"use server";

import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createStreamableValue } from "ai/rsc";

export async function runAgent(input: string) {
  "use server";

  const stream = createStreamableValue();
  (async () => {
    const tools = [new TavilySearch({ maxResults: 1 })];

    const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

    const agent = createReactAgent({
      llm,
      tools,
      messageModifier: new SystemMessage(
        "You are a helpful assistant. Use the tools provided to best assist the user.",
      ),
    });

    const streamingEvents = agent.streamEvents(
      { messages: [new HumanMessage(input)] },
      { version: "v2" },
    );

    for await (const item of streamingEvents) {
      stream.update(JSON.parse(JSON.stringify(item, null, 2)));
    }

    stream.done();
  })();

  return { streamData: stream.value };
}
