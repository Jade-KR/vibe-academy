import type { TocItem } from "@/shared/lib/legal";

interface TableOfContentsProps {
  items: TocItem[];
  title: string;
}

export function TableOfContents({ items, title }: TableOfContentsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={title}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
