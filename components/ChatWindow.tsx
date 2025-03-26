"use client";

import { type Message } from "ai";
import { useChat } from "ai/react";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { IntermediateStep } from "./IntermediateStep";
import { Button } from "./ui/button";
import { ArrowDown, LoaderCircle, Paperclip } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { UploadDocumentsForm } from "./UploadDocumentsForm";
import { FileUploadForm } from "./FileUploadForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { cn } from "@/utils/cn";

function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  sourcesForMessages: Record<string, any>;
  aiEmoji?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full" dir="rtl">
      {props.messages.map((m, i) => {
        // Only render as IntermediateStep if it's a system message AND looks like JSON
        // This prevents errors when regular text messages are incorrectly marked as system
        if (m.role === "system") {
          try {
            // Just test if it's valid JSON before passing to IntermediateStep
            JSON.parse(m.content);
            return <IntermediateStep key={m.id} message={m} />;
          } catch (error) {
            // If not valid JSON, render as a regular message
            return (
              <ChatMessageBubble
                key={m.id}
                message={{...m, role: "assistant"}}
                aiEmoji={props.aiEmoji}
                sources={[]}
              />
            );
          }
        }

        const sourceKey = (props.messages.length - 1 - i).toString();
        return (
          <ChatMessageBubble
            key={m.id}
            message={m}
            aiEmoji={props.aiEmoji}
            sources={props.sourcesForMessages[sourceKey]}
          />
        );
      })}
    </div>
  );
}

export function ChatInput(props: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onStop?: () => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  const disabled = props.loading && props.onStop == null;
  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        e.preventDefault();

        if (props.loading) {
          props.onStop?.();
        } else {
          props.onSubmit(e);
        }
      }}
      className={cn("flex w-full flex-col", props.className)}
      dir="rtl" // Ensure RTL layout
    >
      <div className="border border-input bg-secondary rounded-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto">
        <input
          value={props.value}
          placeholder={props.placeholder}
          onChange={props.onChange}
          className="border-none outline-none bg-transparent p-4 text-right" // Align text to the right
        />

        <div className="flex justify-between ml-2 mr-4 mb-2"> {/* Adjusted margins for RTL */}
          <div className="flex gap-3">{props.children}</div>

          <div className="flex gap-2 self-end">
            {props.actions}
            <Button type="submit" className="self-end" disabled={disabled}>
              {props.loading ? (
                <span role="status" className="flex justify-center">
                  <LoaderCircle className="animate-spin" />
                  <span className="sr-only">جاري التحميل...</span>
                </span>
              ) : (
                <span>إرسال</span> /* Updated button text to Arabic */
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="w-4 h-4" />
      <span>انتقل إلى الأسفل</span> {/* Updated text to Arabic */}
    </Button>
  );
}

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();

  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={cn("grid grid-rows-[1fr,auto]", props.className)}
      dir="rtl" // Ensure RTL layout
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

export function ChatLayout(props: { content: ReactNode; footer: ReactNode }) {
  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={props.content}
        footer={
          <div className="sticky bottom-8 px-2">
            <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
            {props.footer}
          </div>
        }
      />
    </StickToBottom>
  );
}

export function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent: ReactNode;
  placeholder?: string;
  emoji?: string;
  showIngestForm?: boolean;
  showIntermediateStepsToggle?: boolean;
}) {
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(
    !!props.showIntermediateStepsToggle,
  );
  const [intermediateStepsLoading, setIntermediateStepsLoading] =
    useState(false);

  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({});

  const chat = useChat({
    api: props.endpoint,
    onResponse(response) {
      const sourcesHeader = response.headers.get("x-sources");
      const sources = sourcesHeader
        ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8"))
        : [];

      const messageIndexHeader = response.headers.get("x-message-index");
      if (sources.length && messageIndexHeader !== null) {
        setSourcesForMessages({
          ...sourcesForMessages,
          [messageIndexHeader]: sources,
        });
      }
    },
    streamMode: "text",
    onError: (e) =>
      toast.error(`حدث خطأ أثناء معالجة طلبك`, {
        description: e.message,
      }),
  });

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (chat.isLoading || intermediateStepsLoading) return;

    // Handle normal chat flow without intermediate steps
    if (!showIntermediateSteps) {
      chat.handleSubmit(e);
      return;
    }

    // Handle flow with intermediate steps enabled
    setIntermediateStepsLoading(true);

    // Store the user message
    const userInput = chat.input;
    chat.setInput("");
    const messagesWithUserReply = chat.messages.concat({
      id: chat.messages.length.toString(),
      content: userInput,
      role: "user",
    });
    chat.setMessages(messagesWithUserReply);

    try {
      // First try normal API mode to see if it works
      const normalResponse = await fetch(props.endpoint, {
        method: "POST",
        body: JSON.stringify({
          messages: messagesWithUserReply,
        }),
      });

      // If we get a successful response with normal mode, use that
      if (normalResponse.ok) {
        // Get the content from the streaming response
        const reader = normalResponse.body?.getReader();
        const decoder = new TextDecoder();
        let content = '';
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            content += decoder.decode(value, { stream: true });
          }
        }
        
        // Add as assistant message directly - no parsing needed
        chat.setMessages([
          ...messagesWithUserReply,
          {
            id: messagesWithUserReply.length.toString(),
            content: content,
            role: "assistant",
          },
        ]);
        setIntermediateStepsLoading(false);
        return;
      }

      // If normal mode doesn't work, fall back to intermediate steps mode
      const response = await fetch(props.endpoint, {
        method: "POST",
        body: JSON.stringify({
          messages: messagesWithUserReply,
          show_intermediate_steps: true,
        }),
      });

      const json = await response.json();
      
      if (!response.ok) {
        toast.error(`حدث خطأ أثناء معالجة طلبك`, {
          description: json.error,
        });
        setIntermediateStepsLoading(false);
        return;
      }

      // Get response messages
      const responseMessages: Message[] = json.messages || [];
      
      // If there are no messages, end loading state and return
      if (!responseMessages || responseMessages.length === 0) {
        setIntermediateStepsLoading(false);
        return;
      }
      
      // If we have regular message responses without tool calls
      if (!responseMessages.some(msg => 
        (msg.role === "assistant" && msg.tool_calls && msg.tool_calls.length > 0) || 
        msg.role === "tool")) {
        
        // Just add the final assistant message
        if (responseMessages.length > 0) {
          const finalMessage = responseMessages[responseMessages.length - 1];
          chat.setMessages([
            ...messagesWithUserReply,
            {
              id: messagesWithUserReply.length.toString(),
              content: finalMessage.content,
              role: "assistant",
            },
          ]);
        }
        setIntermediateStepsLoading(false);
        return;
      }

      // Handle tool-based messages with intermediate steps
      const toolCallMessages = responseMessages.filter((responseMessage: Message) => {
        return (
          (responseMessage.role === "assistant" && 
           responseMessage.tool_calls && 
           responseMessage.tool_calls.length > 0) ||
          responseMessage.role === "tool"
        );
      });

      // Process intermediate steps
      const intermediateStepMessages = [];
      for (let i = 0; i < toolCallMessages.length; i += 2) {
        const aiMessage = toolCallMessages[i];
        const toolMessage = toolCallMessages[i + 1];
        
        if (aiMessage && toolMessage) {
          try {
            intermediateStepMessages.push({
              id: (messagesWithUserReply.length + i / 2).toString(),
              role: "system" as const,
              content: JSON.stringify({
                action: aiMessage.tool_calls?.[0],
                observation: toolMessage.content,
              }),
            });
          } catch (error) {
            console.error("Error processing intermediate step:", error);
          }
        }
      }

      // Add intermediate step messages with animation delay
      const newMessages = [...messagesWithUserReply];
      for (const message of intermediateStepMessages) {
        newMessages.push(message);
        chat.setMessages([...newMessages]);
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500),
        );
      }

      // Find the final assistant message (without tool calls)
      const finalAssistantMessage = responseMessages.find(
        msg => msg.role === "assistant" && 
              (!msg.tool_calls || msg.tool_calls.length === 0) && 
              msg.content
      );
      
      // Add the final message if it exists
      if (finalAssistantMessage && finalAssistantMessage.content) {
        chat.setMessages([
          ...newMessages,
          {
            id: newMessages.length.toString(),
            content: finalAssistantMessage.content,
            role: "assistant",
          },
        ]);
      }
    } catch (error) {
      console.error("Error in chat processing:", error);
      toast.error(`حدث خطأ أثناء معالجة طلبك`, {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIntermediateStepsLoading(false);
    }
  }

  return (
    <ChatLayout
      content={
        chat.messages.length === 0 ? (
          <div>{props.emptyStateComponent}</div>
        ) : (
          <ChatMessages
            aiEmoji={props.emoji}
            messages={chat.messages}
            emptyStateComponent={props.emptyStateComponent}
            sourcesForMessages={sourcesForMessages}
          />
        )
      }
      footer={
        <ChatInput
          value={chat.input}
          onChange={chat.handleInputChange}
          onSubmit={sendMessage}
          loading={chat.isLoading || intermediateStepsLoading}
          placeholder={props.placeholder ?? "ما هو شعورك كقرصان؟"} /* Updated placeholder to Arabic */
        >
          {props.showIngestForm && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="pl-2 pr-3 -ml-2"
                  disabled={chat.messages.length !== 0}
                >
                  <Paperclip className="size-4" />
                  <span>رفع ملف</span> {/* Updated text to Arabic */}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>رفع ملف</DialogTitle> {/* Updated title to Arabic */}
                  <DialogDescription>
                    قم بتحميل ملف لاستخدامه في المحادثة.
                  </DialogDescription> {/* Updated description to Arabic */}
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-medium mb-2">قم بتحميل ملف .docx</h3> {/* Updated text to Arabic */}
                    <FileUploadForm />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">أو قم بلصق النص مباشرة</h3> {/* Updated text to Arabic */}
                    <UploadDocumentsForm />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {props.showIntermediateStepsToggle && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="show_intermediate_steps"
                name="show_intermediate_steps"
                checked={showIntermediateSteps}
                disabled={chat.isLoading || intermediateStepsLoading}
                onCheckedChange={(e) => setShowIntermediateSteps(!!e)}
              />
              <label htmlFor="show_intermediate_steps" className="text-sm">
                عرض الخطوات المتوسطة
              </label> {/* Updated text to Arabic */}
            </div>
          )}
        </ChatInput>
      }
    />
  );
}