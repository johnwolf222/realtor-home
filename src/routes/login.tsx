import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/AuthFrame";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Member Sign In — Luxury Realtor Platform" },
      { name: "description", content: "Sign in to the private member portal for saved homes, tours, chat, and document preparation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, loginAsDemo } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Enter an email and password to continue.");
      return;
    }
    try {
      const next = login({ ...form, roleHint: "member" });
      toast.success(`Welcome back, ${next.name}.`);
      navigate({ to: "/account" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    }
  };

  const demoMember = () => {
    const next = loginAsDemo("member");
    toast.success("Member demo unlocked.");
    navigate({ to: "/account" });
  };

  return (
    <AuthFrame
      eyebrow="Member Access"
      title="Welcome back to your luxury member portal."
      subtitle="Sign in to save homes, request tours, chat with the realtor, and prepare documents. The private dashboard is not available from this page."
    >
      <div className="space-y-5">
        <div>
          <p className="section-kicker"><ShieldCheck className="size-3.5" /> Secure member sign in</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight">Member Portal</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This login is for members only. The owner dashboard is accessed privately from the profile dashboard icon.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="filter-label">Email</span>
            <div className="relative mt-2">
              <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="ev-input pl-11"
                placeholder="member@email.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="block">
            <span className="filter-label">Password</span>
            <div className="relative mt-2">
              <LockKeyhole className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="ev-input px-11"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" className="size-4 accent-current" defaultChecked /> Remember me
            </label>
            <Link to="/forgot-password" className="font-semibold text-foreground hover:underline">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
            Sign In Securely
          </button>
        </form>

        <div className="rounded-3xl border border-border bg-secondary/60 p-4 text-xs leading-5 text-muted-foreground">
          <p className="font-semibold text-foreground">Private dashboard rule</p>
          <p className="mt-1">No public realtor login. No invite-code access. No random dashboard accounts. The dashboard stays hidden behind the private profile icon and owner gate.</p>
          <button type="button" onClick={demoMember} className="mt-3 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary">
            Try member demo
          </button>
        </div>

        <div className="rounded-3xl border border-border bg-secondary/60 p-4 text-sm">
          <div className="flex items-start gap-3">
            <UserRound className="mt-0.5 size-4 text-accent-foreground" />
            <p className="leading-6 text-muted-foreground">
              New member? <Link to="/register" className="font-semibold text-foreground hover:underline">Create a member account</Link> to save homes, request tours, and start conversations.
            </p>
          </div>
        </div>
      </div>
    </AuthFrame>
  );
}
