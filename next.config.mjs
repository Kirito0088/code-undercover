/** @type {import('next').NextConfig} */

// .js suffix required: next/constants has no ESM subpath export.
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  "connect-src 'self' https://cdn.jsdelivr.net https://emkc.org",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "report-uri /api/security-report",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-Download-Options", value: "noopen" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
  { key: "Vary", value: "Accept-Encoding" },
];

// Only production emits content-hashed filenames under /_next/static. The
// Turbopack dev server reuses stable URLs (_buildManifest.js, _ssgManifest.js,
// Foo_module_css_1igg3k2._.single.css) whose bodies change on every recompile,
// so an immutable year-long max-age pins the browser to the first bundle it
// ever downloaded. It then hydrates that stale bundle against freshly rendered
// SSR HTML, which surfaces as a hydration mismatch. In development we send no
// Cache-Control at all here and let Next manage its own dev assets — it warns
// on any custom Cache-Control for this route, and it is right to.
const staticAssetHeaders = (isDev) => [
  ...(isDev ? [] : [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]),
  { key: "Cross-Origin-Resource-Policy", value: "anonymous" },
];

const nextConfig = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    output: "standalone",
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,
    devIndicators: {
      position: "bottom-right",
    },
    env: {
      NEXT_PHASE: phase,
    },
    experimental: {
      optimizePackageImports: ["lucide-react"],
      scrollRestoration: true,
    },
    compiler: {
      removeConsole: { exclude: ["error", "warn"] },
    },
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: securityHeaders,
        },
        {
          source: "/api/:path*",
          headers: [
            { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
            { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
            { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          ],
        },
        {
          source: "/_next/static/:path*",
          headers: staticAssetHeaders(isDev),
        },
      ];
    },
  };
};

export default nextConfig;
