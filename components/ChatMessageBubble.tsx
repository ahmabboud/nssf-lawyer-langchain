import { cn } from "@/utils/cn";
import type { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  sources: any[];
}) {
  const [popupSource, setPopupSource] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);

  const isArabic = /[\u0600-\u06FF]/.test(props.message.content);

  const handleReferenceClick = (index: number) => {
    // Debugging logs
    console.log("Reference clicked:", index);
    console.log("Available sources:", props.sources);
    
    if (props.sources && index > 0 && index <= props.sources.length) {
      const sourceIndex = index - 1; // Convert to 0-based index
      console.log("Showing source at index:", sourceIndex);
      setPopupSource(props.sources[sourceIndex]);
      setShowPopup(true);
    } else {
      console.warn("No source found for reference:", index);
    }
  };

  const Reference = ({ number }: { number: string }) => {
    const num = parseInt(number);
    return (
      <sup 
        className="cursor-pointer text-blue-500 hover:text-blue-700"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleReferenceClick(num);
        }}
      >
        [{number}]
      </sup>
    );
  };

  const renderMarkdownContent = () => {
    // This regex matches [1], [2], etc. while preserving other content
    const parts = props.message.content.split(/(\[\d+\])/g);
    
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        return <Reference key={`ref-${i}`} number={match[1]} />;
      }
      return (
        <ReactMarkdown 
          key={`md-${i}`}
          components={{
            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-0 mb-2" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-2 mb-1" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-1 mb-1" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-0" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-0" {...props} />,
            li: ({ node, ...props }) => <li className="my-0" {...props} />,
            code: ({ node, ...props }) => <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />,
            pre: ({ node, ...props }) => <pre className="bg-muted p-2 rounded my-0 overflow-x-auto" {...props} />,
          }}
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

  return (
    <div
      className={cn(
        "rounded-[24px] max-w-[80%] mb-8 flex",
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

      <div className="whitespace-pre-wrap flex flex-col">
        {renderMarkdownContent()}

        {props.sources && props.sources.length > 0 && (
          <>
            <code className="mt-4 mr-auto bg-primary px-2 py-1 rounded">
              <h2>🔍 Sources:</h2>
            </code>
            <code className="mt-1 mr-2 bg-primary px-2 py-1 rounded text-xs">
              {props.sources.map((source, i) => (
                <div className="mt-2" key={`source-${i}`}>
                  <span 
                    className="cursor-pointer hover:underline" 
                    onClick={() => {
                      setPopupSource(source);
                      setShowPopup(true);
                    }}
                  >
                    {i + 1}. &quot;{source.pageContent}&quot;
                  </span>
                  {source.metadata?.loc?.lines !== undefined && (
                    <div>
                      <br />
                      Lines {source.metadata.loc.lines.from} to{" "}
                      {source.metadata.loc.lines.to}
                    </div>
                  )}
                </div>
              ))}
            </code>
          </>
        )}
      </div>

      {/* Source Popup */}
      {showPopup && popupSource && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowPopup(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Source Reference</h3>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{popupSource.pageContent}</p>
              {popupSource.metadata?.loc?.lines && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Lines {popupSource.metadata.loc.lines.from} to{" "}
                  {popupSource.metadata.loc.lines.to}
                </p>
              )}
              {popupSource.metadata?.source && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Source: {popupSource.metadata.source}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}