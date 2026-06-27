import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  ArrowRight,
  Search,
  CalendarClock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  MapPin,
  LayoutDashboard,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PropertyCard } from "@/components/PropertyCard";
import { budgetOptions, realtor, timelineOptions } from "@/lib/data";
import { usePlatformData, usePublicProperties, useRealtorProfile, type LeadCapture } from "@/lib/platformStore";
import { shortPrice } from "@/lib/format";
import { emailToMailtoHref, phoneToTelHref } from "@/lib/contact";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elena Valerius — Luxury Real Estate Advisor" },
      {
        name: "description",
        content:
          "Browse exclusive luxury listings, view recently sold homes, schedule a private tour, and connect directly with advisor Elena Valerius.",
      },
      { property: "og:title", content: "Elena Valerius — Luxury Real Estate Advisor" },
      { property: "og:image", content: realtor.hero },
    ],
  }),
  component: Index,
});

function Index() {
  const profile = useRealtorProfile();
  const { activeProperties, soldProperties } = usePublicProperties();
  const { recordContactAction, addLead, ensureChatThread } = usePlatformData();
  const featured = activeProperties[0];
  const hasRealListings = activeProperties.length > 0;
  const visibleSocials = profile.socials.filter((s) => s.enabled === true && s.url.trim());
  const callHref = phoneToTelHref(profile.phone);
  const emailHref = emailToMailtoHref(profile.email);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadCapture>({
    name: "",
    email: "",
    phone: "",
    timeline: timelineOptions[0],
    budget: budgetOptions[2],
    interest: activeProperties[0]?.title || "General buyer consultation",
    source: "Homepage private intake",
    message: "",
  });

  useEffect(() => {
    if (!leadForm.interest && activeProperties[0]?.title) {
      setLeadForm((current) => ({ ...current, interest: activeProperties[0].title }));
    }
  }, [activeProperties, leadForm.interest]);

  const setLeadField = (key: keyof LeadCapture, value: string) => {
    setLeadForm((current) => ({ ...current, [key]: value }));
  };

  const submitLead = (event: React.FormEvent) => {
    event.preventDefault();
    if (!leadForm.name.trim() || !leadForm.email.trim()) {
      toast.error("Please add the member name and email.");
      return;
    }

    const savedLead = addLead({ ...leadForm, source: "Homepage private intake" });
    ensureChatThread({ ...leadForm, source: "Homepage private intake" });
    setLeadSubmitted(true);
    toast.success(`${savedLead.name} was received. A private follow-up thread is ready.`);
  };

  return (
    <AppShell>
      <main>
        <section className="hero-surface relative overflow-hidden border-b border-border/70">
          <div className="mx-auto grid max-w-7xl min-w-0 gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:px-8 lg:py-20">
            <div className="flex flex-col justify-center">
              <div className="rounded-[2rem] border border-border bg-card/90 p-4 shadow-xl backdrop-blur sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <img
                    src={profile.headshot}
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="size-20 rounded-3xl object-cover shadow-sm sm:size-24"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      <ShieldCheck className="size-3.5 text-accent-foreground" /> {profile.license}
                    </div>
                    <h1 className="mt-3 font-serif text-3xl leading-none tracking-tight sm:text-4xl">{profile.name}</h1>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">{profile.title}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-accent-foreground">{profile.brokerage}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    aria-label="Private access"
                    title="Private access"
                    className="grid size-11 shrink-0 place-items-center self-start rounded-full border border-border bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground sm:self-center"
                  >
                    <LayoutDashboard className="size-4" />
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-xs font-semibold text-muted-foreground">
                  <span className="rounded-full bg-primary px-3 py-1.5 text-primary-foreground">Usually replies within minutes</span>
                  <span className="rounded-full border border-border bg-background px-3 py-1.5">White-glove member guidance</span>
                  <span className="rounded-full border border-border bg-background px-3 py-1.5">Private tours available</span>
                </div>
              </div>

              <h2 className="mt-8 max-w-3xl font-serif text-5xl leading-[0.96] tracking-tight sm:text-6xl lg:text-7xl">
                {profile.tagline}
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                {profile.bio}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/listings"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <Search className="size-4" /> Search Available Homes
                </Link>
                <Link
                  to="/tours"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-4 text-sm font-semibold shadow-sm transition-colors hover:bg-secondary"
                >
                  <CalendarClock className="size-4" /> Schedule Private Tour
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {callHref ? (
                  <a
                    href={callHref}
                    className="social-pill"
                    aria-label={`Call ${profile.name} at ${profile.phone}`}
                    onClick={() => {
                      recordContactAction("call", "homepage profile actions");
                      toast.success(`Opening phone call to ${profile.phone}.`);
                    }}
                  >
                    <Phone className="size-4" /> Call
                  </a>
                ) : (
                  <button type="button" disabled className="social-pill opacity-50" title="No phone number is currently set">
                    <Phone className="size-4" /> Call
                  </button>
                )}
                {emailHref ? (
                  <a
                    href={emailHref}
                    className="social-pill"
                    aria-label={`Email ${profile.name} at ${profile.email}`}
                    onClick={() => recordContactAction("email", "homepage profile actions")}
                  >
                    <Mail className="size-4" /> Email
                  </a>
                ) : null}
                {visibleSocials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="social-pill">
                    {s.short}
                  </a>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-6 -top-6 hidden h-40 w-40 rounded-full bg-accent/25 blur-3xl lg:block" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-card shadow-2xl">
                <img
                  src={profile.hero}
                  alt="Featured luxury property"
                  width={1280}
                  height={800}
                  className="h-[28rem] w-full object-cover sm:h-[34rem]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-7">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                        {hasRealListings ? "Featured Listing" : "Real Listings Coming Soon"}
                      </p>
                      <h3 className="mt-2 font-serif text-3xl">
                        {featured?.title || "Verified properties will appear here"}
                      </h3>
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
                        <MapPin className="size-4" /> {featured?.city || "Georgia real estate guidance"}
                      </p>
                    </div>
                    <p className="font-serif text-3xl">{featured ? shortPrice(featured.price) : "Soon"}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {profile.stats.map((s) => (
              <div key={s.label} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <p className="font-serif text-3xl tracking-tight">{s.value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-stretch">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
              <p className="section-kicker"><UserPlus className="size-3.5" /> Private Buyer Intake</p>
              <h3 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">Capture serious interest before the member leaves.</h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                This form captures serious member interest and prepares a private follow-up thread before the member leaves.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <IntakeTrust title="Private intake" text="Clean follow-up details" />
                <IntakeTrust title="Chat prepared" text="Thread is created for reply" />
                <IntakeTrust title="Property-aware" text="Interest follows the selected home" />
              </div>
            </div>

            <form onSubmit={submitLead} className="rounded-[2rem] border border-border bg-card p-6 shadow-xl sm:p-8">
              {leadSubmitted ? (
                <div className="grid min-h-[28rem] place-items-center text-center">
                  <div>
                    <div className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-foreground">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <h4 className="mt-5 font-serif text-3xl">Lead saved</h4>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                      This member inquiry was received and a private follow-up thread is ready.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLeadSubmitted(false);
                        setLeadForm((current) => ({ ...current, name: "", email: "", phone: "", message: "" }));
                      }}
                      className="mt-6 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground"
                    >
                      Add another lead
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <p className="section-kicker">Private member intake</p>
                      <h4 className="mt-2 font-serif text-3xl">Start a private consultation</h4>
                    </div>
                    <span className="w-fit rounded-full bg-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Private intake</span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <LeadField label="Full name">
                      <input value={leadForm.name} onChange={(e) => setLeadField("name", e.target.value)} className="ev-input" placeholder="Member name" />
                    </LeadField>
                    <LeadField label="Email">
                      <input type="email" value={leadForm.email} onChange={(e) => setLeadField("email", e.target.value)} className="ev-input" placeholder="member@email.com" />
                    </LeadField>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <LeadField label="Phone">
                      <input value={leadForm.phone} onChange={(e) => setLeadField("phone", e.target.value)} className="ev-input" placeholder="(404) 555-0000" />
                    </LeadField>
                    <LeadField label="Timeline">
                      <select value={leadForm.timeline} onChange={(e) => setLeadField("timeline", e.target.value)} className="ev-input">
                        {timelineOptions.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </LeadField>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <LeadField label="Budget">
                      <select value={leadForm.budget} onChange={(e) => setLeadField("budget", e.target.value)} className="ev-input">
                        {budgetOptions.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </LeadField>
                    <LeadField label="Interest">
                      <select value={leadForm.interest} onChange={(e) => setLeadField("interest", e.target.value)} className="ev-input">
                        {activeProperties.length > 0 ? (
                          activeProperties.map((property) => <option key={property.id}>{property.title}</option>)
                        ) : (
                          <option>General buyer consultation</option>
                        )}
                        <option>Seller consultation</option>
                        <option>General buyer consultation</option>
                      </select>
                    </LeadField>
                  </div>

                  <LeadField label="Message / need" className="mt-4">
                    <textarea
                      value={leadForm.message}
                      onChange={(e) => setLeadField("message", e.target.value)}
                      className="ev-input min-h-28 resize-none"
                      placeholder="Example: I want a private tour this week, or I need to sell before buying."
                    />
                  </LeadField>

                  <button type="submit" className="mt-5 w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
                    Save Private Inquiry
                  </button>
                  <p className="mt-3 text-center text-xs leading-6 text-muted-foreground">
                    Prototype storage is browser-based. Production can connect this same flow to Supabase so owner and visitors sync across devices.
                  </p>
                </>
              )}
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="section-kicker"><Sparkles className="size-3.5" /> Curated Properties</p>
              <h3 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">Active Listings</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Searchable, saveable property cards built to move members from interest to tour request.
              </p>
            </div>
            <Link to="/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-accent-foreground underline decoration-accent underline-offset-4">
              {hasRealListings ? `View all ${activeProperties.length}` : "View listing page"} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {hasRealListings ? (
              activeProperties.slice(0, 3).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))
            ) : (
              <div className="rounded-[2rem] border border-dashed border-border bg-card p-8 text-center shadow-sm md:col-span-2 xl:col-span-3">
                <p className="font-serif text-2xl">No active real listings are published yet.</p>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                  Verified homes will appear here after the owner imports real listing details and real property photos.
                </p>
                <Link
                  to="/listings"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Check listings <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="border-y border-border/70 bg-secondary/45">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:px-8">
            <div>
              <p className="section-kicker">Proof of Performance</p>
              <h3 className="mt-2 font-serif text-3xl sm:text-4xl">Recently Closed</h3>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                Past homes sold are presented like proof, helping members and sellers trust the realtor before they ever send a message.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {soldProperties.slice(0, 4).map((p) => (
                <Link key={p.id} to="/property/$id" params={{ id: p.id }} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                  <div className="relative">
                    <img src={p.photos[0]} alt={p.title} loading="lazy" className="aspect-[16/10] w-full object-cover grayscale-[0.25] transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Sold</span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-bold">Sold {shortPrice(p.soldPrice ?? p.price)}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{p.title} · {p.city}</p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">Represented {p.represented}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-primary text-primary-foreground shadow-2xl">
            <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-foreground/55">Member Conversion</p>
                <h4 className="mt-3 font-serif text-3xl sm:text-4xl">Find the home. Save it. Tour it. Chat instantly.</h4>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-primary-foreground/70">
                  This experience keeps every important member action close: search, save, schedule, message, and share documents.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link to="/tours" className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-sm font-semibold text-accent-foreground">
                  Schedule a Tour <ArrowRight className="size-4" />
                </Link>
                <Link to="/chat" className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-6 py-4 text-sm font-semibold">
                  <MessageCircle className="size-4" /> Start Instant Chat
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}


function IntakeTrust({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}

function LeadField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
