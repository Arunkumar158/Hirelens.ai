import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getScoreColor } from '@/lib/utils';
import { BookOpenCheck, AlertCircle } from 'lucide-react';
import { getHistory } from '@/lib/api';

interface AnalysisHistoryProps {
  resumeId?: number;
  onSelectAnalysis?: (analysisId: number) => void;
}

export default function AnalysisHistory({ 
  resumeId,
  onSelectAnalysis
}: AnalysisHistoryProps) {
  const { data: allAnalyses, isLoading } = useQuery({
    queryKey: ['/api/v1/history'],
    queryFn: getHistory,
  });

  const analyses = allAnalyses?.filter(a => !resumeId || a.resumeId === resumeId);

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
