import { useState, useEffect } from "react";
import { supabase, SupabaseJob } from "@/lib/supabase";
import { getScoreLabel } from "@/lib/api";
import { 
  Search, 
  FileText, 
  Star, 
  ChevronDown, 
  CheckCircle2, 
  XCircle,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type CandidateData = {
  id: string;
  filename: string;
  score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  uploaded_at: string;
};

export default function CandidatesPage() {
  const [jobs, setJobs] = useState<SupabaseJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("highest");
  
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch active jobs for recruiter
  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("recruiter_id", "temp-recruiter-id")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (data && !error) {
        setJobs(data);
      }
    }
    fetchJobs();
  }, []);

  // Fetch candidates when job is selected
  useEffect(() => {
    if (!selectedJobId) {
      setCandidates([]);
      return;
    }

    async function fetchCandidates() {
      setIsLoading(true);
      
      // 1. Fetch resumes
      const { data: resumes, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .eq("job_id_local", selectedJobId);

      if (resumeError || !resumes) {
        setIsLoading(false);
        return;
      }

      if (resumes.length === 0) {
        setCandidates([]);
        setIsLoading(false);
        return;
      }

      const resumeIds = resumes.map((r) => r.id);

      // 2. Fetch analysis results
      const { data: analysisResults, error: analysisError } = await supabase
        .from("analysis_results")
        .select("*")
        .in("resume_id", resumeIds)
        .order("created_at", { ascending: false });

      if (analysisError) {
        console.error("Error fetching analysis results", analysisError);
      }

      // 3. Combine
      const combined: CandidateData[] = resumes.map((resume) => {
        // Find latest analysis result
        const result = analysisResults?.find((ar) => ar.resume_id === resume.id);
        
        return {
          id: resume.id,
          filename: resume.filename,
          score: result ? result.score : null, // keep null if not analyzed
          matched_keywords: result?.matched_keywords || [],
          missing_keywords: result?.missing_keywords || [],
          uploaded_at: resume.uploaded_at
        };
      });

      setCandidates(combined);
      setIsLoading(false);
    }

    fetchCandidates();
  }, [selectedJobId]);

  // Filter and sort
  const filteredAndSortedCandidates = [...candidates]
    .filter((c) => c.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "highest") {
        return (b.score || 0) - (a.score || 0);
      } else if (sortBy === "lowest") {
        return (a.score || 0) - (b.score || 0);
      } else {
        // recent
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
      }
    });

  const getBadgeColorClass = (color: string) => {
    switch (color) {
      case "green": return "bg-green-100 text-green-800 hover:bg-green-100";
      case "blue": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "yellow": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "red": return "bg-red-100 text-red-800 hover:bg-red-100";
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getVerdict = (score: number | null) => {
    if (score === null) return "Not analyzed yet. Upload and click 'Rank Candidates' on the dashboard.";
    if (score >= 0.85) return "Strong fit — recommend for interview";
    if (score >= 0.65) return "Good candidate — worth a closer look";
    if (score >= 0.40) return "Partial match — consider for junior or adjacent roles";
    return "Low match — does not meet core requirements";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
        <p className="text-muted-foreground mt-2">
          View and analyze candidates for your active jobs.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="w-full md:w-1/3 flex items-center gap-3">
              <span className="font-medium whitespace-nowrap text-sm text-gray-600">Select Job:</span>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a job..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <span className="font-medium whitespace-nowrap text-sm text-gray-600">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highest">Highest Score</SelectItem>
                    <SelectItem value="lowest">Lowest Score</SelectItem>
                    <SelectItem value="recent">Recently Uploaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by filename..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedJobId ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No job selected</h3>
            <p className="text-gray-500 mt-1">Select a job from the dropdown to view its candidates.</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card className="bg-white">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading candidates...</p>
          </CardContent>
        </Card>
      ) : candidates.length === 0 ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No candidates found</h3>
            <p className="text-gray-500 mt-1">No resumes have been uploaded for this job yet.</p>
          </CardContent>
        </Card>
      ) : filteredAndSortedCandidates.length === 0 ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No matching candidates</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search query.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-16 text-center font-semibold text-gray-600">#</TableHead>
                  <TableHead className="font-semibold text-gray-600">Candidate Name</TableHead>
                  <TableHead className="w-32 font-semibold text-gray-600">Score</TableHead>
                  <TableHead className="w-24 text-center font-semibold text-gray-600">Match</TableHead>
                  <TableHead className="w-32 text-right font-semibold text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCandidates.map((candidate, index) => {
                  const scoreLabel = candidate.score !== null ? getScoreLabel(candidate.score) : null;
                  const isMatch = candidate.score !== null && candidate.score >= 0.65;
                  
                  return (
                    <TableRow key={candidate.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="text-center font-medium text-gray-500">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-primary/60" />
                          {candidate.filename}
                        </div>
                      </TableCell>
                      <TableCell>
                        {candidate.score !== null && scoreLabel ? (
                          <Badge variant="secondary" className={getBadgeColorClass(scoreLabel.color)}>
                            {Math.round(candidate.score * 100)}% - {scoreLabel.label.split(' ')[0]}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Not analyzed</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isMatch ? <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 inline" /> : <span className="text-gray-300">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setIsModalOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-4">
            {filteredAndSortedCandidates.map((candidate, index) => {
              const scoreLabel = candidate.score !== null ? getScoreLabel(candidate.score) : null;
              const isMatch = candidate.score !== null && candidate.score >= 0.65;
              
              return (
                <Card key={candidate.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-medium flex items-start gap-2 max-w-[70%]">
                        <span className="text-gray-400 text-xs mt-1">#{index + 1}</span>
                        <span className="truncate">{candidate.filename}</span>
                      </div>
                      <div className="flex items-center">
                        {isMatch && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-2" />}
                        {candidate.score !== null && scoreLabel ? (
                          <Badge variant="secondary" className={getBadgeColorClass(scoreLabel.color)}>
                            {Math.round(candidate.score * 100)}%
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs italic">N/A</span>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setIsModalOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Candidate Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCandidate && (
            <>
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-bold flex items-center">
                  <FileText className="mr-2 h-6 w-6 text-primary" />
                  {selectedCandidate.filename}
                </DialogTitle>
                <DialogDescription>
                  Detailed analysis breakdown for this candidate.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Score */}
                <div className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg border">
                  {selectedCandidate.score !== null ? (
                    <>
                      <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-full shadow-inner mb-4">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="58"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-slate-100"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="58"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray="364.4"
                            strokeDashoffset={364.4 - (364.4 * selectedCandidate.score)}
                            className={getScoreLabel(selectedCandidate.score).color === 'green' ? 'text-green-500' : getScoreLabel(selectedCandidate.score).color === 'blue' ? 'text-blue-500' : getScoreLabel(selectedCandidate.score).color === 'yellow' ? 'text-yellow-500' : 'text-red-500'}
                          />
                        </svg>
                        <div className="text-3xl font-bold text-slate-800">
                          {Math.round(selectedCandidate.score * 100)}<span className="text-xl text-slate-500">%</span>
                        </div>
                      </div>
                      <Badge className={`px-3 py-1 text-sm ${getBadgeColorClass(getScoreLabel(selectedCandidate.score).color)}`}>
                        {getScoreLabel(selectedCandidate.score).label}
                      </Badge>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-400 text-2xl">?</span>
                      </div>
                      <p className="text-gray-500 font-medium">Not Analyzed</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Keywords */}
                <div className="md:col-span-2 space-y-6">
                  {/* Matched Skills */}
                  <div>
                    <h4 className="flex items-center font-semibold text-gray-800 mb-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                      ✅ Skills Matched 
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({selectedCandidate.matched_keywords?.length || 0} skills matched)
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.matched_keywords && selectedCandidate.matched_keywords.length > 0 ? (
                        selectedCandidate.matched_keywords.map((kw, i) => (
                          <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {kw}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No matching skills found.</p>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <h4 className="flex items-center font-semibold text-gray-800 mb-3">
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      ❌ Skills Missing
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({selectedCandidate.missing_keywords?.length || 0} skills missing)
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.missing_keywords && selectedCandidate.missing_keywords.length > 0 ? (
                        selectedCandidate.missing_keywords.map((kw, i) => (
                          <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {kw}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">All required skills present.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Coverage Analysis & Verdict */}
              {selectedCandidate.score !== null && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-gray-800 mb-4">Coverage Analysis</h4>
                  
                  {(() => {
                    const matchedCount = selectedCandidate.matched_keywords?.length || 0;
                    const missingCount = selectedCandidate.missing_keywords?.length || 0;
                    const total = matchedCount + missingCount;
                    const coverage = total > 0 ? Math.round((matchedCount / total) * 100) : 0;
                    
                    return (
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Skill Coverage</span>
                          <span className="font-medium text-gray-900">Covers {coverage}% of required skills</span>
                        </div>
                        <Progress value={coverage} className="h-2" />
                      </div>
                    );
                  })()}
                  
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex items-start">
                    <Star className="h-5 w-5 text-primary mt-0.5 mr-3 shrink-0" />
                    <div>
                      <h5 className="font-semibold text-primary mb-1">AI Verdict</h5>
                      <p className="text-sm text-gray-700">{getVerdict(selectedCandidate.score)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsModalOpen(false)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
