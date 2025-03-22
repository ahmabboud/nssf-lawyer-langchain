"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Loader2 } from "lucide-react";

export function FileUploadForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(`تم اختيار الملف: ${e.target.files[0].name}`); // Updated text to Arabic
    }
  };

  const ingest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setMessage("الرجاء اختيار ملف أولاً."); // Updated text to Arabic
      return;
    }

    setIsLoading(true);
    setMessage("جاري تحميل ومعالجة الملف..."); // Updated text to Arabic

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/retrieval/ingest/file", {
        method: "POST",
        body: formData,
      });

      if (response.status === 200) {
        setMessage("تم تحميل ومعالجة الملف بنجاح!"); // Updated text to Arabic
      } else {
        const json = await response.json();
        if (json.error) {
          setMessage(`خطأ: ${json.error}`); // Updated text to Arabic
        } else {
          setMessage("حدث خطأ غير معروف أثناء التحميل"); // Updated text to Arabic
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("حدث خطأ أثناء تحميل الملف. راجع وحدة التحكم للتفاصيل."); // Updated text to Arabic
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={ingest} className="flex flex-col gap-4 w-full" dir="rtl"> {/* Ensure RTL layout */}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          قم بتحميل ملف .docx ليتم معالجته وإضافته إلى مخزن البيانات. {/* Updated text to Arabic */}
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".docx"
            onChange={handleFileChange}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !file}>
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" /> {/* Adjusted margin for RTL */}
                جاري المعالجة {/* Updated text to Arabic */}
              </>
            ) : (
              "تحميل" 
            )}
          </Button>
        </div>
      </div>
      {message && (
        <div className="p-2 text-sm bg-slate-100 dark:bg-slate-800 rounded">
          {message}
        </div>
      )}
    </form>
  );
}