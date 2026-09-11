import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: ["/", "/pricing", "/privacy", "/terms", "/demo"] }, sitemap: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/sitemap.xml` }; }
