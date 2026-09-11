import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.NEXTAUTH_URL || "http://localhost:3000"; return ["/", "/pricing", "/privacy", "/terms", "/demo"].map((path) => ({ url: `${base}${path}`, lastModified: new Date() })); }
