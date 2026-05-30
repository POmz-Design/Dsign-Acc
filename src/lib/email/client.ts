import "server-only";

import { Resend } from "resend";

// Lazy singleton so importing this module doesn't crash dev environments
// that don't have `RESEND_API_KEY` set yet. Only the call to `getResend()`
// will throw, and only when the action actually tries to send.
let _client: Resend | null = null;

export function getResend(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to .env.local — see .env.example.",
    );
  }
  _client = new Resend(key);
  return _client;
}

/**
 * Resolve the default `From` address. We never silently substitute a
 * Resend-default sender — production sends must use the verified domain in
 * `EMAIL_FROM` so DMARC/SPF stay aligned.
 */
export function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error(
      "EMAIL_FROM is not set. Add it to .env.local — see .env.example.",
    );
  }
  return from;
}
