import type { MetadataRoute } from "next";

const BASE_URL = "https://vforge.app"; // update to the real production domain before deploy

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
