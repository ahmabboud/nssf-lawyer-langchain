import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function Home() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          👨‍⚖️
          <span className="ml-2">
            Welcome to the NSSF Law Assistant. Ask any questions about NSSF laws and regulations.
          </span>
        </li>
        <li className="text-l">
          🔍
          <span className="ml-2">
            This assistant uses a knowledge base of NSSF legal documents to provide accurate information.
          </span>
        </li>
        <li className="text-l">
          💬
          <span className="ml-2">
            Try asking questions like "What are the eligibility requirements for NSSF benefits?" or
            "Explain the NSSF contribution rates"
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <ChatWindow
          endpoint="api/chat/retrieval"
          placeholder="Ask me anything about NSSF laws and regulations..."
          emptyStateComponent={InfoCard}
        />
      </div>
    </main>
  );
}
