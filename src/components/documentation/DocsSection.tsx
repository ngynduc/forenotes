interface DocsSectionProps {
  children: React.ReactNode;
  eyebrow?: string;
  id: string;
  title: string;
}

export function DocsSection({ children, eyebrow, id, title }: DocsSectionProps) {
  return (
    <section id={id} className="docs-section">
      {eyebrow ? (
        <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--color-primary)]">{eyebrow}</p>
      ) : null}
      <h2 className="docs-section-title">{title}</h2>
      <div className="docs-section-body">{children}</div>
    </section>
  );
}
