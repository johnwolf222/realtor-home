import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthRole = "member" | "realtor";
export type RealtorAccessStatus = "not_required" | "owner_only";

export type AuthUser = {
  id: string;
  role: AuthRole;
  name: string;
  email: string;
  phone?: string;
  brokerage?: string;
  license?: string;
  buyingTimeline?: string;
  budgetRange?: string;
  preferredMarkets?: string[];
  avatarInitials: string;
  avatarUrl?: string;
  onboardingComplete: boolean;
  createdAt: string;
  realtorAccessStatus: RealtorAccessStatus;
  verificationStatus?: "verified" | "pending" | "unverified";
  verificationMethod?: string;
  verificationSubmittedAt?: string;
  verificationDocumentName?: string;
  verificationDocumentCount?: number;
  verificationCaptureMethod?: string;
  verificationDocuments?: Record<string, string>;
  verificationNote?: string;
  realtorApplicationId?: string;
  realtorAccessCodeUsed?: boolean;
  realtorVerificationNote?: string;
};

type RegisterInput = {
  role: AuthRole;
  name: string;
  email: string;
  phone?: string;
  password: string;
  brokerage?: string;
  license?: string;
  buyingTimeline?: string;
  budgetRange?: string;
  preferredMarkets?: string[];
  realtorAccessCode?: string;
};

type LoginInput = {
  email: string;
  password: string;
  roleHint?: AuthRole;
};

type UpdateOwnerPasswordInput = {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  ownerGateUnlocked: boolean;
  ownerNotificationEmail: string;
  register: (input: RegisterInput) => AuthUser;
  login: (input: LoginInput) => AuthUser;
  loginAsDemo: (role?: AuthRole) => AuthUser;
  verifyOwnerDashboardPassword: (password: string) => boolean;
  saveOwnerNotificationEmail: (email: string) => AuthUser;
  updateOwnerDashboardPassword: (input: UpdateOwnerPasswordInput) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  completeOnboarding: (updates?: Partial<AuthUser>) => void;
  logout: () => void;
};

const STORAGE_KEY = "realtor_profile_auth_user";
const KNOWN_EMAIL_KEY = "realtor_profile_registered_emails";
const OWNER_DASHBOARD_PASSWORD_KEY = "realtor_profile_owner_dashboard_password";
const OWNER_DASHBOARD_UNLOCK_KEY = "realtor_profile_owner_dashboard_unlocked";
const OWNER_NOTIFICATION_EMAIL_KEY = "realtor_profile_owner_notification_email";

export const DEFAULT_OWNER_DASHBOARD_PASSWORD = "1234567@";

const AuthContext = createContext<AuthContextValue | null>(null);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isEightCharacterPassword(value: string) {
  return value.length === 8;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getStoredOwnerPassword() {
  if (typeof window === "undefined") return DEFAULT_OWNER_DASHBOARD_PASSWORD;
  const saved = window.localStorage.getItem(OWNER_DASHBOARD_PASSWORD_KEY);
  if (!saved || saved === "12345678") return DEFAULT_OWNER_DASHBOARD_PASSWORD;
  return isEightCharacterPassword(saved) ? saved : DEFAULT_OWNER_DASHBOARD_PASSWORD;
}

function getStoredOwnerGateStatus() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(OWNER_DASHBOARD_UNLOCK_KEY) === "true";
}

function setStoredOwnerGateStatus(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    window.sessionStorage.setItem(OWNER_DASHBOARD_UNLOCK_KEY, "true");
  } else {
    window.sessionStorage.removeItem(OWNER_DASHBOARD_UNLOCK_KEY);
  }
}

function getStoredOwnerNotificationEmail() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(OWNER_NOTIFICATION_EMAIL_KEY) || "";
}

function setStoredOwnerNotificationEmail(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OWNER_NOTIFICATION_EMAIL_KEY, normalize(email));
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "EV";
}

function safeReadUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser & { role?: AuthRole | "buyer" };
    const normalizedRole = parsed.role === "buyer" ? "member" : parsed.role;
    return {
      ...parsed,
      id: parsed.id === "demo_buyer" ? "demo_member" : parsed.id,
      role: normalizedRole as AuthRole,
      realtorAccessStatus: parsed.realtorAccessStatus || (normalizedRole === "realtor" ? "owner_only" : "not_required"),
    };
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function rememberEmail(email: string) {
  if (typeof window === "undefined") return;
  try {
    const current = JSON.parse(window.localStorage.getItem(KNOWN_EMAIL_KEY) || "[]") as string[];
    const normalized = normalize(email);
    if (!current.includes(normalized)) {
      window.localStorage.setItem(KNOWN_EMAIL_KEY, JSON.stringify([...current, normalized]));
    }
  } catch {
    window.localStorage.setItem(KNOWN_EMAIL_KEY, JSON.stringify([normalize(email)]));
  }
}

function makeUser(input: RegisterInput): AuthUser {
  const role: AuthRole = "member";
  const name = input.name.trim() || "Private Member";

  return {
    id: `${role}_${Date.now()}`,
    role,
    name,
    email: normalize(input.email),
    phone: input.phone?.trim(),
    buyingTimeline: input.buyingTimeline,
    budgetRange: input.budgetRange,
    preferredMarkets: input.preferredMarkets || [],
    avatarInitials: initials(name),
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
    realtorAccessStatus: "not_required",
    verificationStatus: "unverified",
    verificationNote: "Client has not submitted ID verification yet.",
  };
}

function demoUser(role: AuthRole = "member", email?: string): AuthUser {
  if (role === "member") {
    return {
      id: "demo_member",
      role: "member",
      name: "Avery Morgan",
      email: email || "member.demo@example.com",
      phone: "+1 (404) 555-0177",
      buyingTimeline: "30-60 days",
      budgetRange: "$1.5M - $3M",
      preferredMarkets: ["Atlanta", "Buckhead", "Sandy Springs"],
      avatarInitials: "AM",
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
      realtorAccessStatus: "not_required",
      verificationStatus: "unverified",
      verificationNote: "Demo member has not been verified yet.",
    };
  }

  return {
    id: "owner_realtor",
    role: "realtor",
    name: "Elena Valerius",
    email: email || "owner@prestigega.com",
    phone: "+1 (404) 555-0192",
    brokerage: "Prestige Realty Group Georgia",
    license: "GA Lic. #8829402",
    preferredMarkets: ["Atlanta", "Buckhead", "Alpharetta"],
    avatarInitials: "EV",
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
    realtorAccessStatus: "owner_only",
    realtorVerificationNote: "Owner-only dashboard account protected by the private dashboard gate.",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ownerGateUnlocked, setOwnerGateUnlocked] = useState(false);
  const [ownerNotificationEmail, setOwnerNotificationEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(safeReadUser());
    setOwnerGateUnlocked(getStoredOwnerGateStatus());
    setOwnerNotificationEmail(getStoredOwnerNotificationEmail());
    setIsLoading(false);
  }, []);

  const setAndPersist = useCallback((next: AuthUser | null) => {
    setUser(next);
    persistUser(next);
  }, []);

  const register = useCallback(
    (input: RegisterInput) => {
      const next = makeUser(input);
      rememberEmail(next.email);
      setAndPersist(next);
      return next;
    },
    [setAndPersist],
  );

  const verifyOwnerDashboardPassword = useCallback((password: string) => {
    if (!isEightCharacterPassword(password)) {
      throw new Error("Owner password must be exactly 8 characters.");
    }
    if (password !== getStoredOwnerPassword()) {
      throw new Error("Incorrect owner password.");
    }
    setStoredOwnerGateStatus(true);
    setOwnerGateUnlocked(true);
    return true;
  }, []);

  const saveOwnerNotificationEmail = useCallback(
    (email: string) => {
      const normalizedEmail = normalize(email);
      if (!isValidEmail(normalizedEmail)) {
        throw new Error("Enter a valid notification email.");
      }
      if (!getStoredOwnerGateStatus()) {
        throw new Error("Unlock the dashboard gate before adding the notification email.");
      }
      setStoredOwnerNotificationEmail(normalizedEmail);
      setOwnerNotificationEmail(normalizedEmail);
      const next = demoUser("realtor", normalizedEmail);
      setAndPersist(next);
      return next;
    },
    [setAndPersist],
  );

  const login = useCallback(
    (input: LoginInput) => {
      const role = input.roleHint || "member";
      const normalizedEmail = normalize(input.email);

      if (role === "realtor") {
        if (!getStoredOwnerGateStatus()) {
          throw new Error("Unlock the private dashboard gate before opening the owner dashboard.");
        }
        const notificationEmail = getStoredOwnerNotificationEmail();
        if (!notificationEmail) {
          throw new Error("Add the dashboard notification email before opening the owner dashboard.");
        }
        const next = demoUser("realtor", notificationEmail);
        setAndPersist(next);
        return next;
      }

      const next = demoUser("member", normalizedEmail || "member.demo@example.com");
      setAndPersist(next);
      return next;
    },
    [setAndPersist],
  );

  const loginAsDemo = useCallback(
    (role: AuthRole = "member") => {
      if (role === "realtor") {
        if (!getStoredOwnerGateStatus()) {
          throw new Error("Unlock the private dashboard gate before opening the owner dashboard.");
        }
        const notificationEmail = getStoredOwnerNotificationEmail();
        if (!notificationEmail) {
          throw new Error("Add the dashboard notification email before opening the owner dashboard.");
        }
        const next = demoUser("realtor", notificationEmail);
        setAndPersist(next);
        return next;
      }
      const next = demoUser("member");
      setAndPersist(next);
      return next;
    },
    [setAndPersist],
  );

  const updateOwnerDashboardPassword = useCallback((input: UpdateOwnerPasswordInput) => {
    const currentPassword = input.currentPassword;
    const nextPassword = input.nextPassword;
    const confirmPassword = input.confirmPassword;

    if (!isEightCharacterPassword(currentPassword) || !isEightCharacterPassword(nextPassword) || !isEightCharacterPassword(confirmPassword)) {
      throw new Error("All owner password fields must be exactly 8 characters.");
    }
    if (currentPassword !== getStoredOwnerPassword()) {
      throw new Error("Current owner password is incorrect.");
    }
    if (nextPassword !== confirmPassword) {
      throw new Error("New owner password and confirmation do not match.");
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(OWNER_DASHBOARD_PASSWORD_KEY, nextPassword);
    }
    setStoredOwnerGateStatus(true);
    setOwnerGateUnlocked(true);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...updates };
      persistUser(next);
      return next;
    });
  }, []);

  const completeOnboarding = useCallback((updates?: Partial<AuthUser>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...updates, onboardingComplete: true };
      persistUser(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setStoredOwnerGateStatus(false);
    setOwnerGateUnlocked(false);
    setAndPersist(null);
  }, [setAndPersist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      ownerGateUnlocked,
      ownerNotificationEmail,
      register,
      login,
      loginAsDemo,
      verifyOwnerDashboardPassword,
      saveOwnerNotificationEmail,
      updateOwnerDashboardPassword,
      updateUser,
      completeOnboarding,
      logout,
    }),
    [
      completeOnboarding,
      isLoading,
      login,
      loginAsDemo,
      logout,
      ownerGateUnlocked,
      ownerNotificationEmail,
      register,
      saveOwnerNotificationEmail,
      updateOwnerDashboardPassword,
      updateUser,
      user,
      verifyOwnerDashboardPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
