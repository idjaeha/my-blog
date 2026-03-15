import { SITE } from "@/lib/constants";
import { generateOgImage } from "@/lib/og";

export async function GET() {
  const png = await generateOgImage({
    title: SITE.title,
    subtitle: SITE.description,
  });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
}
