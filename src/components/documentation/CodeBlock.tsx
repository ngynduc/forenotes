interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language = "text", title }: CodeBlockProps) {
  return (
    <figure className="docs-code-block">
      {title ? (
        <figcaption className="docs-code-title">{title}</figcaption>
      ) : null}
      <pre className="docs-code-pre">
        <code className={`language-${language}`}>{code.trim()}</code>
      </pre>
    </figure>
  );
}
