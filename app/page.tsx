import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";
import React from "react";

const Home = () => {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        {/* Arabic content */}
        <li className="text-right">
          👨‍⚖️
          <span className="ml-2">
            مرحباً بك في مساعد قوانين الضمان الاجتماعي. يمكنك طرح أي أسئلة حول قوانين وأنظمة الضمان الاجتماعي.
          </span>
        </li>
        <li className="text-right">
          🔍
          <span className="ml-2">
            يستخدم هذا المساعد قاعدة معرفية تحتوي على وثائق قانونية للضمان الاجتماعي لتقديم معلومات دقيقة.
          </span>
        </li>
        <li className="text-right">
          💬
          <span className="ml-2">
            جرب أن تسأل أسئلة مثل: &ldquo;ما هي شروط الأهلية لاستحقاقات الضمان الاجتماعي؟&rdquo; أو
            &ldquo;اشرح معدلات مساهمات الضمان الاجتماعي&rdquo;
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8" dir="rtl">
      <div className="w-full max-w-5xl mx-auto">
        <ChatWindow
          endpoint="api/chat/retrieval" 
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