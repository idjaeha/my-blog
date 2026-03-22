import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

/**
 * Custom fetch wrapper that adds duplex option for Node.js compatibility.
 * Required for Vercel serverless functions with fetch() and request body.
 */
const customFetch: typeof fetch = (input, init) => {
  if (init?.body) {
    return fetch(input, {
      ...init,
      duplex: "half",
    } as RequestInit & { duplex: "half" });
  }
  return fetch(input, init);
};

/** Read-only client for build-time data fetching (anon key) */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: customFetch },
});

/** Admin client for API routes (service role key, bypasses RLS) */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  global: { fetch: customFetch },
});
