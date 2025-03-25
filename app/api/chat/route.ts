import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { Buffer } from 'buffer';

export const runtime = "edge";

// Polyfill Buffer for edge runtime
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `You are a lawyer expert in Lebanese Laws. Your responses should always be formal and in Arabic language.

Current conversation:
{chat_history}

User: {input}
AI:`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const currentMessageContent = messages[messages.length - 1]?.content || '';
    const currentMessageIndex = messages.length;

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    const model = new ChatOpenAI({
      temperature: 0.8,
      model: "gpt-4-turbo-preview",
    });

    const outputParser = new HttpResponseOutputParser();
    const chain = prompt.pipe(model).pipe(outputParser);

    // For simple messages (like "hi"), always return JSON
    if (!body.show_intermediate_steps || currentMessageContent.length < 10) {
      const stream = await chain.stream({
        chat_history: messages.slice(0, -1).map(formatMessage).join("\n"),
        input: currentMessageContent,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
      }

      return NextResponse.json({
        messages: [{
          id: `msg-${currentMessageIndex}-${Date.now()}`,
          content: fullContent,
          role: "assistant"
        }]
      }, {
        headers: {
          'x-sources': Buffer.from(JSON.stringify(["General Response"])).toString('base64'),
          'x-message-index': currentMessageIndex.toString()
        }
      });
    }

    // Original streaming for complex queries
    const stream = await chain.stream({
      chat_history: messages.slice(0, -1).map(formatMessage).join("\n"),
      input: currentMessageContent,
    });

    return new StreamingTextResponse(stream, {
      headers: {
        'x-sources': Buffer.from(JSON.stringify(["Streaming Response"])).toString('base64'),
        'x-message-index': currentMessageIndex.toString()
      }
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: "حدث خطأ: " + e.message },
      { status: 500 }
    );
  }
}