import type { MetadataRoute } from "next";
import { buildRobotsMetadata } from "@/core/seo/robots";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsMetadata();
}
