"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Loader2 } from "lucide-react";

export function FileUploadForm() {
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
      return;
    }

    setIsLoading(true);
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
        setMessage("File uploaded and processed successfully!");
      } else {
        const json = await response.json();
        if (json.error) {
          setMessage(`Error: ${json.error}`);
        } else {
          setMessage("An unknown error occurred during upload");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Error uploading file. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={ingest} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload a .docx file to be processed and added to the vector store.
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".docx"
            onChange={handleFileChange}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !file}>
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
        <div className="p-2 text-sm bg-slate-100 dark:bg-slate-800 rounded">
          {message}
        </div>
      )}
    </form>
  );
}