import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useRealtorProfile } from "@/lib/platformStore";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Realtor Platform" },
      {
        name: "description",
        content:
          "Learn about the realtor's credentials, experience, affiliations, service areas, sold homes, and contact options.",
      },
    ],
  }),
  component: AboutPage,
});

const credentials = [
  "Licensed Georgia real estate advisor",
  "Luxury buyer and seller representation",
  "Private tours and client-first consultation",
  "Georgia relocation and neighborhood guidance",
  "Digital-first listing, chat, and tour experience",
  "Verification-ready client intake process",
];

const affiliations = [
  "Prestige Realty Group Georgia",
  "Georgia luxury market research",
  "Zillow public market listing data",
  "HasData-powered listing research",
  "OpenAI-powered concierge experience",
  "Zoom-ready private consultation",
  "Document review workflow",
  "Member portal experience",
];

const contactActions = [
  {
    label: "Call Directly",
    value: "Speak with the advisor",
    icon: Phone,
    href: "tel:+13105550192",
  },
  {
    label: "Email",
    value: "Send a private inquiry",
    icon: Mail,
    href: "mailto:elena@prestigega.com",
  },
  {
    label: "Schedule Tour",
    value: "Request private showing",
    icon: CalendarClock,
    to: "/tours",
  },
  {
    label: "Start Chat",
    value: "Ask about homes instantly",
    icon: MessageCircle,
    to: "/chat",
  },
];

function AboutPage() {
  const profile = useRealtorProfile();

  const callHref = profile.phone ? `tel:${profile.phone.replace(/[^\d+]/g, "")}` : "tel:+13105550192";
  const emailHref = profile.email ? `mailto:${profile.email}` : "mailto:elena@prestigega.com";

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-6">
        <div className="mx-auto max-w-sm overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm">
          <div className="relative h-[560px]">
            <img src={profile.headshot} alt={profile.name} className="h-full w-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-[2rem] border border-white/20 bg-white/90 p-5 shadow-xl backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">{profile.title}</p>
              <h2 className="mt-1 font-serif text-3xl text-primary">{profile.name}</h2>
              <p className="mt-1 text-sm font-semibold text-foreground">{profile.brokerage}</p>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <BadgeCheck className="size-3.5" /> {profile.license}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <p className="section-kicker justify-center">
            <ShieldCheck className="size-3.5" /> About the advisor
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            Trusted Georgia real estate guidance with a premium digital experience.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            {profile.name} helps buyers, sellers, and relocating families move through the Georgia market with
            clarity, privacy, and confidence. This platform brings together live listings, private tours, verified
            client intake, instant chat, and a polished concierge experience in one place.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              View listings <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary"
            >
              Start chat <MessageCircle className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {profile.stats.map((stat) => (
          <div key={stat.label} className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{stat.label}</p>
            <p className="mt-3 font-serif text-4xl text-primary">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="section-kicker">
            <Award className="size-3.5" /> Credentials
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight">Professional background</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            This section gives visitors a quick reason to trust the advisor before they request a tour, save a home,
            or start a private conversation.
          </p>

          <div className="mt-6 grid gap-3">
            {credentials.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent-foreground" />
                <p className="text-sm font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="section-kicker">
            <Building2 className="size-3.5" /> Affiliations & platform tools
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight">Built for credibility</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Logos and names here should be treated as brokerage, listing-source, integration, or supported-tool
            references, not automatic partnership claims unless officially verified.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {affiliations.map((item) => (
              <div
                key={item}
                className="flex min-h-24 items-center justify-center rounded-2xl border border-border bg-secondary/50 p-4 text-center"
              >
                <p className="text-sm font-bold text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-border bg-primary p-6 text-primary-foreground shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] opacity-80">
              <Sparkles className="size-3.5" /> Contact & next step
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">Ready to talk about a home?</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 opacity-80">
              Buyers can browse listings, request a private tour, ask questions in chat, or contact the advisor
              directly.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={callHref}
              className="rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15"
            >
              <Phone className="size-5" />
              <p className="mt-3 text-sm font-bold">Call</p>
              <p className="mt-1 text-xs opacity-75">{profile.phone}</p>
            </a>
            <a
              href={emailHref}
              className="rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15"
            >
              <Mail className="size-5" />
              <p className="mt-3 text-sm font-bold">Email</p>
              <p className="mt-1 text-xs opacity-75">{profile.email}</p>
            </a>
            <Link
              to="/tours"
              className="rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15"
            >
              <CalendarClock className="size-5" />
              <p className="mt-3 text-sm font-bold">Schedule Tour</p>
              <p className="mt-1 text-xs opacity-75">Request a showing</p>
            </Link>
            <Link
              to="/chat"
              className="rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15"
            >
              <MessageCircle className="size-5" />
              <p className="mt-3 text-sm font-bold">Chat</p>
              <p className="mt-1 text-xs opacity-75">Ask about homes</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="section-kicker">
          <MapPin className="size-3.5" /> Service focus
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {["Atlanta", "North Georgia", "Luxury relocation"].map((area) => (
            <div key={area} className="rounded-2xl border border-border bg-background p-5">
              <Star className="size-5 text-accent-foreground" />
              <h3 className="mt-3 font-serif text-2xl">{area}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Personalized guidance for buyers, sellers, and private clients exploring Georgia real estate.
              </p>
            </div>
          ))}
        </div>
      </section>
      </main>
    </AppShell>
  );
}
