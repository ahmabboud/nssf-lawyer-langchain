import { cn } from "@/utils/cn";
import type { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  sources?: any[]; // Optional sources
}) {
  const isArabic = /[\u0600-\u06FF]/.test(props.message.content);
  const [activeRef, setActiveRef] = useState<number | null>(null);
  const sources = props.sources || [];

  //Splitting the Message Content with References
  const parts = props.message.content.split(/(\[\d+\])/g);

  //Rendering References as Buttons
  const renderContentWithRefs = () =>
    parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const refNumber = Number(match[1]);
        return (
          <button
            key={index}
            className="ref-btn text-blue-600 underline ml-1 mr-1"
            onClick={() => {
              if (refNumber > 0 && refNumber <= sources.length) {
                console.log("Clicked reference", refNumber); // Debug
                setActiveRef(refNumber);
              }
            }}
          >
            [{refNumber}]
          </button>
        );
      } else {
        // Render the part as markdown
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

  // Close the reference popup when clicking outside of it
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

    if (activeRef !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeRef]);

  // Get the source based on the active reference - display the content of the source
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

        {/* Inline Popup for Source */}
        {activeRef && source && (
          <div className="reference-popup absolute z-50 bg-white border border-gray-300 shadow-md p-4 rounded-xl w-72 top-full mt-2 text-sm">
            <strong>📄 Reference [{activeRef}]</strong>
            <div className="mt-2">
              <p>"{source.pageContent}"</p>
              {source.metadata?.loc?.lines && (
                <div className="text-gray-500 mt-1 text-xs">
                  Lines {source.metadata.loc.lines.from} to{" "}
                  {source.metadata.loc.lines.to}
                </div>
              )}
            </div>
          </div>
        )}


        {/* Displaying All Sources List */}
        {sources.length > 0 && (
          <div className="mt-4 bg-primary px-3 py-2 rounded text-xs text-white">
            <h2 className="font-bold mb-2">🔍 Sources:</h2>
            {sources.map((source, i) => (
              <div className="mt-2" key={`source-${i}`}>
                {i + 1}. &quot;{source.pageContent}&quot;
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
    </div>
  );
}