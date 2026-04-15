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

export const paymentLinkTypeEnum = pgEnum("payment_link_type", [
  "one_time",
  "recurring",
]);

export const priceIntervalEnum = pgEnum("price_interval", [
  "day",
  "week",
  "month",
  "year",
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
  "settings_updated",
  "customer_unsubscribed",
  "customer_created",
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

// Per-recipient delivery state for a campaign send. Each state is monotonic
// in practice (queued → sent → delivered → opened → clicked) but bounced /
// complained / failed can happen from any earlier state.
export const campaignMessageStatusEnum = pgEnum("campaign_message_status", [
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "complained",
  "failed",
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

// Outbound merchant webhook events. Mirrors Stripe's event naming so merchants
// who've integrated Stripe webhooks before have a familiar mental model.
export const merchantWebhookEventEnum = pgEnum("merchant_webhook_event", [
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
  "payment_link.created",
  "checkout.session.completed",
  "checkout.session.expired",
  "subscription.created",
  "subscription.canceled",
]);

export const webhookDeliveryStatusEnum = pgEnum("webhook_delivery_status", [
  "pending",
  "delivered",
  "failed",
  "retrying",
]);

// ─── Merchants ────────────────────────────────────────────────────────────────
// One record per signed-up user. clerk_id is the source of truth for identity.

export const merchants = pgTable(
  "merchants",
  {
    id: text("id").primaryKey(), // clerk user id
    email: varchar("email", { length: 255 }).notNull(),
    businessName: varchar("business_name", { length: 255 }),
    // Public storefront: when storefrontEnabled is true, we serve a
    // zero-code catalog page at /shop/<storefrontSlug> that lists every
    // active payment link for this merchant. Slug is the only truly
    // user-facing identifier so uniqueness is enforced at the DB level.
    storefrontSlug: varchar("storefront_slug", { length: 64 }),
    storefrontTagline: varchar("storefront_tagline", { length: 160 }),
    storefrontEnabled: boolean("storefront_enabled").notNull().default(false),
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
    unique("merchants_storefront_slug_unique").on(t.storefrontSlug),
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
    // Opt-out timestamps for marketing. Non-null = customer asked us to
    // stop. Filtered out of all campaign sends. Set via email unsubscribe
    // links or inbound SMS STOP handler.
    emailOptOutAt: timestamp("email_opt_out_at"),
    smsOptOutAt: timestamp("sms_opt_out_at"),
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
    type: paymentLinkTypeEnum("type").notNull().default("one_time"),
    interval: priceIntervalEnum("interval"),
    intervalCount: integer("interval_count"),
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
    // Engagement counters updated by the webhook pipeline. Kept as denormalized
    // roll-ups so the campaigns list doesn't have to aggregate per-message
    // rows on every render.
    deliveredCount: integer("delivered_count").notNull().default(0),
    openedCount: integer("opened_count").notNull().default(0),
    clickedCount: integer("clicked_count").notNull().default(0),
    bouncedCount: integer("bounced_count").notNull().default(0),
    complainedCount: integer("complained_count").notNull().default(0),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("campaigns_merchant_id_idx").on(t.merchantId),
    index("campaigns_status_idx").on(t.status),
  ]
);

// Per-recipient delivery rows — one per recipient of a campaign send, keyed
// by the provider message id (Resend "email_id") so webhooks can find the
// right row and advance it forward through the status chain.
export const campaignMessages = pgTable(
  "campaign_messages",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    recipient: varchar("recipient", { length: 320 }).notNull(), // email or phone
    providerMessageId: varchar("provider_message_id", { length: 255 }),
    status: campaignMessageStatusEnum("status").notNull().default("queued"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    firstOpenedAt: timestamp("first_opened_at"),
    firstClickedAt: timestamp("first_clicked_at"),
    openCount: integer("open_count").notNull().default(0),
    clickCount: integer("click_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("campaign_messages_campaign_id_idx").on(t.campaignId),
    index("campaign_messages_merchant_id_idx").on(t.merchantId),
    index("campaign_messages_provider_id_idx").on(t.providerMessageId),
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

// ─── Merchant Webhooks ───────────────────────────────────────────────────────
// Outbound webhooks delivered to merchant servers when events happen on their
// account (payment succeeded, subscription created, etc.). Each endpoint has
// a signing secret used for HMAC-SHA256 request signing (same pattern Stripe
// uses — `t=<ts>,v1=<sig>`) and a whitelist of event types it cares about.

export const merchantWebhooks = pgTable(
  "merchant_webhooks",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    // Destination URL — must be https in production. Validated at create time.
    url: text("url").notNull(),
    // Signing secret — prefix "whsec_" followed by base64url random bytes.
    // Shown to the merchant exactly once at creation; stored plain so we can
    // sign outbound requests. (Hashing would mean we couldn't sign.)
    signingSecret: varchar("signing_secret", { length: 128 }).notNull(),
    // Optional human label for the merchant to remember where this goes.
    description: varchar("description", { length: 160 }),
    // Which events this endpoint receives. Empty array = receive everything.
    // Kept as text[] rather than the enum array so adding new events later
    // doesn't require a migration for existing rows.
    enabledEvents: text("enabled_events").array().notNull().default([]),
    active: boolean("active").notNull().default(true),
    // Last-delivery summary for quick dashboard display without joining
    // deliveries. Updated on every send attempt.
    lastDeliveryAt: timestamp("last_delivery_at"),
    lastDeliveryStatus: webhookDeliveryStatusEnum("last_delivery_status"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("merchant_webhooks_merchant_id_idx").on(t.merchantId),
    index("merchant_webhooks_active_idx").on(t.active),
  ]
);

// Per-delivery audit trail. Every attempt (including retries) writes or
// updates one row keyed by id, so merchants can replay individual events
// and we can back off failing endpoints without losing history.
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: text("id").primaryKey(),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => merchantWebhooks.id, { onDelete: "cascade" }),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    // The event type ("payment.succeeded" etc). Not a foreign key to the
    // enum since we want older deliveries to survive enum changes.
    event: varchar("event", { length: 64 }).notNull(),
    // Logical event id — stable across retries so merchants can dedupe on
    // their side. Format: "evt_<timestamp><random>".
    eventId: varchar("event_id", { length: 64 }).notNull(),
    // The full JSON body that was sent (or will be sent). Stored as text so
    // we can replay a delivery verbatim and show the raw payload in the UI.
    payload: text("payload").notNull(),
    status: webhookDeliveryStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    // HTTP response details from the last attempt. Null until first attempt.
    responseCode: integer("response_code"),
    responseBody: text("response_body"), // truncated to ~2KB
    errorMessage: text("error_message"),
    // Exponential backoff schedule. Null once terminal (delivered/failed).
    nextRetryAt: timestamp("next_retry_at"),
    firstAttemptAt: timestamp("first_attempt_at"),
    lastAttemptAt: timestamp("last_attempt_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("webhook_deliveries_webhook_id_idx").on(t.webhookId),
    index("webhook_deliveries_merchant_id_idx").on(t.merchantId),
    index("webhook_deliveries_status_idx").on(t.status),
    index("webhook_deliveries_event_id_idx").on(t.eventId),
    index("webhook_deliveries_created_at_idx").on(t.createdAt),
  ]
);

// ─── Merchant API Keys ───────────────────────────────────────────────────────
// Server-to-server authentication for the v1 API. Merchants generate one or
// more keys from their dashboard and use them as Bearer tokens to call
// endpoints like POST /api/v1/checkout that mint ephemeral Stripe sessions on
// their behalf. We store only a SHA-256 hash of the key so a database leak
// can't be replayed; the plaintext is shown once at creation.

export const merchantApiKeys = pgTable(
  "merchant_api_keys",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    // Short human label ("Production", "Staging", etc) so merchants can tell
    // keys apart in the UI.
    name: varchar("name", { length: 80 }).notNull(),
    // First 12 chars of the plaintext key (e.g. "jp_live_9fkZ") for display.
    // Not sensitive on its own — just enough to identify which key is which.
    prefix: varchar("prefix", { length: 20 }).notNull(),
    // SHA-256 hex hash of the full plaintext key. This is what we compare
    // against on every authenticated request.
    hashedKey: varchar("hashed_key", { length: 128 }).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("merchant_api_keys_merchant_id_idx").on(t.merchantId),
    unique("merchant_api_keys_hashed_key_unique").on(t.hashedKey),
  ]
);

// ─── Marketing Leads (TCR-compliant SMS opt-in) ──────────────────────────────
// Captured from the marketing site popup. Every row represents an explicit
// opt-in to receive marketing text messages from JidoPay and stores the
// exact consent language, timestamp, IP, and user agent for audit/TCR.

export const marketingLeads = pgTable(
  "marketing_leads",
  {
    id: text("id").primaryKey(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    phone: varchar("phone", { length: 24 }).notNull(), // E.164 format
    source: varchar("source", { length: 64 }).notNull().default("popup"),
    consentText: text("consent_text").notNull(),
    consentAt: timestamp("consent_at").notNull().defaultNow(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    welcomeSmsSent: boolean("welcome_sms_sent").notNull().default(false),
    unsubscribedAt: timestamp("unsubscribed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("marketing_leads_phone_unique").on(t.phone),
    index("marketing_leads_created_at_idx").on(t.createdAt),
  ]
);

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
export type MerchantApiKey = typeof merchantApiKeys.$inferSelect;
export type NewMerchantApiKey = typeof merchantApiKeys.$inferInsert;
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
export type MarketingLead = typeof marketingLeads.$inferSelect;
export type NewMarketingLead = typeof marketingLeads.$inferInsert;
export type MerchantWebhook = typeof merchantWebhooks.$inferSelect;
export type NewMerchantWebhook = typeof merchantWebhooks.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;
