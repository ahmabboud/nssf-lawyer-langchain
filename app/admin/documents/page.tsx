"use client";
import { useState } from "react";
import { FileUploadForm } from "@/components/FileUploadForm";
import { UploadDocumentsForm } from "@/components/UploadDocumentsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export default function AdminDocumentsPage() {
  const [activeTab, setActiveTab] = useState("file");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chunking settings
  const [chunkingMethod, setChunkingMethod] = useState<"window" | "splitter">("window");
  const [windowSize, setWindowSize] = useState<number>(1000);
  const [overlapSize, setOverlapSize] = useState<number>(100);
  const [splitterTerm, setSplitterTerm] = useState<string>("\n\n");

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

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Document Chunking Settings</CardTitle>
            <CardDescription>
              Configure how documents are split before being processed and stored in the vector database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={chunkingMethod}
              onValueChange={(value: string) => setChunkingMethod(value as "window" | "splitter")}
              className="space-y-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="window" id="window" className="mt-1" />
                <div className="grid gap-2 w-full">
                  <Label htmlFor="window" className="font-medium">Window Chunking</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="window-size">Chunk Size (characters)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id="window-size"
                          disabled={chunkingMethod !== "window" || isLoading}
                          min={100}
                          max={5000}
                          step={100}
                          value={[windowSize]}
                          onValueChange={(values: number[]) => setWindowSize(values[0])}
                          className="flex-grow"
                        />
                        <span className="w-16 text-right">{windowSize}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="overlap-size">Overlap Size (characters)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id="overlap-size"
                          disabled={chunkingMethod !== "window" || isLoading}
                          min={0}
                          max={500}
                          step={10}
                          value={[overlapSize]}
                          onValueChange={(values: number[]) => setOverlapSize(values[0])}
                          className="flex-grow"
                        />
                        <span className="w-16 text-right">{overlapSize}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="splitter" id="splitter" className="mt-1" />
                <div className="grid gap-2 w-full">
                  <Label htmlFor="splitter" className="font-medium">Split by Term</Label>
                  <div className="space-y-2">
                    <Label htmlFor="splitter-term">Split on Term</Label>
                    <Input
                      id="splitter-term"
                      placeholder="Enter text to split on (e.g. &quot;\n\n&quot; for paragraphs)"
                      value={splitterTerm}
                      onChange={(e) => setSplitterTerm(e.target.value)}
                      disabled={chunkingMethod !== "splitter" || isLoading}
                      className="max-w-md"
                    />
                    <p className="text-sm text-slate-500">
                      Common examples: &quot;\n\n&quot; for paragraphs, &quot;\n&quot; for lines, &quot;.&quot; for sentences
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

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
                chunkingMethod={chunkingMethod}
                chunkingOptions={{
                  windowSize,
                  overlapSize,
                  splitterTerm
                }}
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
                chunkingMethod={chunkingMethod}
                chunkingOptions={{
                  windowSize,
                  overlapSize,
                  splitterTerm
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}