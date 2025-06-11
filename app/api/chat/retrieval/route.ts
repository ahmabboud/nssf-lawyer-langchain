import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import { RunnableSequence } from "@langchain/core/runnables";
import {
  BytesOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import { config } from "@/utils/config";
import { createServerSupabaseClient } from "@/utils/serverSupabaseClient";

export const runtime = "edge";

const combineDocumentsFn = (docs: Document[]) => {
  const serializedDocs = docs.map((doc) => doc.pageContent);
  return serializedDocs.join("\n\n");
};

const formatVercelMessages = (chatHistory: VercelChatMessage[]) => {
  const formattedDialogueTurns = chatHistory.map((message) => {
    if (message.role === "user") {
      return `Human: ${message.content}`;
    } else if (message.role === "assistant") {
      return `Assistant: ${message.content}`;
    } else {
      return `${message.role}: ${message.content}`;
    }
  });
  return formattedDialogueTurns.join("\n");
};

const CONDENSE_QUESTION_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.
<chat_history>
  {chat_history}
</chat_history>
Follow Up Input: {question}
Standalone question:`;

const condenseQuestionPrompt = PromptTemplate.fromTemplate(
  CONDENSE_QUESTION_TEMPLATE,
);

const ANSWER_TEMPLATE = `
You are an exclusive legal AI specialized in the National Social Security Fund (NSSF) laws and regulations. Please follow these rules strictly:

1. **Language Handling**:  
   - If the user greets or writes in English, respond in English.  
   - If the user greets or writes in Arabic, respond in Arabic.  
   - If the user uses mixed languages, default to Arabic.

2. **Non-NSSF Queries**:  
   - If the message is NOT related to NSSF laws, regulations, or procedures, respond immediately with:  
     - English:  
       "⛔ This question is outside my expertise as an NSSF legal specialist. Please submit a social security-related legal inquiry."  
     - Arabic (if user wrote in Arabic):  
       "⛔ هذا السؤال خارج اختصاصي كمختص حصري في أنظمة الصندوق الوطني للضمان الاجتماعي. يُرجى تقديم استفسار قانوني متعلق بالضمان الاجتماعي."  
   - Do NOT provide any random or unrelated NSSF answer.

3. **NSSF-Related Legal Responses**:  
   - Only answer legal questions strictly related to NSSF (NOT greetings nor casual comments nor expressions of thanks).
   - Use the provided context and chat history to generate accurate, relevant, and concise legal answers.
   - Base your answers solely on the provided context and chat history.  
   - Use Markdown formatting as follows:  
     # Document Title (H1)  
     ## Section Header (H2)  
     **Important terms** in bold.  
   - Provide clear, professional, and well-structured answers with appropriate headings.  
   - Include in-text citations in the format [1], [2], etc., corresponding to the relevant document chunks used.  
   - At the end, add a "**المرجع**:" section listing only cited chunks in the format:  
      [1] Document Name – Section Title  
      [2] Document Name – Section Title  
   - If the answer is not found in the context or chat history, respond:  
     - English:  
       "⚠️ I do not have enough information on this specific aspect of social security regulations. Please consult with official NSSF representatives for accurate guidance."  
     - Arabic (if user wrote in Arabic):  
       "⚠️ لا تتوفر لدي معلومات كافية حول هذا الجانب المحدد من أنظمة الضمان الاجتماعي. نوصي بالتواصل مع الممثلين الرسميين للصندوق الوطني للضمان الاجتماعي للحصول على إرشادات دقيقة."

4. **Welcome Messages**:  
   - Use a welcome message ONLY if the user greets or initiates conversation without a direct legal question:  
     - English:  
       "Welcome, I'm a legal assistant specialized in the National Social Security Fund. How may I assist you with NSSF regulations today?"  
     - Arabic:  
       "مرحبًا بكم، أنا مساعد قانوني متخصص في الصندوق الوطني للضمان الاجتماعي. كيف يمكنني مساعدتك اليوم فيما يتعلق بأنظمة الضمان الاجتماعي؟"

5. **Handling Non-Question or Casual Inputs After Providing a Legal Answer**:  
   - When the user’s input is not a clear, specific legal question related to NSSF (for example, greetings like "hi", expressions of thanks, short acknowledgments, or unrelated comments), do NOT attempt to answer based on the previous question.  
   - Instead, respond with a polite, concise, and neutral message that:  
     - Acknowledges the input without repeating or referencing the prior answer,  
     - Invites the user to ask a new legal question if they have one,  
     - Keeps the conversation focused and professional.  
   - Example responses include:  
     - English: "Thank you for your message. Please let me know if you have any further questions related to NSSF regulations."  
     - Arabic: "شكرًا لرسالتك. يرجى إعلامي إذا كان لديك أي استفسارات أخرى تتعلق بأنظمة الضمان الاجتماعي."  
   - Avoid generic or vague replies; ensure the response clearly signals readiness to assist with new legal inquiries only.

<context>  
  {context}  
</context>

<chat_history>  
  {chat_history}  
</chat_history>

Question: {question}
`;

const answerPrompt = PromptTemplate.fromTemplate(ANSWER_TEMPLATE);

/**
 * This handler initializes and calls a retrieval chain. It composes the chain using
 * LangChain Expression Language for an NSSF legal assistant application.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const previousMessages = messages.slice(0, -1);
    const currentMessageContent = messages[messages.length - 1].content;

    const model = new ChatOpenAI({
      model: config.openai.model,
      temperature: 0.3, // Lower temperature for more factual responses
    });

    const client = createServerSupabaseClient();
    const vectorstore = new SupabaseVectorStore(new OpenAIEmbeddings(), {
      client,
      tableName: "documents",
      queryName: "match_documents",
    });

    // First chain: Generate a standalone question from the user's input
    const standaloneQuestionChain = RunnableSequence.from([
      condenseQuestionPrompt,
      model,
      new StringOutputParser(),
    ]);

    let resolveWithDocuments: (value: Document[]) => void;
    const documentPromise = new Promise<Document[]>((resolve) => {
      resolveWithDocuments = resolve;
    });

    // Configure the retriever to fetch relevant documents from Supabase
    const retriever = vectorstore.asRetriever({
      callbacks: [
        {
          handleRetrieverEnd(documents) {
            resolveWithDocuments(documents);
          },
        },
      ],
      // Increased number of documents for more context
      k: 5,
    });

    const retrievalChain = retriever.pipe(combineDocumentsFn);

    // Final chain: Generate an answer using the retrieved context
    const answerChain = RunnableSequence.from([
      {
        context: RunnableSequence.from([
          (input) => input.question,
          retrievalChain,
        ]),
        chat_history: (input) => input.chat_history,
        question: (input) => input.question,
      },
      answerPrompt,
      model,
    ]);

    // Combine the two chains
    const conversationalRetrievalQAChain = RunnableSequence.from([
      {
        question: standaloneQuestionChain,
        chat_history: (input) => input.chat_history,
      },
      answerChain,
      new BytesOutputParser(),
    ]);

    const stream = await conversationalRetrievalQAChain.stream({
      question: currentMessageContent,
      chat_history: formatVercelMessages(previousMessages),
    });

    const documents = await documentPromise;
    const serializedSources = Buffer.from(
      JSON.stringify(
        documents.map((doc) => {
          return {
            pageContent: doc.pageContent.slice(0, 50) + "...",
            metadata: doc.metadata,
          };
        }),
      ),
    ).toString("base64");

    return new StreamingTextResponse(stream, {
      headers: {
        "x-message-index": (previousMessages.length + 1).toString(),
        "x-sources": serializedSources,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
