import { cn } from "@/utils/cn"; // Utility to merge Tailwind CSS class names conditionally
import type { Message } from "ai/react"; // Type for a chat message
import ReactMarkdown from "react-markdown"; // For rendering markdown (not used directly in the code)
import { useEffect, useState } from "react";

export function ChatMessageBubble(props: {
  message: Message; // Message object, includes .content and .role
  aiEmoji?: string; // Optional emoji to represent the AI
  sources?: any[];  // Array of source documents (used for citation popup)
}) {
  //Text Direction Handling: Detects if the content contains Arabic characters and adjusts layout accordingly
  const isArabic = /[\u0600-\u06FF]/.test(props.message.content);
  
  // State to manage the active reference (clicked reference button)
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
            data-ref={refNumber}
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

  // New click handler for citation references
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("ref-btn")) {
        const ref = Number(target.getAttribute("data-ref"));
        if (!isNaN(ref) && ref > 0 && ref <= sources.length) {
          setActiveRef(ref); // Show the popup
        }
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [sources]);
  
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

      {/* Centered Modal Popup for Source - Now showing full content */}
      {activeRef && source && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setActiveRef(null)}>
          <div 
            className="reference-popup bg-white border border-gray-300 shadow-lg p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
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
            
            {/* Full content display */}
            <div className="prose prose-sm max-w-none">
              {source.content ? (
                // If source has a structured content property
                <ReactMarkdown>
                  {source.content}
                </ReactMarkdown>
              ) : (
                // Display the entire pageContent
                <div className="text-gray-800 whitespace-pre-wrap">
                  {source.pageContent}
                </div>
              )}
              
              {/* Show metadata if available */}
              {source.metadata && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Source Information</h4>
                  
                  {source.metadata.source && (
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Source:</span> {source.metadata.source}
                    </div>
                  )}
                  
                  {source.metadata.loc?.lines && (
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Lines:</span> {source.metadata.loc.lines.from} to {source.metadata.loc.lines.to}
                    </div>
                  )}
                  
                  {source.metadata.loc?.page && (
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Page:</span> {source.metadata.loc.page}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}