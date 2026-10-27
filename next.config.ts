import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Cabeceras de seguridad para todas las respuestas. La geolocalización solo para la propia web. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Carpeta de build alternativa (p. ej. NEXT_DIST_DIR=.next-check) para compilar sin pisar un `next dev` abierto.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["sharp", "bcryptjs"],
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
