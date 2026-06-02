import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Container } from "@/components/Container";

export function DocsPage() {
  return (
    <>
      <SiteHeader />
      <main className="py-24">
        <Container>
          <h1 className="text-[1.625rem] font-semibold tracking-tight">Documentation</h1>
          <p className="mt-3 text-[0.9375rem] text-[var(--color-text-muted)]">
            Documentation coming soon.
          </p>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
