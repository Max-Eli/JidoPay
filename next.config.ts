import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    // The embed checkout page is designed to be iframed from any merchant's
    // website via /public/embed.js. Serve it without X-Frame-Options so the
    // modal works cross-origin.
    {
      source: "/embed/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        // Allow any site to iframe this page — this is the whole point.
        { key: "Content-Security-Policy", value: "frame-ancestors *" },
      ],
    },
    {
      source: "/((?!embed/).*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],
};

export default nextConfig;
