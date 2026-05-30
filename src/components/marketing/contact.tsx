import { useTranslations } from "next-intl";
import { Phone, Mail, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONTACT_EMAIL = "info@dsignaccounting.com";
const CONTACT_PHONE = "+66 2 000 0000";

export function Contact() {
  const t = useTranslations("Contact");

  return (
    <section id="contact" className="border-b bg-muted/30 py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("subheading")}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t("phone")}</p>
                <a className="font-medium" href={`tel:${CONTACT_PHONE}`}>
                  {CONTACT_PHONE}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t("email")}</p>
                <a className="font-medium" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t("address")}</p>
                <p className="font-medium">{t("addressValue")}</p>
              </div>
            </li>
          </ul>

          <form
            className="space-y-4 rounded-lg border bg-background p-6"
            action={`mailto:${CONTACT_EMAIL}`}
            method="post"
            encType="text/plain"
          >
            <div className="space-y-2">
              <Label htmlFor="contact-name">{t("formName")}</Label>
              <Input id="contact-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">{t("formEmail")}</Label>
              <Input id="contact-email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">{t("formMessage")}</Label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <Button type="submit" className="w-full">
              {t("formSubmit")}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
