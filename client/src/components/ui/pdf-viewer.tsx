import { useEffect, useState } from 'react';
import { AlertCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type PDFViewerProps = {
  file: File | string; // File object or URL
  height?: string;
};

export default function PDFViewer({ file, height = '500px' }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    if (!file) {
      setError('No file provided');
      setLoading(false);
      return;
    }
    
    let fileUrl: string;
    
    if (typeof file === 'string') {
      // If file is a URL
      fileUrl = file;
      setUrl(fileUrl);
      setLoading(false);
    } else {
      // If file is a File object
      fileUrl = URL.createObjectURL(file);
      setUrl(fileUrl);
      setLoading(false);
      
      // Clean up the object URL when the component unmounts
      return () => {
        URL.revokeObjectURL(fileUrl);
      };
    }
  }, [file]);
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 border border-red-200 rounded-md bg-red-50" style={{ height }}>
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-red-700 text-center">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ height }}>
        <Skeleton className="w-full h-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 border rounded-md overflow-hidden" style={{ height }}>
        {url ? (
          <iframe 
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
            className="w-full h-full" 
            title="PDF Viewer" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100">
            <FileText className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-600">PDF preview unavailable</p>
          </div>
        )}
      </div>
      
      {numPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <span className="text-sm text-gray-500">
            Page {currentPage} of {numPages}
          </span>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNextPage}
            disabled={currentPage === numPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
