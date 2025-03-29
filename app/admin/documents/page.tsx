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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminDocumentsPage() {
  const [activeTab, setActiveTab] = useState("file");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCleaningDocuments, setIsCleaningDocuments] = useState(false);
  
  // Chunking settings
  const [chunkingMethod, setChunkingMethod] = useState<"window" | "splitter">("window");
  const [windowSize, setWindowSize] = useState<number>(1000);
  const [overlapSize, setOverlapSize] = useState<number>(100);
  const [splitterTerm, setSplitterTerm] = useState<string>("\n\n");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null); // Clear any errors when switching tabs
  };

  const handleCleanAllDocuments = async () => {
    setIsCleaningDocuments(true);
    try {
      // Get the current session - this ensures the auth token is included
      const { supabase } = await import('@/utils/supabaseClient');
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Make the API call with credentials
      const response = await fetch('/api/retrieval/clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include the access token if available
          ...(sessionData?.session?.access_token 
            ? { Authorization: `Bearer ${sessionData.session.access_token}` } 
            : {})
        },
        credentials: 'include', // Important: include cookies in the request
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || 'Failed to clean documents');
      }
      
      toast.success('All documents have been deleted successfully');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error cleaning documents:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while cleaning documents');
      setError(error instanceof Error ? error.message : 'An error occurred while cleaning documents');
    } finally {
      setIsCleaningDocuments(false);
    }
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

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Documents Configuration</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Clean All Documents</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clean All Documents</DialogTitle>
              <DialogDescription>
                This action will delete all documents from the database. This action cannot be undone.
                Are you sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCleaningDocuments}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCleanAllDocuments} 
                disabled={isCleaningDocuments}
              >
                {isCleaningDocuments ? 'Cleaning...' : 'Yes, Delete All Documents'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                disabled={isLoading || isCleaningDocuments}
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
                disabled={isLoading || isCleaningDocuments}
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