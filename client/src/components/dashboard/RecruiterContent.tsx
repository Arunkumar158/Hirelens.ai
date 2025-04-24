import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import DashboardStats from './DashboardStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, Users, Briefcase, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getScoreColor, formatDate } from '@/lib/utils';

const jobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(10, "Job description must be at least 10 characters"),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function RecruiterContent() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch recruiter's jobs
  const { data: jobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Fetch all resumes (in a real app, this would be paginated and filtered)
  const { data: resumes, isLoading: isLoadingResumes } = useQuery({
    queryKey: ['/api/resumes/all'],
    enabled: false, // Disable auto-fetching for demo
  });

  // Fetch analyses for the selected job
  const { data: analyses, isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ['/api/analyses/job', selectedJobId],
    enabled: !!selectedJobId,
  });

  // Form for creating a new job
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Mutation for creating a new job
  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      const res = await apiRequest('POST', '/api/jobs', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      form.reset();
    },
  });

  // Mutation for bulk analyzing resumes
  const bulkAnalyzeMutation = useMutation({
    mutationFn: async (data: { jobId: number, resumeIds: number[] }) => {
      const res = await apiRequest('POST', '/api/recruiter/bulk-analyze', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyses/job', selectedJobId] });
      setSelectedCandidates([]);
      setDialogOpen(false);
    },
  });

  const onSubmit = (data: JobFormValues) => {
    createJobMutation.mutate(data);
  };

  const handleBulkAnalyze = () => {
    if (!selectedJobId || selectedCandidates.length === 0) return;
    
    bulkAnalyzeMutation.mutate({
      jobId: selectedJobId,
      resumeIds: selectedCandidates
    });
  };

  const toggleCandidateSelection = (resumeId: number) => {
    setSelectedCandidates(prev => 
      prev.includes(resumeId)
        ? prev.filter(id => id !== resumeId)
        : [...prev, resumeId]
    );
  };

  // Mock statistics for the recruiter dashboard
  const stats = [
    { label: 'Active Jobs', value: jobs?.length || 0 },
    { label: 'Candidates Analyzed', value: analyses?.length || 0 },
    { label: 'Top Match Score', value: analyses?.length ? `${Math.max(...analyses.map((a: any) => a.score))}%` : '0%' }
  ];

  // Mock data for candidates (in a real app, this would come from the backend)
  const mockCandidates = [
    { id: 1, name: 'John Doe', resumeId: 1, email: 'john@example.com', dateApplied: '2023-06-15' },
    { id: 2, name: 'Jane Smith', resumeId: 2, email: 'jane@example.com', dateApplied: '2023-06-14' },
    { id: 3, name: 'Alex Johnson', resumeId: 3, email: 'alex@example.com', dateApplied: '2023-06-12' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Recruiter Dashboard</h1>
      
      <DashboardStats stats={stats} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs">My Jobs</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jobs" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Job</CardTitle>
                  <CardDescription>Add a new job posting to analyze resumes against</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Senior Frontend Developer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Paste the full job description including required skills..."
                                className="h-32 resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={createJobMutation.isPending}
                      >
                        {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>My Job Listings</CardTitle>
                  <CardDescription>View and manage your job postings</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingJobs ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : jobs?.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Candidates</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {jobs.map((job: any) => (
                            <TableRow key={job.id}>
                              <TableCell className="font-medium">{job.title}</TableCell>
                              <TableCell>{formatDate(job.createdAt)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {analyses?.filter((a: any) => a.jobId === job.id).length || 0} analyzed
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedJobId(job.id)}
                                    >
                                      <Users className="h-4 w-4 mr-2" />
                                      Analyze Resumes
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>Analyze Resumes for {job.title}</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                      <div className="flex justify-between mb-4">
                                        <h3 className="text-sm font-medium">Select resumes to analyze</h3>
                                        <Button
                                          size="sm"
                                          disabled={selectedCandidates.length === 0 || bulkAnalyzeMutation.isPending}
                                          onClick={handleBulkAnalyze}
                                        >
                                          {bulkAnalyzeMutation.isPending ? 'Analyzing...' : 'Analyze Selected'}
                                        </Button>
                                      </div>
                                      <div className="max-h-96 overflow-y-auto rounded-md border">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="w-12">
                                                <input 
                                                  type="checkbox" 
                                                  className="h-4 w-4 rounded border-gray-300"
                                                  checked={selectedCandidates.length === mockCandidates.length}
                                                  onChange={() => {
                                                    if (selectedCandidates.length === mockCandidates.length) {
                                                      setSelectedCandidates([]);
                                                    } else {
                                                      setSelectedCandidates(mockCandidates.map(c => c.resumeId));
                                                    }
                                                  }}
                                                />
                                              </TableHead>
                                              <TableHead>Name</TableHead>
                                              <TableHead>Email</TableHead>
                                              <TableHead>Date Applied</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {mockCandidates.map((candidate) => (
                                              <TableRow key={candidate.id}>
                                                <TableCell>
                                                  <input 
                                                    type="checkbox" 
                                                    className="h-4 w-4 rounded border-gray-300"
                                                    checked={selectedCandidates.includes(candidate.resumeId)}
                                                    onChange={() => toggleCandidateSelection(candidate.resumeId)}
                                                  />
                                                </TableCell>
                                                <TableCell className="font-medium">{candidate.name}</TableCell>
                                                <TableCell>{candidate.email}</TableCell>
                                                <TableCell>{candidate.dateApplied}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No jobs created yet</p>
                      <p className="text-sm text-gray-400">Create your first job to start analyzing resumes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="candidates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Candidate Rankings</span>
                <select 
                  className="text-sm border rounded-md p-2"
                  onChange={(e) => setSelectedJobId(Number(e.target.value) || null)}
                  value={selectedJobId || ''}
                >
                  <option value="">Select a job</option>
                  {jobs?.map((job: any) => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </CardTitle>
              <CardDescription>Candidates ranked by match score for selected job</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedJobId ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No job selected</p>
                  <p className="text-sm text-gray-400">Select a job to view candidate rankings</p>
                </div>
              ) : isLoadingAnalyses ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : analyses?.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Match Score</TableHead>
                        <TableHead>Matched Skills</TableHead>
                        <TableHead>Missing Skills</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...analyses]
                        .sort((a: any, b: any) => b.score - a.score)
                        .map((analysis: any, index: number) => (
                          <TableRow key={analysis.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              {mockCandidates.find(c => c.resumeId === analysis.resumeId)?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium ${getScoreColor(analysis.score)}`}>
                                {analysis.score}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(analysis.matchedSkills) && analysis.matchedSkills.slice(0, 3).map((skill: string, i: number) => (
                                  <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {skill}
                                  </Badge>
                                ))}
                                {Array.isArray(analysis.matchedSkills) && analysis.matchedSkills.length > 3 && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    +{analysis.matchedSkills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(analysis.missingSkills) && analysis.missingSkills.slice(0, 3).map((skill: string, i: number) => (
                                  <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    {skill}
                                  </Badge>
                                ))}
                                {Array.isArray(analysis.missingSkills) && analysis.missingSkills.length > 3 && (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    +{analysis.missingSkills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No analyses for this job yet</p>
                  <p className="text-sm text-gray-400">Use the "Analyze Resumes" button on the Jobs tab</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills Analysis</CardTitle>
              <CardDescription>Most common skills among analyzed resumes</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Skills visualization would appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
