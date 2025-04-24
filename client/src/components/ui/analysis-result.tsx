import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { SkillsChart } from '@/components/ui/skills-chart';
import { CheckCircle, XCircle, AlertCircle, FileText, Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalysisResultProps {
  analysisId: number | null;
}

export default function AnalysisResult({ analysisId }: AnalysisResultProps) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['/api/analyses', analysisId],
    enabled: !!analysisId,
  });

  if (!analysisId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resume Analysis</CardTitle>
          <CardDescription>
            Upload a resume and provide a job description to see your match score and get personalized feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No analysis results yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis Not Found</CardTitle>
          <CardDescription>
            The requested analysis could not be found.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const matchedSkills = Array.isArray(analysis.matchedSkills) ? analysis.matchedSkills : [];
  const missingSkills = Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Resume Analysis
          <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
            {analysis.score}%
          </span>
        </CardTitle>
        <CardDescription>
          Based on your resume and the provided job description
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-600 mb-1 block">
            Match Score
          </label>
          <div className="flex items-center">
            <Progress value={analysis.score} className="mr-4 flex-1" />
            <span className={`text-sm font-semibold ${getScoreColor(analysis.score)}`}>
              {analysis.score}%
            </span>
          </div>
          <div className={`mt-4 p-4 rounded-lg ${getScoreBackground(analysis.score)}`}>
            <p className="text-gray-800">{analysis.feedback}</p>
          </div>
        </div>

        <Tabs defaultValue="skills" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="skills">Skills Match</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="skills" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium flex items-center mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  Matching Skills ({matchedSkills.length})
                </h4>
                {matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {matchedSkills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No matching skills found.</p>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium flex items-center mb-2">
                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  Missing Skills ({missingSkills.length})
                </h4>
                {missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No missing skills found.</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="suggestions" className="mt-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start">
                <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">Improvement Suggestions</h4>
                  <p className="text-amber-700 text-sm">{analysis.suggestions}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="chart" className="mt-4 h-60">
            <SkillsChart 
              matchedSkills={matchedSkills.length} 
              missingSkills={missingSkills.length} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
