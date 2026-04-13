export const metadata = {
  title: "Terms of Service",
  description: "Terms governing your use of the JidoPay platform.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="mb-12 flex items-center gap-2">
        <span className="h-px w-8 bg-foreground/40" />
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Legal
        </span>
      </div>
      <h1 className="font-display text-display-md">Terms of Service</h1>
      <p className="mt-6 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="mt-12 max-w-none space-y-8 text-foreground/90 leading-relaxed">
        <section>
          <h2 className="font-display text-2xl mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using JidoPay (&ldquo;the Service&rdquo;), you agree
            to be bound by these Terms of Service. If you do not agree, do not
            use the Service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">2. Eligibility</h2>
          <p>
            You must be at least 18 years old and legally capable of entering
            contracts to use JidoPay. By registering, you represent that you meet
            these requirements and that the information you provide is
            accurate and complete.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">3. Account Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account. Notify us immediately of any unauthorized use.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">4. Payment Processing</h2>
          <p>
            JidoPay facilitates payment processing through Stripe, Inc. By using
            JidoPay to accept payments, you also agree to the{" "}
            <a
              href="https://stripe.com/connect-account/legal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              Stripe Connected Account Agreement
            </a>
            . Stripe handles KYC (Know Your Customer) verification, AML
            (Anti-Money Laundering) compliance, and fund settlement.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">5. Fees</h2>
          <p>
            JidoPay charges a flat fee of 3.5% + $0.30 on each successful
            transaction. There are no monthly fees, setup fees, or hidden
            charges. Fees are deducted automatically from each transaction
            before payout.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">6. Prohibited Activities</h2>
          <p>
            You may not use JidoPay to process payments for illegal goods or
            services, engage in fraud, or violate any applicable law. We
            reserve the right to suspend or terminate accounts engaged in
            prohibited activities.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">7. Disputes and Refunds</h2>
          <p>
            Refunds and chargebacks are handled according to Stripe&apos;s
            policies. You are responsible for communicating refund policies to
            your customers and for responding to disputes in a timely manner.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">8. Intellectual Property</h2>
          <p>
            All content and intellectual property on JidoPay, including software,
            trademarks, and designs, is owned by JidoPay, Inc. or its licensors.
            You receive a limited, non-transferable license to use the Service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, JidoPay is not liable for any
            indirect, incidental, consequential, or punitive damages arising
            from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">10. Termination</h2>
          <p>
            You may terminate your account at any time. We may suspend or
            terminate accounts for violations of these terms or applicable law.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware,
            United States, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-4">12. Contact</h2>
          <p>
            Questions? Email{" "}
            <a href="mailto:legal@jidopay.com" className="text-accent underline">
              legal@jidopay.com
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
