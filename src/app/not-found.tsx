import { getTranslations } from "next-intl/server";
import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function NotFoundPage() {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>{t("notFound")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">{t("notFoundDescription")}</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {t("goHome")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
