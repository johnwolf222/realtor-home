import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, LockKeyhole, Video } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { usePlatformData } from "@/lib/platformStore";
import type { TourRequest } from "@/lib/data";

export const Route = createFileRoute("/tours/live")({
  head: () => ({
    meta: [
      { title: "Live Video Room — Elena Valerius" },
      { name: "description", content: "Enter a private video tour room with an owner-approved access code." },
    ],
  }),
  component: LiveVideoRoom,
});

const feedbackChoices = [
  "Space",
  "Kitchen",
  "Guest Room",
  "Master Room",
  "Bathrooms",
  "Flooring",
  "Backyard",
  "Natural Light",
  "Layout",
  "Neighborhood",
  "Price",
  "Other",
];

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function LiveVideoRoom() {
  const { tourRequests, updateTourRequest } = usePlatformData();
  const [code, setCode] = useState("");
  const [activeTourId, setActiveTourId] = useState("");
  const [likedTourId, setLikedTourId] = useState("");
  const [likedMost, setLikedMost] = useState<string[]>([]);
  const [finalComment, setFinalComment] = useState("");

  const activeTour = activeTourId ? tourRequests.find((tour) => tour.id === activeTourId) : undefined;

  const enterRoom = (event: React.FormEvent) => {
    event.preventDefault();

    const matched = tourRequests.find(
      (tour) => tour.type === "Video Tour" && normalizeCode(tour.videoAccessCode || "") === normalizeCode(code),
    );

    if (!matched) {
      toast.error("That video room code was not found.");
      return;
    }

    if (!matched.videoCodeSentAt) {
      toast.error("This code has not been sent/activated by the owner yet.");
      return;
    }

    setActiveTourId(matched.id);
    toast.success("Code accepted. Entering private video room.");
  };

  const likeTour = (tour: TourRequest) => {
    if (tour.videoSessionStatus !== "live") {
      toast.message("Likes open once the owner starts the live tour.");
      return;
    }

    if (likedTourId === tour.id) {
      toast.message("You already liked this live tour.");
      return;
    }

    updateTourRequest(tour.id, { videoLikes: (tour.videoLikes || 0) + 1 });
    setLikedTourId(tour.id);
    toast.success("Like saved.");
  };

  const toggleChoice = (choice: string) => {
    setLikedMost((current) =>
      current.includes(choice) ? current.filter((item) => item !== choice) : [...current, choice],
    );
  };

  const submitFeedback = (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeTour) return;

    updateTourRequest(activeTour.id, {
      videoSessionStatus: "closed",
      videoFeedback: {
        likedMost,
        finalComment: finalComment.trim().slice(0, 200),
        submittedAt: new Date().toISOString(),
      },
    });

    toast.success("Feedback saved. This video tour is now closed.");
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {!activeTour ? (
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-card p-6 text-center shadow-xl sm:p-8">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground">
              <LockKeyhole className="size-8" />
            </div>
            <p className="mt-5 section-kicker justify-center">Private live room</p>
            <h1 className="mt-3 font-serif text-4xl">Enter your video tour code.</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
              Your code is sent by the owner after approval. You can enter the waiting room before the tour starts.
            </p>

            <form onSubmit={enterRoom} className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                className="ev-input text-center font-mono text-xl font-black tracking-[0.22em]"
                placeholder="CODE"
              />
              <button type="submit" className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
                Enter Room
              </button>
            </form>

            <Link to="/tours" className="mt-5 inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground">
              Request a tour instead
            </Link>
          </section>
        ) : activeTour.videoSessionStatus === "live" ? (
          <section className="overflow-hidden rounded-[2rem] border border-green-300 bg-green-950 text-green-50 shadow-2xl">
            <div className="flex flex-col gap-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-green-300">Live video available</p>
                  <h1 className="mt-1 font-serif text-3xl">{activeTour.property}</h1>
                  <p className="mt-1 text-sm text-green-100/75">{activeTour.date} · {activeTour.time}</p>
                </div>

                <button
                  type="button"
                  onClick={() => likeTour(activeTour)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-green-950"
                >
                  <Heart className="size-4" /> {likedTourId === activeTour.id ? "Liked" : `Like ${activeTour.videoLikes || 0}`}
                </button>
              </div>

              <div className="grid min-h-[620px] place-items-center bg-black p-8 text-center">
                <div>
                  <div className="mx-auto grid size-24 place-items-center rounded-full bg-green-500 text-5xl shadow-2xl shadow-green-500/40">
                    <Video className="size-12" />
                  </div>
                  <h2 className="mt-6 font-serif text-5xl">Owner Live Viewing</h2>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-green-100/80">
                    This is the client live room. The room state is unlocked; the production video stream connects here through the live video provider.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : activeTour.videoSessionStatus === "ended" ? (
          <section className="rounded-[2rem] border border-purple-200 bg-purple-50 p-6 text-purple-950 shadow-sm sm:p-8">
            <p className="section-kicker text-purple-700">Thank you for watching</p>
            <h1 className="mt-3 font-serif text-4xl">Share what you liked most.</h1>
            <p className="mt-3 text-sm leading-7 text-purple-900/80">
              Your response helps the owner understand what stood out after the private video tour.
            </p>

            <form onSubmit={submitFeedback} className="mt-6 space-y-5">
              <div className="grid gap-2 sm:grid-cols-3">
                {feedbackChoices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => toggleChoice(choice)}
                    className={`rounded-2xl border px-4 py-3 text-xs font-bold ${
                      likedMost.includes(choice)
                        ? "border-purple-700 bg-purple-700 text-white"
                        : "border-purple-200 bg-white text-purple-950"
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-purple-700">Final comment, 200 characters max</span>
                <textarea
                  value={finalComment}
                  onChange={(event) => setFinalComment(event.target.value.slice(0, 200))}
                  rows={4}
                  className="ev-input resize-none bg-white"
                  placeholder="Leave a short final comment..."
                />
                <p className="mt-2 text-xs text-purple-800">{finalComment.length}/200 characters</p>
              </label>

              <button type="submit" className="w-full rounded-2xl bg-purple-700 py-4 text-sm font-bold text-white">
                Submit Feedback and Close Session
              </button>
            </form>
          </section>
        ) : activeTour.videoSessionStatus === "closed" ? (
          <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-slate-950 shadow-sm sm:p-8">
            <p className="section-kicker">Past video tour</p>
            <h1 className="mt-3 font-serif text-4xl">This session is closed.</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              This private video tour is saved as a past event and can no longer be reopened with this code.
            </p>
          </section>
        ) : (
          <section className="rounded-[2rem] border border-red-300 bg-red-950 p-6 text-red-50 shadow-2xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Private room entered</p>
            <h1 className="mt-3 font-serif text-5xl">Waiting for the owner.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-red-100/80">
              Your code is valid for {activeTour.property}. The live viewing stays locked until the owner starts the tour.
            </p>

            <div className="mt-7 grid min-h-[420px] place-items-center rounded-[2rem] border border-red-700 bg-black/25 text-center">
              <div>
                <div className="mx-auto grid size-20 place-items-center rounded-full bg-red-600 text-4xl shadow-2xl shadow-red-600/40">🔒</div>
                <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-red-200">Live feed locked</p>
                <p className="mt-2 text-xs text-red-100/70">The owner has not started the live viewing yet.</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}
