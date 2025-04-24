import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

type JobDescriptionInputProps = {
  resumeId: number | null;
  onAnalyzeClick: (analysisId: number) => void;
};

export default function JobDescriptionInput({ resumeId, onAnalyzeClick }: JobDescriptionInputProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // Query for fetching saved jobs (for recruiters)
  const { data: savedJobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/jobs'],
    enabled: !!resumeId // Only fetch if we have a resumeId
  });

  // Mutation for analyzing resume
  const analyzeMutation = useMutation({
    mutationFn: async (data: { resumeId: number; jobDescription: string; jobId?: number }) => {
      const res = await apiRequest('POST', '/api/analyze', data);
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate any existing analyses queries
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
      onAnalyzeClick(data.id);
    }
  });

  const handleAnalyze = () => {
    if (!resumeId) return;
    
    const payload: { resumeId: number; jobDescription: string; jobId?: number } = {
      resumeId,
      jobDescription: selectedJobId ? '' : jobDescription,
    };
    
    if (selectedJobId) {
      payload.jobId = parseInt(selectedJobId);
    }
    
    analyzeMutation.mutate(payload);
  };

  const hasValidInput = () => {
    return resumeId && (jobDescription.trim().length > 0 || selectedJobId);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Job Description</h3>

        {savedJobs && savedJobs.length > 0 && (
          <div className="mb-4">
            <Label htmlFor="job-select">Select a saved job</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger id="job-select">
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Paste custom job description</SelectItem>
                {savedJobs.map((job: any) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(!selectedJobId || !savedJobs || savedJobs.length === 0) && (
          <div className="mb-4">
            <Label htmlFor="job-description">Paste job description</Label>
            <Textarea
              id="job-description"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="h-32 resize-none"
              disabled={analyzeMutation.isPending || !!selectedJobId}
            />
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={handleAnalyze} 
            disabled={!hasValidInput() || analyzeMutation.isPending}
            className="w-full sm:w-auto"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Resume'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
