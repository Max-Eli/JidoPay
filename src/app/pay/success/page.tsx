import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm mx-auto px-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Complete</h1>
        <p className="mt-2 text-gray-500">
          Thank you! Your payment has been processed successfully. You&apos;ll
          receive a confirmation email shortly.
        </p>
      </div>
    </div>
  );
}
