// Supabase Edge Function: revalidate-blog
// Database Webhook에서 호출되어 Vercel ISR을 트리거한다

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Supabase Database Webhook Payload 타입
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    slug: string;
    locale: "ko" | "en";
    draft?: boolean;
    [key: string]: unknown;
  } | null;
  old_record: {
    slug: string;
    locale: "ko" | "en";
    [key: string]: unknown;
  } | null;
}

// Revalidation API 요청 타입
interface RevalidateRequest {
  slug: string;
  locale: "ko" | "en";
  bypassToken: string;
}

serve(async (req) => {
  try {
    // CORS 프리플라이트 요청 처리
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // POST 요청만 허용
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Webhook payload 파싱
    const payload = (await req.json()) as WebhookPayload;

    console.log("[Edge Function] Received webhook:", {
      type: payload.type,
      table: payload.table,
      slug: payload.record?.slug || payload.old_record?.slug,
    });

    // 환경변수 확인
    const bypassToken = Deno.env.get("ISR_BYPASS_TOKEN");
    const siteUrl = Deno.env.get("SITE_URL");

    if (!bypassToken) {
      throw new Error("ISR_BYPASS_TOKEN is not configured");
    }

    if (!siteUrl) {
      throw new Error("SITE_URL is not configured");
    }

    // record에서 slug와 locale 추출
    // DELETE인 경우 old_record 사용
    const record = payload.record || payload.old_record;

    if (!record) {
      throw new Error("No record found in webhook payload");
    }

    const { slug, locale = "ko" } = record;

    if (!slug) {
      throw new Error("Slug not found in record");
    }

    // draft 게시글은 재생성하지 않음 (선택사항)
    if (payload.type !== "DELETE" && record.draft === true) {
      console.log("[Edge Function] Skipping draft post:", slug);
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "Draft post",
          slug,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Vercel Revalidation API 호출
    const revalidateRequest: RevalidateRequest = {
      slug,
      locale,
      bypassToken,
    };

    console.log(
      `[Edge Function] Calling revalidation API for: ${locale}/blog/${slug}`,
    );

    const response = await fetch(`${siteUrl}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(revalidateRequest),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Edge Function] Revalidation failed:", result);
      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[Edge Function] Revalidation successful:", result);

    return new Response(
      JSON.stringify({
        success: true,
        webhookType: payload.type,
        ...result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[Edge Function] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
