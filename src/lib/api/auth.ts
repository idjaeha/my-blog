import { supabaseAdmin } from "../supabase";

/**
 * Validate API key from Authorization header.
 * Compares SHA-256 hash against api_keys table.
 * Returns the key name if valid, null if invalid.
 */
export async function validateApiKey(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiKey = authHeader.slice(7);
  if (!apiKey) return null;

  const keyHash = await hashKey(apiKey);

  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("name")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  // Update last_used_at (fire and forget)
  supabaseAdmin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", keyHash)
    .then();

  return data.name;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Return 401 JSON response */
export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/** Return JSON response */
export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
