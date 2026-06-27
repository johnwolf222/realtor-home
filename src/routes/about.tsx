import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Mail,
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
        content: "Learn about the realtor profile, credentials, experience, service focus, and private contact options.",
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

const serviceFocus = ["Atlanta", "North Georgia", "Luxury relocation"];

function AboutPage() {
  const profile = useRealtorProfile();

  const callHref = profile.phone ? `tel:${profile.phone.replace(/[^\d+]/g, "")}` : "tel:+13105550192";
  const emailHref = profile.email ? `mailto:${profile.email}` : "mailto:elena@prestigega.com";
  const socials = Array.isArray(profile.socials) ? profile.socials.filter((social) => social.enabled !== false) : [];

  return (
    <AppShell>
      <main className="mx-auto min-h-screen max-w-[430px] px-5 pb-28 pt-5 sm:max-w-[560px]">
        <section className="overflow-hidden rounded-[1.4rem] border border-border bg-card shadow-sm">
          <div className="relative">
            <img
              src={profile.hero}
              alt={`${profile.name} luxury real estate`}
              className="h-24 w-full object-cover sm:h-32"
            />

            <div className="absolute left-1/2 top-[52px] -translate-x-1/2 sm:top-[78px]">
              <div className="rounded-full border-[5px] border-background bg-background shadow-xl">
                <img
                  src={profile.headshot}
                  alt={profile.name}
                  className="size-20 rounded-full object-cover object-top sm:size-24"
                />
              </div>
            </div>
          </div>

          <div className="px-5 pb-6 pt-14 text-center sm:pt-16">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              {profile.title}
            </p>

            <h1 className="mt-2 font-serif text-[1.75rem] leading-tight tracking-tight text-foreground sm:text-3xl">
              {profile.name}
            </h1>

            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {profile.brokerage}
            </p>

            <p className="mx-auto mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              <BadgeCheck className="size-3.5" /> {profile.license}
            </p>

            <p className="mx-auto mt-5 max-w-[330px] text-[12px] leading-6 text-muted-foreground">
              {profile.bio}
            </p>

            <div className="mt-6 grid grid-cols-8 gap-2">
              <ContactBubble icon={<Phone className="size-3.5" />} href={callHref} label="Call" />
              <ContactBubble icon={<Mail className="size-3.5" />} href={emailHref} label="Email" />
              {socials.slice(0, 6).map((social) => (
                <ContactBubble key={social.label} text={social.short} href={social.url} label={social.label} />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-4 overflow-hidden rounded-2xl border border-border bg-background">
              {profile.stats.map((stat) => (
                <div key={stat.label} className="border-r border-border px-2 py-4 last:border-r-0">
                  <p className="font-serif text-sm text-foreground">{stat.value}</p>
                  <p className="mt-1 text-[7px] font-black uppercase leading-3 tracking-[0.1em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                to="/listings"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-sm"
              >
                View listings <ArrowRight className="size-3.5" />
              </Link>

              <Link
                to="/tours"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-xs font-bold text-foreground shadow-sm hover:bg-secondary"
              >
                Book tour <CalendarClock className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[1.4rem] border border-border bg-card p-5 shadow-sm">
          <p className="section-kicker">
            <ShieldCheck className="size-3.5" /> About the advisor
          </p>

          <h2 className="mt-3 font-serif text-2xl leading-tight tracking-tight">
            Trusted Georgia real estate guidance with a premium digital experience.
          </h2>

          <p className="mt-3 text-[12px] leading-6 text-muted-foreground">
            {profile.name} helps buyers, sellers, and relocating families move through the Georgia market with
            clarity, privacy, and confidence. This platform brings together live listings, private tours, verified
            client intake, instant chat, and a polished concierge experience in one place.
          </p>
        </section>

        <section className="mt-6 rounded-[1.4rem] border border-border bg-card p-5 shadow-sm">
          <p className="section-kicker">
            <Award className="size-3.5" /> Credentials
          </p>

          <h2 className="mt-3 font-serif text-2xl tracking-tight">Professional background</h2>

          <div className="mt-5 grid gap-3">
            {credentials.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent-foreground" />
                <p className="text-sm font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[1.4rem] border border-border bg-card p-5 shadow-sm">
          <p className="section-kicker">
            <Sparkles className="size-3.5" /> Service focus
          </p>

          <div className="mt-4 grid gap-3">
            {serviceFocus.map((area) => (
              <div key={area} className="rounded-2xl border border-border bg-background p-4">
                <Star className="size-5 text-accent-foreground" />
                <h3 className="mt-3 font-serif text-2xl">{area}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Personalized guidance for buyers, sellers, and private clients exploring Georgia real estate.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[1.4rem] border border-border bg-primary p-5 text-primary-foreground shadow-sm">
          <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] opacity-80">
            <MessageCircle className="size-3.5" /> Contact & next step
          </p>

          <h2 className="mt-3 font-serif text-3xl tracking-tight">Ready to talk about a home?</h2>

          <p className="mt-3 text-sm leading-7 opacity-80">
            Browse listings, request a private tour, ask questions in chat, or contact the advisor directly.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <a href={callHref} className="rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15">
              <Phone className="size-5" />
              <p className="mt-3 text-sm font-bold">Call</p>
              <p className="mt-1 truncate text-xs opacity-75">{profile.phone}</p>
            </a>

            <a href={emailHref} className="rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15">
              <Mail className="size-5" />
              <p className="mt-3 text-sm font-bold">Email</p>
              <p className="mt-1 truncate text-xs opacity-75">{profile.email}</p>
            </a>

            <Link to="/tours" className="rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15">
              <CalendarClock className="size-5" />
              <p className="mt-3 text-sm font-bold">Tour</p>
              <p className="mt-1 text-xs opacity-75">Request showing</p>
            </Link>

            <Link to="/chat" className="rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15">
              <MessageCircle className="size-5" />
              <p className="mt-3 text-sm font-bold">Chat</p>
              <p className="mt-1 text-xs opacity-75">Ask instantly</p>
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
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
