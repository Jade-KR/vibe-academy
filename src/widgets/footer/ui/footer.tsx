import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/shared/config";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <p className="text-lg font-semibold">{siteConfig.name}</p>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/legal/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("terms")}
            </Link>
            <Link
              href="/legal/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("privacy")}
            </Link>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Twitter
            </a>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteConfig.name}. {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
