import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Convenience types ─────────────────────────────────────────────────────────

export type SupabaseJob = {
  id: string;
  recruiter_id: string;
  title: string;
  description: string;
  status: 'active' | 'closed';
  created_at: string;
};

export type SupabaseResume = {
  id: string;
  job_id_local: string | null;
  filename: string;
  storage_path: string;
  uploaded_at: string;
};
