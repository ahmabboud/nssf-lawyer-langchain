"use client";
import { useState, type FormEvent, type Dispatch, type SetStateAction } from "react";
import DEFAULT_RETRIEVAL_TEXT from "@/data/DefaultRetrievalText";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Loader2 } from "lucide-react";

interface ChunkingOptions {
  windowSize: number;
  overlapSize: number;
  splitterTerm: string;
}

interface UploadDocumentsFormProps {
  onLoadingChange?: Dispatch<SetStateAction<boolean>>;
  onError?: Dispatch<SetStateAction<string | null>>;
  disabled?: boolean;
  chunkingMethod?: "window" | "splitter";
  chunkingOptions?: ChunkingOptions;
}

export function UploadDocumentsForm({ 
  onLoadingChange, 
  onError, 
  disabled,
  chunkingMethod = "window",
  chunkingOptions = {
    windowSize: 1000,
    overlapSize: 100,
    splitterTerm: "\n\n"
  }
}: UploadDocumentsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [document, setDocument] = useState(DEFAULT_RETRIEVAL_TEXT);
  
  const ingest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsLoading(true);
    if (onLoadingChange) onLoadingChange(true);
    
    try {
      const response = await fetch("/api/retrieval/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: document,
          chunkingMethod: chunkingMethod,
          ...(chunkingMethod === "window"
            ? { windowSize: chunkingOptions.windowSize, overlapSize: chunkingOptions.overlapSize }
            : { splitterTerm: chunkingOptions.splitterTerm }),
        }),
      });
      
      if (response.status === 200) {
        setDocument("Uploaded!");
        if (onError) onError(null);
      } else {
        const json = await response.json();
        if (json.error) {
          setDocument(json.error);
          if (onError) onError(json.error);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = "Error uploading text. See console for details.";
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };
  
  return (
    <form onSubmit={ingest} className="flex flex-col gap-4 w-full">
      <Textarea
        className="grow p-4 rounded bg-transparent min-h-[512px]"
        value={document}
        onChange={(e) => setDocument(e.target.value)}
        disabled={isLoading || disabled}
      />
      <Button type="submit" disabled={isLoading || disabled}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing
          </>
        ) : (
          "Upload"
        )}
      </Button>
    </form>
  );
}
