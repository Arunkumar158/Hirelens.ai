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
import { CheckCircle2, FileText, Lightbulb, Loader2, PlusCircle, Sparkles, Upload, XCircle } from 'lucide-react';
import ResumeList from './ResumeList';
import { analyzeResumes, getScoreLabel, getResumes, type Candidate } from '@/lib/api';

type AnalysisOutput = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
};

interface Resume {
  id: number;
  filename: string;
  uploadedAt: string | Date;
  content?: string;
}

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

  // ── API integration state ─────────────────────────────────────────────────
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<Candidate | null>(null);

  const analysisSteps = [
    'Extracting keywords...',
    'Matching skills...',
    'Scoring profile fit...',
    'Generating recommendations...'
  ];

  // Fetch user's resumes
  const { data: resumes, isLoading: isLoadingResumes } = useQuery<Resume[]>({
    queryKey: ['/api/v1/resumes'],
    queryFn: getResumes,
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

  // ── Real API handler ──────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setAnalysisError('Please upload your resume');
      return;
    }
    if (!jobDescription.trim()) {
      setAnalysisError('Please paste the job description you are applying for');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    setApiResult(null);
    try {
      const response = await analyzeResumes(jobDescription, [selectedFile]);
      setApiResult(response.ranked_candidates[0] ?? null);
      setActiveTab('results');
    } catch (err: any) {
      setAnalysisError(err.message ?? 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getKeywordTip = (keyword: string): string => {
    const kw = keyword.toLowerCase();
    if (kw.includes('docker'))
      return "Add Docker to your skills section. Consider completing Docker's official getting-started guide.";
    if (kw.includes('python'))
      return 'Highlight Python projects in your experience section with measurable outcomes.';
    if (kw.includes('sql') || kw.includes('postgresql'))
      return 'Add a SQL project or certification (e.g. Mode Analytics SQL Tutorial) to your portfolio.';
    if (kw.includes('aws') || kw.includes('cloud'))
      return 'List any cloud exposure, even personal projects. AWS Free Tier is a good starting point.';
    return `Add '${keyword}' to your Skills section if you have experience, or plan to learn it via a short course.`;
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

                  <div className="flex justify-end gap-3">
                    {/* Legacy mock analysis (kept) */}
                    <Button
                      variant="outline"
                      onClick={startAnalysis}
                      disabled={!hasValidInput || isAnalyzing}
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Quick Preview'}
                    </Button>
                    {/* Live API analysis */}
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="bg-blue-600 font-semibold shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-700/30"
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking your resume against this role...</>
                      ) : 'Analyze with AI'}
                    </Button>
                  </div>
                  {/* Error state */}
                  {analysisError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 mt-2">
                      <p className="text-sm text-red-700">{analysisError}</p>
                      <button
                        className="mt-1 text-xs font-medium text-red-600 hover:underline"
                        onClick={() => { setAnalysisError(null); setApiResult(null); }}
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="results" className="mt-6 space-y-4">
              {/* ── Live API results card ── */}
              {apiResult ? (() => {
                const pct = Math.round(apiResult.score * 100);
                const { label: scoreLabel, color: scoreColor } = getScoreLabel(apiResult.score);
                const motivational =
                  apiResult.score >= 0.85 ? 'Excellent! You are a strong fit for this role.' :
                  apiResult.score >= 0.65 ? 'Good match! You meet most of the requirements.' :
                  apiResult.score >= 0.40 ? 'You are partway there — a few gaps to address.' :
                                            'Significant gaps found — use the tips below to improve.';
                const bothEmpty = apiResult.matched_keywords.length === 0 && apiResult.missing_keywords.length === 0;
                const scoreColorClasses: Record<string, string> = {
                  green: 'bg-green-50 border-green-300 text-green-700',
                  blue:  'bg-blue-50 border-blue-300 text-blue-700',
                  yellow:'bg-yellow-50 border-yellow-300 text-yellow-700',
                  red:   'bg-red-50 border-red-300 text-red-700',
                };

                const actionPlan: string[] = [];
                if (apiResult.missing_keywords.length > 0)
                  actionPlan.push(`1. Add these skills to your resume Skills section: ${apiResult.missing_keywords.slice(0,3).join(', ')}`);
                actionPlan.push(`${actionPlan.length + 1}. Mirror the exact language from the job description in your resume — ATS systems match keywords precisely.`);
                if (apiResult.score < 0.65)
                  actionPlan.push(`${actionPlan.length + 1}. Consider a short online course or project to close the skill gaps highlighted above.`);
                actionPlan.push(`${actionPlan.length + 1}. Quantify your experience — replace vague descriptions with measurable achievements (e.g. 'Reduced load time by 40%').`);

                return (
                  <div className="space-y-4">
                    {/* Score section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Match Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <div
                            className="relative h-36 w-36 rounded-full grid place-items-center shrink-0"
                            style={{ background: `conic-gradient(#2563eb ${pct * 3.6}deg, #e2e8f0 0deg)` }}
                          >
                            <div className="h-28 w-28 rounded-full bg-white grid place-items-center">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-700">{pct}%</p>
                                <p className="text-xs text-slate-500">Match</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className={`text-xs font-medium border rounded-full px-3 py-1 ${scoreColorClasses[scoreColor]}`}>
                              {scoreLabel}
                            </span>
                            <p className="mt-3 text-sm font-medium text-slate-800">{motivational}</p>
                            <Progress value={pct} className="h-2 mt-3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Strengths */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">✅ What You Bring to the Table</CardTitle>
                        <CardDescription>These skills align with what the employer is looking for</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {bothEmpty ? (
                          <p className="text-sm text-slate-500 italic">
                            No direct keyword matches found — try reformatting your resume to mirror the job description language
                          </p>
                        ) : apiResult.matched_keywords.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {apiResult.matched_keywords.map((kw) => (
                              <span key={kw} className="text-xs px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 font-medium">{kw}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">
                            No direct keyword matches found — try reformatting your resume to mirror the job description language
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Gaps */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">🎯 Skills to Add or Highlight</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {apiResult.missing_keywords.length === 0 ? (
                          <p className="text-sm text-green-700 font-medium">No critical gaps detected — great job!</p>
                        ) : (
                          <div className="space-y-3">
                            {apiResult.missing_keywords.map((kw) => (
                              <div key={kw} className="rounded-md border border-red-100 bg-red-50 p-3">
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-red-200 text-red-700">{kw}</span>
                                <p className="mt-2 text-xs text-slate-600">{getKeywordTip(kw)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Action plan */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">📋 Your Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {actionPlan.map((step) => (
                            <li key={step} className="text-sm text-slate-700 flex gap-2">
                              <span className="text-blue-600 font-semibold shrink-0">→</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Apply encouragement */}
                    {apiResult.score >= 0.65 ? (
                      <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-center">
                        <p className="text-sm font-semibold text-green-800">
                          You meet the core requirements. Don't wait — apply now and let your matched skills speak for themselves.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                        <p className="text-sm text-slate-600">
                          Close the gaps above and recheck your score before applying. Even a few additions can significantly improve your match.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => { setApiResult(null); setActiveTab('analyze'); }}>
                        Start Over
                      </Button>
                    </div>
                  </div>
                );
              })() : null}

              {/* ── Legacy mock results (shown if no API result) ── */}
              {!apiResult && (
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
              )}
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
