"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function OnboardingRefreshPage() {
  useEffect(() => {
    // Auto-trigger a new onboarding link
    fetch("/api/stripe/connect", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) window.location.href = data.url;
      });
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-violet-600" />
        <p className="text-gray-600">Refreshing your onboarding link...</p>
      </div>
    </div>
  );
}
