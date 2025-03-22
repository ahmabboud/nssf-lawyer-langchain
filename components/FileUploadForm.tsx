"use client";
import { useState, type FormEvent, type Dispatch, type SetStateAction } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2 } from "lucide-react";

interface FileUploadFormProps {
  onLoadingChange?: Dispatch<SetStateAction<boolean>>;
  onError?: Dispatch<SetStateAction<string | null>>;
  disabled?: boolean;
}

export function FileUploadForm({ onLoadingChange, onError, disabled }: FileUploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(`Selected file: ${e.target.files[0].name}`);
    }
  };

  const ingest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file first.");
      if (onError) onError("Please select a file first.");
      return;
    }

    setIsLoading(true);
    if (onLoadingChange) onLoadingChange(true);
    setMessage("Uploading and processing file...");

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/retrieval/ingest/file", {
        method: "POST",
        body: formData,
      });
      if (response.status === 200) {
        const data = await response.json();
        setMessage(data.message || "File uploaded and processed successfully!");
        if (onError) onError(null);
        setFile(null);
        // Reset the file input
        const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const json = await response.json();
        const errorMessage = json.error ? `Error: ${json.error}` : "An unknown error occurred during upload";
        setMessage(errorMessage);
        if (onError) onError(errorMessage);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = "Error uploading file. See console for details.";
      setMessage(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  return (
    <form onSubmit={ingest} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload a document file to be processed and added to the vector store.
        </p>
        <div className="flex items-center gap-2">
          <Input
            id="fileUpload"
            type="file"
            accept=".txt,.docx,.pdf"
            onChange={handleFileChange}
            className="flex-1"
            disabled={isLoading || disabled}
          />
          <Button type="submit" disabled={isLoading || !file || disabled}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </div>
      {message && (
        <div className="p-3 mt-2 text-sm bg-slate-100 dark:bg-slate-800 rounded">
          {message}
        </div>
      )}
    </form>
  );
}