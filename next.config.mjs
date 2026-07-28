/** @type {import('next').NextConfig} */

// Monaco's default CDN loader (@monaco-editor/react) pulls its runtime from
// jsdelivr and spins up web workers via blob: URLs — both are allow-listed
// below so the in-browser code editor keeps working under this CSP.
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
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig = (phase) => {
  return {
    output: "standalone",
    env: {
      NEXT_PHASE: phase,
    },
    // Strips console.log/debug/info from the production bundle; error/warn
    // are kept so real error reporting still works. Next only applies this
    // during production builds, so local `next dev` logging is unaffected.
    compiler: {
      removeConsole: { exclude: ["error", "warn"] },
    },
    experimental: {
      // Improves tree-shaking for icon imports (`import { X } from "lucide-react"`).
      optimizePackageImports: ["lucide-react"],
    },
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: securityHeaders,
        },
      ];
    },
  };
};

export default nextConfig;
