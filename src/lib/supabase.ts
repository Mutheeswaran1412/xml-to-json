import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ConversionRecord {
  id: string;
  user_id: string | null;
  filename: string;
  xml_input: string;
  json_output: string | null;
  file_size: number;
  conversion_time_ms: number;
  status: 'success' | 'error';
  error_message: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  organization: string;
  total_conversions: number;
  created_at: string;
  updated_at: string;
}
