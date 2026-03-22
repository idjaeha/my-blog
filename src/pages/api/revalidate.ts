import type { APIRoute } from "astro";

export const prerender = false;

interface RevalidateRequest {
  slug: string;
  locale?: "ko" | "en";
  bypassToken: string;
}

/**
 * On-Demand Revalidation API
 *
 * Supabase Database Webhook에서 호출되어 특정 게시글 페이지를 무효화하고 재생성한다.
 *
 * 사용법:
 * POST /api/revalidate
 * Body: { slug: "post-slug", locale: "ko", bypassToken: "secret" }
 *
 * Supabase Webhook 설정:
 * - URL: https://your-site.vercel.app/api/revalidate
 * - Method: POST
 * - Trigger: posts 테이블 INSERT/UPDATE/DELETE
 */
export const POST: APIRoute = async ({ request, site }) => {
  try {
    const body = (await request.json()) as RevalidateRequest;
    const { slug, locale = "ko", bypassToken } = body;

    // 환경변수 가져오기 (Astro는 import.meta.env를 사용)
    const envBypassToken = import.meta.env.ISR_BYPASS_TOKEN;
    const envSiteUrl = import.meta.env.SITE_URL;

    // 1. 인증 검증
    if (!bypassToken || bypassToken !== envBypassToken) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid bypass token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 2. 필수 파라미터 검증
    if (!slug) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Missing required field: slug",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 3. 사이트 URL 확인
    const rawSiteUrl = site?.toString() || envSiteUrl;
    if (!rawSiteUrl) {
      return new Response(
        JSON.stringify({
          error: "Configuration Error",
          message: "SITE_URL is not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // trailing slash 제거
    const siteUrl = rawSiteUrl.replace(/\/$/, "");

    // 4. 무효화할 URL 생성
    const pathPrefix = locale === "ko" ? "" : `/${locale}`;
    const pageUrl = `${siteUrl}${pathPrefix}/blog/${slug}`;

    // 5. Vercel ISR 재검증 요청
    console.log(`[Revalidate] Requesting revalidation for: ${pageUrl}`);
    const revalidateResponse = await fetch(pageUrl, {
      headers: {
        "x-prerender-revalidate": bypassToken,
      },
    });

    if (!revalidateResponse.ok) {
      console.error(
        `[Revalidate] Failed: ${revalidateResponse.status} ${revalidateResponse.statusText}`,
      );
      return new Response(
        JSON.stringify({
          error: "Revalidation Failed",
          message: `HTTP ${revalidateResponse.status}: ${revalidateResponse.statusText}`,
          url: pageUrl,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 6. 블로그 목록 페이지도 무효화 (선택적)
    const indexUrl = `${siteUrl}${pathPrefix}/blog`;
    console.log(`[Revalidate] Requesting revalidation for: ${indexUrl}`);
    await fetch(indexUrl, {
      headers: {
        "x-prerender-revalidate": bypassToken,
      },
    });

    // 7. 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        revalidated: [pageUrl, indexUrl],
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[Revalidate] Error:", error);
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
};
