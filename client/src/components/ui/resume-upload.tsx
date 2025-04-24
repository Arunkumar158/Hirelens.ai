import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ResumeUploadProps = {
  onUploadSuccess: (resumeId: number) => void;
};

export default function ResumeUpload({ onUploadSuccess }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (fileData: FormData) => {
      const res = await apiRequest('POST', '/api/resumes', fileData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Resume Uploaded',
        description: 'Your resume has been successfully uploaded.',
      });
      onUploadSuccess(data.id);
      setFile(null);
    },
    onError: (error: Error) => {
      setError(error.message || 'Failed to upload resume');
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload resume',
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Check file type
    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are accepted');
      return;
    }
    
    // Check file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('resume', file);
    
    uploadMutation.mutate(formData);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-lg font-medium text-gray-900 mb-1">Upload Resume</p>
          <p className="text-sm text-gray-500 text-center mb-4">
            Drag and drop your resume or click to browse<br />
            (PDF format only, 5MB max)
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="application/pdf"
            disabled={uploadMutation.isPending}
          />
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {file && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-primary mr-2" />
              <span className="font-medium truncate max-w-[240px]">{file.name}</span>
            </div>
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRemoveFile}
                disabled={uploadMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploadMutation.isPending}
            className="w-full sm:w-auto"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Resume'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
