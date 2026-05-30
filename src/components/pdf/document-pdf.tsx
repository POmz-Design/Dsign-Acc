import path from "node:path";
import fs from "node:fs";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

import type { DocumentPayload, DocType } from "@/lib/documents/types";

// PDF strings are intentionally bilingual (Thai + English) regardless of
// the UI locale — Thai Revenue Department requires the Thai phrase for
// VAT invoices and most overseas customers expect a Latin gloss.
const DOC_TITLES: Record<DocType, { th: string; en: string }> = {
  quotation: { th: "ใบเสนอราคา", en: "QUOTATION" },
  invoice: { th: "ใบกำกับภาษี", en: "TAX INVOICE" },
  receipt: { th: "ใบเสร็จรับเงิน", en: "RECEIPT" },
};

// Register Sarabun once per worker. The renderer caches by family name.
// `scripts/download-fonts.sh` populates these files; if missing we skip
// registration and let @react-pdf fall back to Helvetica (no Thai glyphs,
// but the PDF still renders so the audit page works pre-font-install).
let fontsRegistered: boolean | null = null;
function registerFonts(): boolean {
  if (fontsRegistered !== null) return fontsRegistered;
  try {
    // Only attempt registration when the files actually exist — otherwise
    // @react-pdf throws when it tries to read them on first paint.
    const reg = path.join(process.cwd(), "public", "fonts", "Sarabun-Regular.ttf");
    const bold = path.join(process.cwd(), "public", "fonts", "Sarabun-Bold.ttf");
    if (!fs.existsSync(reg) || !fs.existsSync(bold)) {
      fontsRegistered = false;
      return false;
    }
    Font.register({
      family: "Sarabun",
      fonts: [
        { src: reg },
        { src: bold, fontWeight: "bold" },
      ],
    });
    fontsRegistered = true;
    return true;
  } catch {
    fontsRegistered = false;
    return false;
  }
}

function makeStyles(fontFamily: string | undefined) {
  return StyleSheet.create({
    page: {
      padding: 36,
      ...(fontFamily ? { fontFamily } : {}),
      fontSize: 9,
      color: "#111",
    },
    headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  companyBlock: { flexDirection: "row", gap: 10, maxWidth: 320 },
  logo: { width: 48, height: 48, objectFit: "contain" },
  companyName: { fontSize: 13, fontWeight: "bold" },
  muted: { color: "#555" },
  titleBlock: { alignItems: "flex-end" },
  docTitleTh: { fontSize: 14, fontWeight: "bold" },
  docTitleEn: { fontSize: 9, color: "#555", marginBottom: 4 },
  runningNumber: { fontSize: 11, fontWeight: "bold" },
  metaRow: { flexDirection: "row", marginTop: 2 },
  metaLabel: { color: "#555", width: 80, textAlign: "right", marginRight: 6 },
  customerBox: {
    border: "1pt solid #ddd",
    padding: 8,
    marginBottom: 14,
    borderRadius: 4,
  },
  sectionLabel: { fontSize: 8, color: "#555", marginBottom: 2 },
  table: { borderTop: "1pt solid #ddd", marginTop: 4 },
  th: {
    flexDirection: "row",
    borderBottom: "1pt solid #ddd",
    paddingVertical: 4,
    backgroundColor: "#f7f7f7",
    fontWeight: "bold",
  },
  tr: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #eee",
    paddingVertical: 4,
  },
  colNo: { width: 24, textAlign: "center" },
  colDesc: { flex: 1, paddingHorizontal: 4 },
  colQty: { width: 50, textAlign: "right" },
  colPrice: { width: 70, textAlign: "right" },
  colDisc: { width: 50, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  totalsBox: {
    marginTop: 12,
    alignSelf: "flex-end",
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalLabel: { color: "#555" },
  netPayableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    marginTop: 4,
    borderTop: "1pt solid #111",
    fontWeight: "bold",
    fontSize: 11,
  },
  notesBlock: {
    marginTop: 18,
    padding: 8,
    backgroundColor: "#fafafa",
    borderRadius: 4,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 40,
  },
  signatureBox: { alignItems: "center", width: 200 },
  signatureImg: { width: 120, height: 50, objectFit: "contain" },
  signatureLine: { borderTop: "1pt solid #111", width: 180, marginTop: 4 },
  signatureLabel: { fontSize: 8, marginTop: 4, color: "#555" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#888",
  },
  });
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function DocumentPDF({ payload }: { payload: DocumentPayload }) {
  const hasSarabun = registerFonts();
  const styles = makeStyles(hasSarabun ? "Sarabun" : undefined);
  const title = DOC_TITLES[payload.type];
  const c = payload.company;
  const cu = payload.customer;
  const t = payload.totals;
  const hasWht = t.whtAmount > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.companyBlock}>
            {c.logoUrl ? <Image src={c.logoUrl} style={styles.logo} /> : null}
            <View>
              <Text style={styles.companyName}>{c.nameTh}</Text>
              {c.nameEn ? <Text style={styles.muted}>{c.nameEn}</Text> : null}
              <Text style={styles.muted}>
                TIN: {c.tin} {c.branchCode ? `(${c.branchCode})` : ""}
              </Text>
              <Text style={styles.muted}>{c.addressTh}</Text>
              {c.phone ? <Text style={styles.muted}>โทร {c.phone}</Text> : null}
              {c.email ? <Text style={styles.muted}>{c.email}</Text> : null}
            </View>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.docTitleTh}>{title.th}</Text>
            <Text style={styles.docTitleEn}>{title.en}</Text>
            <Text style={styles.runningNumber}>{payload.runningNumber}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>วันที่ / Date</Text>
              <Text>{payload.issueDate}</Text>
            </View>
            {payload.dueDate ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>ครบกำหนด / Due</Text>
                <Text>{payload.dueDate}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Customer */}
        <View style={styles.customerBox}>
          <Text style={styles.sectionLabel}>ลูกค้า / Customer</Text>
          <Text style={{ fontWeight: "bold" }}>{cu.name}</Text>
          {cu.tin ? (
            <Text style={styles.muted}>
              TIN: {cu.tin} {cu.branchCode ? `(${cu.branchCode})` : ""}
            </Text>
          ) : null}
          {cu.address ? <Text style={styles.muted}>{cu.address}</Text> : null}
          {cu.phone ? <Text style={styles.muted}>โทร {cu.phone}</Text> : null}
        </View>

        {/* Line items */}
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={styles.colNo}>#</Text>
            <Text style={styles.colDesc}>รายการ / Description</Text>
            <Text style={styles.colQty}>จำนวน</Text>
            <Text style={styles.colPrice}>ราคา/หน่วย</Text>
            <Text style={styles.colDisc}>ส่วนลด</Text>
            <Text style={styles.colAmount}>จำนวนเงิน</Text>
          </View>
          {payload.lines.map((l, i) => (
            <View key={i} style={styles.tr} wrap={false}>
              <Text style={styles.colNo}>{i + 1}</Text>
              <Text style={styles.colDesc}>{l.description}</Text>
              <Text style={styles.colQty}>{l.quantity}</Text>
              <Text style={styles.colPrice}>{fmt(l.unitPrice)}</Text>
              <Text style={styles.colDisc}>
                {l.discountPercent > 0 ? `${l.discountPercent}%` : "—"}
              </Text>
              <Text style={styles.colAmount}>{fmt(l.lineTotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>มูลค่าก่อน VAT / Subtotal</Text>
            <Text>{fmt(t.subtotal)}</Text>
          </View>
          {t.vatAmount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ภาษีมูลค่าเพิ่ม / VAT 7%</Text>
              <Text>{fmt(t.vatAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>รวม / Total</Text>
            <Text>{fmt(t.total)}</Text>
          </View>
          {hasWht ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                หัก ณ ที่จ่าย / WHT{" "}
                {payload.whtRate ? `${payload.whtRate}%` : ""}
              </Text>
              <Text>−{fmt(t.whtAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.netPayableRow}>
            <Text>ยอดชำระสุทธิ / Net Payable</Text>
            <Text>
              {fmt(t.netPayable)} {payload.currency}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {payload.notes ? (
          <View style={styles.notesBlock}>
            <Text style={styles.sectionLabel}>หมายเหตุ / Notes</Text>
            <Text>{payload.notes}</Text>
          </View>
        ) : null}

        {/* Signature */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            {c.signatureUrl ? (
              <Image src={c.signatureUrl} style={styles.signatureImg} />
            ) : null}
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              ผู้มีอำนาจลงนาม / Authorized Signatory
            </Text>
          </View>
        </View>

        {/* Footer / page numbers */}
        <View style={styles.footer} fixed>
          <Text>{c.nameTh}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
