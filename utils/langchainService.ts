import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { createStructuredOutputChainFromZod } from "langchain/chains/openai_functions";
import { z } from "zod";
import { config } from "./config";

// Chat model configuration
const model = new ChatOpenAI({
  modelName: config.openai.model,
  temperature: config.openai.temperature,
});

// Templates
export const CONDENSE_QUESTION_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}

Follow Up Input: {question}

Standalone question:`;

export const ANSWER_TEMPLATE = `Answer the question based on the following context:

{context}

Question: {question}

Answer in a helpful and friendly tone. If you cannot find the answer in the context, say so.`;

// Message conversion utilities
export function formatVercelMessages(messages: Array<{ role: string; content: string }>) {
  return messages.map((message) => {
    if (message.role === "user") {
      return new HumanMessage(message.content);
    }
    return new AIMessage(message.content);
  });
}

// Chain creation utilities
export function createRetrievalChain(retriever: any) {
  const standaloneQuestionPrompt = PromptTemplate.fromTemplate(CONDENSE_QUESTION_TEMPLATE);
  const answerPrompt = PromptTemplate.fromTemplate(ANSWER_TEMPLATE);

  const standaloneQuestionChain = standaloneQuestionPrompt
    .pipe(model)
    .pipe((output) => output.content);

  const answerChain = answerPrompt.pipe(model).pipe((output) => output.content);

  return {
    standaloneQuestionChain,
    answerChain,
  };
}

// Structured output chain creation
export function createStructuredOutputChain<T extends z.ZodObject<any>>(
  schema: T,
  prompt: PromptTemplate
) {
  return createStructuredOutputChainFromZod(schema, {
    prompt,
    llm: model,
  });
}

// System templates for agents
export const AGENT_SYSTEM_TEMPLATE = `You are a helpful AI assistant.
If you need to look up information, use the available tools.
If you don't know something, say so.
Always remain professional and helpful.`;

// Chat processing
export async function processChatWithHistory(messages: Array<{ role: string; content: string }>) {
  const lastMessage = messages[messages.length - 1].content;
  const history = formatVercelMessages(messages.slice(0, -1));
  
  const prompt = PromptTemplate.fromTemplate(
    `{context}\n\nCurrent conversation:\n{chat_history}\n\nHuman: {input}\nAssistant:`
  );

  const chain = prompt.pipe(model);

  return chain.stream({
    context: AGENT_SYSTEM_TEMPLATE,
    chat_history: history.map((m) => m.content).join("\n"),
    input: lastMessage,
  });
}