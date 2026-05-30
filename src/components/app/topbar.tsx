import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";

import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function Topbar({ email }: { email: string | null | undefined }) {
  const t = await getTranslations("App.topbar");

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-3">
        {email && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {email}
          </span>
        )}
        <LocaleSwitcher />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" size="sm" variant="outline">
            <LogOut className="h-4 w-4" />
            <span className="ml-2">{t("signOut")}</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
