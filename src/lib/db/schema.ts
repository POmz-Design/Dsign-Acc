import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  unique,
  integer,
  uuid,
  numeric,
  boolean,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccount } from "next-auth/adapters";

// Auth.js v5 required tables (Postgres) — shape lifted from @auth/drizzle-adapter docs.

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // Credentials provider — null for OAuth-only accounts.
  hashedPassword: text("hashedPassword"),
  // Preferred UI locale. Default Thai.
  locale: text("locale").notNull().default("th"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

// -------------------- Phase 1: foundations --------------------

// companies — solo workspace model: exactly one company per user. Created on
// first visit to /settings, not at signup.
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  nameTh: text("nameTh").notNull(),
  nameEn: text("nameEn"),
  // 13-digit Thai taxpayer id.
  tin: text("tin").notNull(),
  // Head office is "00000"; physical branches use their own code.
  branchCode: text("branchCode").notNull().default("00000"),
  addressTh: text("addressTh").notNull(),
  addressEn: text("addressEn"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logoUrl"),
  signatureUrl: text("signatureUrl"),
  defaultVatRate: numeric("defaultVatRate", { precision: 5, scale: 2 })
    .notNull()
    .default("7.00"),
  defaultCurrency: text("defaultCurrency").notNull().default("THB"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

// customers — many per company. Either juristic (company w/ TIN) or natural.
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("companyId")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // Individuals often don't have a TIN — optional.
  tin: text("tin"),
  branchCode: text("branchCode").default("00000"),
  isJuristic: boolean("isJuristic").notNull().default(false),
  address: text("address"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

// items — services or goods sold by the company.
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("companyId")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").notNull().default("ชิ้น"),
  unitPrice: numeric("unitPrice", { precision: 14, scale: 2 }).notNull(),
  vatApplicable: boolean("vatApplicable").notNull().default(true),
  // null = no WHT applies; otherwise 1, 3, or 5 percent.
  whtRate: numeric("whtRate", { precision: 5, scale: 2 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

// -------------------- Phase 2: documents --------------------

// Per-(company, docType, year) atomic counter for running numbers.
// Bumped via an UPSERT-with-RETURNING — no FOR UPDATE needed because
// Postgres serializes ON CONFLICT writes on the conflicting tuple.
export const documentCounters = pgTable(
  "document_counters",
  {
    companyId: uuid("companyId")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    docType: text("docType").notNull(),
    year: integer("year").notNull(),
    nextValue: integer("nextValue").notNull().default(1),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.companyId, t.docType, t.year] }),
  }),
);

// documents — polymorphic table for quotation / invoice / receipt.
// customerSnapshot + companySnapshot + jsonPayload freeze the payload at
// issuance so the PDF remains reproducible even if upstream records change.
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("companyId")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    runningNumber: text("runningNumber").notNull(),
    year: integer("year").notNull(),
    // Soft-link to customer — no cascade. If a customer is deleted later
    // the document keeps its snapshot but loses the live link.
    customerId: uuid("customerId").references(() => customers.id),
    issueDate: date("issueDate", { mode: "string" }).notNull(),
    dueDate: date("dueDate", { mode: "string" }),
    status: text("status").notNull().default("draft"),
    customerSnapshot: jsonb("customerSnapshot").notNull(),
    companySnapshot: jsonb("companySnapshot").notNull(),
    notes: text("notes"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
    vatAmount: numeric("vatAmount", { precision: 14, scale: 2 })
      .notNull()
      .default("0.00"),
    whtAmount: numeric("whtAmount", { precision: 14, scale: 2 })
      .notNull()
      .default("0.00"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull(),
    netPayable: numeric("netPayable", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("THB"),
    jsonPayload: jsonb("jsonPayload").notNull(),
    issuedAt: timestamp("issuedAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => ({
    // Same running number can never be reused within (company, type, year).
    uniqRunning: unique("documents_uniq_running").on(
      t.companyId,
      t.type,
      t.runningNumber,
    ),
  }),
);

export const documentLines = pgTable("document_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("documentId")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  sortOrder: integer("sortOrder").notNull(),
  // Null for free-text lines. Soft-link — items can be deleted later.
  itemId: uuid("itemId").references(() => items.id),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric("unitPrice", { precision: 14, scale: 2 }).notNull(),
  discountPercent: numeric("discountPercent", { precision: 5, scale: 2 })
    .notNull()
    .default("0.00"),
  vatRate: numeric("vatRate", { precision: 5, scale: 2 })
    .notNull()
    .default("0.00"),
  lineTotal: numeric("lineTotal", { precision: 14, scale: 2 }).notNull(),
});

// -------------------- Relations --------------------

export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.id],
    references: [companies.userId],
  }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  customers: many(customers),
  items: many(items),
  documents: many(documents),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  documents: many(documents),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  company: one(companies, {
    fields: [items.companyId],
    references: [companies.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  company: one(companies, {
    fields: [documents.companyId],
    references: [companies.id],
  }),
  customer: one(customers, {
    fields: [documents.customerId],
    references: [customers.id],
  }),
  lines: many(documentLines),
}));

export const documentLinesRelations = relations(documentLines, ({ one }) => ({
  document: one(documents, {
    fields: [documentLines.documentId],
    references: [documents.id],
  }),
  item: one(items, {
    fields: [documentLines.itemId],
    references: [items.id],
  }),
}));

// -------------------- Inferred types --------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export type DocType = "quotation" | "invoice" | "receipt";

export type DocumentRow = typeof documents.$inferSelect;
export type NewDocumentRow = typeof documents.$inferInsert;

export type DocumentLineRow = typeof documentLines.$inferSelect;
export type NewDocumentLineRow = typeof documentLines.$inferInsert;

export type DocumentCounterRow = typeof documentCounters.$inferSelect;
