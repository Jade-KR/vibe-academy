import { getTranslations } from "next-intl/server";
import { generateSEO, Card, CardContent } from "@/shared/ui";
import { Mail } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return generateSEO({
    title: t("title"),
    description: t("description"),
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <section className="py-16 md:py-24">
      <div className="container flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
              <p className="text-muted-foreground">{t("description")}</p>
            </div>

            <a
              href="mailto:support@vibeacademy.dev"
              className="text-lg font-medium text-primary underline-offset-4 hover:underline"
            >
              support@vibeacademy.dev
            </a>

            <p className="text-sm text-muted-foreground">{t("responseTime")}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
