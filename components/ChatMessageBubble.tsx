import { cn } from "@/utils/cn";
import type { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import { DownloadButton } from "@/components/ui/download-button";

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  sources: any[];
}) {
  // Detect if content is primarily Arabic (simple detection)
  const isArabic = /[\u0600-\u06FF]/.test(props.message.content);
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
    <div className={cn(
    "border bg-secondary -mt-2 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center",
    isArabic ? "ml-4" : "mr-4"
    )}>
      {props.aiEmoji}
        </div>
      )}

      <div className="whitespace-pre-wrap flex flex-col">

        <ReactMarkdown
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
          <div className={cn(
            "mt-2",
            isArabic ? "text-left" : "text-right" // Reverse alignment for Arabic
          )}>
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
