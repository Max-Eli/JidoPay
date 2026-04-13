import {
  pgTable,
  text,
  varchar,
  integer,
  bigint,
  boolean,
  timestamp,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "paid",
  "overdue",
  "void",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
  "disputed",
]);

export const paymentLinkStatusEnum = pgEnum("payment_link_status", [
  "active",
  "inactive",
  "expired",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "invoice_created",
  "invoice_sent",
  "invoice_paid",
  "invoice_voided",
  "payment_link_created",
  "payment_link_deactivated",
  "payout_requested",
  "account_connected",
  "account_disconnected",
  "refund_issued",
  "campaign_sent",
  "wallet_credited",
  "wallet_debited",
  "abandoned_checkout_reminded",
]);

export const campaignChannelEnum = pgEnum("campaign_channel", ["email", "sms"]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "sending",
  "sent",
  "failed",
]);

export const campaignAudienceEnum = pgEnum("campaign_audience", [
  "all",
  "repeat",
  "inactive",
  "abandoned",
]);

export const walletTxnTypeEnum = pgEnum("wallet_txn_type", [
  "credit",
  "debit",
  "refund",
  "payment",
]);

export const abandonedStatusEnum = pgEnum("abandoned_status", [
  "pending",
  "reminded",
  "recovered",
  "dismissed",
]);

// ─── Merchants ────────────────────────────────────────────────────────────────
// One record per signed-up user. clerk_id is the source of truth for identity.

export const merchants = pgTable(
  "merchants",
  {
    id: text("id").primaryKey(), // clerk user id
    email: varchar("email", { length: 255 }).notNull(),
    businessName: varchar("business_name", { length: 255 }),
    stripeAccountId: varchar("stripe_account_id", { length: 255 }),
    stripeOnboardingComplete: boolean("stripe_onboarding_complete")
      .notNull()
      .default(false),
    stripeChargesEnabled: boolean("stripe_charges_enabled")
      .notNull()
      .default(false),
    stripePayoutsEnabled: boolean("stripe_payouts_enabled")
      .notNull()
      .default(false),
    // Feature flags
    oneClickPayEnabled: boolean("one_click_pay_enabled").notNull().default(false),
    walletEnabled: boolean("wallet_enabled").notNull().default(false),
    abandonedRecoveryEnabled: boolean("abandoned_recovery_enabled")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("merchants_stripe_account_id_idx").on(t.stripeAccountId),
    unique("merchants_stripe_account_id_unique").on(t.stripeAccountId),
  ]
);

// ─── Customers ────────────────────────────────────────────────────────────────
// Merchant's end customers (who pay the merchant)

export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(), // cuid or uuid generated in app
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    address: text("address"),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    totalSpend: bigint("total_spend", { mode: "number" }).notNull().default(0), // in cents
    paymentCount: integer("payment_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("customers_merchant_id_idx").on(t.merchantId),
    index("customers_email_merchant_idx").on(t.email, t.merchantId),
  ]
);

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }).notNull(),
    subtotal: bigint("subtotal", { mode: "number" }).notNull(), // cents
    taxAmount: bigint("tax_amount", { mode: "number" }).notNull().default(0), // cents
    totalAmount: bigint("total_amount", { mode: "number" }).notNull(), // cents
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    dueDate: timestamp("due_date"),
    paidAt: timestamp("paid_at"),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    stripeInvoiceUrl: text("stripe_invoice_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("invoices_merchant_id_idx").on(t.merchantId),
    index("invoices_status_idx").on(t.status),
    index("invoices_customer_id_idx").on(t.customerId),
    unique("invoices_number_merchant_unique").on(
      t.invoiceNumber,
      t.merchantId
    ),
  ]
);

// ─── Invoice Line Items ───────────────────────────────────────────────────────

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: varchar("description", { length: 500 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitAmount: bigint("unit_amount", { mode: "number" }).notNull(), // cents
    totalAmount: bigint("total_amount", { mode: "number" }).notNull(), // cents
  },
  (t) => [index("invoice_items_invoice_id_idx").on(t.invoiceId)]
);

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    invoiceId: text("invoice_id").references(() => invoices.id, {
      onDelete: "set null",
    }),
    paymentLinkId: text("payment_link_id"),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", {
      length: 255,
    }).notNull(),
    stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
    amount: bigint("amount", { mode: "number" }).notNull(), // cents
    applicationFee: bigint("application_fee", { mode: "number" }).notNull().default(0), // cents — your 0.5%
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    customerName: varchar("customer_name", { length: 255 }),
    customerEmail: varchar("customer_email", { length: 255 }),
    description: text("description"),
    metadata: text("metadata"), // JSON string
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("payments_merchant_id_idx").on(t.merchantId),
    index("payments_status_idx").on(t.status),
    index("payments_stripe_pi_idx").on(t.stripePaymentIntentId),
    index("payments_created_at_idx").on(t.createdAt),
  ]
);

// ─── Payment Links ────────────────────────────────────────────────────────────

export const paymentLinks = pgTable(
  "payment_links",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    amount: bigint("amount", { mode: "number" }).notNull(), // cents (0 = customer chooses)
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    status: paymentLinkStatusEnum("status").notNull().default("active"),
    stripePaymentLinkId: varchar("stripe_payment_link_id", { length: 255 }),
    stripePaymentLinkUrl: text("stripe_payment_link_url"),
    totalCollected: bigint("total_collected", { mode: "number" }).notNull().default(0),
    useCount: integer("use_count").notNull().default(0),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("payment_links_merchant_id_idx").on(t.merchantId),
    index("payment_links_status_idx").on(t.status),
  ]
);

// ─── Webhook Events (idempotency) ─────────────────────────────────────────────

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: text("id").primaryKey(), // stripe event id
    type: varchar("type", { length: 100 }).notNull(),
    processedAt: timestamp("processed_at").notNull().defaultNow(),
  },
  (t) => [index("webhook_events_type_idx").on(t.type)]
);

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    action: auditActionEnum("action").notNull(),
    resourceId: text("resource_id"),
    resourceType: varchar("resource_type", { length: 50 }),
    metadata: text("metadata"), // JSON string
    ipAddress: varchar("ip_address", { length: 50 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_merchant_id_idx").on(t.merchantId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

// ─── Campaigns (retargeting / marketing) ─────────────────────────────────────

export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    channel: campaignChannelEnum("channel").notNull(),
    audience: campaignAudienceEnum("audience").notNull().default("all"),
    status: campaignStatusEnum("status").notNull().default("draft"),
    subject: varchar("subject", { length: 255 }), // email only
    body: text("body").notNull(),
    sentCount: integer("sent_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("campaigns_merchant_id_idx").on(t.merchantId),
    index("campaigns_status_idx").on(t.status),
  ]
);

// ─── Customer Wallets ────────────────────────────────────────────────────────
// Per-merchant stored-value wallets for end customers.

export const wallets = pgTable(
  "wallets",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    balance: bigint("balance", { mode: "number" }).notNull().default(0), // cents
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("wallets_merchant_id_idx").on(t.merchantId),
    unique("wallets_merchant_customer_unique").on(t.merchantId, t.customerId),
  ]
);

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: text("id").primaryKey(),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    type: walletTxnTypeEnum("type").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(), // cents, always positive
    balanceAfter: bigint("balance_after", { mode: "number" }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("wallet_txn_wallet_id_idx").on(t.walletId),
    index("wallet_txn_merchant_id_idx").on(t.merchantId),
  ]
);

// ─── Abandoned Checkouts ─────────────────────────────────────────────────────
// Tracked from Stripe checkout.session.expired events on payment links.

export const abandonedCheckouts = pgTable(
  "abandoned_checkouts",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    paymentLinkId: text("payment_link_id").references(() => paymentLinks.id, {
      onDelete: "set null",
    }),
    stripeSessionId: varchar("stripe_session_id", { length: 255 }),
    customerEmail: varchar("customer_email", { length: 255 }),
    customerPhone: varchar("customer_phone", { length: 50 }),
    customerName: varchar("customer_name", { length: 255 }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    status: abandonedStatusEnum("status").notNull().default("pending"),
    remindedAt: timestamp("reminded_at"),
    recoveredAt: timestamp("recovered_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("abandoned_merchant_id_idx").on(t.merchantId),
    index("abandoned_status_idx").on(t.status),
  ]
);

// ─── Saved Payment Methods (one-click pay) ───────────────────────────────────
// Mirror of stripe payment methods attached to a customer for quick reuse.

export const savedPaymentMethods = pgTable(
  "saved_payment_methods",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 255 })
      .notNull(),
    brand: varchar("brand", { length: 50 }),
    last4: varchar("last4", { length: 4 }),
    expMonth: integer("exp_month"),
    expYear: integer("exp_year"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("saved_pm_customer_id_idx").on(t.customerId),
    index("saved_pm_merchant_id_idx").on(t.merchantId),
    unique("saved_pm_stripe_unique").on(t.stripePaymentMethodId),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const merchantRelations = relations(merchants, ({ many }) => ({
  customers: many(customers),
  invoices: many(invoices),
  payments: many(payments),
  paymentLinks: many(paymentLinks),
  auditLogs: many(auditLogs),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [customers.merchantId],
    references: [merchants.id],
  }),
  invoices: many(invoices),
  payments: many(payments),
}));

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [invoices.merchantId],
    references: [merchants.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
  payment: one(payments, {
    fields: [invoices.id],
    references: [payments.invoiceId],
  }),
}));

export const invoiceItemRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  merchant: one(merchants, {
    fields: [payments.merchantId],
    references: [merchants.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentLinkRelations = relations(paymentLinks, ({ one }) => ({
  merchant: one(merchants, {
    fields: [paymentLinks.merchantId],
    references: [merchants.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Merchant = typeof merchants.$inferSelect;
export type NewMerchant = typeof merchants.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentLink = typeof paymentLinks.$inferSelect;
export type NewPaymentLink = typeof paymentLinks.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type NewWalletTransaction = typeof walletTransactions.$inferInsert;
export type AbandonedCheckout = typeof abandonedCheckouts.$inferSelect;
export type NewAbandonedCheckout = typeof abandonedCheckouts.$inferInsert;
export type SavedPaymentMethod = typeof savedPaymentMethods.$inferSelect;
export type NewSavedPaymentMethod = typeof savedPaymentMethods.$inferInsert;
