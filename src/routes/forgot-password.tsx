import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/AuthFrame";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Luxury Realtor Platform" },
      { name: "description", content: "Request a password reset for your portal account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    setSent(true);
    toast.success("Reset instructions prepared.");
  };

  return (
    <AuthFrame
      eyebrow="Account Recovery"
      title="Reset access without breaking the luxury experience."
      subtitle="This page completes the auth journey with a polished password recovery flow that can later connect to Supabase email resets."
    >
      <form onSubmit={submit} className="space-y-6">
        <div>
          <p className="section-kicker"><ShieldCheck className="size-3.5" /> Secure recovery</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight">Forgot Password</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter your email and we’ll prepare password reset instructions. In production, this sends through Supabase Auth.
          </p>
        </div>

        <label className="block">
          <span className="filter-label">Email</span>
          <div className="relative mt-2">
            <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ev-input pl-11" placeholder="name@email.com" />
          </div>
        </label>

        {sent && (
          <div className="rounded-3xl border border-border bg-secondary p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="size-4" /> Reset flow ready</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">A real reset email provider can be connected next. For now, return to login and use demo access.</p>
          </div>
        )}

        <button type="submit" className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
          Send Reset Instructions
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Remembered it? <Link to="/login" className="font-semibold text-foreground hover:underline">Back to login</Link>
        </p>
      </form>
    </AuthFrame>
  );
}
