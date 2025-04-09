import { Button } from './button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export const DownloadButton = ({ content, fileName }: { content: string, fileName: string }) => {
  const handleDownload = async (format: 'pdf' | 'docx') => {
    try {
      const response = await fetch(`app/api/ai-responses/${format}`, {
        method: 'POST',  // Ensure this is 'POST'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download');
      }
  
      const data = await response.blob(); 
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-response-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Download failed with error:', error);
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleDownload('pdf')}>
        <Download className="h-4 w-4 mr-2" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleDownload('docx')}>
        <Download className="h-4 w-4 mr-2" /> DOCX
      </Button>
    </div>
  );
};
