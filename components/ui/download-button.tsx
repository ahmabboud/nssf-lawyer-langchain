import { Button } from './button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export const DownloadButton = ({ content, fileName }: { content: string, fileName: string }) => {
  const handleDownload = async (format: 'pdf' | 'docx') => {
    try {
      console.log('Starting download for format:', format);
      
      const response = await fetch(`/api/ai-responses/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/html',
          'user-role': 'admin', // optional: only needed if DOCX route uses it
        },
        body: content,
      });
  
      if (!response.ok) {
        let errorMessage = 'Failed to download';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            console.error('Non-JSON error response:', text);
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
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
