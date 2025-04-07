import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function Home() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          👨‍⚖️
          <span className="ml-2">
            مرحبًا بك في مساعد قانون الضمان الاجتماعي. اطرح أي سؤال يتعلق بقوانين وأنظمة الضمان.
          </span>
        </li>
        <li className="text-l">
          🔍
          <span className="ml-2">
            يستخدم هذا المساعد قاعدة معرفية من مستندات قانون الضمان لتوفير معلومات دقيقة.
          </span>
        </li>
        <li className="text-l">
          💬
          <span className="ml-2">
            جرّب طرح أسئلة مثل "ما هي شروط الأهلية للحصول على منافع الضمان؟" أو "اشرح نسب مساهمات الضمان".
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div dir="rtl" lang="ar" className="w-full max-w-5xl mx-auto">
        <ChatWindow
          endpoint="api/chat/retrieval"
          placeholder="اسألني أي شيء عن قوانين وأنظمة الضمان الاجتماعي..."
          emptyStateComponent={InfoCard}
        />
      </div>
    </main>
  );
}
