import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase, type SupabaseJob } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  TableRow,
} from '@/components/ui/table';
import { Briefcase, Plus, Trash2, PenLine } from 'lucide-react';

const RECRUITER_ID = '00000000-0000-0000-0000-000000000001';

const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(100, 'Title must be under 100 chars'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function MyJobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<SupabaseJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingJob, setEditingJob] = useState<SupabaseJob | null>(null);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: { title: '', description: '' },
  });

  // ── Fetch jobs ─────────────────────────────────────────────────────────────
  const fetchJobs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('recruiter_id', RECRUITER_ID)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Failed to load jobs', description: error.message, variant: 'destructive' });
    } else {
      setJobs(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  // ── Open modal ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingJob(null);
    form.reset({ title: '', description: '' });
    setIsModalOpen(true);
  };

  const openEdit = (job: SupabaseJob) => {
    setEditingJob(job);
    form.reset({ title: job.title, description: job.description });
    setIsModalOpen(true);
  };

  // ── Submit (create or edit) ─────────────────────────────────────────────────
  const onSubmit = async (values: JobFormValues) => {
    setIsSaving(true);
    if (editingJob) {
      const { error } = await supabase
        .from('jobs')
        .update({ title: values.title, description: values.description })
        .eq('id', editingJob.id);
      if (error) {
        toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Job updated', description: `"${values.title}" has been updated.` });
        setIsModalOpen(false);
        fetchJobs();
      }
    } else {
      const { error } = await supabase.from('jobs').insert({
        recruiter_id: RECRUITER_ID,
        title: values.title,
        description: values.description,
        status: 'active',
      });
      if (error) {
        toast({ title: 'Creation failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Job created!', description: `"${values.title}" is now active.` });
        setIsModalOpen(false);
        fetchJobs();
      }
    }
    setIsSaving(false);
  };

  // ── Toggle status ───────────────────────────────────────────────────────────
  const toggleStatus = async (job: SupabaseJob) => {
    const next = job.status === 'active' ? 'closed' : 'active';
    const { error } = await supabase.from('jobs').update({ status: next }).eq('id', job.id);
    if (!error) {
      fetchJobs();
      toast({ title: `Job ${next === 'active' ? 'reopened' : 'closed'}`, description: job.title });
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteJob = async (job: SupabaseJob) => {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('jobs').delete().eq('id', job.id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Job deleted', description: `"${job.title}" has been removed.` });
      fetchJobs();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your job listings and screen candidates against them.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" />
          Create New Job
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Listings</CardTitle>
          <CardDescription>All jobs linked to your recruiter account.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => <Skeleton key={n} className="h-12 w-full" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <Briefcase className="h-12 w-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-600">No jobs yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Create your first job to start screening candidates.
              </p>
              <Button onClick={openCreate} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create New Job
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(job.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            job.status === 'active'
                              ? 'text-green-700 border-green-300 bg-green-50'
                              : 'text-slate-500 border-slate-300 bg-slate-50'
                          }
                        >
                          {job.status === 'active' ? 'Active' : 'Closed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(job)}
                            className="gap-1"
                          >
                            <PenLine className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(job)}
                          >
                            {job.status === 'active' ? 'Close' : 'Reopen'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => deleteJob(job)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Edit Job' : 'Create New Job'}</DialogTitle>
            <DialogDescription>
              {editingJob
                ? 'Update the job title and description below.'
                : 'Fill in the details to create a new job listing.'}
            </DialogDescription>
          </DialogHeader>

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
                        placeholder="Paste the full job description here — required skills, qualifications, responsibilities..."
                        className="min-h-[160px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? 'Saving...' : editingJob ? 'Save Changes' : 'Create Job'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
