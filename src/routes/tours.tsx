import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, Check, Clock, MapPin, Video } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { selectedModeFromUrl, selectedPropertyFromUrl, usePlatformData, usePublicProperties } from "@/lib/platformStore";
import type { TourRequest } from "@/lib/data";

export const Route = createFileRoute("/tours")({
  head: () => ({
    meta: [
      { title: "Schedule a Tour — Elena Valerius" },
      { name: "description", content: "Request a private in-person or video tour of any listing." },
    ],
  }),
  component: Tours,
});

const times = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"];

function Tours() {
  const { tourRequests, addTourRequest } = usePlatformData();
  const { activeProperties } = usePublicProperties();

  const [property, setProperty] = useState("");
  const [mode, setMode] = useState<"In Person" | "Video Tour">("In Person");
  const [date, setDate] = useState("");
  const [time, setTime] = useState(times[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const selected = selectedPropertyFromUrl();
    setProperty(selected?.title || activeProperties[0]?.title || "");
    setMode(selectedModeFromUrl());
  }, [activeProperties]);

  const availableLiveTours = Array.from(
    tourRequests
      .filter((tour) => tour.type === "Video Tour" && tour.videoSessionStatus === "live")
      .reduce((map, tour) => {
        if (!map.has(tour.property)) map.set(tour.property, tour);
        return map;
      }, new Map<string, TourRequest>())
      .values(),
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !date || !property.trim()) {
      toast.error("Please complete your name, email, property, and preferred date.");
      return;
    }

    addTourRequest({
      name,
      email,
      phone: "Not provided",
      timeline: "Tour request",
      budget: "Not specified",
      interest: property,
      date,
      time,
      type: mode,
    });

    setSubmitted(true);

    toast.success(
      mode === "Video Tour"
        ? "Video tour requested. The owner will approve and send a private room code."
        : "Tour requested. Private follow-up is ready.",
    );
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-7">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
              <p className="section-kicker"><CalendarClock className="size-3.5" /> Private appointments</p>
              <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Schedule a Tour</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Request an in-person showing or a private video tour. Video tour access codes are sent only after owner approval.
              </p>

              <div className="mt-6 rounded-[1.5rem] border border-primary/20 bg-primary/5 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Have a video code?</p>
                    <h3 className="mt-1 font-serif text-2xl">Enter the Live Video Room</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Use the code sent by the owner to enter the waiting room.</p>
                  </div>

                  <Link to="/tours/live" className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm">
                    Open Live Room
                  </Link>
                </div>
              </div>
            </div>

            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
              <h3 className="font-serif text-2xl">Available live video tours</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A property appears here only after the owner starts the live video tour from the dashboard.
              </p>

              <div className="mt-5 space-y-3">
                {availableLiveTours.length ? (
                  availableLiveTours.map((t) => (
                    <div key={t.property} className="flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-950 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{t.property}</p>
                        <p className="mt-1 text-xs text-green-900/75">{t.date} · {t.time} · Live viewing has started</p>
                      </div>
                      <Link to="/tours/live" className="w-fit shrink-0 rounded-full bg-green-600 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white">
                        Available
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-background p-5 text-sm leading-6 text-muted-foreground">
                    No live video tours are available right now.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-xl sm:p-8 lg:sticky lg:top-24 lg:h-fit">
            {submitted ? (
              <div className="animate-fade-up py-8 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-foreground">
                  <Check className="size-8" />
                </div>
                <p className="mt-5 font-serif text-3xl">Request sent</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                  {mode} for <span className="font-medium text-foreground">{property}</span> on {date} at {time}.
                  {mode === "Video Tour" ? " If approved, the owner will send your private video-room code." : ` A confirmation will arrive at ${email}.`}
                </p>
                <button onClick={() => setSubmitted(false)} className="mt-7 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground">
                  Book another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setMode("In Person")} className={modeButton(mode === "In Person")}>
                    <MapPin className="size-5" /> In Person
                  </button>
                  <button type="button" onClick={() => setMode("Video Tour")} className={modeButton(mode === "Video Tour")}>
                    <Video className="size-5" /> Video Tour
                  </button>
                </div>

                <L label="Property">
                  <select value={property} onChange={(e) => setProperty(e.target.value)} className="ev-input">
                    {activeProperties.map((p) => <option key={p.id} value={p.title}>{p.title}</option>)}
                  </select>
                </L>

                <div className="grid gap-4 sm:grid-cols-2">
                  <L label="Preferred date">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ev-input" />
                  </L>
                  <L label="Time">
                    <select value={time} onChange={(e) => setTime(e.target.value)} className="ev-input">
                      {times.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </L>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <L label="Full name">
                    <input value={name} onChange={(e) => setName(e.target.value)} className="ev-input" placeholder="Your name" />
                  </L>
                  <L label="Email">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ev-input" placeholder="you@email.com" />
                  </L>
                </div>

                <button type="submit" className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground">
                  <span className="inline-flex items-center gap-2"><Clock className="size-4" /> Request Tour</span>
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function modeButton(active: boolean) {
  return `flex flex-col items-center gap-2 rounded-2xl border p-5 text-sm font-semibold transition-colors ${
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-secondary"
  }`;
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
