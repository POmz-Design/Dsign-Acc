import type { ReactNode } from "react";
import "./globals.css";

// Per next-intl docs, the root layout is intentionally minimal because the
// real <html>/<body> are emitted by src/app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
