import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UN Tiles | Buy Tiles in Sri Lanka - Floor & Wall Tile Store",
    short_name: "UN Tiles",
    description:
      "Buy tiles in Sri Lanka with UN Tiles (Unicorn Enterprises). Browse 50+ premium floor and wall tiles with transparent LKR pricing, Colombo showroom, and islandwide delivery.",
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#faf8f5",
    lang: "en",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Buy Tiles",
        short_name: "Buy Tiles",
        description: "Browse and buy floor and wall tiles in Sri Lanka",
        url: "/collections",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "AI Tiles Finder",
        short_name: "AI Finder",
        description: "Upload photo to find matching tiles with AI in Sri Lanka",
        url: "/visual-search",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Contact Showroom",
        short_name: "Showroom",
        description: "Visit our tile showroom in Colombo 05",
        url: "/contact",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
