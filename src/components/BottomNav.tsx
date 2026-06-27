import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarClock, Heart, Home, MessageCircle, Building2 } from "lucide-react";
import { useSaved } from "@/lib/useSaved";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { saved } = useSaved();

  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

  const leftItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/saved", label: "Saved", icon: Heart, badge: saved.length },
  ];

  const rightItems = [
    { to: "/chat", label: "Chat", icon: MessageCircle },
    { to: "/tours", label: "Tours", icon: CalendarClock },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 flex w-[88%] max-w-[430px] -translate-x-1/2 items-center justify-between rounded-[1.6rem] border border-border bg-card/95 px-5 py-3 shadow-2xl backdrop-blur-md">
      {leftItems.map((item) => (
        <NavItem key={item.to} {...item} active={isActive(item.to)} />
      ))}

      <Link
        to="/listings"
        aria-label="Browse listings"
        className="-mt-9 grid size-12 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Building2 className="size-5" />
      </Link>

      {rightItems.map((item) => (
        <NavItem key={item.to} {...item} active={isActive(item.to)} />
      ))}
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
  badge,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className={`relative flex min-w-12 flex-col items-center gap-1 transition-opacity ${
        active ? "opacity-100" : "opacity-50 hover:opacity-80"
      }`}
    >
      <span className="relative">
        <Icon className={`size-5 ${active ? "text-primary" : "text-foreground"}`} />
        {badge ? (
          <span className="absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
            {badge}
          </span>
        ) : null}
      </span>

      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>

      {active ? <span className="absolute -bottom-1.5 size-1 rounded-full bg-accent" /> : null}
    </Link>
  );
}
