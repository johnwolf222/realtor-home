import type { LeadCapture, ConciergeSettings } from "@/lib/platformStore";
import type { ChatActionPayload, Property } from "@/lib/data";

export type SeriousConciergeIntent =
  | "greeting"
  | "property_search"
  | "tour"
  | "video_tour"
  | "contact"
  | "verification"
  | "documents"
  | "pricing"
  | "financing"
  | "offer"
  | "neighborhood"
  | "comparison"
  | "general";

export type SeriousConciergeAction =
  | "view_all"
  | "schedule_tour"
  | "video_tour"
  | "contact_call"
  | "contact_email"
  | "verification"
  | "upload_documents"
  | "owner_followup";

export type SeriousConciergeResponse = {
  intent: SeriousConciergeIntent;
  message: string;
  propertyIds: string[];
  actions: SeriousConciergeAction[];
  privateOwnerNote: string;
  priorityScore: number;
  shouldHandoff: boolean;
  mode: "live_ai" | "guided_fallback";
};

export type SeriousConciergeInput = {
  message: string;
  history: Array<{ from: "member" | "realtor"; text: string }>;
  lead: LeadCapture | null;
  properties: Property[];
  selectedPropertyTitle?: string;
  realtor: {
    name: string;
    title: string;
    brokerage: string;
    phone: string;
    email: string;
  };
  settings: ConciergeSettings;
  isLoggedIn: boolean;
};

export type SeriousConciergeClientResult = SeriousConciergeResponse & {
  actionCard?: ChatActionPayload;
  nextActions: string[];
};
