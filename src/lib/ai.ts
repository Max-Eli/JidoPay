import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (cached) return cached;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  cached = new Anthropic({ apiKey: key });
  return cached;
}

export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    return Reflect.get(getAnthropic(), prop);
  },
});

export type MerchantContext = {
  businessName: string | null;
  totalRevenue: number;
  paymentCount: number;
  invoiceCount: number;
  customerCount: number;
  recentPayments?: Array<{ amount: number; customerName: string | null; date: string }>;
};

export function buildSystemPrompt(ctx: MerchantContext): string {
  return `You are JidoPay AI, a financial assistant built into the JidoPay payment platform.
You help merchants manage their payments, invoices, and grow their business.

Current merchant context:
- Business: ${ctx.businessName ?? "your business"}
- Total Revenue: $${(ctx.totalRevenue / 100).toFixed(2)}
- Payments Processed: ${ctx.paymentCount}
- Invoices Created: ${ctx.invoiceCount}
- Total Customers: ${ctx.customerCount}

You can help with:
1. Analyzing revenue trends and providing insights
2. Drafting professional invoice descriptions and notes
3. Writing follow-up emails for unpaid invoices
4. Explaining payment disputes and how to respond
5. Suggesting pricing strategies
6. Answering questions about payments, payouts, and fees

Keep responses concise, professional, and actionable.
Never fabricate financial figures beyond what is provided in context.
Always be honest if you don't have enough data to make a recommendation.`;
}
