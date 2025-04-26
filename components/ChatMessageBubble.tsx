import React, { useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import type { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import { DownloadButton } from "@/components/ui/download-button";

// Regex to match [1], [2], etc.
const REF_REGEX = /\[(\d+)\]/g;

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  sources: any[];
}) {
  const isArabic = /[\u0600-\u06FF]/.test(props.message.content);

  // State for which reference popup is open (null if none)
  const [openRef, setOpenRef] = useState<number | null>(null);

  // Handler to close popup when clicking outside
  useEffect(() => {
    if (openRef === null) return;
    function handleClick() {
      console.log("Window click detected, closing popup");
      setOpenRef(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [openRef]);

  // Custom renderer for text nodes to replace [x] with clickable refs
  function renderWithRefs(text: string) {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Unique key prefix per message to avoid conflicts
    const keyPrefix = "ref-" + (props.message.id || Math.random());

    while ((match = REF_REGEX.exec(text)) !== null) {
      const refNum = Number(match[1]);
      const hasSource = props.sources && props.sources[refNum - 1];

      console.log(`Reference [${refNum}] found. Has source:`, hasSource);
      console.log("Current openRef:", openRef);

      // Push preceding text
      if (match.index > lastIndex) {
        elements.push(text.slice(lastIndex, match.index));
      }

      // Push clickable reference
      elements.push(
        <span
          key={`${keyPrefix}-${refNum}-${match.index}`}
          className="text-blue-600 underline cursor-pointer relative"
          onClick={(e) => {
            console.log(`Reference [${refNum}] clicked`);
            console.log("Event target:", e.target);
            console.log("Current sources:", props.sources);
            e.stopPropagation();
            const newRef = refNum === openRef ? null : refNum;
            console.log("Setting openRef to:", newRef);
            setOpenRef(newRef);
          }}
        >
          [{refNum}]
          {/* Popup card */}
          {openRef === refNum && hasSource && (
            <div
              className={cn(
                "absolute z-50 bg-white text-black border border-gray-300 rounded shadow-lg p-4 min-w-[250px] max-w-[350px]",
                isArabic ? "right-full mr-2" : "left-full ml-2"
              )}
              style={{ top: "100%", whiteSpace: "normal" }}
              onClick={(e) => {
                console.log("Popup content clicked");
                e.stopPropagation();
              }}
            >
              <div className="font-bold mb-2">Source {refNum}</div>
              <div className="text-sm">
                {props.sources[refNum - 1]?.pageContent || "No source found."}
                {props.sources[refNum - 1]?.metadata?.loc?.lines && (
                  <div className="mt-1 text-xs text-gray-500">
                    Lines {props.sources[refNum - 1].metadata.loc.lines.from} to{" "}
                    {props.sources[refNum - 1].metadata.loc.lines.to}
                  </div>
                )}
              </div>
              <button
                className="mt-2 text-xs text-blue-600 underline"
                onClick={() => {
                  console.log("Close button clicked");
                  setOpenRef(null);
                }}
              >
                Close
              </button>
            </div>
          )}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    // Push any remaining text
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }
    return elements;
  }

  // Debug log for props
  useEffect(() => {
    console.log("Message bubble props updated:", {
      messageId: props.message.id,
      sources: props.sources,
      openRef,
    });
  }, [props.message.id, props.sources, openRef]);

  return (
    <div
      className={cn(
        `rounded-[24px] max-w-[80%] mb-8 flex`,
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
        <ReactMarkdown
          components={{
            // Custom paragraph renderer to handle references
            p: ({ node, children, ...props2 }) => {
              if (!children) return <p {...props2}></p>;
              const childrenArray = React.Children.toArray(children);
              console.log("Markdown paragraph children:", childrenArray);
              return (
                <p {...props2}>
                  {childrenArray.map((child: React.ReactNode, idx: number) => {
                    if (typeof child === "string" && REF_REGEX.test(child)) {
                      REF_REGEX.lastIndex = 0; // Reset regex state
                      return (
                        <React.Fragment key={idx}>
                          {renderWithRefs(child)}
                        </React.Fragment>
                      );
                    }
                    return child;
                  })}
                </p>
              );
            },
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
            li: ({ node, ...props }) => (
              <li className="my-0" {...props} />
            ),
            code: ({ node, ...props }) => (
              <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />
            ),
            pre: ({ node, ...props }) => (
              <pre className="bg-muted p-2 rounded my-0 overflow-x-auto" {...props} />
            ),
          }}
        >
          {props.message.content}
        </ReactMarkdown>

        {props.message.role !== "user" && (
          <div
            className={cn(
              "mt-2",
              isArabic ? "text-left" : "text-right"
            )}
          >
            <DownloadButton
              content={props.message.content}
              fileName={`ai-response-${new Date().getTime()}`}
            />
          </div>
        )}

        {props.sources && props.sources.length ? (
          <>
            <code className="mt-4 mr-auto bg-primary px-2 py-1 rounded">
              <h2>🔍 Sources:</h2>
            </code>
            <code className="mt-1 mr-2 bg-primary px-2 py-1 rounded text-xs">
              {props.sources?.map((source, i) => (
                <div className="mt-2" key={"source:" + i}>
                  {i + 1}. &quot;{source.pageContent}&quot;
                  {source.metadata?.loc?.lines !== undefined ? (
                    <div>
                      <br />
                      Lines {source.metadata?.loc?.lines?.from} to{" "}
                      {source.metadata?.loc?.lines?.to}
                    </div>
                  ) : (
                    ""
                  )}
                </div>
              ))}
            </code>
          </>
        ) : null}
      </div>
    </div>
  );
}