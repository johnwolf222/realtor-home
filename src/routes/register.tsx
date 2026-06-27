import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Check, Eye, EyeOff, Heart, KeyRound, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/AuthFrame";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Member Registration — Luxury Realtor Platform" },
      { name: "description", content: "Create a private member portal account for saved homes, tours, chat, and document review." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

const markets = ["Atlanta", "Buckhead", "Sandy Springs", "Alpharetta", "Roswell", "Savannah"];

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    buyingTimeline: "30-60 days",
    budgetRange: "$1M - $2M",
    preferredMarkets: ["Atlanta"],
    accept: false,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));

  const toggleMarket = (market: string) => {
    setForm((current) => ({
      ...current,
      preferredMarkets: current.preferredMarkets.includes(market)
        ? current.preferredMarkets.filter((item) => item !== market)
        : [...current.preferredMarkets, market],
    }));
  };

  const next = () => {
    if (step === 1 && (!form.name.trim() || !form.email.trim())) {
      toast.error("Enter your name and email to continue.");
      return;
    }
    if (step === 2 && (form.password.length < 8 || form.password !== form.confirm)) {
      toast.error("Password must be at least 8 characters and match the confirmation.");
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accept) {
      toast.error("Please accept the member account terms.");
      return;
    }
    const nextUser = register({
      role: "member",
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      buyingTimeline: form.buyingTimeline,
      budgetRange: form.budgetRange,
      preferredMarkets: form.preferredMarkets,
    });
    toast.success(`Welcome, ${nextUser.name}.`);
    navigate({ to: "/onboarding" });
  };

  return (
    <AuthFrame
      eyebrow="Member Registration"
      title="Create a private member portal."
      subtitle="Members can register to save homes, request tours, chat, and prepare documents. Dashboard access is owner-only and is not available through registration."
    >
      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className={`h-2 flex-1 rounded-full ${item <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        <div>
          <p className="section-kicker"><BadgeCheck className="size-3.5" /> Step {step} of 3</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight">
            {step === 1 && "Member details"}
            {step === 2 && "Secure password"}
            {step === 3 && "Preferences"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {step === 1 && "Tell the realtor who you are so saved homes, chats, and tour requests stay organized."}
            {step === 2 && "Create your member portal password. Dashboard access remains owner-only and is not available through registration."}
            {step === 3 && "Set your buying timeline, budget, and preferred markets."}
          </p>
        </div>

        {step === 1 && (
          <section className="space-y-4">
            <div className="rounded-3xl border border-border bg-secondary/60 p-4 text-xs leading-5 text-muted-foreground">
              <p className="flex items-center gap-2 font-semibold text-foreground"><KeyRound className="size-4" /> Owner dashboard is not public</p>
              <p className="mt-1">Other realtors cannot create dashboard accounts here. This registration is for members only.</p>
            </div>
            <Field label="Full Name" icon={UserRound}>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="ev-input pl-11" placeholder="Your full name" />
            </Field>
            <Field label="Email" icon={Mail}>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="ev-input pl-11" placeholder="name@email.com" />
            </Field>
            <Field label="Phone" icon={Phone}>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="ev-input pl-11" placeholder="+1 (___) ___-____" />
            </Field>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <label>
              <span className="filter-label">Password</span>
              <div className="relative mt-2">
                <LockKeyhole className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className="ev-input px-11"
                  placeholder="At least 8 characters"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            <label>
              <span className="filter-label">Confirm Password</span>
              <input type={showPassword ? "text" : "password"} value={form.confirm} onChange={(e) => set("confirm", e.target.value)} className="ev-input mt-2" placeholder="Repeat password" />
            </label>
            <div className="rounded-3xl border border-border bg-secondary/60 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4" /> Member portal includes</p>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <p>✓ Saved homes</p>
                <p>✓ Tour requests</p>
                <p>✓ Member chat</p>
                <p>✓ Document upload placeholder</p>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="filter-label">Buying Timeline</span>
                <select value={form.buyingTimeline} onChange={(e) => set("buyingTimeline", e.target.value)} className="ev-input mt-2">
                  <option>Immediately</option>
                  <option>30-60 days</option>
                  <option>3-6 months</option>
                  <option>Just browsing</option>
                </select>
              </label>
              <label>
                <span className="filter-label">Budget Range</span>
                <select value={form.budgetRange} onChange={(e) => set("budgetRange", e.target.value)} className="ev-input mt-2">
                  <option>$750K - $1M</option>
                  <option>$1M - $2M</option>
                  <option>$2M - $5M</option>
                  <option>$5M+</option>
                </select>
              </label>
            </div>

            <div>
              <span className="filter-label">Preferred Markets</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {markets.map((market) => (
                  <button
                    key={market}
                    type="button"
                    onClick={() => toggleMarket(market)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                      form.preferredMarkets.includes(market)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {market}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
              <input type="checkbox" checked={form.accept} onChange={(e) => set("accept", e.target.checked)} className="mt-1 size-4 accent-current" />
              <span>I agree to create a member account for saved homes, tours, chat, and document preparation.</span>
            </label>
          </section>
        )}

        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1} className="rounded-2xl border border-border bg-card px-5 py-3 text-xs font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-40">
            Back
          </button>
          {step < 3 ? (
            <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground shadow-sm">
              Continue <ArrowRight className="size-4" />
            </button>
          ) : (
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground shadow-sm">
              Create Member Account <Check className="size-4" />
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Already registered? <Link to="/login" className="font-semibold text-foreground hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthFrame>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="filter-label">{label}</span>
      <div className="relative mt-2">
        <Icon className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </label>
  );
}
