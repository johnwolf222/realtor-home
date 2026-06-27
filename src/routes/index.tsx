import { Link, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Heart, Mail, Phone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { realtor } from "@/lib/data";
import type { Property } from "@/lib/data";
import { usePublicProperties } from "@/lib/platformStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${realtor.name} — ${realtor.title}` },
      {
        name: "description",
        content: "A luxury realtor profile, active listings, private tours, and client portal.",
      },
    ],
  }),
  component: Home,
});

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function Home() {
  const { activeProperties } = usePublicProperties();
  const featuredListings = activeProperties.slice(0, 5);
  const socials = Array.isArray(realtor.socials) ? realtor.socials.filter((social) => social.enabled !== false) : [];

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[430px] px-5 pb-36 pt-8 sm:max-w-[480px]">
        <section className="min-h-[calc(100vh-7.5rem)] text-center">
          <div className="relative mx-auto h-[170px] overflow-visible rounded-[1.35rem]">
            <img
              src={realtor.hero}
              alt={`${realtor.name} luxury real estate`}
              className="h-[146px] w-full rounded-[1.35rem] object-cover shadow-sm"
            />

            <div className="absolute left-1/2 top-[92px] -translate-x-1/2">
              <div className="rounded-full border-[5px] border-background bg-background shadow-xl">
                <img
                  src={realtor.headshot}
                  alt={realtor.name}
                  className="size-[94px] rounded-full object-cover object-top"
                />
              </div>
            </div>
          </div>

          <h1 className="mt-7 font-serif text-[1.8rem] leading-tight tracking-tight text-foreground sm:text-[2rem]">
            {realtor.tagline}
          </h1>

          <p className="mx-auto mt-3 max-w-[390px] text-[12px] leading-6 text-muted-foreground">
            Curating the world&apos;s most exceptional properties for the most discerning clients.
          </p>

          <p className="mt-2 text-[11px] font-medium tracking-[0.04em] text-muted-foreground">
            DRE #8829402 · Prestige Realty Group
          </p>

          <div className="mx-auto mt-6 flex max-w-[430px] items-center justify-center gap-3">
            <ContactBubble icon={<Phone className="size-3.5" />} href={`tel:${realtor.phone}`} label="Call" />
            <ContactBubble icon={<Mail className="size-3.5" />} href={`mailto:${realtor.email}`} label="Email" />
            {socials.slice(0, 6).map((social) => (
              <ContactBubble key={social.label} text={social.short} href={social.url} label={social.label} />
            ))}
          </div>

          <div className="mt-16 grid grid-cols-4 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
            {realtor.stats.map((stat) => (
              <div key={stat.label} className="border-r border-border px-2 py-4 last:border-r-0">
                <p className="font-serif text-sm text-foreground">{stat.value}</p>
                <p className="mt-1 text-[7px] font-black uppercase leading-3 tracking-[0.1em] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-7 pb-8 text-left text-[12px] leading-6 text-muted-foreground">
            {realtor.bio}
          </p>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-[1.45rem] tracking-tight">Active Listings</h2>

            <Link to="/listings" className="text-[10px] font-black text-foreground underline underline-offset-4">
              View all {activeProperties.length}
            </Link>
          </div>

          <div className="mt-4 space-y-5">
            {featuredListings.map((property) => (
              <FeaturedListingCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function FeaturedListingCard({ property }: { property: Property }) {
  const photo = property.image || property.gallery?.[0] || property.photos?.[0] || realtor.hero;

  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-border bg-card shadow-sm">
      <div className="relative">
        <Link to="/property/$id" params={{ id: property.id }}>
          <img src={photo} alt={property.title} className="aspect-[4/3] w-full object-cover" />
        </Link>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-950 px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white">
            Active
          </span>

          {(property.badges || []).slice(0, 1).map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-white/90 px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-950 backdrop-blur"
            >
              {badge}
            </span>
          ))}
        </div>

        <button
          type="button"
          aria-label="Save property"
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur"
        >
          <Heart className="size-4" />
        </button>
      </div>

      <div className="p-4">
        <Link to="/property/$id" params={{ id: property.id }} className="font-serif text-xl leading-tight hover:underline">
          {property.title}
        </Link>

        <p className="mt-1 text-xs text-muted-foreground">{property.address}</p>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{property.beds} bd · {property.baths} ba · {Number(property.sqft || 0).toLocaleString()} sqft</span>
          <span className="font-black text-foreground">{money(property.price)}</span>
        </div>
      </div>
    </article>
  );
}

function ContactBubble({
  icon,
  text,
  href,
  label,
}: {
  icon?: ReactNode;
  text?: string;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="grid size-12 place-items-center rounded-2xl border border-border bg-background text-[9px] font-black uppercase tracking-[0.08em] text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-secondary"
    >
      {icon || text}
    </a>
  );
}
