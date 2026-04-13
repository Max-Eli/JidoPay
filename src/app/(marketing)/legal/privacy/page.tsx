export const metadata = {
  title: "Privacy Policy",
  description: "How JidoPay collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="mb-12 flex items-center gap-2">
        <span className="h-px w-8 bg-foreground/40" />
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Legal
        </span>
      </div>
      <h1 className="font-display text-display-md">Privacy Policy</h1>
      <p className="mt-6 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="prose prose-neutral dark:prose-invert mt-12 max-w-none space-y-8 text-foreground/90 leading-relaxed">
        <section>
          <h2 className="font-display text-2xl mb-4">1. Introduction</h2>
          <p>
            JidoPay, Inc. (&ldquo;JidoPay,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
            or &ldquo;our&rdquo;) provides payments infrastructure that enables
            businesses (&ldquo;Merchants&rdquo;) to accept payments from their
            customers (&ldquo;End Customers&rdquo;). This Privacy Policy
            explains how we collect, use, share, and protect information in
            connection with our services.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">2. Information We Collect</h2>
          <p>
            We collect information you provide directly when creating an
            account, including your name, email address, business details, and
            payment account information necessary to process payments on your
            behalf. We also automatically collect usage data such as IP
            addresses, browser type, and pages visited.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">3. Payment Processing</h2>
          <p>
            Payments are processed through our payment infrastructure partner,
            Stripe, Inc. Card numbers, bank details, and other sensitive payment
            information are transmitted directly to Stripe and never stored on
            JidoPay&apos;s servers. Your use of payment processing is subject to
            Stripe&apos;s{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              privacy policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">4. How We Use Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related notifications</li>
            <li>Detect and prevent fraud, abuse, and security incidents</li>
            <li>Comply with legal obligations and enforce our terms</li>
            <li>Communicate with you about updates, features, and support</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">5. Information Sharing</h2>
          <p>
            We do not sell your personal information. We share information only
            with trusted service providers (such as Stripe for payment
            processing, Clerk for authentication, and Neon for database
            hosting), when required by law, or with your explicit consent.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">6. Data Security</h2>
          <p>
            We implement industry-standard security controls including
            encryption in transit (TLS 1.3) and at rest (AES-256), multi-factor
            authentication, and continuous vulnerability monitoring. See our{" "}
            <a href="/security" className="text-accent underline">
              security page
            </a>{" "}
            for details.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">7. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have rights to access,
            correct, delete, or export your personal data. You can exercise
            these rights by contacting us at privacy@jidopay.com.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material
            changes will be communicated via email or prominent notice within
            the product.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">9. Contact Us</h2>
          <p>
            Questions about this policy? Email us at{" "}
            <a
              href="mailto:privacy@jidopay.com"
              className="text-accent underline"
            >
              privacy@jidopay.com
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
