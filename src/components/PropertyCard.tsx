import { Link } from "@tanstack/react-router";
import { BedDouble, Bath, Maximize, MapPin, CalendarClock } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Property } from "@/lib/data";

export function PropertyCard({ property, compact = false }: { property: Property; compact?: boolean }) {
  if (!property) return null;

  const coverImage =
    typeof property.image === "string" && property.image.trim().length > 0
      ? property.image
      : "";

  // Hide any property without a direct usable image.
  if (!coverImage) return null;

  const price =
    typeof property.price === "number" ? formatPrice(property.price) : "Price not listed";

  const sqftLabel =
    typeof property.sqft === "number" ? property.sqft.toLocaleString() : "Size not listed";

  const bedsLabel =
    typeof property.beds === "number" ? `${property.beds} bd` : "Beds not listed";

  const bathsLabel =
    typeof property.baths === "number" ? `${property.baths} ba` : "Baths not listed";

  return (
    <article className="group overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link to="/property/$id" params={{ id: property.id }} className="block">
        <div className="relative overflow-hidden bg-muted">
          <img
            src={coverImage}
            alt={property.title || "Property"}
            loading="lazy"
            className={`${compact ? "aspect-[4/3]" : "aspect-[4/3] lg:aspect-[16/11]"} w-full object-cover transition-transform duration-700 group-hover:scale-105`}
          />

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />

          <p className="absolute bottom-4 left-4 font-serif text-2xl text-white drop-shadow-sm">
            {price}
          </p>
        </div>
      </Link>

      <div className="p-5">
        <Link to="/property/$id" params={{ id: property.id }} className="block">
          <h3 className="truncate text-base font-semibold tracking-tight">
            {property.title || "Property"}
          </h3>
        </Link>

        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {property.address ? `${property.address}, ` : ""}
          {property.city || "City not listed"}
          {property.state ? `, ${property.state}` : ""}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-secondary/70 p-3 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center justify-center gap-1.5">
            <BedDouble className="size-3.5" /> {bedsLabel}
          </span>

          <span className="flex items-center justify-center gap-1.5">
            <Bath className="size-3.5" /> {bathsLabel}
          </span>

          <span className="flex items-center justify-center gap-1.5">
            <Maximize className="size-3.5" /> {sqftLabel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            to="/property/$id"
            params={{ id: property.id }}
            className="rounded-xl border border-border bg-card px-4 py-3 text-center text-xs font-semibold transition-colors hover:bg-secondary"
          >
            View Details
          </Link>

          <a
            href={`/tours?propertyId=${property.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground"
          >
            <CalendarClock className="size-3.5" /> Tour
          </a>
        </div>
      </div>
    </article>
  );
}
