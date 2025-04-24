import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getScoreColor } from '@/lib/utils';
import { BookOpenCheck, AlertCircle } from 'lucide-react';

// Mock data - in a real application, this would come from the API
const mockAnalyses = [
  { 
    id: 1, 
    resumeId: 1,
    jobDescription: "Frontend Developer with React experience",
    score: 85, 
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) 
  },
  { 
    id: 2, 
    resumeId: 1,
    jobDescription: "Full Stack Developer with Node.js and React",
    score: 75, 
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) 
  },
  { 
    id: 3, 
    resumeId: 2,
    jobDescription: "Senior JavaScript Developer",
    score: 62, 
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
  }
];

interface AnalysisHistoryProps {
  resumeId?: number;
  onSelectAnalysis?: (analysisId: number) => void;
}

export default function AnalysisHistory({ 
  resumeId,
  onSelectAnalysis
}: AnalysisHistoryProps) {
  // We would normally fetch analyses from the API
  // For now, we'll use mock data and simulate loading
  const { data: analyses, isLoading } = useQuery({
    queryKey: ['/api/analyses', resumeId],
    enabled: false, // Disabled to simulate with mock data for now
    initialData: mockAnalyses.filter(a => !resumeId || a.resumeId === resumeId),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }
  
  if (!analyses || analyses.length === 0) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">No analysis history yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Analyze your resume against job descriptions to see results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis) => (
        <div 
          key={analysis.id} 
          className="border rounded-lg p-3 hover:border-gray-300 transition-colors cursor-pointer"
          onClick={() => onSelectAnalysis?.(analysis.id)}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="truncate flex-1 mr-2">
              <p className="text-sm font-medium truncate">
                {analysis.jobDescription || "Job Analysis"}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(analysis.timestamp)}
              </p>
            </div>
            <Badge className={`${getScoreColor(analysis.score)} bg-opacity-10`}>
              {analysis.score}%
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
