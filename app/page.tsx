import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function Home() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        
      </ul>
    </GuideInfoBox>
  );
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <ChatWindow
          endpoint="api/chat"
          placeholder="This is an LLM that will answer your questions regarding NSSF Laws"
          emptyStateComponent={InfoCard}
        />
      </div>
    </main>
  );
}
