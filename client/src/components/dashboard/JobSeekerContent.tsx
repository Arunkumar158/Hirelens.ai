import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardStats from './DashboardStats';
import ResumeUpload from '@/components/ui/resume-upload';
import JobDescriptionInput from '@/components/ui/job-description-input';
import AnalysisResult from '@/components/ui/analysis-result';
import AnalysisHistory from './AnalysisHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pen, PlusCircle } from 'lucide-react';
import ResumeList from './ResumeList';

export default function JobSeekerContent() {
  const { user } = useAuth();
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('analyze');

  // Fetch user's resumes
  const { data: resumes, isLoading: isLoadingResumes } = useQuery({
    queryKey: ['/api/resumes'],
    enabled: !!user
  });

  // Statistics for the jobseeker
  const stats = [
    { label: 'Resumes Uploaded', value: resumes?.length || 0 },
    { label: 'Analyses Run', value: 0 }, // This would be dynamically populated in a real app
    { label: 'Average Match Score', value: '65%' } // This would be dynamically calculated
  ];

  const handleResumeUploadSuccess = (resumeId: number) => {
    setSelectedResumeId(resumeId);
  };

  const handleAnalysisComplete = (analysisId: number) => {
    setSelectedAnalysisId(analysisId);
    setActiveTab('results');
  };

  const handleSelectResume = (resumeId: number) => {
    setSelectedResumeId(resumeId);
    setActiveTab('analyze');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Job Seeker Dashboard</h1>
      
      <DashboardStats stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analyze">Analyze Resume</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analyze" className="space-y-4 mt-6">
              {!selectedResumeId && (
                <ResumeUpload onUploadSuccess={handleResumeUploadSuccess} />
              )}
              
              {selectedResumeId && (
                <JobDescriptionInput 
                  resumeId={selectedResumeId} 
                  onAnalyzeClick={handleAnalysisComplete} 
                />
              )}
            </TabsContent>
            
            <TabsContent value="results" className="mt-6">
              <AnalysisResult analysisId={selectedAnalysisId} />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">My Resumes</h3>
                <Button variant="outline" size="sm" 
                  onClick={() => {
                    setSelectedResumeId(null);
                    setActiveTab('analyze');
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>
              
              {isLoadingResumes ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <ResumeList 
                  resumes={resumes || []} 
                  selectedResumeId={selectedResumeId}
                  onSelectResume={handleSelectResume}
                />
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Recent Analyses</h3>
              <AnalysisHistory />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
