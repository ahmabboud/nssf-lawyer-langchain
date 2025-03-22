import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";
import React from "react";

const Home = () => {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        {/* Add Arabic content here */}
        <li className="text-right">
          🤝
          <span className="ml-2">
            هذا النموذج يعرض وكيل{" "}
            <a href="https://js.langchain.com/" target="_blank">
              LangChain.js
            </a>{" "}
            و{" "}
            <a href="https://sdk.vercel.ai/docs" target="_blank">
              Vercel AI SDK
            </a>{" "}
            في مشروع{" "}
            <a href="https://nextjs.org/" target="_blank">
              Next.js
            </a>.
          </span>
        </li>
        <li className="text-right">
          🛠️
          <span className="ml-2">
            الوكيل لديه ذاكرة ويمكنه الوصول إلى محرك بحث وآلة حاسبة.
          </span>
        </li>
        <li className="text-right">
          💻
          <span className="ml-2">
            يمكنك العثور على منطق النموذج والرسائل في{" "}
            <code>app/api/chat/route.ts</code>.
          </span>
        </li>
        <li className="text-right">
          🦜
          <span className="ml-2">
            بشكل افتراضي، يتظاهر الوكيل بأنه ببغاء متحدث، ولكن يمكنك تغيير الرسائل كما تريد!
          </span>
        </li>
        <li className="text-right">
          👇
          <span className="ml-2">
            جرب أن تسأل مثلاً: <code>ما هو الطقس في هونولولو؟</code> في الأسفل!
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8" dir="rtl">
      <div className="w-full max-w-5xl mx-auto">
        <ChatWindow
          endpoint="api/chat"
          placeholder="هذه LLM التي ستجيب على استفساراتك بشأن قوانين NSSF"
          emptyStateComponent={InfoCard}
          emoji="🦜" // Add an emoji for the chat window
          showIntermediateStepsToggle={true} // Enable intermediate steps toggle
        />
      </div>
      <div className="w-full max-w-5xl mx-auto text-right">
        {/* Your page content here */}
        <h1 className="text-2xl font-bold mt-8">مرحباً بك في الموقع</h1>
        <p className="mt-2">هذه صفحة باللغة العربية</p>
      </div>
    </main>
  );
};

export default Home;