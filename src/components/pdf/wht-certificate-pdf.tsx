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

import type {
  CompanySnapshot,
  CustomerSnapshot,
} from "@/lib/documents/types";
import {
  WHT_INCOME_TYPES,
  toBuddhistEra,
  type WhtFormType,
  type WhtIncomeLine,
  type WhtPaymentMethod,
} from "@/lib/documents/wht-types";

// Sarabun registration mirrors `document-pdf.tsx` — same files, same
// process-cache pattern, same fallback to Helvetica when the TTFs are
// missing. Duplicated rather than shared so each PDF stays self-contained.
let fontsRegistered: boolean | null = null;
function registerFonts(): boolean {
  if (fontsRegistered !== null) return fontsRegistered;
  try {
    const reg = path.join(
      process.cwd(),
      "public",
      "fonts",
      "Sarabun-Regular.ttf",
    );
    const bold = path.join(
      process.cwd(),
      "public",
      "fonts",
      "Sarabun-Bold.ttf",
    );
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
      padding: 32,
      ...(fontFamily ? { fontFamily } : {}),
      fontSize: 9,
      color: "#111",
    },
    titleBlock: { alignItems: "center", marginBottom: 8 },
    titleTh: { fontSize: 14, fontWeight: "bold" },
    titleEn: { fontSize: 10, color: "#444", marginTop: 2 },
    referenceLine: { fontSize: 8, color: "#555", marginTop: 2 },

    topGrid: {
      flexDirection: "row",
      gap: 8,
      marginTop: 10,
      marginBottom: 10,
    },
    partyBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#999",
      padding: 8,
      borderRadius: 3,
    },
    partyLabel: {
      fontSize: 7,
      color: "#555",
      marginBottom: 2,
      textTransform: "uppercase",
    },
    partyName: { fontSize: 10, fontWeight: "bold" },
    muted: { color: "#555" },

    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    metaCell: { flexDirection: "row", gap: 4 },
    metaLabel: { color: "#555" },

    formCheckboxRow: {
      flexDirection: "row",
      gap: 16,
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: "#f5f5f5",
      borderRadius: 3,
      marginBottom: 8,
    },
    checkboxItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    checkbox: {
      width: 10,
      height: 10,
      borderWidth: 1,
      borderColor: "#333",
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxMark: { fontSize: 9, lineHeight: 1, color: "#111" },
    checkboxLabel: { fontSize: 9 },

    table: { borderTopWidth: 1, borderColor: "#999", marginTop: 6 },
    th: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderColor: "#999",
      backgroundColor: "#eee",
      paddingVertical: 4,
      paddingHorizontal: 4,
      fontWeight: "bold",
      fontSize: 8,
    },
    tr: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderColor: "#ccc",
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    trTotal: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: "#333",
      paddingVertical: 4,
      paddingHorizontal: 4,
      fontWeight: "bold",
      backgroundColor: "#fafafa",
    },
    colIncome: { flex: 2 },
    colDate: { width: 70, textAlign: "center" },
    colGross: { width: 80, textAlign: "right" },
    colRate: { width: 50, textAlign: "right" },
    colWith: { width: 80, textAlign: "right" },

    paymentBlock: {
      marginTop: 12,
      padding: 8,
      borderWidth: 0.5,
      borderColor: "#bbb",
      borderRadius: 3,
    },
    paymentLabel: {
      fontSize: 8,
      color: "#555",
      marginBottom: 4,
      textTransform: "uppercase",
    },
    paymentOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginVertical: 1,
    },

    notesBlock: {
      marginTop: 10,
      padding: 8,
      backgroundColor: "#fafafa",
      borderRadius: 3,
    },

    signatureRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 30,
    },
    signatureBox: { alignItems: "center", width: 220 },
    signatureImg: { width: 120, height: 50, objectFit: "contain" },
    signatureLine: { borderTopWidth: 1, borderColor: "#111", width: 200, marginTop: 4 },
    signatureLabel: { fontSize: 8, marginTop: 4, color: "#555" },
    signatureDate: { fontSize: 8, marginTop: 2, color: "#555" },

    footer: {
      position: "absolute",
      bottom: 16,
      left: 32,
      right: 32,
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

export type WhtCertificatePdfData = {
  runningNumber: string;
  formType: WhtFormType;
  year: number;
  paymentDate: string;
  paymentMethod: WhtPaymentMethod;
  notes: string | null;
  totalGross: number;
  totalWithheld: number;
  company: CompanySnapshot;
  customer: CustomerSnapshot;
  lines: WhtIncomeLine[];
};

function Check({ on }: { on: boolean }) {
  // Render via inline style refs from the calling component would be
  // nicer, but @react-pdf needs the View+Text directly.
  return (
    <View style={{ width: 10, height: 10, borderWidth: 1, borderColor: "#333", alignItems: "center", justifyContent: "center" }}>
      {on ? <Text style={{ fontSize: 9, lineHeight: 1 }}>X</Text> : null}
    </View>
  );
}

export function WhtCertificatePDF({
  data,
}: {
  data: WhtCertificatePdfData;
}) {
  const hasSarabun = registerFonts();
  const styles = makeStyles(hasSarabun ? "Sarabun" : undefined);
  const c = data.company;
  const cu = data.customer;
  const ceYear = data.year;
  const beYear = toBuddhistEra(ceYear);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.titleTh}>หนังสือรับรองการหักภาษี ณ ที่จ่าย</Text>
          <Text style={styles.titleEn}>Certificate of Withholding Tax</Text>
          <Text style={styles.referenceLine}>
            ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร / Per Section 50 bis, Revenue
            Code
          </Text>
        </View>

        {/* Running number + tax year */}
        <View style={styles.metaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>เลขที่ / No.:</Text>
            <Text style={{ fontWeight: "bold" }}>{data.runningNumber}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>ปีภาษี / Tax Year:</Text>
            <Text style={{ fontWeight: "bold" }}>
              {beYear} ({ceYear})
            </Text>
          </View>
        </View>

        {/* Payer (left) / Payee (right) */}
        <View style={styles.topGrid}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>
              ผู้มีหน้าที่หักภาษี ณ ที่จ่าย / Withholding Agent (Payer)
            </Text>
            <Text style={styles.partyName}>{c.nameTh}</Text>
            {c.nameEn ? <Text style={styles.muted}>{c.nameEn}</Text> : null}
            <Text style={styles.muted}>
              เลขประจำตัวผู้เสียภาษี / TIN: {c.tin}
              {c.branchCode ? ` (${c.branchCode})` : ""}
            </Text>
            <Text style={styles.muted}>{c.addressTh}</Text>
            {c.phone ? <Text style={styles.muted}>โทร {c.phone}</Text> : null}
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>
              ผู้ถูกหักภาษี ณ ที่จ่าย / Payee
            </Text>
            <Text style={styles.partyName}>{cu.name}</Text>
            {cu.tin ? (
              <Text style={styles.muted}>
                เลขประจำตัวผู้เสียภาษี / TIN: {cu.tin}
                {cu.branchCode ? ` (${cu.branchCode})` : ""}
              </Text>
            ) : null}
            {cu.address ? (
              <Text style={styles.muted}>{cu.address}</Text>
            ) : null}
            {cu.phone ? <Text style={styles.muted}>โทร {cu.phone}</Text> : null}
          </View>
        </View>

        {/* Form type checkboxes */}
        <View style={styles.formCheckboxRow}>
          <View style={styles.checkboxItem}>
            <Check on={data.formType === "pnd3"} />
            <Text style={styles.checkboxLabel}>
              ภ.ง.ด. 3 (บุคคลธรรมดา / Natural person)
            </Text>
          </View>
          <View style={styles.checkboxItem}>
            <Check on={data.formType === "pnd53"} />
            <Text style={styles.checkboxLabel}>
              ภ.ง.ด. 53 (นิติบุคคล / Juristic person)
            </Text>
          </View>
        </View>

        {/* Income table */}
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={styles.colIncome}>ประเภทเงินได้ / Income Type</Text>
            <Text style={styles.colDate}>วันที่จ่าย / Date</Text>
            <Text style={styles.colGross}>จำนวนเงิน / Gross</Text>
            <Text style={styles.colRate}>อัตรา / Rate</Text>
            <Text style={styles.colWith}>ภาษีที่หัก / Withheld</Text>
          </View>
          {data.lines.map((l, i) => {
            const meta = WHT_INCOME_TYPES[l.code];
            return (
              <View key={i} style={styles.tr} wrap={false}>
                <View style={styles.colIncome}>
                  <Text>{meta.thLabel}</Text>
                  {l.description ? (
                    <Text style={styles.muted}>{l.description}</Text>
                  ) : null}
                </View>
                <Text style={styles.colDate}>{l.paymentDate}</Text>
                <Text style={styles.colGross}>{fmt(l.grossAmount)}</Text>
                <Text style={styles.colRate}>{l.rate}%</Text>
                <Text style={styles.colWith}>{fmt(l.withheldAmount)}</Text>
              </View>
            );
          })}
          <View style={styles.trTotal}>
            <Text style={styles.colIncome}>รวม / Total</Text>
            <Text style={styles.colDate} />
            <Text style={styles.colGross}>{fmt(data.totalGross)}</Text>
            <Text style={styles.colRate} />
            <Text style={styles.colWith}>{fmt(data.totalWithheld)}</Text>
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.paymentBlock}>
          <Text style={styles.paymentLabel}>
            ประเภทการจ่าย / Payment Type
          </Text>
          <View style={styles.paymentOption}>
            <Check on={data.paymentMethod === "withheld"} />
            <Text style={styles.checkboxLabel}>
              หัก ณ ที่จ่าย / Withheld from payment
            </Text>
          </View>
          <View style={styles.paymentOption}>
            <Check on={data.paymentMethod === "paid_for_payee"} />
            <Text style={styles.checkboxLabel}>
              ออกให้ผู้ถูกหักตลอดไป / Paid by payer in full
            </Text>
          </View>
          <View style={styles.paymentOption}>
            <Check on={data.paymentMethod === "other"} />
            <Text style={styles.checkboxLabel}>
              อื่นๆ / Other{data.notes ? `: ${data.notes}` : ""}
            </Text>
          </View>
        </View>

        {/* Free-text notes (only when paymentMethod !== "other" — that case
            already prints notes inline). */}
        {data.notes && data.paymentMethod !== "other" ? (
          <View style={styles.notesBlock}>
            <Text style={styles.paymentLabel}>หมายเหตุ / Notes</Text>
            <Text>{data.notes}</Text>
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
              (...........................) ผู้มีอำนาจลงนาม / Authorized
              Signatory
            </Text>
            <Text style={styles.signatureDate}>
              วันที่ / Date: {data.paymentDate}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{c.nameTh}</Text>
          <Text>Generated by Dsign Accounting Workspace</Text>
        </View>
      </Page>
    </Document>
  );
}
