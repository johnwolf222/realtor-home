import { Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, KeyRound, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { realtor } from "@/lib/data";

const trustItems = [
  { icon: ShieldCheck, label: "Private member portal" },
  { icon: BadgeCheck, label: "Owner-only dashboard" },
  { icon: LockKeyhole, label: "Documents-ready workflow" },
];

export function AuthFrame({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,oklch(0.92_0.035_78),transparent_30%),linear-gradient(135deg,oklch(0.995_0.002_90),oklch(0.96_0.006_255))] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/75 px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur-xl transition-colors hover:bg-card">
          <ArrowLeft className="size-4" /> Back to site
        </Link>
        <div />
      </div>

      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/50 bg-primary text-primary-foreground shadow-2xl">
          <img src={realtor.hero} alt="Luxury home" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/88 to-primary/45" />
          <div className="relative flex min-h-[34rem] flex-col justify-between p-7 sm:p-10 lg:min-h-[44rem]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/75 backdrop-blur-xl">
                <Sparkles className="size-3.5" /> {eyebrow}
              </p>
              <h1 className="mt-7 max-w-2xl font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                {title}
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                {subtitle}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {trustItems.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                  <item.icon className="size-5 text-gold" />
                  <p className="mt-3 text-xs font-semibold text-white/85">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2.5rem] bg-white/45 blur-2xl" />
          <div className="relative rounded-[2rem] border border-border/70 bg-card/92 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-7 flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <KeyRound className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Secure Access</p>
                <p className="text-xs text-muted-foreground">Member portal · Private document workflow</p>
              </div>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
