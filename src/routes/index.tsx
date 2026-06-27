import { Link, createFileRoute } from "@tanstack/react-router";
import { Building2, CalendarDays, Heart, Mail, Phone, Search, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { realtor } from "@/lib/data";
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function Home() {
  const { activeProperties } = usePublicProperties();
  const featuredListings = activeProperties.slice(0, 5);

  return (
    <AppShell>
      <main className="mx-auto min-h-screen max-w-[430px] px-5 pb-28 pt-5 sm:max-w-[520px]">
        <section className="overflow-hidden rounded-[1.4rem] border border-border bg-card shadow-sm">
          <div className="relative">
            <img
              src={realtor.hero}
              alt={`${realtor.name} luxury real estate`}
              className="h-24 w-full object-cover sm:h-32"
            />

            <div className="absolute left-1/2 top-[52px] -translate-x-1/2 sm:top-[78px]">
              <div className="rounded-full border-[5px] border-background bg-background shadow-xl">
                <img
                  src={realtor.headshot}
                  alt={realtor.name}
                  className="size-20 rounded-full object-cover sm:size-24"
                />
              </div>
            </div>
          </div>

          <div className="px-5 pb-6 pt-14 text-center sm:pt-16">
            <h1 className="font-serif text-[1.65rem] leading-tight tracking-tight text-foreground sm:text-3xl">
              {realtor.tagline}
            </h1>

            <p className="mx-auto mt-3 max-w-[300px] text-[11px] leading-5 text-muted-foreground">
              Curating the world&apos;s most exceptional properties for the most discerning clients.
            </p>

            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              DRE #8829402 · Prestige Realty Group
            </p>

            <div className="mt-6 grid grid-cols-8 gap-2">
              <ContactBubble icon={<Phone className="size-3.5" />} href={`tel:${realtor.phone}`} label="Call" />
              <ContactBubble icon={<Mail className="size-3.5" />} href={`mailto:${realtor.email}`} label="Email" />
              {realtor.socials.slice(0, 6).map((social) => (
                <ContactBubble key={social.label} text={social.short} href={social.url} label={social.label} />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-4 overflow-hidden rounded-2xl border border-border bg-background">
              {realtor.stats.map((stat) => (
                <div key={stat.label} className="border-r border-border px-2 py-4 last:border-r-0">
                  <p className="font-serif text-sm text-foreground">{stat.value}</p>
                  <p className="mt-1 text-[7px] font-black uppercase leading-3 tracking-[0.1em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-left text-[12px] leading-6 text-muted-foreground">
              {realtor.bio}
            </p>
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Portfolio
              </p>
              <h2 className="mt-1 font-serif text-2xl tracking-tight">Active Listings</h2>
            </div>

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

function FeaturedListingCard({ property }: { property: ReturnType<typeof usePublicProperties>["activeProperties"][number] }) {
  const photo = property.image || property.gallery?.[0] || property.photos?.[0] || realtor.hero;

  return (
    <article className="overflow-hidden rounded-[1.4rem] border border-border bg-card shadow-sm">
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to="/property/$id" params={{ id: property.id }} className="font-serif text-xl leading-tight hover:underline">
              {property.title}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">{property.address}</p>
          </div>

          <p className="shrink-0 text-sm font-black">{formatMoney(property.price)}</p>
        </div>

        <div className="mt-4 grid grid-cols-4 overflow-hidden rounded-2xl border border-border bg-background text-center">
          <MiniFact icon={<Building2 className="size-3.5" />} label="Beds" value={property.beds} />
          <MiniFact icon={<UserRound className="size-3.5" />} label="Baths" value={property.baths} />
          <MiniFact icon={<Search className="size-3.5" />} label="Sqft" value={Number(property.sqft || 0).toLocaleString()} />
          <MiniFact icon={<CalendarDays className="size-3.5" />} label="Tour" value="Book" />
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
  icon?: React.ReactNode;
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
      className="grid aspect-square place-items-center rounded-2xl border border-border bg-background text-[9px] font-black uppercase tracking-[0.08em] text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-secondary"
    >
      {icon || text}
    </a>
  );
}

function MiniFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="border-r border-border px-2 py-3 last:border-r-0">
      <div className="mx-auto grid size-7 place-items-center rounded-full bg-secondary text-muted-foreground">
        {icon}
      </div>
      <p className="mt-1 text-xs font-black text-foreground">{value}</p>
      <p className="text-[7px] font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    </div>
  );
}
