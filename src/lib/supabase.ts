import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

/** Read-only client for build-time data fetching (anon key) */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Admin client for API routes (service role key, bypasses RLS) */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
