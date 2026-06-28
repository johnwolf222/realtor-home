import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock3, KeyRound, LockKeyhole, PlayCircle, Video } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { usePlatformData } from "@/lib/platformStore";

export const Route = createFileRoute("/tours/live")({
  head: () => ({
    meta: [
      { title: "Tour Preview — Elena Valerius" },
      {
        name: "description",
        content: "View an owner-recorded property tour preview with timestamped property sections.",
      },
    ],
  }),
  component: TourPreviewAccess,
});

const previewChapters = [
  { label: "Front Yard", time: "0:00" },
  { label: "Entryway", time: "0:45" },
  { label: "Living Room", time: "1:20" },
  { label: "Kitchen", time: "2:10" },
  { label: "Master Bedroom", time: "3:05" },
  { label: "Guest Bedroom", time: "4:00" },
  { label: "Bathroom", time: "4:40" },
  { label: "Basement", time: "5:25" },
  { label: "Backyard", time: "6:15" },
];

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function TourPreviewAccess() {
  const { tourRequests } = usePlatformData();
  const [code, setCode] = useState("");
  const [activeTourId, setActiveTourId] = useState("");
  const [activeChapter, setActiveChapter] = useState(previewChapters[0].label);

  const previewTourRequests = useMemo(
    () => tourRequests.filter((tour) => tour.type === "Video Tour"),
    [tourRequests],
  );

  const activeTour = activeTourId
    ? previewTourRequests.find((tour) => tour.id === activeTourId)
    : undefined;

  const enterPreview = (event: React.FormEvent) => {
    event.preventDefault();

    const matched = previewTourRequests.find(
      (tour) => normalizeCode(tour.videoAccessCode || "") === normalizeCode(code),
    );

    if (!matched) {
      toast.error("That Tour Preview access code was not found.");
      return;
    }

    if (!matched.videoCodeSentAt) {
      toast.error("This preview access has not been activated by the owner yet.");
      return;
    }

    setActiveTourId(matched.id);
    setActiveChapter(previewChapters[0].label);
    toast.success("Access accepted. Opening Tour Preview.");
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {!activeTour ? (
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-card p-6 text-center shadow-xl sm:p-8">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground">
              <LockKeyhole className="size-8" />
            </div>

            <p className="mt-5 section-kicker justify-center">Private Tour Preview</p>

            <h1 className="mt-3 font-serif text-4xl">Enter your preview access code.</h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
              Tour Previews are owner-recorded property walkthroughs available to approved account holders. Enter the
              access code sent by the owner to view the preview anytime.
            </p>

            <form onSubmit={enterPreview} className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                className="ev-input text-center font-mono text-xl font-black tracking-[0.22em]"
                placeholder="CODE"
              />

              <button type="submit" className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
                Open Preview
              </button>
            </form>

            <Link to="/tours" className="mt-5 inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground">
              Request preview access instead
            </Link>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
            <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                <div>
                  <p className="section-kicker">
                    <Video className="size-3.5" /> Owner-recorded Tour Preview
                  </p>

                  <h1 className="mt-2 font-serif text-3xl">{activeTour.property}</h1>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Private preview access · Available anytime
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-muted-foreground">
                  <KeyRound className="size-4" /> Approved Access
                </div>
              </div>

              <div className="grid min-h-[420px] place-items-center bg-black p-8 text-center text-white sm:min-h-[560px]">
                <div>
                  <div className="mx-auto grid size-24 place-items-center rounded-full bg-white/10 text-white shadow-2xl">
                    <PlayCircle className="size-14" />
                  </div>

                  <h2 className="mt-6 font-serif text-4xl">{activeChapter}</h2>

                  <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70">
                    Recorded preview player placeholder. The uploaded owner video connects here, and each timestamp
                    button jumps to the selected property section.
                  </p>
                </div>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-border bg-card p-5 shadow-sm lg:sticky lg:top-28 lg:h-fit">
              <p className="section-kicker">
                <Clock3 className="size-3.5" /> Preview timestamps
              </p>

              <h2 className="mt-3 font-serif text-2xl">Jump to a section</h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Clients can review the exact areas they care about without needing a live appointment.
              </p>

              <div className="mt-5 space-y-2">
                {previewChapters.map((chapter) => (
                  <button
                    key={chapter.label}
                    type="button"
                    onClick={() => setActiveChapter(chapter.label)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-colors ${
                      activeChapter === chapter.label
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span>{chapter.label}</span>
                    <span className={activeChapter === chapter.label ? "text-primary-foreground/70" : "text-muted-foreground"}>
                      {chapter.time}
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          </section>
        )}
      </main>
    </AppShell>
  );
}
