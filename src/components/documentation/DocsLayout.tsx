import { Container } from "@/components/Container";

interface TocItem {
  id: string;
  label: string;
}

interface DocsLayoutProps {
  children: React.ReactNode;
  toc: TocItem[];
}

export function DocsLayout({ children, toc }: DocsLayoutProps) {
  return (
    <Container className="docs-layout-container">
      <div className="docs-layout-grid">
        <aside className="docs-sidebar">
          <div className="docs-toc-panel">
            <p className="docs-toc-label">
              On this page
            </p>
            <nav aria-label="Documentation sections" className="docs-toc-list">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="docs-toc-link"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <details className="docs-mobile-toc">
            <summary>
              Guide sections
            </summary>
            <nav aria-label="Documentation sections" className="docs-mobile-toc-list">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="docs-mobile-toc-link"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
        </aside>

        <article className="docs-article">{children}</article>
      </div>
    </Container>
  );
}
