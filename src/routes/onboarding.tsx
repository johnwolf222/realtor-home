import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, ClipboardList, HeartHandshake, Home, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/AuthFrame";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — Luxury Realtor Platform" },
      { name: "description", content: "Complete member or realtor onboarding." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

const memberGoals = ["Find a primary home", "Compare luxury properties", "Schedule private tours", "Prepare documents"];
const realtorGoals = ["Launch my profile", "Add listings", "Capture member leads", "Manage tours and chats"];

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, completeOnboarding, loginAsDemo } = useAuth();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [concierge, setConcierge] = useState(true);
  const [docs, setDocs] = useState(true);
  const [video, setVideo] = useState(true);

  const activeUser = user;
  const goals = activeUser?.role === "realtor" ? realtorGoals : memberGoals;
  const nextPath = "/account";

  const completion = useMemo(() => {
    let score = 45;
    if (selectedGoals.length) score += 25;
    if (concierge) score += 10;
    if (docs) score += 10;
    if (video) score += 10;
    return Math.min(score, 100);
  }, [concierge, docs, selectedGoals.length, video]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal],
    );
  };

  const finish = () => {
    if (!activeUser) {
      const demo = loginAsDemo("member");
      completeOnboarding({ preferredMarkets: demo.preferredMarkets, onboardingComplete: true });
      toast.success("Demo member onboarding completed.");
      navigate({ to: "/account" });
      return;
    }

    completeOnboarding();
    toast.success("Onboarding completed.");
    navigate({ to: nextPath });
  };

  return (
    <AuthFrame
      eyebrow="White-glove setup"
      title="Finish the portal experience before entering."
      subtitle="A premium onboarding sequence makes the platform feel valuable, guided, and ready for real members and agents."
    >
      <div className="space-y-6">
        <div>
          <p className="section-kicker"><Sparkles className="size-3.5" /> Onboarding</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight">
            {activeUser ? `Welcome, ${activeUser.name.split(" ")[0]}` : "Start with a demo account"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {activeUser
              ? `Complete setup for your ${activeUser.role === "realtor" ? "realtor command center" : "member portal"}.`
              : "No account found. Continue with a member demo or return to registration."}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-secondary/60 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Portal readiness</p>
              <p className="text-xs text-muted-foreground">Profile, preferences, documents, and video features</p>
            </div>
            <p className="font-serif text-3xl">{completion}%</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-card">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>

        <section>
          <p className="filter-label">Choose your goals</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {goals.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`flex items-start gap-3 rounded-3xl border p-4 text-left transition-colors ${
                  selectedGoals.includes(goal)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                <span className="text-sm font-semibold">{goal}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <ToggleRow icon={HeartHandshake} title="Concierge lead flow" text="Guide members toward chat, tours, and contact." checked={concierge} onChange={setConcierge} />
          <ToggleRow icon={ClipboardList} title="Document-ready portal" text="Show document upload/review placeholders." checked={docs} onChange={setDocs} />
          <ToggleRow icon={Building2} title="Video consultation ready" text="Show Zoom/video tour placeholders." checked={video} onChange={setVideo} />
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/register" className="rounded-2xl border border-border bg-card px-5 py-4 text-center text-xs font-semibold shadow-sm transition-colors hover:bg-secondary">
            Back to registration
          </Link>
          <button onClick={finish} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
            Enter Portal <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </AuthFrame>
  );
}

function ToggleRow({ icon: Icon, title, text, checked, onChange }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-secondary">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-secondary text-foreground">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs leading-5 text-muted-foreground">{text}</p>
        </div>
      </div>
      <span className={`grid size-7 place-items-center rounded-full ${checked ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
        {checked ? <CheckCircle2 className="size-4" /> : <Home className="size-3.5" />}
      </span>
    </button>
  );
}
