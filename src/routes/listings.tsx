import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Home, ArrowUpDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PropertyCard } from "@/components/PropertyCard";
import { type PropertyType } from "@/lib/data";
import { usePublicProperties } from "@/lib/platformStore";

export const Route = createFileRoute("/listings")({
  head: () => ({
    meta: [
      { title: "Active Listings — Elena Valerius Luxury Real Estate" },
      {
        name: "description",
        content:
          "Search and filter exclusive active luxury property listings by price, type, and bedrooms.",
      },
      { property: "og:title", content: "Active Listings — Elena Valerius" },
    ],
  }),
  component: Listings,
});

const TYPES: (PropertyType | "All")[] = ["All", "House"];
const AMENITIES = ["Pool", "Balcony", "Basement", "Kitchen Island", "Guesthouse"] as const;
const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price low to high" },
  { id: "price-desc", label: "Price high to low" },
  { id: "sqft", label: "Largest first" },
];
const PRICE_LIMITS = [
  { value: 0, label: "Any price" },
  { value: 400000, label: "Under $400K" },
  { value: 500000, label: "Under $500K" },
  { value: 600000, label: "Under $600K" },
  { value: 700000, label: "Under $700K" },
  { value: 800000, label: "Under $800K" },
  { value: 1000000, label: "Under $1M" },
  { value: 2000000, label: "Under $2M" },
];

function initialParam(name: string, fallback = "") {
  if (typeof window === "undefined") return fallback;
  return new URLSearchParams(window.location.search).get(name) || fallback;
}

function initialNumberParam(name: string, fallback = 0) {
  const value = Number(initialParam(name));
  return Number.isFinite(value) ? value : fallback;
}

function initialType() {
  const value = initialParam("type");
  return TYPES.includes(value as PropertyType | "All") ? (value as PropertyType | "All") : "All";
}

function Listings() {
  const [query, setQuery] = useState(() => initialParam("q"));
  const [type, setType] = useState<(typeof TYPES)[number]>(() => initialType());
  const [minBeds, setMinBeds] = useState(() => initialNumberParam("beds"));
  const [minBaths, setMinBaths] = useState(() => initialNumberParam("baths"));
  const [maxPrice, setMaxPrice] = useState(() => initialNumberParam("maxPrice"));
  const [amenities, setAmenities] = useState<string[]>([]);
  const [sort, setSort] = useState(() => initialParam("sort", "featured"));
  const { activeProperties } = usePublicProperties();

  const results = useMemo(() => {
    let list = activeProperties.filter((p) => {
      const matchesQuery =
        !query ||
        `${p.title} ${p.address} ${p.city} ${p.type} ${p.badges.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesType = type === "All" || p.type === type;
      const matchesBeds = p.beds >= minBeds;
      const matchesBaths = p.baths >= minBaths;
      const matchesPrice = maxPrice === 0 || p.price <= maxPrice;
      const matchesAmenities = amenities.length === 0 || amenities.every((amenity) => p.badges.includes(amenity));
      return matchesQuery && matchesType && matchesBeds && matchesBaths && matchesPrice && matchesAmenities;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "sqft") list = [...list].sort((a, b) => b.sqft - a.sqft);
    return list;
  }, [query, type, minBeds, minBaths, maxPrice, amenities, sort]);

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="section-kicker"><Home className="size-3.5" /> Property Marketplace</p>
              <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Active Listings</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Browse available homes with clear filters, premium cards, and member actions that make it easy to save or schedule a tour.
              </p>
            </div>
            <div className="rounded-3xl bg-secondary p-5 text-center lg:min-w-48">
              <p className="font-serif text-4xl">{results.length}</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {results.length === 1 ? "Home Available" : "Homes Available"}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-accent-foreground" />
                <h3 className="font-serif text-xl">Search & Filters</h3>
              </div>

              <div className="mt-5 space-y-5">
                <label className="block">
                  <span className="filter-label">City, address, or property name</span>
                  <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3">
                    <Search className="size-4 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search homes"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </label>

                <FilterGroup label="Property Type">
                  <div className="grid grid-cols-2 gap-2">
                    {TYPES.map((t) => (
                      <button key={t} onClick={() => setType(t)} className={chip(type === t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup label="Bedrooms">
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 2, 3, 4, 5].map((b) => (
                      <button key={b} onClick={() => setMinBeds(b)} className={chip(minBeds === b)}>
                        {b === 0 ? "Any" : `${b}+`}
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup label="Bathrooms">
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 2, 3, 4, 5].map((b) => (
                      <button key={b} onClick={() => setMinBaths(b)} className={chip(minBaths === b)}>
                        {b === 0 ? "Any" : `${b}+`}
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup label="Amenities">
                  <details className="group rounded-2xl border border-border bg-background">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      <span>
                        {amenities.length === 0
                          ? "Select amenities"
                          : `${amenities.length} selected`}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground group-open:hidden">
                        Open
                      </span>
                      <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground group-open:inline">
                        Close
                      </span>
                    </summary>

                    <div className="border-t border-border p-3">
                      <div className="grid gap-2">
                        {AMENITIES.map((amenity) => {
                          const active = amenities.includes(amenity);
                          return (
                            <button
                              key={amenity}
                              type="button"
                              onClick={() =>
                                setAmenities((current) =>
                                  active ? current.filter((item) => item !== amenity) : [...current, amenity]
                                )
                              }
                              className={chip(active)}
                            >
                              {amenity}
                            </button>
                          );
                        })}
                      </div>

                      {amenities.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setAmenities([])}
                          className="mt-3 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          Clear amenities
                        </button>
                      )}
                    </div>
                  </details>
                </FilterGroup>

                <label className="block">
                  <span className="filter-label">Price</span>
                  <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="ev-input mt-2">
                    {PRICE_LIMITS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="filter-label">Sort</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value)} className="ev-input mt-2">
                    {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-5 flex flex-col justify-between gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold">Showing {results.length} of {activeProperties.length} listings</p>
                <p className="text-xs text-muted-foreground">Save favorites, compare options, or request a private tour.</p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <ArrowUpDown className="size-3.5" /> {SORTS.find((s) => s.id === sort)?.label}
              </div>
            </div>

            {results.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {results.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-border bg-card p-12 text-center">
                <p className="font-serif text-2xl">No homes match those filters yet.</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Try widening your search or clearing one of the filters.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="filter-label">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function chip(active: boolean) {
  return `rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
  }`;
}
