import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { generateSEO } from "@/shared/ui";
import { getLegalPage, extractTableOfContents } from "@/shared/lib/legal";
import { LegalPage } from "@/pages/legal";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return generateSEO({
    title: t("privacy.title"),
    description: t("privacy.description"),
  });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  const page = getLegalPage("privacy", locale);
  if (!page) notFound();
  const tocItems = extractTableOfContents(page.content);
  return (
    <LegalPage
      frontmatter={page.frontmatter}
      content={page.content}
      tocItems={tocItems}
      lastModifiedLabel={t("lastModified")}
      tocLabel={t("tableOfContents")}
    />
  );
}
