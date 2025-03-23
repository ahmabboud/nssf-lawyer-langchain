import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function AgentsPage() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          🤝
          <span className="mr-2"> {/* Changed ml-2 to mr-2 for RTL */}
            This template showcases a{" "}
            <a href="https://js.langchain.com/" target="_blank">
              LangChain.js
            </a>{" "}
            agent and the Vercel{" "}
            <a href="https://sdk.vercel.ai/docs" target="_blank">
              AI SDK
            </a>{" "}
            in a{" "}
            <a href="https://nextjs.org/" target="_blank">
              Next.js
            </a>{" "}
            project.
          </span>
        </li>
        <li>
          🛠️
          <span className="mr-2"> {/* Changed ml-2 to mr-2 for RTL */}
            The agent has memory and access to a search engine and a calculator.
          </span>
        </li>
        <li className="hidden text-l md:block">
          💻
          <span className="mr-2"> {/* Changed ml-2 to mr-2 for RTL */}
            You can find the prompt and model logic for this use-case in{" "}
            <code>app/api/chat/agents/route.ts</code>.
          </span>
        </li>
        <li>
          🦜
          <span className="mr-2"> {/* Changed ml-2 to mr-2 for RTL */}
            By default, the agent is pretending to be a talking parrot, but you
            can the prompt to whatever you want!
          </span>
        </li>
        <li className="hidden text-l md:block">
          🎨
          <span className="mr-2"> {/* Changed ml-2 to mr-2 for RTL */}
            The main frontend logic is found in <code>app/agents/page.tsx</code>
            .
          </span>
        </li>
        <li className="text-l">
          👇
          <span className="mr-2"> {/* Changed ml-2 to mr-2 for RTL */}
            Try asking e.g. <code>What is the weather in Honolulu?</code> below!
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );

  return (
    <div dir="rtl"> {/* Added dir="rtl" for RTL alignment */}
      <ChatWindow
        endpoint="/api/chat/agents" 
        emptyStateComponent={InfoCard}
        placeholder="Squawk! I'm a conversational agent! Ask me about the current weather in Honolulu!"
        emoji="🦜"
        showIntermediateStepsToggle={true}
      />
    </div>
  );
}