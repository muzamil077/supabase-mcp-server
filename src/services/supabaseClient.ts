import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/config';

const supabase: SupabaseClient = createClient(
  SUPABASE_URL as string,
  SUPABASE_ANON_KEY as string
);

export default supabase;

