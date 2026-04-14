import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/invoices(.*)",
  "/payments(.*)",
  "/payment-links(.*)",
  "/payouts(.*)",
  "/customers(.*)",
  "/settings(.*)",
  "/campaigns(.*)",
  "/wallet(.*)",
  "/recovery(.*)",
  "/onboarding(.*)",
  "/api/ai(.*)",
  "/api/invoices(.*)",
  "/api/payment-links(.*)",
  "/api/stripe/connect(.*)",
  "/api/stripe/payouts-session(.*)",
  "/api/campaigns(.*)",
  "/api/wallet(.*)",
  "/api/abandoned-checkouts(.*)",
  "/api/merchants(.*)",
  "/api/customers(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
