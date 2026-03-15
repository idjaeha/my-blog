import { readFile } from "node:fs/promises";
import { join } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { SITE } from "@/lib/constants";

export async function loadFont(): Promise<ArrayBuffer> {
  try {
    const fontPath = join(process.cwd(), "public", "fonts", "Inter-Bold.ttf");
    const buffer = await readFile(fontPath);
    return buffer.buffer as ArrayBuffer;
  } catch {
    const res = await fetch(
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf",
    );
    return await res.arrayBuffer();
  }
}

export async function generateOgImage(options: {
  title: string;
  subtitle?: string;
  badge?: string;
}): Promise<Buffer> {
  const { title, subtitle, badge } = options;
  const fontSize = title.length > 40 ? 42 : 52;

  const children: any[] = [];

  if (badge) {
    children.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                padding: "6px 16px",
                borderRadius: "6px",
                fontSize: "20px",
                fontWeight: 600,
              },
              children: badge,
            },
          },
        ],
      },
    });
  }

  children.push({
    type: "div",
    props: {
      style: {
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        color: "#ffffff",
        lineHeight: 1.3,
        marginBottom: "40px",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
      children: title,
    },
  });

  const footerChildren: any[] = [
    {
      type: "div",
      props: {
        style: {
          fontSize: "24px",
          color: "rgba(255, 255, 255, 0.8)",
          fontWeight: 500,
        },
        children: SITE.title,
      },
    },
  ];

  if (subtitle) {
    footerChildren.push({
      type: "div",
      props: {
        style: {
          fontSize: "20px",
          color: "rgba(255, 255, 255, 0.5)",
        },
        children: subtitle,
      },
    });
  }

  children.push({
    type: "div",
    props: {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: "1px solid rgba(255, 255, 255, 0.2)",
        paddingTop: "20px",
      },
      children: footerChildren,
    },
  });

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        },
        children,
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: await loadFont(),
          weight: 700 as const,
          style: "normal" as const,
        },
      ],
    },
  );

  return sharp(Buffer.from(svg)).png().toBuffer();
}
