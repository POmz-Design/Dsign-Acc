"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";

import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signupAction } from "@/app/actions/signup";

export default function SignupPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("locale", locale);

    startTransition(async () => {
      setError(null);
      const res = await signupAction(data);
      if (!res.ok) {
        const key =
          res.error === "exists"
            ? "errorExists"
            : res.error === "mismatch"
              ? "errorMismatch"
              : res.error === "invalid"
                ? "errorInvalid"
                : "errorGeneric";
        setError(t(key));
        return;
      }
      // Sign the new user in directly after creating the account.
      const email = String(data.get("email") ?? "");
      const password = String(data.get("password") ?? "");
      const signin = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!signin || signin.error) {
        router.replace("/login");
        return;
      }
      router.replace("/dashboard");
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading">{t("signupTitle")}</CardTitle>
          <CardDescription>{t("signupSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {t("submitSignup")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t("loginLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
