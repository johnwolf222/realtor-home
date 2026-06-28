import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Bell,
  Bot,
  BrainCircuit,
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  ImageUp,
  MapPin,
  Maximize2,
  ShieldAlert,
  ShieldCheck,
  Edit3,
  Heart,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  UserCog,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { realtor, type Lead, type Property, type PropertyStatus, type PropertyType, type TourRequest, type VerificationStatus } from "@/lib/data";
import { shortPrice } from "@/lib/format";
import { useSaved } from "@/lib/useSaved";
import { useAuth } from "@/lib/useAuth";
import { defaultConciergeSettings, usePlatformData, useRealtorProfile, type ConciergeSettings, type ConciergeTone, type ListingDraft, type StoredRealtorProfile } from "@/lib/platformStore";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner Dashboard — Realtor Platform" },
      { name: "description", content: "Owner-only command center for live platform edits." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "listings", label: "Listings", icon: Building2 },
  { id: "leads", label: "Leads", icon: Users },
  { id: "clients", label: "Client ID", icon: ShieldCheck },
  { id: "tours", label: "Tours", icon: CalendarClock },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "ai", label: "Chat KB", icon: Bot },
  { id: "profile", label: "Profile", icon: UserCog },
  { id: "security", label: "Security", icon: KeyRound },
] as const;

type TabId = (typeof tabs)[number]["id"];

function Dashboard() {
  const [tab, setTab] = useState<TabId>("overview");
  const { saved } = useSaved();
  const { user, isLoading, ownerGateUnlocked, ownerNotificationEmail } = useAuth();
  const profile = useRealtorProfile();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/45 px-4">
        <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto size-10 animate-pulse rounded-full bg-secondary" />
          <p className="mt-4 text-sm font-semibold">Checking secure dashboard access…</p>
        </div>
      </div>
    );
  }

  if (!ownerGateUnlocked || !ownerNotificationEmail || !user || user.role !== "realtor") {
    return <DashboardGate />;
  }

  return (
    <div className="min-h-screen bg-secondary/45 pb-12">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" aria-label="Back to site" className="grid size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <p className="text-sm font-semibold">Owner Dashboard</p>
              <p className="text-[11px] text-muted-foreground">Live local control · {profile.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-green-800 sm:inline-flex">Live edits on</span>
            <img src={profile.headshot} alt={profile.name} width={40} height={40} className="size-10 rounded-full object-cover" />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl min-w-0 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="no-scrollbar flex gap-2 overflow-x-auto rounded-3xl border border-border bg-card p-2 shadow-sm lg:flex-col lg:overflow-visible">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-none items-center gap-2 rounded-2xl px-4 py-3 text-left text-xs font-semibold transition-colors ${
                  tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <t.icon className="size-4" /> {t.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0">
          {tab === "overview" && <Overview savedCount={saved.length} jumpTo={setTab} />}
          {tab === "listings" && <Listings />}
          {tab === "leads" && <Leads />}
          {tab === "clients" && <ClientVerification />}
          {tab === "tours" && <Tours />}
          {tab === "chat" && <Chats />}
          {tab === "ai" && <AIConcierge />}
          {tab === "profile" && <Profile />}
          {tab === "security" && <Security />}
        </section>
      </main>
    </div>
  );
}

function DashboardGate() {
  const { ownerGateUnlocked, verifyOwnerDashboardPassword, saveOwnerNotificationEmail } = useAuth();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      verifyOwnerDashboardPassword(password);
      toast.success("Dashboard gate unlocked. Add the notification email to continue.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to unlock dashboard.");
    }
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveOwnerNotificationEmail(email);
      toast.success("Notification email saved. Dashboard unlocked.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save notification email.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,oklch(0.92_0.035_78),transparent_30%),linear-gradient(135deg,oklch(0.995_0.002_90),oklch(0.96_0.006_255))] px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/75 px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur-xl transition-colors hover:bg-card">
        <ArrowLeft className="size-4" /> Back to profile
      </Link>
      <main className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-4xl place-items-center py-10">
        <section className="w-full rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl sm:p-10">
          <p className="section-kicker"><LockKeyhole className="size-3.5" /> Hidden owner dashboard</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            {ownerGateUnlocked ? "Where should dashboard updates go?" : "Private dashboard password."}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            {ownerGateUnlocked
              ? "Add the email that should receive future lead, tour, document, and dashboard notifications."
              : "The dashboard is not exposed through a public realtor login. It opens only from the small profile icon and this private gate."}
          </p>

          {!ownerGateUnlocked ? (
            <form onSubmit={submitPassword} className="mt-7 space-y-5 rounded-[2rem] border border-border bg-secondary/60 p-5">
              <P label="Private password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, 8))}
                  className="ev-input text-center text-xl tracking-[0.45em]"
                  placeholder="••••••••"
                  maxLength={8}
                  autoComplete="one-time-code"
                />
              </P>
              <button type="submit" className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={submitEmail} className="mt-7 space-y-5 rounded-[2rem] border border-border bg-secondary/60 p-5">
              <P label="Dashboard notification email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ev-input" placeholder="owner@email.com" autoComplete="email" />
              </P>
              <button type="submit" className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
                Save Email & Open Dashboard
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

function Overview({ savedCount, jumpTo }: { savedCount: number; jumpTo: (tab: TabId) => void }) {
  const { leads, tourRequests, chatThreads, activeProperties, soldProperties, notifications, clearNotifications } = usePlatformData();
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const unread = chatThreads.reduce((total, thread) => total + thread.unread, 0);
  const cards = [
    { label: "Active Listings", value: activeProperties.length, icon: Building2, tab: "listings" as TabId },
    { label: "Sold Homes", value: soldProperties.length, icon: CheckCircle2, tab: "listings" as TabId },
    { label: "New Leads", value: leads.filter((l) => l.status === "New").length, icon: Users, tab: "leads" as TabId },
    { label: "Unread Chats", value: unread, icon: MessageCircle, tab: "chat" as TabId },
    { label: "Tour Requests", value: tourRequests.length, icon: CalendarClock, tab: "tours" as TabId },
    { label: "Saved by Members", value: savedCount, icon: Heart, tab: "overview" as TabId },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="section-kicker"><LayoutDashboard className="size-3.5" /> Live Command Center</p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Edits made here update the public profile, listings, member lead data, tour status, and chat threads immediately in this browser.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((s) => (
          <button key={s.label} onClick={() => jumpTo(s.tab)} className="rounded-3xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <s.icon className="size-5 text-accent-foreground" />
            <p className="mt-4 font-serif text-4xl">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      <section className={`rounded-[2rem] border bg-card p-6 shadow-sm transition-all ${updatesOpen ? "border-primary/35 ring-2 ring-primary/10" : "border-border"}`}>
        <button type="button" onClick={() => setUpdatesOpen((value) => !value)} className="flex w-full flex-col justify-between gap-3 text-left sm:flex-row sm:items-center">
          <div>
            <h3 className="font-serif text-2xl">Latest dashboard updates</h3>
            <p className="mt-1 text-sm text-muted-foreground">Open to review lead, tour, listing, profile, chat, document, and video activity.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{notifications.length} updates</span>
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">{updatesOpen ? "Close" : "Open"}</span>
          </div>
        </button>
        {updatesOpen && (
          <div className="mt-5 border-t border-border pt-5">
            {notifications.length > 0 && (
              <div className="mb-4 flex justify-end">
                <button onClick={() => { clearNotifications(); toast.success("Dashboard updates cleared."); }} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-semibold shadow-sm hover:bg-secondary">
                  <X className="size-4" /> Clear updates
                </button>
              </div>
            )}
            <div className="grid gap-3 lg:grid-cols-2">
              {(notifications.length ? notifications : [{ id: "empty", title: "Ready for live updates", body: "New member actions and owner edits will appear here.", createdAt: "" }]).slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl bg-secondary p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const emptyListingForm = {
  title: "",
  address: "",
  city: "Atlanta",
  state: "GA",
  zip: "",
  price: "1250000",
  beds: "3",
  baths: "2",
  sqft: "1800",
  type: "House" as PropertyType,
  status: "active" as PropertyStatus,
  badges: "Active",
  amenities: [] as string[],
  description: "",
  soldPrice: "",
  represented: "Seller" as "Buyer" | "Seller",
  soldDate: "",
  mapLat: "",
  mapLng: "",
  mapLocked: false as boolean,
  mapDisplayName: "",
};

type ListingForm = typeof emptyListingForm;

type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

function normalizeGeorgiaState(value: string) {
  const cleaned = value.trim().toUpperCase();
  return cleaned === "GEORGIA" ? "GA" : cleaned || "GA";
}

function normalizedZip(value: string) {
  return value.replace(/[^0-9-]/g, "").slice(0, 10);
}

function cityStateZip(form: ListingForm) {
  const city = form.city.trim();
  const state = normalizeGeorgiaState(form.state);
  const zip = normalizedZip(form.zip);
  if (!city) return [state, zip].filter(Boolean).join(" ").trim();
  return `${city}, ${[state, zip].filter(Boolean).join(" ").trim()}`.trim();
}

function fullAddress(form: ListingForm) {
  const base = [form.address.trim(), cityStateZip(form)].filter(Boolean).join(", ");
  if (!base) return "";
  return `${base}, USA`;
}

function shortAddress(form: ListingForm) {
  return [form.address.trim(), cityStateZip(form)].filter(Boolean).join(", ");
}

function hasLockedMap(form: ListingForm) {
  return form.mapLocked && Boolean(form.mapLat) && Boolean(form.mapLng);
}

type NominatimPlace = {
  lat: string;
  lon: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

type GeocodeAttempt = {
  url: string;
  label: string;
};

const georgiaCityFallbacks: Array<{ terms: string[]; lat: number; lng: number; label: string }> = [
  { terms: ["atlanta", "303"], lat: 33.7488, lng: -84.3877, label: "Atlanta, GA" },
  { terms: ["decatur", "30030", "30032", "30033"], lat: 33.7748, lng: -84.2963, label: "Decatur, GA" },
  { terms: ["marietta", "30060", "30062", "30064", "30066", "30067", "30068"], lat: 33.9526, lng: -84.5499, label: "Marietta, GA" },
  { terms: ["sandy springs", "30328", "30342", "30350"], lat: 33.9304, lng: -84.3733, label: "Sandy Springs, GA" },
  { terms: ["alpharetta", "30004", "30005", "30009", "30022"], lat: 34.0754, lng: -84.2941, label: "Alpharetta, GA" },
  { terms: ["roswell", "30075", "30076"], lat: 34.0232, lng: -84.3616, label: "Roswell, GA" },
  { terms: ["johns creek", "30097", "30022", "30024"], lat: 34.0289, lng: -84.1986, label: "Johns Creek, GA" },
  { terms: ["duluth", "30096", "30097"], lat: 34.0029, lng: -84.1446, label: "Duluth, GA" },
  { terms: ["lawrenceville", "30043", "30044", "30045", "30046"], lat: 33.9562, lng: -83.9879, label: "Lawrenceville, GA" },
  { terms: ["stone mountain", "30083", "30087", "30088"], lat: 33.8082, lng: -84.1702, label: "Stone Mountain, GA" },
  { terms: ["savannah", "314"], lat: 32.0809, lng: -81.0912, label: "Savannah, GA" },
  { terms: ["augusta", "309"], lat: 33.4735, lng: -82.0105, label: "Augusta, GA" },
  { terms: ["columbus", "319"], lat: 32.4610, lng: -84.9877, label: "Columbus, GA" },
  { terms: ["macon", "312"], lat: 32.8407, lng: -83.6324, label: "Macon, GA" },
  { terms: ["athens", "306"], lat: 33.9519, lng: -83.3576, label: "Athens, GA" },
];

function parseStoredCity(value: string) {
  const match = value.match(/^\s*([^,]+?)(?:,\s*([A-Za-z]{2}|Georgia))?(?:\s+(\d{5}(?:-\d{4})?))?\s*$/);
  if (!match) {
    return {
      city: value.replace(/\b(GA|Georgia|CA|California|USA|United States)\b/gi, "").replace(/\d{5}(?:-\d{4})?/g, "").replace(/[,]+/g, " ").replace(/\s+/g, " ").trim(),
      state: "GA",
      zip: "",
    };
  }
  return {
    city: (match[1] || "").trim(),
    state: normalizeGeorgiaState(match[2] || "GA"),
    zip: normalizedZip(match[3] || ""),
  };
}

function georgiaFallbackForAddress(address: string): GeocodeResult | null {
  const haystack = address.toLowerCase();
  const match = georgiaCityFallbacks.find((entry) => entry.terms.some((term) => haystack.includes(term)));
  if (!match) return null;
  return {
    lat: match.lat,
    lng: match.lng,
    displayName: `Approximate Georgia map match: ${match.label}. Re-check the street address before publishing if exact placement matters.`,
  };
}

async function getNominatimResults(attempt: GeocodeAttempt): Promise<NominatimPlace[]> {
  const response = await fetch(attempt.url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${attempt.label} is unavailable right now.`);
  }

  return (await response.json()) as NominatimPlace[];
}

function bestGeorgiaPlace(results: NominatimPlace[]) {
  return (
    results.find((place) => /\bGeorgia\b/i.test(place.address?.state || "")) ||
    results.find((place) => /\bGeorgia\b/i.test(place.display_name || "")) ||
    results[0]
  );
}

function resultFromPlace(place: NominatimPlace, requestedAddress: string): GeocodeResult {
  const lat = Number(place.lat);
  const lng = Number(place.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("The map service returned an unreadable location. Try a more complete Georgia address.");
  }

  return { lat, lng, displayName: place.display_name || requestedAddress };
}

async function geocodeListingAddress(input: ListingForm | string): Promise<GeocodeResult> {
  const requestedAddress = typeof input === "string" ? input.trim() : fullAddress(input);
  const displayAddress = typeof input === "string" ? input.trim() : shortAddress(input);
  const street = typeof input === "string" ? "" : input.address.trim();
  const city = typeof input === "string" ? "" : input.city.trim();
  const state = typeof input === "string" ? "GA" : normalizeGeorgiaState(input.state);
  const zip = typeof input === "string" ? "" : normalizedZip(input.zip);

  if (!requestedAddress.trim()) {
    throw new Error("Enter a Georgia street address first.");
  }

  if (typeof input !== "string" && (!street || !city || !zip)) {
    throw new Error("Add street address, city, state, and ZIP before verifying the map.");
  }

  if (state !== "GA") {
    throw new Error("This demo is Georgia-based. Set the state to GA before verifying the map.");
  }

  const baseParams = "format=json&limit=5&addressdetails=1&countrycodes=us&viewbox=-85.6052,35.0007,-80.7514,30.3571&bounded=1";
  const attempts: GeocodeAttempt[] = [];

  if (street || city || zip) {
    attempts.push({
      label: "Structured Georgia address lookup",
      url: `https://nominatim.openstreetmap.org/search?${baseParams}&street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=Georgia&postalcode=${encodeURIComponent(zip)}&country=USA`,
    });
  }

  attempts.push(
    {
      label: "Georgia map lookup",
      url: `https://nominatim.openstreetmap.org/search?${baseParams}&q=${encodeURIComponent(requestedAddress)}`,
    },
    {
      label: "ZIP-level Georgia lookup",
      url: `https://nominatim.openstreetmap.org/search?${baseParams}&postalcode=${encodeURIComponent(zip)}&state=Georgia&country=USA`,
    },
    {
      label: "City-level Georgia lookup",
      url: `https://nominatim.openstreetmap.org/search?${baseParams}&city=${encodeURIComponent(city)}&state=Georgia&country=USA`,
    },
    {
      label: "Expanded Georgia map lookup",
      url: `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&countrycodes=us&q=${encodeURIComponent(requestedAddress)}`,
    },
  );

  let lastUnavailableError: Error | null = null;

  for (const attempt of attempts) {
    try {
      const results = await getNominatimResults(attempt);
      const place = bestGeorgiaPlace(results);
      if (place) return resultFromPlace(place, requestedAddress);
    } catch (error) {
      lastUnavailableError = error instanceof Error ? error : new Error("Map lookup failed.");
    }
  }

  const fallback = georgiaFallbackForAddress(`${displayAddress} ${requestedAddress}`);
  if (fallback) return fallback;

  if (lastUnavailableError) {
    throw new Error("Map lookup is unavailable right now. Try again in a moment or check your connection.");
  }

  throw new Error("No Georgia map location was found. Check the street address, city, state, and ZIP code, then try again.");
}

function mapPreviewSrc(lat: string | number, lng: string | number) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";
  return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.012}%2C${latitude - 0.008}%2C${longitude + 0.012}%2C${latitude + 0.008}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

function formFromProperty(property: Property): ListingForm {
  const parsed = parseStoredCity(property.city);
  return {
    title: property.title,
    address: property.address,
    city: parsed.city,
    state: parsed.state,
    zip: parsed.zip,
    price: String(property.price),
    beds: String(property.beds),
    baths: String(property.baths),
    sqft: String(property.sqft),
    type: property.type,
    status: property.status,
    badges: property.badges.filter((badge) => !(listingAmenityOptions as readonly string[]).includes(badge)).join(", "),
    amenities: property.badges.filter((badge) => (listingAmenityOptions as readonly string[]).includes(badge)),
    description: property.description,
    soldPrice: property.soldPrice ? String(property.soldPrice) : "",
    represented: property.represented || "Seller",
    soldDate: property.soldDate || "",
    mapLat: String(property.lat),
    mapLng: String(property.lng),
    mapLocked: Number.isFinite(property.lat) && Number.isFinite(property.lng),
    mapDisplayName: `${property.address}, ${property.city}`,
  };
}

function draftFromForm(form: ListingForm, existing?: Property): ListingDraft {
  return {
    title: form.title,
    address: form.address,
    city: cityStateZip(form),
    price: Number(form.price) || 0,
    beds: Number(form.beds) || 0,
    baths: Number(form.baths) || 0,
    sqft: Number(form.sqft) || 0,
    type: form.type,
    status: form.status,
    badges: uniqueListingTags([...parseListingTags(form.badges), ...(form.amenities || [])]),
    description: form.description,
    photos: existing?.photos,
    lat: hasLockedMap(form) ? Number(form.mapLat) : existing?.lat,
    lng: hasLockedMap(form) ? Number(form.mapLng) : existing?.lng,
    soldPrice: form.status === "sold" && form.soldPrice ? Number(form.soldPrice) : undefined,
    represented: form.status === "sold" ? form.represented : undefined,
    soldDate: form.status === "sold" ? form.soldDate : undefined,
  };
}

function Listings() {
  const { dashboardListings, addDashboardListing, updateDashboardListing, deleteDashboardListing } = usePlatformData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ListingForm>(emptyListingForm);
  const [isVerifyingMap, setIsVerifyingMap] = useState(false);
  const editing = dashboardListings.find((property) => property.id === editingId);
  const set = <K extends keyof ListingForm>(key: K, value: ListingForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const setAddressPart = (key: "address" | "city" | "state" | "zip", value: string) => {
    setForm((current) => ({
      ...current,
      [key]: key === "state" ? normalizeGeorgiaState(value) : key === "zip" ? normalizedZip(value) : value,
      mapLat: "",
      mapLng: "",
      mapLocked: false as boolean,
      mapDisplayName: "",
    }));
  };
  const lockMapLocation = async (input: ListingForm = form) => {
    setIsVerifyingMap(true);
    try {
      const result = await geocodeListingAddress(input);
      const nextForm = {
        ...input,
        mapLat: String(result.lat),
        mapLng: String(result.lng),
        mapLocked: true,
        mapDisplayName: result.displayName,
      };
      setForm(nextForm);
      if (result.displayName.startsWith("Approximate Georgia map match")) {
        toast.warning("Exact street match was not found. A Georgia city-level map location was prepared for review.");
      } else {
        toast.success("Map location locked to the verified Georgia address.");
      }
      return nextForm;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify the map location.");
      return null;
    } finally {
      setIsVerifyingMap(false);
    }
  };
  const previewSrc = hasLockedMap(form) ? mapPreviewSrc(form.mapLat, form.mapLng) : "";

  const beginAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyListingForm,
      title: "",
      address: "",
      city: "",
      state: "GA",
      zip: "",
      price: "",
      beds: "",
      baths: "",
      sqft: "",
      type: "House",
      status: "active",
      badges: "Active",
      amenities: [],
      description: "",
      mapLat: "",
      mapLng: "",
      mapLocked: false,
      mapDisplayName: "",
    });
    setShowForm(true);
  };

  const beginEdit = (property: Property) => {
    setEditingId(property.id);
    setForm(formFromProperty(property));
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim() || !form.zip.trim()) {
      toast.error("Add a title, street address, city, state, and ZIP before saving.");
      return;
    }

    const lockedForm = hasLockedMap(form) ? form : await lockMapLocation(form);
    if (!lockedForm) return;

    if (editingId && editing) {
      updateDashboardListing(editingId, draftFromForm(lockedForm, editing));
      toast.success("Listing updated across the public site with a locked map location.");
    } else {
      addDashboardListing(draftFromForm(lockedForm));
      toast.success("Listing added to the public site with a locked map location.");
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyListingForm);
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-col justify-between gap-3 rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <p className="section-kicker"><Building2 className="size-3.5" /> Editable Listings</p>
          <h2 className="mt-2 font-serif text-3xl">Public property inventory</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add, edit, mark sold, or remove listings. Changes appear on the website immediately.</p>
        </div>
        <button type="button" onClick={beginAdd} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground">
          <Plus className="size-4" /> Add listing
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-2xl">{editingId ? "Edit listing" : "Add new listing"}</h3>
              <p className="text-sm text-muted-foreground">Photos use the current sample gallery until real storage is connected.</p>
            </div>
            <button type="button" onClick={() => setShowForm(false)} className="grid size-10 place-items-center rounded-full border border-border"><X className="size-4" /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="sm:col-span-2 xl:col-span-2"><P label="Title"><input value={form.title} onChange={(e) => set("title", e.target.value)} className="ev-input" /></P></div>
            <div className="sm:col-span-2 xl:col-span-2"><P label="Street address"><input value={form.address} onChange={(e) => setAddressPart("address", e.target.value)} className="ev-input" placeholder="123 Peachtree St NE" /></P></div>
            <P label="City"><input value={form.city} onChange={(e) => setAddressPart("city", e.target.value)} className="ev-input" placeholder="Atlanta" /></P>
            <P label="State"><select value={form.state} onChange={(e) => setAddressPart("state", e.target.value)} className="ev-input"><option value="GA">GA</option></select></P>
            <P label="ZIP code"><input value={form.zip} onChange={(e) => setAddressPart("zip", e.target.value)} className="ev-input" placeholder="30303" inputMode="numeric" /></P>
            <P label="Price"><input value={form.price} onChange={(e) => set("price", e.target.value)} className="ev-input" inputMode="numeric" /></P>
            <P label="Beds"><input value={form.beds} onChange={(e) => set("beds", e.target.value)} className="ev-input" inputMode="numeric" /></P>
            <P label="Baths"><input value={form.baths} onChange={(e) => set("baths", e.target.value)} className="ev-input" inputMode="numeric" /></P>
            <P label="Sq Ft"><input value={form.sqft} onChange={(e) => set("sqft", e.target.value)} className="ev-input" inputMode="numeric" /></P>
            <P label="Type"><select value={form.type} onChange={(e) => set("type", e.target.value as PropertyType)} className="ev-input"><option>House</option></select></P>
            <P label="Status"><select value={form.status} onChange={(e) => set("status", e.target.value as PropertyStatus)} className="ev-input"><option value="active">Active</option><option value="sold">Sold</option></select></P>
            <P label="Badges"><input value={form.badges} onChange={(e) => set("badges", e.target.value)} className="ev-input" placeholder="Active, Open House, New Listing" /></P>
            <details className="lg:col-span-2 rounded-3xl border border-border bg-secondary/40 p-4">
              <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Amenities {(form.amenities || []).length > 0 ? `(${(form.amenities || []).length})` : ""}
              </summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {listingAmenityOptions.map((amenity) => {
                  const active = (form.amenities || []).includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          amenities: active
                            ? current.amenities.filter((item) => item !== amenity)
                            : [...current.amenities, amenity],
                        }))
                      }
                      className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </details>
            {form.status === "sold" && <P label="Sold Price"><input value={form.soldPrice} onChange={(e) => set("soldPrice", e.target.value)} className="ev-input" inputMode="numeric" /></P>}
            {form.status === "sold" && <P label="Represented"><select value={form.represented} onChange={(e) => set("represented", e.target.value as "Buyer" | "Seller")} className="ev-input"><option>Seller</option><option>Buyer</option></select></P>}
            {form.status === "sold" && <P label="Sold Date"><input value={form.soldDate} onChange={(e) => set("soldDate", e.target.value)} className="ev-input" placeholder="Jun 2026" /></P>}
          </div>
          <div className="mt-4"><P label="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className="ev-input resize-none" /></P></div>

          <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-border bg-secondary/35">
            <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="section-kicker"><MapPin className="size-3.5" /> Address Verification / Map Lock</p>
                <h4 className="mt-2 font-serif text-2xl">{hasLockedMap(form) ? "Map location locked" : "Verify map before publishing"}</h4>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {hasLockedMap(form)
                    ? form.mapDisplayName || fullAddress(form)
                    : "Homes are Georgia-based by default. Add street address, city, state, and ZIP so the property page map can lock to the best available GPS result."}
                </p>
                {hasLockedMap(form) && (
                  <p className="mt-2 text-xs font-semibold text-primary">Lat {Number(form.mapLat).toFixed(5)} · Lng {Number(form.mapLng).toFixed(5)}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => lockMapLocation()}
                disabled={isVerifyingMap}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-card px-5 py-4 text-sm font-semibold text-primary shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`size-4 ${isVerifyingMap ? "animate-spin" : ""}`} />
                {isVerifyingMap ? "Verifying…" : hasLockedMap(form) ? "Re-verify location" : "Verify map location"}
              </button>
            </div>
            {previewSrc ? (
              <iframe title="Verified listing map preview" src={previewSrc} loading="lazy" className="h-64 w-full border-t border-border" />
            ) : (
              <div className="border-t border-border p-5 text-sm text-muted-foreground">No map preview yet. Enter a Georgia address, then select Verify map location.</div>
            )}
          </div>

          <button type="submit" disabled={isVerifyingMap} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"><Save className="size-4" /> {hasLockedMap(form) ? "Save listing" : "Verify map & save listing"}</button>
        </form>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {dashboardListings.map((p) => (
          <div key={p.id} className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <img src={p.photos[0]} alt={p.title} width={84} height={84} className="size-20 shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{shortPrice(p.price)} · {p.beds}bd · {p.baths}ba · {p.status === "sold" ? "Sold" : "Active"}</p>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">{p.address}, {p.city}</p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary"><MapPin className="size-3" /> Map locked</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Link to="/property/$id" params={{ id: p.id }} className="rounded-2xl border border-border py-3 text-center text-xs font-semibold hover:bg-secondary">View</Link>
              <button onClick={() => beginEdit(p)} className="inline-flex items-center justify-center gap-1 rounded-2xl border border-border py-3 text-xs font-semibold hover:bg-secondary"><Edit3 className="size-3.5" /> Edit</button>
              <button onClick={() => { if (confirm(`Remove ${p.title}?`)) { deleteDashboardListing(p.id); toast.success("Listing removed."); } }} className="inline-flex items-center justify-center gap-1 rounded-2xl border border-destructive/30 py-3 text-xs font-semibold text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /> Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const leadColors: Record<Lead["status"], string> = {
  New: "bg-accent text-accent-foreground",
  Contacted: "bg-secondary text-foreground",
  Touring: "bg-primary text-primary-foreground",
  Closed: "bg-secondary text-muted-foreground",
};

function Leads() {
  const { leads, updateLeadStatus, updateLeadVerification, deleteLead } = usePlatformData();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLeadId && !leads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(null);
    }
  }, [leads, selectedLeadId]);

  return (
    <div className="space-y-5 animate-fade-up">
      <Header kicker="Member Pipeline" title="Editable leads" text="Select one member at a time to update status, review verification, or remove the lead." icon={Users} />
      <div className="grid gap-3">
        {leads.map((l) => {
          const isOpen = selectedLeadId === l.id;
          return (
            <article key={l.id} className={`overflow-hidden rounded-3xl border bg-card shadow-sm transition-all ${isOpen ? "border-primary/35 ring-2 ring-primary/10" : "border-border"}`}>
              <button type="button" onClick={() => setSelectedLeadId(isOpen ? null : l.id)} className="flex w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-secondary/70 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{l.name}</p>
                    <VerificationBadge status={l.verificationStatus || "unverified"} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{l.email} · {l.phone}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${leadColors[l.status]}`}>{l.status}</span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{l.budget}</span>
                  <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">{isOpen ? "Close" : "Open"}</span>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-border p-5">
                  <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                    <Meta label="Timeline" value={l.timeline} />
                    <Meta label="Budget" value={l.budget} />
                    <Meta label="Source" value={l.source || "Website"} />
                    <Meta label="Created" value={l.createdAt} />
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">Interested in <span className="font-medium text-foreground">{l.interest}</span></p>
                  {l.note ? (
                    <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Lead note</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{l.note}</p>
                    </div>
                  ) : null}
                  <div className="mt-4 rounded-2xl bg-secondary p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Client verification</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {l.verificationStatus === "verified" ? "Verified client — ready for higher-trust documents, tour follow-up, and owner priority." : l.verificationStatus === "pending" ? `Pending owner review${l.verificationMethod ? ` · ${l.verificationMethod}` : ""}.` : "Unverified client — treat as a new inquiry until ID photos are reviewed."}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <button type="button" onClick={() => { updateLeadVerification(l.id, "verified"); toast.success(`${l.name} marked verified.`); }} className="rounded-2xl bg-green-100 px-3 py-2 text-xs font-bold text-green-800">Verify</button>
                      <button type="button" onClick={() => { updateLeadVerification(l.id, "pending"); toast.success(`${l.name} marked pending.`); }} className="rounded-2xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800">Pending</button>
                      <button type="button" onClick={() => { updateLeadVerification(l.id, "unverified"); toast.success(`${l.name} marked unverified.`); }} className="rounded-2xl bg-card px-3 py-2 text-xs font-bold text-muted-foreground">Unverified</button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <select value={l.status} onChange={(e) => updateLeadStatus(l.id, e.target.value as Lead["status"])} className="ev-input">
                      <option>New</option><option>Contacted</option><option>Touring</option><option>Closed</option>
                    </select>
                    <button onClick={() => { deleteLead(l.id); toast.success("Lead removed."); }} className="grid size-12 place-items-center rounded-2xl border border-destructive/30 text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ClientVerification() {
  const { leads, updateLeadVerification } = usePlatformData();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const verified = leads.filter((lead) => lead.verificationStatus === "verified").length;
  const pending = leads.filter((lead) => lead.verificationStatus === "pending").length;
  const unverified = leads.length - verified - pending;

  useEffect(() => {
    if (selectedLeadId && !leads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(null);
    }
  }, [leads, selectedLeadId]);

  return (
    <div className="space-y-5 animate-fade-up">
      <Header kicker="Client Identity" title="Client ID verification" text="Review one member at a time. Select a client card to open the ID photo review and verification controls." icon={ShieldCheck} />
      <div className="grid gap-4 sm:grid-cols-3">
        <button type="button" onClick={() => setSelectedLeadId(leads.find((lead) => lead.verificationStatus === "verified")?.id ?? null)} className="rounded-3xl border border-border bg-card p-5 text-left shadow-sm hover:bg-secondary"><p className="font-serif text-4xl">{verified}</p><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Verified</p></button>
        <button type="button" onClick={() => setSelectedLeadId(leads.find((lead) => lead.verificationStatus === "pending")?.id ?? null)} className="rounded-3xl border border-border bg-card p-5 text-left shadow-sm hover:bg-secondary"><p className="font-serif text-4xl">{pending}</p><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Pending</p></button>
        <button type="button" onClick={() => setSelectedLeadId(leads.find((lead) => !lead.verificationStatus || lead.verificationStatus === "unverified")?.id ?? null)} className="rounded-3xl border border-border bg-card p-5 text-left shadow-sm hover:bg-secondary"><p className="font-serif text-4xl">{unverified}</p><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Unverified</p></button>
      </div>

      <details className="group rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-6">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
          <div>
            <p className="section-kicker"><ShieldAlert className="size-3.5" /> Verification method</p>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl">Prototype verification rules</h2>
            <p className="mt-1 text-sm text-muted-foreground">Open this panel to review the verification rules.</p>
          </div>
          <span className="rounded-full bg-secondary px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground group-open:hidden">Open</span>
          <span className="hidden rounded-full bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-foreground group-open:inline-flex">Close</span>
        </summary>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl bg-secondary p-5"><p className="text-sm font-semibold">1. Government ID only</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Identity verification uses one allowed method: Government ID.</p></div>
          <div className="rounded-3xl bg-secondary p-5"><p className="text-sm font-semibold">2. Three live captures</p><p className="mt-2 text-xs leading-5 text-muted-foreground">The member captures the front of ID, back of ID, and a forward-facing face picture from the live camera.</p></div>
          <div className="rounded-3xl bg-secondary p-5"><p className="text-sm font-semibold">3. Owner reviews</p><p className="mt-2 text-xs leading-5 text-muted-foreground">The owner reviews the camera set, then marks the client verified, pending, or unverified.</p></div>
        </div>
      </details>

      <div className="grid gap-3">
        {leads.map((lead) => {
          const isOpen = selectedLeadId === lead.id;
          const photoCount = lead.verificationDocumentCount ?? Object.values(lead.verificationDocuments || {}).filter(Boolean).length;
          return (
            <article key={lead.id} className={`overflow-hidden rounded-3xl border bg-card shadow-sm transition-all ${isOpen ? "border-primary/35 ring-2 ring-primary/10" : "border-border"}`}>
              <button type="button" onClick={() => setSelectedLeadId(isOpen ? null : lead.id)} className="flex w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-secondary/70 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{lead.name}</p>
                    <VerificationBadge status={lead.verificationStatus || "unverified"} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{lead.email} · {lead.phone}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{photoCount ? `${photoCount}/3 photos` : "No photos"}</span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{lead.interest}</span>
                  <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">{isOpen ? "Close" : "Review"}</span>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-border p-5">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Meta label="Method" value={lead.verificationMethod || "Not submitted"} />
                    <Meta label="Submitted" value={lead.verificationSubmittedAt || "Not submitted"} />
                    <Meta label="Photo set" value={photoCount ? `${photoCount}/3 live photos` : "Not submitted"} />
                    <Meta label="Capture rule" value={lead.verificationCaptureMethod || "Camera capture required"} />
                  </div>
                  <VerificationPhotoSet photos={lead.verificationDocuments} clientName={lead.name} />
                  <p className="mt-4 rounded-2xl bg-secondary p-4 text-xs leading-5 text-muted-foreground">{lead.verificationNote || "No verification note yet."}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <button type="button" onClick={() => { updateLeadVerification(lead.id, "verified"); toast.success(`${lead.name} marked verified.`); }} className="rounded-2xl bg-green-100 px-3 py-3 text-xs font-bold text-green-800">Mark Verified</button>
                    <button type="button" onClick={() => { updateLeadVerification(lead.id, "pending"); toast.success(`${lead.name} marked pending.`); }} className="rounded-2xl bg-amber-100 px-3 py-3 text-xs font-bold text-amber-800">Mark Pending</button>
                    <button type="button" onClick={() => { updateLeadVerification(lead.id, "unverified"); toast.success(`${lead.name} marked unverified.`); }} className="rounded-2xl border border-border bg-card px-3 py-3 text-xs font-bold text-muted-foreground">Mark Unverified</button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function VerificationPhotoSet({ photos, clientName }: { photos?: Record<string, string>; clientName?: string }) {
  const [viewer, setViewer] = useState<{ label: string; photo: string } | null>(null);
  const items = [
    ["frontId", "Front ID"],
    ["backId", "Back ID"],
    ["facePhoto", "Face photo"],
  ] as const;

  const cleanClientName = (clientName || "client").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const downloadPhoto = (photo: string, label: string) => {
    const link = document.createElement("a");
    link.href = photo;
    link.download = `${cleanClientName}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-verification.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!photos || !items.some(([key]) => Boolean(photos[key]))) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border bg-secondary p-4 text-xs leading-5 text-muted-foreground">
        No live camera photo set submitted yet.
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map(([key, label]) => {
          const photo = photos[key];
          return (
            <div key={key} className="overflow-hidden rounded-2xl border border-border bg-secondary">
              {photo ? (
                <button type="button" onClick={() => setViewer({ label, photo })} className="group relative block w-full overflow-hidden text-left" aria-label={`Open ${label} verification photo`}>
                  <img src={photo} alt={`${label} verification preview`} className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute inset-0 grid place-items-center bg-primary/0 text-primary-foreground transition-colors group-hover:bg-primary/35">
                    <span className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                      <Maximize2 className="size-3" /> Open
                    </span>
                  </span>
                </button>
              ) : (
                <div className="grid h-28 place-items-center px-3 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Missing</div>
              )}
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                {photo && (
                  <button
                    type="button"
                    onClick={() => downloadPhoto(photo, label)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    aria-label={`Download ${label} verification photo`}
                  >
                    <Download className="size-3" /> Download
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {viewer && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-primary/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${viewer.label} verification photo viewer`}>
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-card shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Client verification photo</p>
                <h3 className="font-serif text-2xl">{viewer.label}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => downloadPhoto(viewer.photo, viewer.label)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
                  <Download className="size-4" /> Download
                </button>
                <button type="button" onClick={() => setViewer(null)} className="grid size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary" aria-label="Close photo viewer">
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[76vh] overflow-auto bg-secondary/50 p-3 sm:p-5">
              <img src={viewer.photo} alt={`${viewer.label} verification full size`} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-sm" />
            </div>
            <div className="border-t border-border px-4 py-3 text-xs leading-5 text-muted-foreground sm:px-5">
              Opened individually for owner review. Download the image if it needs to be printed or stored with offline transaction notes.
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function Tours() {
  const {
    activeProperties,
    propertyVideoTours,
    propertyVideoTourViews,
    propertyVideoTourComments,
    upsertPropertyVideoTour,
    removePropertyVideoTour,
  } = usePlatformData();

  const [selectedPropertyId, setSelectedPropertyId] = useState(activeProperties[0]?.id || "");
  const selectedProperty = activeProperties.find((property) => property.id === selectedPropertyId) || activeProperties[0];
  const currentVideo = selectedProperty ? propertyVideoTours.find((tour) => tour.propertyId === selectedProperty.id) : undefined;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (!selectedPropertyId && activeProperties[0]) {
      setSelectedPropertyId(activeProperties[0].id);
    }

    if (selectedPropertyId && !activeProperties.some((property) => property.id === selectedPropertyId)) {
      setSelectedPropertyId(activeProperties[0]?.id || "");
    }
  }, [activeProperties, selectedPropertyId]);

  useEffect(() => {
    if (!selectedProperty) return;

    const video = propertyVideoTours.find((tour) => tour.propertyId === selectedProperty.id);

    setTitle(video?.title || `${selectedProperty.title} Property Video`);
    setDescription(video?.description || "Owner-recorded walkthrough for this property.");
    setVideoUrl(video?.videoUrl || "");
    setPosterUrl(video?.posterUrl || "");
    setIsEnabled(video?.isEnabled ?? true);
  }, [propertyVideoTours, selectedProperty]);

  const selectedImage =
    selectedProperty?.image ||
    selectedProperty?.gallery?.[0] ||
    selectedProperty?.photos?.[0] ||
    "/placeholder-property.jpg";

  const selectedViews = currentVideo
    ? propertyVideoTourViews.filter((view) => view.videoTourId === currentVideo.id)
    : [];

  const selectedComments = currentVideo
    ? propertyVideoTourComments.filter((comment) => comment.videoTourId === currentVideo.id)
    : [];

  const totalViews = selectedViews.reduce((sum, view) => sum + view.viewCount, 0);
  const totalLikes = selectedComments.filter((comment) => comment.liked).length;
  const writtenComments = selectedComments.filter((comment) => comment.comment.trim());

  const saveVideo = () => {
    if (!selectedProperty) {
      toast.error("Choose a property first.");
      return;
    }

    if (!videoUrl.trim()) {
      toast.error("Add a video URL before saving.");
      return;
    }

    upsertPropertyVideoTour({
      propertyId: selectedProperty.id,
      title,
      description,
      videoUrl,
      posterUrl,
      isEnabled,
    });

    toast.success("Property video saved.");
  };

  const deleteVideo = () => {
    if (!selectedProperty || !currentVideo) {
      toast.error("No video exists for this property yet.");
      return;
    }

    removePropertyVideoTour(selectedProperty.id);
    toast.success("Property video removed.");
  };

  const toggleLock = () => {
    if (!selectedProperty || !currentVideo) {
      toast.error("Save a video before changing lock status.");
      return;
    }

    upsertPropertyVideoTour({
      propertyId: selectedProperty.id,
      title: currentVideo.title,
      description: currentVideo.description,
      videoUrl: currentVideo.videoUrl,
      posterUrl: currentVideo.posterUrl,
      isEnabled: !currentVideo.isEnabled,
      chapters: currentVideo.chapters,
    });

    toast.success(currentVideo.isEnabled ? "Property video locked." : "Property video unlocked.");
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <Header
        kicker="Property Video Manager"
        title="Add, remove, lock, and review property videos"
        text="Attach one owner-recorded video to each property. Clients must log in to view, like, comment, and create view history."
        icon={CalendarClock}
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-3">
          <h3 className="font-serif text-2xl">Properties</h3>

          {activeProperties.map((property) => {
            const image =
              property.image ||
              property.gallery?.[0] ||
              property.photos?.[0] ||
              "/placeholder-property.jpg";

            const video = propertyVideoTours.find((tour) => tour.propertyId === property.id);
            const views = video
              ? propertyVideoTourViews
                  .filter((view) => view.videoTourId === video.id)
                  .reduce((sum, view) => sum + view.viewCount, 0)
              : 0;

            const isSelected = selectedProperty?.id === property.id;

            return (
              <button
                key={property.id}
                type="button"
                onClick={() => setSelectedPropertyId(property.id)}
                className={`w-full overflow-hidden rounded-3xl border bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected ? "border-primary ring-2 ring-primary/10" : "border-border"
                }`}
              >
                <div className="grid sm:grid-cols-[140px_1fr]">
                  <img src={image} alt={property.title} className="h-36 w-full object-cover sm:h-full" />
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Property video</p>
                    <h4 className="mt-1 font-serif text-xl">{property.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {property.city} · {property.beds} bd · {property.baths} ba
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        video?.isEnabled ? "bg-green-100 text-green-800" : video ? "bg-slate-900 text-white" : "bg-secondary text-muted-foreground"
                      }`}>
                        {video?.isEnabled ? "Unlocked" : video ? "Locked" : "No video"}
                      </span>
                      <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {views} view{views === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          {selectedProperty ? (
            <>
              <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                <div className="grid sm:grid-cols-[220px_1fr]">
                  <img src={selectedImage} alt={selectedProperty.title} className="h-56 w-full object-cover sm:h-full" />
                  <div className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Selected property</p>
                    <h3 className="mt-2 font-serif text-3xl">{selectedProperty.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {selectedProperty.address} · {selectedProperty.city}
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-4">
                      <StatPill label="Status" value={currentVideo?.isEnabled ? 1 : 0} />
                      <StatPill label="Views" value={totalViews} />
                      <StatPill label="Likes" value={totalLikes} />
                      <StatPill label="Comments" value={writtenComments.length} />
                    </div>

                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      Status value shows <strong>1</strong> when unlocked and <strong>0</strong> when locked or missing.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Owner controls</p>
                    <h3 className="mt-1 font-serif text-2xl">Add or update property video</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This powers the locked video section on the public property page.
                  </p>
                </div>

                <div className="mt-5 grid gap-4">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Video title</span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder={`${selectedProperty.title} Property Video`}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Video URL</span>
                    <input
                      value={videoUrl}
                      onChange={(event) => setVideoUrl(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="Paste MP4, WebM, YouTube, Vimeo, Drive, or hosted video link"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Poster image URL</span>
                    <input
                      value={posterUrl}
                      onChange={(event) => setPosterUrl(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="Optional preview image"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Description</span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="Owner-recorded walkthrough for this property."
                    />
                  </label>

                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-3">
                    <span>
                      <span className="block text-sm font-bold">Unlocked for logged-in clients</span>
                      <span className="block text-xs text-muted-foreground">Turn off to hide/lock the video without deleting it.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(event) => setIsEnabled(event.target.checked)}
                      className="size-5 accent-current"
                    />
                  </label>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={saveVideo}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-primary-foreground"
                    >
                      <Save className="size-4" /> Save Video
                    </button>

                    <button
                      type="button"
                      onClick={toggleLock}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary px-4 py-4 text-sm font-bold"
                    >
                      <LockKeyhole className="size-4" /> {currentVideo?.isEnabled ? "Lock Video" : "Unlock Video"}
                    </button>

                    <button
                      type="button"
                      onClick={deleteVideo}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-card px-4 py-4 text-sm font-bold text-destructive"
                    >
                      <Trash2 className="size-4" /> Remove Video
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Client activity</p>
                    <h3 className="mt-1 font-serif text-2xl">Views, likes, and comments</h3>
                  </div>
                  <Link
                    to="/property/$id"
                    params={{ id: selectedProperty.id }}
                    className="rounded-full border border-border bg-secondary px-4 py-2 text-xs font-bold"
                  >
                    Open Property Page
                  </Link>
                </div>

                <div className="mt-4 grid gap-3">
                  {selectedViews.length ? selectedViews.map((view) => {
                    const feedback = selectedComments.find((comment) =>
                      (view.clientId && comment.clientId === view.clientId) ||
                      comment.clientEmail.toLowerCase() === view.clientEmail.toLowerCase(),
                    );

                    return (
                      <article key={view.id} className="rounded-3xl border border-border bg-background p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold">{view.clientName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{view.clientEmail}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Viewed {view.viewCount} time{view.viewCount === 1 ? "" : "s"} · Last viewed {new Date(view.viewedAt).toLocaleString()}
                            </p>
                          </div>
                          <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            feedback?.liked ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                          }`}>
                            {feedback?.liked ? "Liked" : "No like"}
                          </span>
                        </div>

                        {feedback?.comment ? (
                          <p className="mt-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6">
                            {feedback.comment}
                          </p>
                        ) : null}
                      </article>
                    );
                  }) : (
                    <div className="rounded-3xl border border-dashed border-border bg-background p-5 text-sm leading-6 text-muted-foreground">
                      No logged-in client has viewed this property video yet.
                    </div>
                  )}

                  {!selectedViews.length && writtenComments.length ? writtenComments.map((comment) => (
                    <article key={comment.id} className="rounded-3xl border border-border bg-background p-4">
                      <p className="font-semibold">{comment.clientName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{comment.clientEmail}</p>
                      <p className="mt-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6">{comment.comment}</p>
                    </article>
                  )) : null}
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-[2rem] border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
              Add an active property first, then property video controls will appear here.
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Chats() {
  const { chatThreads, markThreadRead, addChatMessage, deleteChatThread } = usePlatformData();
  const [selectedId, setSelectedId] = useState(chatThreads[0]?.id || "");
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (!selectedId && chatThreads[0]) setSelectedId(chatThreads[0].id);
  }, [chatThreads, selectedId]);

  const selected = chatThreads.find((thread) => thread.id === selectedId) || chatThreads[0];

  const sendReply = () => {
    if (!selected || !reply.trim()) return;
    addChatMessage(selected.id, "realtor", reply);
    setReply("");
    toast.success("Owner reply saved to the thread.");
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <Header kicker="Conversations" title="Live chat inbox" text="Open member threads, mark them read, reply as the realtor, and remove old conversations." icon={MessageCircle} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          {chatThreads.map((c) => {
            const last = c.messages[c.messages.length - 1];
            return (
              <button key={c.id} onClick={() => { setSelectedId(c.id); markThreadRead(c.id); }} className={`flex w-full items-center gap-4 rounded-3xl border p-5 text-left shadow-sm transition-colors ${selected?.id === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary/60"}`}>
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary font-serif text-lg text-foreground">{c.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className={`truncate text-xs ${selected?.id === c.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{last?.text}</p>
                  <p className="mt-1 text-[10px] font-semibold">{c.property}</p>
                </div>
                {c.unread > 0 && <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">{c.unread}</span>}
              </button>
            );
          })}
        </div>

        <div className="rounded-[2rem] border border-border bg-card shadow-sm">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-border p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><p className="font-serif text-2xl">{selected.name}</p><VerificationBadge status={selected.verificationStatus || "unverified"} /></div>
                  <p className="text-sm text-muted-foreground">{selected.property}</p>
                </div>
                <button onClick={() => { deleteChatThread(selected.id); toast.success("Chat removed."); }} className="grid size-10 place-items-center rounded-full border border-destructive/30 text-destructive"><Trash2 className="size-4" /></button>
              </div>
              <div className="max-h-[28rem] space-y-3 overflow-y-auto bg-secondary/40 p-5">
                {selected.messages.map((m) => {
                  const isAi = m.from !== "member" && m.text.startsWith("AI Concierge:");
                  const isSystem = m.kind === "system" || m.kind === "timeout";
                  const propertyVideoCard = parseOwnerPropertyVideoComment(m.text);
                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="max-w-[82%] rounded-2xl border border-border bg-background px-4 py-3 text-center text-xs leading-6 text-muted-foreground shadow-sm">
                          <p>{m.text}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground/70">{m.time}</p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} className={`flex ${m.from === "member" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${m.from === "member" ? "rounded-bl-md bg-card" : isAi ? "rounded-br-md border border-primary/20 bg-secondary" : "rounded-br-md bg-primary text-primary-foreground"}`}>
                        {isAi && <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground">AI concierge</p>}
                        {propertyVideoCard ? (
                          <OwnerPropertyVideoCommentCard card={propertyVideoCard} clientName={selected.name} />
                        ) : (
                          <p className="whitespace-pre-line">{isAi ? m.text.replace(/^AI Concierge:\s*/, "") : m.text}</p>
                        )}
                        <p className={`mt-1 text-[10px] ${m.from === "member" ? "text-muted-foreground" : isAi ? "text-muted-foreground" : "text-primary-foreground/65"}`}>{m.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 p-4">
                <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} className="ev-input" placeholder="Reply as realtor…" />
                <button onClick={sendReply} className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><Send className="size-4" /></button>
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">No chat threads yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

type OwnerPropertyVideoCommentCardData = {
  propertyTitle: string;
  videoTitle: string;
  comment: string;
  href: string;
};

function parseOwnerPropertyVideoComment(text: string): OwnerPropertyVideoCommentCardData | null {
  if (!text.startsWith("🎥 Property video comment for ")) return null;

  const lines = text.split("\n").map((line) => line.trim());
  const titleLine = lines[0] || "";
  const videoLineIndex = lines.findIndex((line) => line.startsWith("Video card:"));
  const openLineIndex = lines.findIndex((line) => line.startsWith("Open property:"));

  const propertyTitle = titleLine
    .replace("🎥 Property video comment for ", "")
    .replace(/\.$/, "")
    .trim() || "this property";

  const commentEnd = videoLineIndex >= 0 ? videoLineIndex : openLineIndex >= 0 ? openLineIndex : lines.length;
  const comment = lines.slice(1, commentEnd).filter(Boolean).join("\n").trim();

  const videoTitle = videoLineIndex >= 0
    ? lines[videoLineIndex].replace("Video card:", "").trim()
    : "Property Video";

  const rawHref = openLineIndex >= 0
    ? lines[openLineIndex].replace("Open property:", "").trim()
    : "/listings";

  const href = rawHref.includes("#property-video-tour")
    ? rawHref
    : rawHref.startsWith("/property/")
      ? `${rawHref}#property-video-tour`
      : rawHref || "/listings";

  return {
    propertyTitle,
    videoTitle: videoTitle || "Property Video",
    comment: comment || "No written comment provided.",
    href,
  };
}

function OwnerPropertyVideoCommentCard({ card, clientName }: { card: OwnerPropertyVideoCommentCardData; clientName: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200 bg-violet-50 text-violet-950 shadow-sm">
      <div className="border-b border-violet-200 bg-white/70 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Property video comment</p>
        <h4 className="mt-1 text-sm font-black">{card.propertyTitle}</h4>
        <p className="mt-1 text-xs font-semibold text-violet-800/80">{card.videoTitle}</p>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">Client</p>
          <p className="mt-1 text-sm font-bold">{clientName || "Client"}</p>
        </div>

        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">Comment</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-6">{card.comment}</p>
        </div>

        <a
          href={card.href}
          className="inline-flex w-full items-center justify-center rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white shadow-sm hover:bg-violet-800"
        >
          Open property video
        </a>
      </div>
    </div>
  );
}


function AIConcierge() {
  const { conciergeSettings, updateConciergeSettings } = usePlatformData();
  const [form, setForm] = useState<ConciergeSettings>(conciergeSettings);

  useEffect(() => {
    setForm(conciergeSettings);
  }, [conciergeSettings]);

  const set = <K extends keyof ConciergeSettings>(key: K, value: ConciergeSettings[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateConciergeSettings(form);
    toast.success(`${form.agentName} AI settings saved.`);
  };

  const toneOptions: ConciergeTone[] = ["High-ticket closer", "Luxury calm", "Warm and friendly", "Direct and efficient", "Investor-focused"];

  return (
    <form onSubmit={save} className="space-y-6 animate-fade-up">
      <Header
        kicker="Website Chat Knowledge Base"
        title="Control the website chat experience"
        text="Control approved chat answers, common questions, property guidance, tours, verification, fallback responses, and follow-up rules without paying for an AI API."
        icon={Bot}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="section-kicker"><WandSparkles className="size-3.5" /> Chat identity</p>
          <h2 className="mt-3 font-serif text-3xl">Voice and market context</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <P label="Chat assistant name"><input value={form.agentName} onChange={(e) => set("agentName", e.target.value)} className="ev-input" placeholder="Valeria" /></P>
            <P label="Tone"><select value={form.tone} onChange={(e) => set("tone", e.target.value as ConciergeTone)} className="ev-input">{toneOptions.map((tone) => <option key={tone}>{tone}</option>)}</select></P>
          </div>
          <div className="mt-4"><P label="Service area"><input value={form.serviceArea} onChange={(e) => set("serviceArea", e.target.value)} className="ev-input" /></P></div>
          <div className="mt-4"><P label="Member-facing welcome message"><textarea value={form.welcomeMessage} onChange={(e) => set("welcomeMessage", e.target.value)} rows={4} className="ev-input resize-none" /></P></div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="section-kicker"><BrainCircuit className="size-3.5" /> Behavior controls</p>
          <h2 className="mt-3 font-serif text-3xl">Automation rules</h2>
          <div className="mt-5 space-y-4">
            <label className="flex items-start gap-3 rounded-2xl bg-secondary p-4">
              <input type="checkbox" checked={form.autoReply} onChange={(e) => set("autoReply", e.target.checked)} className="mt-1 size-4 accent-primary" />
              <span><span className="block text-sm font-semibold">Auto-reply to member messages</span><span className="text-xs leading-5 text-muted-foreground">When off, the chat logs member messages and creates a private follow-up alert instead of sending an AI answer.</span></span>
            </label>
            <label className="flex items-start gap-3 rounded-2xl bg-secondary p-4">
              <input type="checkbox" checked={form.enableOwnerHandoff} onChange={(e) => set("enableOwnerHandoff", e.target.checked)} className="mt-1 size-4 accent-primary" />
              <span><span className="block text-sm font-semibold">Private follow-up alerts</span><span className="text-xs leading-5 text-muted-foreground">Create private alerts for serious members, document uploads, property video comments, tours, and offer intent.</span></span>
            </label>
            <P label={`Private follow-up threshold: ${form.handoffScore}/100`}><input type="range" min="25" max="95" value={form.handoffScore} onChange={(e) => set("handoffScore", Number(e.target.value))} className="w-full accent-primary" /></P>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="section-kicker"><BrainCircuit className="size-3.5" /> Chat Knowledge Base</p>
        <h2 className="mt-3 font-serif text-3xl">Control what the website chat can answer</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
          Add website-approved information the chat can use when answering visitors, buyers, sellers, renters, verified users, and clients. The chat should answer from real listings and approved knowledge only. If something is outside this knowledge base, it should create a follow-up note instead of guessing.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <P label="General public knowledge">
            <textarea value={form.publicKnowledge} onChange={(e) => set("publicKnowledge", e.target.value)} rows={7} className="ev-input resize-none" />
          </P>
          <P label="Property facts and amenities">
            <textarea value={form.propertyKnowledge} onChange={(e) => set("propertyKnowledge", e.target.value)} rows={7} className="ev-input resize-none" />
          </P>
          <P label="Tour and property video rules">
            <textarea value={form.tourKnowledge} onChange={(e) => set("tourKnowledge", e.target.value)} rows={7} className="ev-input resize-none" />
          </P>
          <P label="Website support knowledge">
            <textarea value={form.websiteSupportKnowledge} onChange={(e) => set("websiteSupportKnowledge", e.target.value)} rows={7} className="ev-input resize-none" />
          </P>
          <P label="Outside-scope fallback behavior">
            <textarea value={form.fallbackKnowledge} onChange={(e) => set("fallbackKnowledge", e.target.value)} rows={6} className="ev-input resize-none" />
          </P>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Chat KB Control Center</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Coded response categories</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  The website chat answers from approved rules, real listing facts, saved dashboard knowledge,
                  and owner-controlled fallback responses. It does not need a paid AI API.
                </p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                No AI billing
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Property listings",
                "Pricing",
                "Bedrooms & bathrooms",
                "Square footage",
                "Amenities",
                "City & address",
                "Tours",
                "Property videos",
                "Verification",
                "Account help",
                "Saved homes",
                "Contact realtor",
                "Website navigation",
                "Unclear messages",
                "Off-topic messages",
                "Goodbye messages",
                "Owner follow-up",
                "No-response follow-up",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-4 text-sm leading-6 text-slate-600">
              <span className="font-black text-slate-900">Rule format:</span>{" "}
              Category | keywords separated by commas | approved response | button label | website link
            </div>
          </div>

          <P label="Owner-coded response rules">
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p className="font-black">How to write a chat rule</p>
              <p className="mt-1">
                Each line should follow this format:
                <span className="font-bold"> Category | keywords | approved response | button label | link</span>
              </p>
              <p className="mt-2">
                Example: <span className="font-bold">Property Videos | property video, virtual tour | Property videos live under each listing when added by the owner. If no video exists yet, suggest scheduling an in-person tour. | View Property Video | /listings</span>
              </p>
            </div>

            <textarea
              value={form.chatKnowledgeRules}
              onChange={(e) => set("chatKnowledgeRules", e.target.value)}
              rows={14}
              className="ev-input resize-none font-mono text-xs leading-6"
              placeholder={"Category | keywords | approved response | button label | link\nProperty Videos | property video, virtual tour | Property videos live under each listing when added by the owner. If no video exists yet, suggest scheduling an in-person tour. | View Property Video | /listings"}
            />

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Keyword matching</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Separate keywords with commas. The chat checks whether the visitor message contains one of those keywords.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Approved answers only</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The chat should only say what is written here or what is available from real listing facts.
                </p>
              </div>
            </div>
          </P>
          <div className="grid gap-4">
            <P label="Inactive-user follow-up message">
              <textarea value={form.idleFollowUpMessage} onChange={(e) => set("idleFollowUpMessage", e.target.value)} rows={3} className="ev-input resize-none" />
            </P>
            <P label="Goodbye / closing message">
              <textarea value={form.goodbyeMessage} onChange={(e) => set("goodbyeMessage", e.target.value)} rows={3} className="ev-input resize-none" />
            </P>
          </div>
          <div className="lg:col-span-2">
            <P label="Private owner knowledge">
              <textarea value={form.privateKnowledge} onChange={(e) => set("privateKnowledge", e.target.value)} rows={6} className="ev-input resize-none" />
            </P>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="section-kicker"><ShieldInline /> Response guardrails</p>
        <h2 className="mt-3 font-serif text-3xl">Luxury, helpful, and safe</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <P label="Financial disclaimer"><textarea value={form.financialDisclaimer} onChange={(e) => set("financialDisclaimer", e.target.value)} rows={4} className="ev-input resize-none" /></P>
          <P label="Fair housing / location note"><textarea value={form.fairHousingNote} onChange={(e) => set("fairHousingNote", e.target.value)} rows={4} className="ev-input resize-none" /></P>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <P label="Forbidden public phrases"><textarea value={form.forbiddenPhrases} onChange={(e) => set("forbiddenPhrases", e.target.value)} rows={6} className="ev-input resize-none" /></P>
          <P label="Response rules"><textarea value={form.responseRules} onChange={(e) => set("responseRules", e.target.value)} rows={6} className="ev-input resize-none" /></P>
        </div>
        <div className="mt-4"><P label="Private follow-up message"><textarea value={form.ownerHandoffMessage} onChange={(e) => set("ownerHandoffMessage", e.target.value)} rows={3} className="ev-input resize-none" /></P></div>
      </section>

      <section className="rounded-[2rem] border border-border bg-secondary/70 p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold">Current agent preview</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{form.agentName} · {form.tone} · private alert at {form.handoffScore}/100 · auto-reply {form.autoReply ? "on" : "off"}</p>
          </div>
          <button type="button" onClick={() => setForm(defaultConciergeSettings)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold shadow-sm hover:bg-secondary">
            <RefreshCw className="size-4" /> Reset chat
          </button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            <Save className="size-4" /> Save chat knowledge
          </button>
        </div>
      </section>
    </form>
  );
}

function ShieldInline() {
  return <LockKeyhole className="size-3.5" />;
}

function Profile() {
  const profile = useRealtorProfile();
  const { updateRealtorProfile } = usePlatformData();
  const [form, setForm] = useState<StoredRealtorProfile>({
    name: profile.name,
    title: profile.title,
    license: profile.license,
    brokerage: profile.brokerage,
    phone: profile.phone,
    email: profile.email,
    tagline: profile.tagline,
    bio: profile.bio,
    headshotUrl: profile.headshot,
    stats: profile.stats,
    socials: profile.socials,
  });

  const setBasic = (k: keyof Omit<StoredRealtorProfile, "stats" | "socials">, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setStat = (index: number, key: "label" | "value", value: string) => setForm((f) => ({ ...f, stats: f.stats.map((item, i) => (i === index ? { ...item, [key]: value } : item)) }));
  const setSocial = (index: number, key: "label" | "short" | "url" | "enabled", value: string | boolean) => setForm((f) => ({ ...f, socials: f.socials.map((item, i) => (i === index ? { ...item, [key]: value } : item)) }));
  const saveOwnerPhoto = (headshotUrl: string) => {
    const next = { ...form, headshotUrl: headshotUrl.trim() };
    setForm(next);
    updateRealtorProfile(next);
    toast.success(headshotUrl.trim() ? "Owner profile photo updated across the site." : "Owner profile photo reset.");
  };

  const readProfilePhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => saveOwnerPhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); updateRealtorProfile(form); toast.success("Public profile updated live."); }} className="space-y-6 animate-fade-up">
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src={form.headshotUrl || profile.headshot} alt={form.name || profile.name} width={88} height={88} className="size-20 rounded-3xl object-cover shadow-sm" />
            <div>
              <p className="font-serif text-2xl">Public profile editor</p>
              <p className="text-sm text-muted-foreground">Name, photo, contact info, bio, stats, and social links update the homepage immediately.</p>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-xs font-semibold shadow-sm hover:bg-secondary">
            <ImageUp className="size-4" /> Upload owner photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => readProfilePhoto(e.target.files?.[0])} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <P label="Name"><input value={form.name} onChange={(e) => setBasic("name", e.target.value)} className="ev-input" /></P>
          <P label="Title"><input value={form.title} onChange={(e) => setBasic("title", e.target.value)} className="ev-input" /></P>
          <P label="License"><input value={form.license} onChange={(e) => setBasic("license", e.target.value)} className="ev-input" /></P>
          <P label="Brokerage"><input value={form.brokerage} onChange={(e) => setBasic("brokerage", e.target.value)} className="ev-input" /></P>
          <P label="Phone"><input type="tel" value={form.phone} onChange={(e) => setBasic("phone", e.target.value)} className="ev-input" placeholder="+1 (310) 555-0192" /></P>
          <P label="Email"><input value={form.email} onChange={(e) => setBasic("email", e.target.value)} className="ev-input" /></P>
        </div>
        <div className="mt-4"><P label="Hero tagline"><input value={form.tagline} onChange={(e) => setBasic("tagline", e.target.value)} className="ev-input" /></P></div>
        <div className="mt-4"><P label="Bio"><textarea value={form.bio} onChange={(e) => setBasic("bio", e.target.value)} rows={5} className="ev-input resize-none" /></P></div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <h3 className="font-serif text-2xl">Homepage stats</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {form.stats.map((stat, index) => (
            <div key={index} className="rounded-2xl bg-secondary p-4">
              <P label="Value"><input value={stat.value} onChange={(e) => setStat(index, "value", e.target.value)} className="ev-input" /></P>
              <div className="mt-3"><P label="Label"><input value={stat.label} onChange={(e) => setStat(index, "label", e.target.value)} className="ev-input" /></P></div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h3 className="font-serif text-2xl">Social links</h3>
            <p className="mt-1 text-sm text-muted-foreground">Turn socials off to remove them from the public app without deleting their URLs.</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{form.socials.filter((s) => s.enabled === true).length} visible</span>
        </div>
        <div className="mt-4 grid gap-4">
          {form.socials.map((social, index) => (
            <div key={index} className={`w-full rounded-2xl p-4 ${social.enabled === false ? "bg-secondary/50 opacity-70" : "bg-secondary"}`}>
              <label className="mb-4 flex items-start justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold">{social.label || "Social link"}</span>
                  <span className="text-xs text-muted-foreground">{social.enabled === false ? "Hidden from public app" : "Visible on public profile"}</span>
                </span>
                <input
                  type="checkbox"
                  checked={social.enabled === true}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setForm((current) => {
                      const next = { ...current, socials: current.socials.map((item, i) => (i === index ? { ...item, enabled } : item)) };
                      updateRealtorProfile(next);
                      return next;
                    });
                    toast.success(`${social.label || "Social link"} is now ${enabled ? "visible" : "hidden"} on the public site.`);
                  }}
                  className="mt-1 size-5 accent-primary"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                <P label="Label"><input value={social.label} onChange={(e) => setSocial(index, "label", e.target.value)} className="ev-input" /></P>
                <P label="Short"><input value={social.short} onChange={(e) => setSocial(index, "short", e.target.value)} className="ev-input" /></P>
                <P label="URL"><input value={social.url} onChange={(e) => setSocial(index, "url", e.target.value)} className="ev-input" /></P>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground"><Save className="size-4" /> Save public profile</button>
    </form>
  );
}

function Security() {
  const { updateOwnerDashboardPassword, saveOwnerNotificationEmail, ownerNotificationEmail, logout } = useAuth();
  const { clearPlatformData } = usePlatformData();
  const [form, setForm] = useState({ currentPassword: "", nextPassword: "", confirmPassword: "" });
  const [notificationEmail, setNotificationEmail] = useState(ownerNotificationEmail);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value.slice(0, 8) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      updateOwnerDashboardPassword(form);
      toast.success("Owner dashboard password updated.");
      setForm({ currentPassword: "", nextPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update owner password.");
    }
  };

  const submitNotificationEmail = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveOwnerNotificationEmail(notificationEmail);
      toast.success("Dashboard notification email updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update notification email.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <Header kicker="Owner Security" title="Dashboard access controls" text="Change the private dashboard password, notification email, lock the owner session, or reset local demo data." icon={KeyRound} />

      <form onSubmit={submit} className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-3xl">Change private dashboard password</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Password must be exactly 8 characters.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <P label="Current password"><input type="password" value={form.currentPassword} onChange={(e) => set("currentPassword", e.target.value)} className="ev-input text-center text-lg tracking-[0.35em]" placeholder="••••••••" maxLength={8} /></P>
          <P label="New password"><input type="password" value={form.nextPassword} onChange={(e) => set("nextPassword", e.target.value)} className="ev-input text-center text-lg tracking-[0.35em]" placeholder="••••••••" maxLength={8} /></P>
          <P label="Confirm new password"><input type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} className="ev-input text-center text-lg tracking-[0.35em]" placeholder="••••••••" maxLength={8} /></P>
        </div>
        <button type="submit" className="mt-6 w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground">Update owner password</button>
      </form>

      <form onSubmit={submitNotificationEmail} className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-3xl">Dashboard notification email</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Lead alerts, tour requests, document updates, and future dashboard activity should go to this email.</p>
        <div className="mt-5"><P label="Notification email"><input type="email" value={notificationEmail} onChange={(e) => setNotificationEmail(e.target.value)} className="ev-input" placeholder="owner@email.com" /></P></div>
        <button type="submit" className="mt-6 w-full rounded-2xl border border-border bg-card py-4 text-sm font-semibold shadow-sm transition-colors hover:bg-secondary">Update notification email</button>
      </form>

      <section className="rounded-[2rem] border border-border bg-secondary/70 p-6 shadow-sm sm:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <button onClick={() => { logout(); toast.success("Owner session locked."); }} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-4 text-sm font-semibold shadow-sm">
            <LogOut className="size-4" /> Sign out & lock
          </button>
          <button onClick={() => { if (confirm("Reset all local dashboard edits, leads, listings, tours, chats, profile changes, and updates?")) { clearPlatformData(); toast.success("Local demo data reset."); } }} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-card px-6 py-4 text-sm font-semibold text-destructive shadow-sm">
            <RefreshCw className="size-4" /> Reset local demo data
          </button>
        </div>
      </section>
    </div>
  );
}

function Header({ kicker, title, text, icon: Icon }: { kicker: string; title: string; text: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="section-kicker"><Icon className="size-3.5" /> {kicker}</p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{text}</p>
    </section>
  );
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const label = status === "verified" ? "Verified Client" : status === "pending" ? "ID Pending" : "Unverified Client";
  const classes = status === "verified"
    ? "bg-green-100 text-green-800"
    : status === "pending"
      ? "bg-amber-100 text-amber-800"
      : "bg-secondary text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${classes}`}>
      {status === "verified" ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
      {label}
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary px-2 py-3">
      <p className="text-[11px] font-semibold">{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function P({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
