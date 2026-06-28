import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Building2, LockKeyhole, Video } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { usePublicProperties } from "@/lib/platformStore";

export const Route = createFileRoute("/tours/live")({
  head: () => ({
    meta: [
      { title: "Property Videos Moved — Elena Valerius" },
      {
        name: "description",
        content: "Property video tours now live directly under each individual property page.",
      },
    ],
  }),
  component: PropertyVideosMoved,
});

function PropertyVideosMoved() {
  const { activeProperties } = usePublicProperties();

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-card p-6 text-center shadow-xl sm:p-8">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground">
            <LockKeyhole className="size-8" />
          </div>

          <p className="mt-5 section-kicker justify-center">
            <Video className="size-3.5" /> Property video tours moved
          </p>

          <h1 className="mt-3 font-serif text-4xl">Video tours now live under each property.</h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            The old access-code preview room has been retired. Open a property page, scroll to the Property Video Tour section, and log in to watch, like, comment, and create view history for the owner.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/listings" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm">
              <Building2 className="size-4" /> View Listings
            </Link>
            <Link to="/tours" className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-3 text-sm font-bold">
              <ArrowLeft className="size-4" /> Schedule In-Person Tour
            </Link>
          </div>
        </section>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeProperties.slice(0, 6).map((property) => (
            <a
              key={property.id}
              href={`/property/${property.id}#property-video-tour`}
              className="rounded-3xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-secondary"
            >
              <p className="font-serif text-xl">{property.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{property.city} · {property.beds} bd · {property.baths} ba</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">Open video section</p>
            </a>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
