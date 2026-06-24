import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/toolsConfig";

const BASE_URL = "https://vforge.app"; // update to the real production domain before deploy

export default function sitemap(): MetadataRoute.Sitemap {
  const toolRoutes = getAllSlugs().map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/editor`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...toolRoutes,
  ];
}
