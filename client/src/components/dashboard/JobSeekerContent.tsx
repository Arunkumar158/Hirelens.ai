import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardStats from './DashboardStats';
import AnalysisHistory from './AnalysisHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { CheckCircle2, FileText, Lightbulb, PlusCircle, Sparkles, Upload, XCircle } from 'lucide-react';
import ResumeList from './ResumeList';

type AnalysisOutput = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
};

const commonResumeKeywords = [
  'javascript', 'typescript', 'react', 'next.js', 'node.js', 'python', 'sql',
  'mongodb', 'postgresql', 'aws', 'docker', 'kubernetes', 'git', 'rest', 'api',
  'tailwind', 'figma', 'ci/cd', 'testing', 'agile', 'communication', 'leadership'
];

export default function JobSeekerContent() {
  const { user } = useAuth();
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('analyze');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysisSteps = [
    'Extracting keywords...',
    'Matching skills...',
    'Scoring profile fit...',
    'Generating recommendations...'
  ];

  // Fetch user's resumes
  const { data: resumes, isLoading: isLoadingResumes } = useQuery({
    queryKey: ['/api/resumes'],
    enabled: !!user
  });

  // Statistics for the jobseeker
  const stats = [
    { label: 'Resumes Uploaded', value: resumes?.length || 0 },
    { label: 'Analyses Run', value: analysisResult ? 1 : 0 },
    { label: 'Average Match Score', value: analysisResult ? `${analysisResult.score}%` : '0%' }
  ];

  const hasValidInput = useMemo(() => {
    return !!selectedFile && jobDescription.trim().length > 0;
  }, [selectedFile, jobDescription]);

  const extractKeywords = (text: string): string[] => {
    return text
      .toLowerCase()
      .split(/[^a-zA-Z0-9.+#/-]+/)
      .filter((word) => word.length > 2)
      .filter((word, index, arr) => arr.indexOf(word) === index);
  };

  const buildAnalysis = (): AnalysisOutput => {
    const jdKeywords = extractKeywords(jobDescription);
    const resumeKeywords = commonResumeKeywords;
    const matchedKeywords = jdKeywords.filter((skill) => resumeKeywords.includes(skill)).slice(0, 12);
    const missingKeywords = jdKeywords.filter((skill) => !resumeKeywords.includes(skill)).slice(0, 10);

    const safeTotal = Math.max(jdKeywords.length, 1);
    const rawScore = Math.round((matchedKeywords.length / safeTotal) * 100);
    const score = Math.min(Math.max(rawScore, 32), 94);

    const suggestions: string[] = [];
    if (missingKeywords.length > 0) {
      suggestions.push(`Add measurable project experience around: ${missingKeywords.slice(0, 3).join(', ')}.`);
    }
    suggestions.push('Include 2-3 bullet points with metrics to strengthen impact (for example: "% uptime", "% conversion lift").');
    suggestions.push('Mirror the exact JD phrasing for core skills in your summary and skills section.');

    return {
      score,
      matchedKeywords: matchedKeywords.length ? matchedKeywords : ['communication'],
      missingKeywords,
      suggestions,
    };
  };

  const startAnalysis = () => {
    if (!hasValidInput) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStepIndex(0);

    const stepCount = analysisSteps.length;
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      const progress = Math.min(Math.round((current / stepCount) * 100), 100);
      setAnalysisProgress(progress);
      setAnalysisStepIndex(Math.min(current, stepCount - 1));

      if (current >= stepCount) {
        window.clearInterval(timer);
        setIsAnalyzing(false);
        setAnalysisResult(buildAnalysis());
        setActiveTab('results');
      }
    }, 700);
  };

  const downloadReport = () => {
    if (!analysisResult) return;
    const report = [
      'HireLens Resume Analysis Report',
      `Resume: ${selectedFile?.name ?? 'Uploaded Resume'}`,
      `Match Score: ${analysisResult.score}%`,
      '',
      `Matched Keywords: ${analysisResult.matchedKeywords.join(', ') || 'None'}`,
      `Missing Keywords: ${analysisResult.missingKeywords.join(', ') || 'None'}`,
      '',
      'Suggestions:',
      ...analysisResult.suggestions.map((item, i) => `${i + 1}. ${item}`)
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'hirelens-analysis-report.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type !== 'application/pdf') return;
    setSelectedFile(file);
  };

  const handleReanalyze = () => {
    setActiveTab('analyze');
    startAnalysis();
  };

  const handleSelectResume = (resumeId: number) => {
    setSelectedResumeId(resumeId);
    setActiveTab('analyze');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-2xl font-bold">Job Seeker Dashboard</h1>
          </div>

          <DashboardStats stats={stats} />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analyze">Analyze Resume</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analyze" className="space-y-4 mt-6">
              <Card className="relative overflow-hidden">
                {isAnalyzing && (
                  <div className="absolute inset-0 z-10 bg-slate-950/65 backdrop-blur-[1px] flex items-center justify-center p-6">
                    <div className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-5">
                      <div className="flex items-center gap-2 text-slate-100 mb-3">
                        <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
                        <span className="font-medium">{analysisSteps[analysisStepIndex]}</span>
                      </div>
                      <Progress value={analysisProgress} className="h-2 bg-slate-800" />
                    </div>
                  </div>
                )}
                <CardHeader>
                  <CardDescription>Upload your PDF and paste a job description to start matching.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
                      <p className="text-sm font-medium text-slate-700 mb-3">Upload Resume (PDF)</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full rounded-md border border-slate-300 bg-white p-5 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-700">Click to choose a resume file</p>
                        <p className="text-xs text-slate-500 mt-1">PDF only</p>
                      </button>
                      {selectedFile && (
                        <div className="mt-3 flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 p-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-slate-800 truncate">{selectedFile.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4 bg-white">
                      <p className="text-sm font-medium text-slate-700 mb-3">Paste Job Description</p>
                      <Textarea
                        placeholder="Paste responsibilities, required skills, and qualifications..."
                        className="min-h-[220px] resize-y"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        disabled={isAnalyzing}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={startAnalysis}
                      disabled={!hasValidInput || isAnalyzing}
                      className="bg-blue-600 font-semibold shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-700/30"
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="results" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                  <CardDescription>Keyword match and targeted improvements for this role.</CardDescription>
                </CardHeader>
                <CardContent>
                  {!analysisResult ? (
                    <div className="text-center py-10 text-slate-500">
                      Run an analysis to see your match score and recommendations.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div
                          className="relative h-36 w-36 rounded-full grid place-items-center"
                          style={{
                            background: `conic-gradient(#2563eb ${analysisResult.score * 3.6}deg, #e2e8f0 0deg)`,
                          }}
                        >
                          <div className="h-28 w-28 rounded-full bg-white grid place-items-center">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-700">{analysisResult.score}%</p>
                              <p className="text-xs text-slate-500">Match</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 mb-2">Profile Match Score</h3>
                          <Progress value={analysisResult.score} className="h-2" />
                          <p className="text-sm text-slate-600 mt-2">
                            Stronger score comes from matching exact JD terms and adding quantified experience bullets.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                          <h4 className="text-sm font-semibold text-green-800 flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-4 w-4" />
                            Matched Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.matchedKeywords.map((skill) => (
                              <Badge key={skill} variant="outline" className="bg-white text-green-700 border-green-200">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                          <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2 mb-3">
                            <XCircle className="h-4 w-4" />
                            Missing Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.missingKeywords.length ? analysisResult.missingKeywords.map((skill) => (
                              <Badge key={skill} variant="outline" className="bg-white text-red-700 border-red-200">
                                {skill}
                              </Badge>
                            )) : (
                              <span className="text-sm text-red-700">No major gaps detected.</span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                          <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-3">
                            <Lightbulb className="h-4 w-4" />
                            Improvement Suggestions
                          </h4>
                          <ul className="space-y-2">
                            {analysisResult.suggestions.map((tip) => (
                              <li key={tip} className="text-sm text-amber-800">- {tip}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 justify-end">
                        <Button variant="outline" onClick={handleReanalyze}>Re-analyze</Button>
                        <Button onClick={downloadReport} className="bg-blue-600 hover:bg-blue-700">Download Report</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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
                    setSelectedFile(null);
                    setJobDescription('');
                    setAnalysisResult(null);
                    setIsAnalyzing(false);
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
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-lg font-medium">Recent Analyses</h3>
                {Array.isArray(resumes) && resumes.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveTab('analyze');
                      window.setTimeout(() => fileInputRef.current?.click(), 0);
                    }}
                  >
                    Quick Upload
                  </Button>
                )}
              </div>
              <AnalysisHistory />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
