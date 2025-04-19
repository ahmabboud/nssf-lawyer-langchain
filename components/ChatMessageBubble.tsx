import { cn } from "@/utils/cn"; // Utility to merge Tailwind CSS class names conditionally
import type { Message } from "ai/react"; // Type for a chat message
import ReactMarkdown from "react-markdown"; // For rendering markdown
import { useEffect, useState, useMemo } from "react";

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  sources?: any[];
}) {
  const isArabic = /[\u0600-\u06FF]/.test(props.message.content);
  const [activeRef, setActiveRef] = useState<number | null>(null);
  const sources = useMemo(() => props.sources || [], [props.sources]);

  const parts = props.message.content.split(/(\[\d+\])/g);

  const renderContentWithRefs = () =>
    parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const refNumber = Number(match[1]);
        return (
          <button
            key={index}
            className="ref-btn text-blue-600 underline ml-1 mr-1"
            data-ref={refNumber}
          >
            [{refNumber}]
          </button>
        );
      } else {
        return (
          <ReactMarkdown
            key={index}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-2xl font-bold mt-0 mb-2" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-xl font-semibold mt-2 mb-1" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-lg font-semibold mt-1 mb-1" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-bold" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-5 my-0" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-5 my-0" {...props} />
              ),
              li: ({ node, ...props }) => <li className="my-0" {...props} />,
              code: ({ node, ...props }) => (
                <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />
              ),
              pre: ({ node, ...props }) => (
                <pre className="bg-muted p-2 rounded my-0 overflow-x-auto" {...props} />
              ),
            }}
          >
            {part}
          </ReactMarkdown>
        );
      }
    });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("ref-btn")) {
        const ref = Number(target.getAttribute("data-ref"));
        if (!isNaN(ref) && ref > 0 && ref <= sources.length) {
          setActiveRef(ref);
        }
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [sources]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".reference-popup") &&
        !target.classList.contains("ref-btn")
      ) {
        setActiveRef(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const source =
    activeRef && activeRef > 0 && activeRef <= sources.length
      ? sources[activeRef - 1]
      : null;

  return (
    <div
      className={cn(
        `relative rounded-[24px] max-w-[80%] mb-8 flex`,
        props.message.role === "user"
          ? "bg-secondary text-secondary-foreground px-4 py-2"
          : null,
        props.message.role === "user" ? "ml-auto" : "mr-auto",
        isArabic && "text-right"
      )}
      dir={isArabic ? "rtl" : "ltr"}
    >
      {props.message.role !== "user" && (
        <div
          className={cn(
            "border bg-secondary -mt-2 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center",
            isArabic ? "ml-4" : "mr-4"
          )}
        >
          {props.aiEmoji}
        </div>
      )}

      <div className="whitespace-pre-wrap flex flex-col relative">
        <div className="leading-relaxed">{renderContentWithRefs()}</div>

        {/* Displaying All Sources List */}
        {sources.length > 0 && (
          <div className="mt-4 bg-primary px-3 py-2 rounded text-xs text-white">
            <h2 className="font-bold mb-2">🔍 Sources:</h2>
            {sources.map((source, i) => (
              <div className="mt-2" key={`source-${i}`}>
                {i + 1}. &ldquo;{source.pageContent}&rdquo;
                {source.metadata?.source && (
                  <div className="text-gray-300 mt-1">
                    📄 {source.metadata.source}
                  </div>
                )}
                {source.metadata?.loc?.lines && (
                  <div className="text-gray-300 mt-1">
                    Lines {source.metadata.loc.lines.from} to{" "}
                    {source.metadata.loc.lines.to}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Centered Modal Popup for Source */}
      {activeRef && source && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="reference-popup bg-white border border-gray-300 shadow-lg p-6 rounded-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">📄 Reference [{activeRef}]</h3>
              <button
                onClick={() => setActiveRef(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="mt-2">
              {/* Document Name */}
              {source.metadata?.source && (
                <div className="text-xs text-gray-500 mb-2">
                  Document: <span className="font-semibold">{source.metadata.source}</span>
                </div>
              )}
              {/* Page Content */}
              <p className="text-sm text-gray-800">&ldquo;{source.pageContent}&rdquo;</p>
              {/* Line Numbers */}
              {source.metadata?.loc?.lines && (
                <div className="text-gray-500 mt-1 text-xs">
                  Lines {source.metadata.loc.lines.from} to{" "}
                  {source.metadata.loc.lines.to}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
