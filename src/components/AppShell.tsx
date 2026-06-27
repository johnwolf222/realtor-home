import { Link, useRouterState } from "@tanstack/react-router";
import { BadgeCheck, LogIn, MessageCircle, ShieldCheck, UserCircle, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { useRealtorProfile } from "@/lib/platformStore";
import { useAuth } from "@/lib/useAuth";

const navLinks = [
  { to: "/", label: "Profile" },
  { to: "/listings", label: "Listings" },
  { to: "/about", label: "About" },
  { to: "/saved", label: "Saved Homes" },
  { to: "/tours", label: "Tours" },
  { to: "/chat", label: "Chat" },
] as const;

const VERIFICATION_PROMPT_DELAY_MS = 5 * 60 * 1000;
const VERIFICATION_PROMPT_SESSION_START_KEY = "ev_verification_prompt_session_started_at";
const VERIFICATION_PROMPT_DISMISSED_KEY = "ev_verification_prompt_dismissed";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const realtor = useRealtorProfile();
  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-background pb-32 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img
              src={realtor.headshot}
              alt={realtor.name}
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-full border border-border object-cover shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">{realtor.name}</h1>
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                {realtor.title}
              </p>
            </div>
          </Link>

          <nav className="hidden">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  isActive(link.to)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={user ? "/account" : "/login"}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:px-5"
            >
              {user ? <UserCircle className="size-4" /> : <LogIn className="size-4" />}
              {user ? "Member Portal" : "Member Login"}
            </Link>
          </div>
        </div>

      </header>

      {children}

      <VerificationPrompt pathname={pathname} />

      <BottomNav />
    </div>
  );
}

function VerificationPrompt({ pathname }: { pathname: string }) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  const shouldPrompt = useMemo(() => {
    const blockedRoutes = ["/dashboard", "/login", "/register", "/forgot-password", "/onboarding", "/account"];
    if (blockedRoutes.some((route) => pathname.startsWith(route))) return false;
    if (user?.role === "realtor") return false;
    if (user?.verificationStatus === "verified" || user?.verificationStatus === "pending") return false;
    return true;
  }, [pathname, user?.role, user?.verificationStatus]);

  useEffect(() => {
    if (!shouldPrompt || typeof window === "undefined") {
      setIsVisible(false);
      return;
    }

    if (window.sessionStorage.getItem(VERIFICATION_PROMPT_DISMISSED_KEY) === "true") return;

    const now = Date.now();
    const startedAt = Number(window.sessionStorage.getItem(VERIFICATION_PROMPT_SESSION_START_KEY) || "0") || now;
    window.sessionStorage.setItem(VERIFICATION_PROMPT_SESSION_START_KEY, String(startedAt));

    const remaining = Math.max(0, startedAt + VERIFICATION_PROMPT_DELAY_MS - now);
    const timer = window.setTimeout(() => {
      if (window.sessionStorage.getItem(VERIFICATION_PROMPT_DISMISSED_KEY) !== "true") {
        setIsVisible(true);
      }
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [shouldPrompt]);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(VERIFICATION_PROMPT_DISMISSED_KEY, "true");
    }
    setIsVisible(false);
  };

  if (!isVisible || !shouldPrompt) return null;

  const isLoggedIn = Boolean(user);

  return (
    <div className="fixed inset-x-4 bottom-28 z-50 mx-auto max-w-md md:bottom-8 md:right-8 md:left-auto md:mx-0">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-primary text-primary-foreground shadow-2xl shadow-primary/30">
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div className="flex gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-white">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/60">Client Verification</p>
              <h2 className="mt-1 font-serif text-2xl text-white">Get verified for serious next steps.</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Verified members receive a trust mark in the portal and help the realtor prioritize tours, documents, and owner follow-up.
              </p>
            </div>
          </div>
          <button type="button" onClick={dismiss} aria-label="Dismiss verification reminder" className="rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/15 hover:text-white">
            <X className="size-4" />
          </button>
        </div>

        <div className="border-t border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/70">
            <BadgeCheck className="size-4 text-gold" />
            Camera-only Government ID verification is available in the member portal.
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              to={isLoggedIn ? "/account" : "/register"}
              onClick={dismiss}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-primary shadow-sm transition-opacity hover:opacity-90"
            >
              Get Started
            </Link>
            {isLoggedIn ? (
              <button type="button" onClick={dismiss} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15">
                Later
              </button>
            ) : (
              <Link to="/login" onClick={dismiss} className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15">
                Sign In First
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
