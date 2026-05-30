import "server-only";

import type {
  CompanySnapshot,
  CustomerSnapshot,
  DocType,
} from "@/lib/documents/types";

// Lightweight bilingual templates. We build raw HTML strings here rather
// than pulling in MJML or react-email — the messages are small enough that
// a few inline-styled <p> tags are clearer than a templating dependency.
//
// Convention: every block is rendered TH first, EN second. Both languages
// are always sent regardless of UI locale — Thai customers expect Thai,
// foreign customers need English, and the firm rarely knows which is which.

const DOC_THAI: Record<DocType, string> = {
  quotation: "ใบเสนอราคา",
  invoice: "ใบกำกับภาษี",
  receipt: "ใบเสร็จรับเงิน",
};

const DOC_EN: Record<DocType, string> = {
  quotation: "Quotation",
  invoice: "Tax Invoice",
  receipt: "Receipt",
};

export type DocumentEmailKind =
  | { kind: "document"; docType: DocType }
  | { kind: "wht" };

export type DocumentEmailInput = {
  type: DocumentEmailKind;
  runningNumber: string;
  company: CompanySnapshot;
  customer: CustomerSnapshot;
};

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(bodyHtml: string): string {
  // Inline styles only — many Thai inboxes (Outlook, AIS Plamail, etc.)
  // strip <style> blocks.
  return `<!doctype html><html><body style="font-family: 'Sarabun', Arial, sans-serif; color: #111; line-height: 1.5; max-width: 560px; margin: 0 auto; padding: 24px;">${bodyHtml}</body></html>`;
}

export function buildDocumentEmail(input: DocumentEmailInput): BuiltEmail {
  const docNameTh =
    input.type.kind === "document"
      ? DOC_THAI[input.type.docType]
      : "หนังสือรับรองการหักภาษี ณ ที่จ่าย";
  const docNameEn =
    input.type.kind === "document"
      ? DOC_EN[input.type.docType]
      : "Withholding Tax Certificate";

  const companyName =
    input.company.nameEn ?? input.company.nameTh ?? "Dsign Accounting";
  const customerName = input.customer.name;
  const num = input.runningNumber;

  const subject = `${docNameTh} ${num} — ${docNameEn} ${num}`;

  const text = [
    `เรียน คุณ ${customerName}`,
    ``,
    `${companyName} ส่ง${docNameTh} เลขที่ ${num} มาตามไฟล์แนบ`,
    `หากต้องการสอบถามเพิ่มเติม โปรดติดต่อกลับมาที่อีเมลฉบับนี้`,
    ``,
    `ขอแสดงความนับถือ`,
    `${companyName}`,
    ``,
    `---`,
    ``,
    `Dear ${customerName},`,
    ``,
    `Please find attached ${docNameEn} ${num} from ${companyName}.`,
    `If you have any questions, just reply to this email.`,
    ``,
    `Best regards,`,
    `${companyName}`,
  ].join("\n");

  const html = shell(
    `
      <p>เรียน คุณ <strong>${esc(customerName)}</strong></p>
      <p>${esc(companyName)} ส่ง<strong>${esc(docNameTh)}</strong> เลขที่ <strong>${esc(num)}</strong> มาตามไฟล์แนบ</p>
      <p>หากต้องการสอบถามเพิ่มเติม โปรดติดต่อกลับมาที่อีเมลฉบับนี้</p>
      <p style="color:#666;">ขอแสดงความนับถือ<br/>${esc(companyName)}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p>Dear <strong>${esc(customerName)}</strong>,</p>
      <p>Please find attached <strong>${esc(docNameEn)} ${esc(num)}</strong> from ${esc(companyName)}.</p>
      <p>If you have any questions, just reply to this email.</p>
      <p style="color:#666;">Best regards,<br/>${esc(companyName)}</p>
    `,
  );

  return { subject, html, text };
}
