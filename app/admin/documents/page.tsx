"use client";
import { useState } from "react";
import { FileUploadForm } from "@/components/FileUploadForm";
import { UploadDocumentsForm } from "@/components/UploadDocumentsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDocumentsPage() {
  const [activeTab, setActiveTab] = useState("file");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null); // Clear any errors when switching tabs
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Document Management</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">
        Upload and manage documents for the NSSF Legal Assistant. Documents will be processed, chunked, 
        and stored in the Supabase Vector Database for retrieval during chat conversations.
      </p>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="file">File Upload</TabsTrigger>
          <TabsTrigger value="text">Text Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document Files</CardTitle>
              <CardDescription>
                Upload document files (docx, pdf) to be processed and added to the knowledge base.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadForm 
                onLoadingChange={setIsLoading} 
                onError={setError}
                disabled={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Upload Text Directly</CardTitle>
              <CardDescription>
                Paste text directly to be processed and added to the knowledge base.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadDocumentsForm 
                onLoadingChange={setIsLoading}
                onError={setError}
                disabled={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}