interface LinkCardProps {
  href: string;
  title: string;
  description?: string;
}

export default function LinkCard({ href, title, description }: LinkCardProps) {
  const isExternal = /^https?:\/\//.test(href);
  let hostname: string | null = null;
  if (isExternal) {
    try {
      hostname = new URL(href).hostname;
    } catch {
      // invalid URL — skip hostname display
    }
  }

  return (
    <a
      href={href}
      {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      className="group border-border bg-card hover:bg-accent my-4 flex items-center gap-4 rounded-lg border p-4 no-underline transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-foreground group-hover:text-accent-foreground m-0 font-semibold">
          {title}
        </p>
        {description && (
          <p className="text-muted-foreground m-0 mt-1 text-sm">
            {description}
          </p>
        )}
        {hostname && (
          <span className="text-muted-foreground mt-1 block text-xs">
            {hostname}
          </span>
        )}
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      >
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}
