import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getToolBySlug, getAllSlugs, TOOLS_CONFIG } from "@/lib/toolsConfig";
import EditorShell from "@/components/EditorShell";
import Navbar from "@/components/Navbar";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  return {
    title: `${tool.title} | VForge`,
    description: tool.metaDescription,
    alternates: { canonical: `/${tool.slug}` },
    openGraph: {
      title: tool.title,
      description: tool.metaDescription,
      type: "website",
      url: `/${tool.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: tool.title,
      description: tool.metaDescription,
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return notFound();

  const relatedTools = tool.related
    .map((s) => TOOLS_CONFIG.find((t) => t.slug === s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: tool.label,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Any (runs in browser)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: tool.metaDescription,
      },
      {
        "@type": "FAQPage",
        mainEntity: tool.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  };

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
        <Navbar />

        {/* ── SEO content block ── */}
        <article style={{ maxWidth: "760px", margin: "0 auto", padding: "120px 24px 48px" }}>
          <h1 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-1.2px",
            color: "#F1F5F9",
            marginBottom: "16px",
            lineHeight: 1.1,
          }}>
            {tool.label}
          </h1>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "17px",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            marginBottom: "40px",
          }}>
            {tool.tagline}
          </p>

          {/* Editor goes right under the fold — primary CTA */}
          <div style={{
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "56px",
          }}>
            <EditorShell lockedOp={tool.op} />
          </div>

          {/* Intro copy — distinct per tool, not templated */}
          <section style={{ marginBottom: "48px" }}>
            {tool.intro.map((para, i) => (
              <p key={i} style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                color: "var(--color-text-secondary)",
                lineHeight: 1.8,
                marginBottom: "18px",
              }}>
                {para}
              </p>
            ))}
          </section>

          {/* Use cases */}
          <section style={{ marginBottom: "48px" }}>
            <h2 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "24px",
              fontWeight: 600,
              color: "#F1F5F9",
              marginBottom: "20px",
            }}>
              When you'd use this
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {tool.useCases.map((uc) => (
                <div
                  key={uc.title}
                  style={{
                    padding: "18px 20px",
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                  }}
                >
                  <h3 style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#F1F5F9",
                    marginBottom: "6px",
                  }}>
                    {uc.title}
                  </h3>
                  <p style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                    {uc.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ — mirrors the JSON-LD FAQPage schema above */}
          <section style={{ marginBottom: "48px" }}>
            <h2 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "24px",
              fontWeight: 600,
              color: "#F1F5F9",
              marginBottom: "20px",
            }}>
              Frequently asked questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {tool.faqs.map((f) => (
                <details
                  key={f.question}
                  style={{
                    padding: "16px 18px",
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                  }}
                >
                  <summary style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#F1F5F9",
                    cursor: "pointer",
                  }}>
                    {f.question}
                  </summary>
                  <p style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.7,
                    marginTop: "10px",
                    marginBottom: 0,
                  }}>
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Related tools — internal linking signal */}
          {relatedTools.length > 0 && (
            <section>
              <h2 style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "#F1F5F9",
                marginBottom: "16px",
              }}>
                Related tools
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {relatedTools.map((rt) => (
                  <Link
                    key={rt.slug}
                    href={`/${rt.slug}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 16px",
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                    }}
                  >
                    {rt.label} <ArrowRight size={13} />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
    </>
  );
}
