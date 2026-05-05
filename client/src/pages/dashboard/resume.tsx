import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getResumes, uploadResume, deleteResume } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { FileText, Loader2, Plus, Trash2, Upload, FileType, CheckCircle2 } from 'lucide-react';
import { formatDate, truncate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumePage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['/api/v1/resumes'],
    queryFn: getResumes,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/resumes'] });
      toast({
        title: "Success",
        description: "Resume uploaded successfully.",
      });
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload resume.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/resumes'] });
      toast({
        title: "Deleted",
        description: "Resume has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete resume.",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    // Fake progress for UX
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    uploadMutation.mutate(file);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            My Resumes
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your professional profiles and upload new versions for analysis.
          </p>
        </div>
        <Button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Upload New Resume
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf"
          onChange={handleFileSelect}
        />
      </div>

      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-blue-100 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-blue-600 animate-bounce" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Uploading your resume...</p>
                    <Progress value={uploadProgress} className="h-1.5 mt-2 bg-blue-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-slate-100 rounded-t-lg" />
              <CardContent className="h-12 bg-slate-50" />
            </Card>
          ))
        ) : resumes && resumes.length > 0 ? (
          resumes.map((resume: any, index: number) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this resume?")) {
                          deleteMutation.mutate(resume.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg mt-4 truncate" title={resume.filename}>
                    {truncate(resume.filename, 24)}
                  </CardTitle>
                  <CardDescription>
                    Uploaded {formatDate(resume.uploadedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded-md">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified PDF
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <FileType className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">No resumes yet</h3>
            <p className="text-slate-500 mt-2 max-w-xs text-center">
              Upload your first resume to start analyzing it against job descriptions.
            </p>
            <Button 
              variant="outline" 
              className="mt-6 border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

