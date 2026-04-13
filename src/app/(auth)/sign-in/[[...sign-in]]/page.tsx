import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-10 flex flex-col items-center">
          <Logo />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Welcome back. Sign in to your account.
          </p>
        </div>
        <SignIn
          forceRedirectUrl="/dashboard"
          signUpUrl="/sign-up"
          appearance={{
            variables: {
              colorPrimary: "#38b6ff",
              borderRadius: "0.75rem",
            },
            elements: {
              rootBox: "w-full",
              card: "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-border bg-card",
            },
          }}
        />
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-accent underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
