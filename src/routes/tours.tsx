import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, Clock, MapPin, MessageCircle, Video } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { selectedPropertyFromUrl, usePlatformData, usePublicProperties } from "@/lib/platformStore";

export const Route = createFileRoute("/tours")({
  head: () => ({
    meta: [
      { title: "Schedule a Tour — Elena Valerius" },
      { name: "description", content: "Request an in-person property showing with Elena Valerius." },
    ],
  }),
  component: Tours,
});

const times = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"];

function Tours() {
  const { addTourRequest, propertyVideoTours } = usePlatformData();
  const { activeProperties } = usePublicProperties();

  const [property, setProperty] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState(times[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const selected = selectedPropertyFromUrl();
    setProperty(selected?.title || activeProperties[0]?.title || "");
  }, [activeProperties]);

  const selectedProperty = useMemo(
    () => activeProperties.find((item) => item.title === property) || activeProperties[0],
    [activeProperties, property],
  );

  const selectedVideo = selectedProperty
    ? propertyVideoTours.find((video) => video.propertyId === selectedProperty.id && video.isEnabled)
    : undefined;

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
      type: "In Person",
    });

    setSubmitted(true);
    toast.success("Tour requested. Private follow-up is ready.");
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-7">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
              <p className="section-kicker"><CalendarClock className="size-3.5" /> Private appointments</p>
              <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Schedule an in-person tour</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Request a private showing for the property you want to see. Property videos now live directly on each property page and stay locked until the client is logged in.
              </p>

              <div className="mt-6 rounded-[1.5rem] border border-primary/20 bg-primary/5 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Looking for video?</p>
                    <h3 className="mt-1 font-serif text-2xl">Open the property page video section</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Property videos are no longer requested here. Choose a property and view its locked property video from the property page.
                    </p>
                  </div>

                  {selectedProperty ? (
                    <a href={`/property/${selectedProperty.id}#property-video-tour`} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm">
                      View Property Video
                    </a>
                  ) : (
                    <Link to="/listings" className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm">
                      View Listings
                    </Link>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-xl sm:p-8 lg:sticky lg:top-24 lg:h-fit">
            {submitted ? (
              <div className="animate-fade-up py-8 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-foreground">
                  <Check className="size-8" />
                </div>
                <p className="mt-5 font-serif text-3xl">Request sent</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                  In-person tour for <span className="font-medium text-foreground">{property}</span> on {date} at {time}.
                  A confirmation will arrive at {email}.
                </p>
                <button onClick={() => setSubmitted(false)} className="mt-7 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground">
                  Book another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="rounded-2xl border border-primary bg-primary p-5 text-primary-foreground">
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                    <MapPin className="size-5" /> In-person showing
                  </div>
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

                {selectedProperty ? (
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Also available</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedVideo ? "This property has a login-locked property video." : "The owner has not added a video for this property yet."}
                        </p>
                      </div>
                      <a href={`/property/${selectedProperty.id}#property-video-tour`} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold">
                        <Video className="size-4" /> Video Section
                      </a>
                    </div>
                  </div>
                ) : null}

                <button type="submit" className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground">
                  <span className="inline-flex items-center gap-2"><Clock className="size-4" /> Request Tour</span>
                </button>

                <Link to="/chat" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary py-4 text-sm font-semibold">
                  <MessageCircle className="size-4" /> Ask Before Scheduling
                </Link>
              </form>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
          <h3 className="font-serif text-2xl">Property videos</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Owner-recorded property videos are managed in the owner dashboard and appear under each individual listing. Logged-in clients can watch, like, comment, and create view history for the owner.
          </p>

          <div className="mt-5 space-y-3">
            {activeProperties.map((item) => {
              const video = propertyVideoTours.find((tour) => tour.propertyId === item.id && tour.isEnabled);

              return (
                <a key={item.id} href={`/property/${item.id}#property-video-tour`} className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-secondary sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.city} · {item.beds} bd · {item.baths} ba</p>
                  </div>
                  <span className={`w-fit shrink-0 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wide ${
                    video ? "bg-green-100 text-green-800" : "bg-secondary text-muted-foreground"
                  }`}>
                    {video ? "Video ready" : "No video yet"}
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
