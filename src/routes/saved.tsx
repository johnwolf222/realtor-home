import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PropertyCard } from "@/components/PropertyCard";
import { useSaved } from "@/lib/useSaved";
import { usePublicProperties } from "@/lib/platformStore";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Homes — Elena Valerius" },
      { name: "description", content: "Your saved luxury homes and favorites." },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { saved } = useSaved();
  const { properties } = usePublicProperties();
  const list = properties.filter((p) => saved.includes(p.id));

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="mb-8 rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="section-kicker"><Heart className="size-3.5" /> Member Favorites</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Saved Homes</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Keep favorite listings together so members can compare options and request tours quickly.
          </p>
        </section>

        {list.length === 0 ? (
          <div className="mx-auto mt-10 flex max-w-xl flex-col items-center rounded-[2rem] border border-dashed border-border bg-card p-10 text-center shadow-sm">
            <div className="grid size-16 place-items-center rounded-full bg-secondary">
              <Heart className="size-8 text-muted-foreground" />
            </div>
            <p className="mt-6 font-serif text-3xl">No saved homes yet</p>
            <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
              Tap the heart on any listing to keep it here for easy access.
            </p>
            <Link to="/listings" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground">
              <Search className="size-4" /> Browse Listings
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
