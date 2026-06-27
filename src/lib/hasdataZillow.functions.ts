import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Property } from "@/lib/data";

const inputSchema = z.object({
  keyword: z.string().min(2).max(120).default("Atlanta, GA"),
  minPrice: z.number().default(300000),
  maxPrice: z.number().default(800000),
  limit: z.number().min(1).max(20).default(20),
});

type HasDataListing = {
  id?: string;
  url?: string;
  homeType?: string;
  image?: string;
  status?: string;
  price?: number;
  area?: number;
  addressRaw?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
  latitude?: number;
  longitude?: number;
  beds?: number;
  baths?: number;
  brokerName?: string;
  photos?: string[];
};

function propertyType(): "House" {
  return "House";
}

function cleanId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function findListings(obj: unknown): HasDataListing[] {
  if (Array.isArray(obj)) return obj as HasDataListing[];

  if (obj && typeof obj === "object") {
    const record = obj as Record<string, unknown>;

    for (const key of ["properties", "listings", "results", "items", "data"]) {
      const value = record[key];
      if (Array.isArray(value)) return value as HasDataListing[];
    }

    for (const value of Object.values(record)) {
      const found = findListings(value);
      if (found.length) return found;
    }
  }

  return [];
}

function normalizeListing(item: HasDataListing): Property | null {
  const price = Number(item.price);
  const beds = Number(item.beds || 0);
  const baths = Number(item.baths || 0);
  const sqft = Number(item.area || 0);
  const lat = Number(item.latitude);
  const lng = Number(item.longitude);
  const street = item.address?.street || item.addressRaw?.split(",")[0] || "";
  const city = [item.address?.city, item.address?.state, item.address?.zipcode].filter(Boolean).join(", ").replace(", GA,", ", GA ");
  const photo = item.image || item.photos?.[0] || "";

  if (!street || !city || !Number.isFinite(price) || !Number.isFinite(lat) || !Number.isFinite(lng) || !photo) {
    return null;
  }

  const zillowId = String(item.id || cleanId(`${street}-${price}`));
  const broker = item.brokerName ? `Broker: ${item.brokerName}` : "Public market listing";

  return {
    id: `zillow-${zillowId}`,
    title: `${street} Home`,
    address: street,
    city,
    price,
    beds,
    baths,
    sqft,
    type: propertyType(item.homeType),
    status: "active",
    badges: ["Public Market Listing", "HasData/Zillow", broker],
    description: `Imported from public Zillow listing data via HasData. Source: ${item.url || "Zillow listing"}`,
    photos: item.photos?.length ? item.photos : [photo],
    lat,
    lng,
  };
}

export const fetchHasDataZillowListings = createServerFn({ method: "POST" })
  .validator(inputSchema)
  .handler(async ({ data }) => {
    const apiKey = process.env.HASDATA_API_KEY;

    if (!apiKey) {
      throw new Error("HASDATA_API_KEY is missing. Add it to .env locally and Vercel environment variables.");
    }

    const params = new URLSearchParams({
      keyword: data.keyword,
      type: "forSale",
      "price[min]": String(data.minPrice),
      "price[max]": String(data.maxPrice),
    });

    const response = await fetch(`https://api.hasdata.com/scrape/zillow/listing?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HasData request failed ${response.status}: ${text.slice(0, 300)}`);
    }

    const json = await response.json();
    const listings = findListings(json)
      .map(normalizeListing)
      .filter(Boolean)
      .slice(0, data.limit) as Property[];

    return {
      count: listings.length,
      listings,
    };
  });
