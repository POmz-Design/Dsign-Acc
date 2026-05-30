import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-8 text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
          <p className="font-heading">
            Dsign Accounting — {t("tagline")}
          </p>
          <p>
            © {year} Dsign Accounting. {t("rights")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
