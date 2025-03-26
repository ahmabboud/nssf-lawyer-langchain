import { useState } from "react";
import type { Message } from "ai/react";
import { cn } from "@/utils/cn";
import { ChevronDown, ChevronUp } from "lucide-react";

export function IntermediateStep(props: { message: Message }) {
  // Add error handling for JSON parsing
  let action = null;
  let observation = null;
  
  try {
    const parsedInput = JSON.parse(props.message.content);
    action = parsedInput.action;
    observation = parsedInput.observation;
  } catch (error) {
    // If parsing fails, just display the content as observation
    action = { name: "Response" };
    observation = props.message.content;
  }
  
  const [expanded, setExpanded] = useState(false);

  // If parsing failed and we couldn't extract valid action data, return null
  if (!action) return null;

  return (
    <div
      className="ml-auto bg-secondary border border-input rounded p-3 max-w-[80%] mb-8 whitespace-pre-wrap flex flex-col"
      dir="rtl" // Ensure RTL layout
    >
      <button
        type="button"
        className={cn(
          "text-right flex items-center gap-1", // Align text to the right
          expanded && "w-full",
        )}
        onClick={(e) => setExpanded(!expanded)}
      >
        <span>
          الخطوة: <strong className="font-mono">{action.name}</strong> {/* Updated text to Arabic */}
        </span>
        <span className={cn(expanded && "hidden")}>
          <ChevronDown className="w-5 h-5" />
        </span>
        <span className={cn(!expanded && "hidden")}>
          <ChevronUp className="w-5 h-5" />
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden max-h-[0px] transition-[max-height] ease-in-out text-sm",
          expanded && "max-h-[360px]",
        )}
      >
        <div
          className={cn(
            "rounded",
            expanded ? "max-w-full" : "transition-[max-width] delay-100",
          )}
        >
          الإدخال:{" "} {/* Updated text to Arabic */}
          <code className="max-h-[100px] overflow-auto">
            {action.args ? JSON.stringify(action.args) : "N/A"}
          </code>
        </div>
        <div
          className={cn(
            "rounded",
            expanded ? "max-w-full" : "transition-[max-width] delay-100",
          )}
        >
          الإخراج:{" "} {/* Updated text to Arabic */}
          <code className="max-h-[260px] overflow-auto">{observation}</code>
        </div>
      </div>
    </div>
  );
}