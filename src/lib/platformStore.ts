import { useCallback, useEffect, useMemo, useState } from "react";
import {
  activeProperties,
  chatThreads as seedChatThreads,
  leads as seedLeads,
  properties as seedProperties,
  propertyVideoTourComments as seedPropertyVideoTourComments,
  propertyVideoTours as seedPropertyVideoTours,
  propertyVideoTourViews as seedPropertyVideoTourViews,
  realtor,
  tourRequests as seedTourRequests,
  defaultPropertyVideoTourChapters,
  type ChatActionPayload,
  type ChatMessage,
  type ChatThread,
  type Lead,
  type Property,
  type PropertyStatus,
  type PropertyVideoTour,
  type PropertyVideoTourChapter,
  type PropertyVideoTourComment,
  type PropertyVideoTourView,
  type SocialLink,
  type TourRequest,
  type VerificationStatus,
} from "@/lib/data";

const LEADS_KEY = "ev_platform_leads";
const TOURS_KEY = "ev_platform_tours";
const PROPERTY_VIDEO_TOURS_KEY = "ev_platform_property_video_tours";
const PROPERTY_VIDEO_TOUR_VIEWS_KEY = "ev_platform_property_video_tour_views";
const PROPERTY_VIDEO_TOUR_COMMENTS_KEY = "ev_platform_property_video_tour_comments";
const CHATS_KEY = "ev_platform_chats";
const PROFILE_KEY = "ev_platform_realtor_profile";
const NOTIFICATIONS_KEY = "ev_platform_notifications";
const PROPERTIES_KEY = "ev_platform_properties_ga_no_image_removed_v1";
const AI_SETTINGS_KEY = "ev_platform_ai_concierge_settings";

export type StoredRealtorProfile = Pick<
  typeof realtor,
  "name" | "title" | "license" | "brokerage" | "phone" | "email" | "bio" | "tagline"
> & {
  headshotUrl?: string;
  stats: typeof realtor.stats;
  socials: SocialLink[];
};

export type LeadCapture = {
  name: string;
  email: string;
  phone?: string;
  timeline?: string;
  budget?: string;
  interest: string;
  verificationStatus?: VerificationStatus;
  source?: string;
  message?: string;
};

export type ConciergeTone = "Luxury calm" | "High-ticket closer" | "Warm and friendly" | "Direct and efficient" | "Investor-focused";

export type ConciergeSettings = {
  agentName: string;
  tone: ConciergeTone;
  serviceArea: string;
  welcomeMessage: string;
  ownerHandoffMessage: string;
  autoReply: boolean;
  enableOwnerHandoff: boolean;
  handoffScore: number;
  financialDisclaimer: string;
  fairHousingNote: string;
  publicKnowledge: string;
  propertyKnowledge: string;
  tourKnowledge: string;
  websiteSupportKnowledge: string;
  fallbackKnowledge: string;
  chatKnowledgeRules: string;
  idleFollowUpMessage: string;
  goodbyeMessage: string;
  privateKnowledge: string;
  forbiddenPhrases: string;
  responseRules: string;
};

export const defaultConciergeSettings: ConciergeSettings = {
  agentName: "Valeria",
  tone: "High-ticket closer",
  serviceArea: "Atlanta, North Atlanta, Buckhead, Alpharetta, Sandy Springs, Savannah, and surrounding Georgia luxury markets",
  welcomeMessage: "I can help you compare homes, understand next steps, request tours, and prepare documents with a discreet, luxury-level experience.",
  ownerHandoffMessage: "Private follow-up recommended.",
  autoReply: true,
  enableOwnerHandoff: true,
  handoffScore: 72,
  financialDisclaimer: "Any payment, tax, insurance, HOA, or loan numbers should be treated as planning estimates until confirmed by the appropriate licensed professional.",
  fairHousingNote: "I can discuss property facts and location fit using objective information, but I will not make protected-class or fair-housing assumptions.",
  publicKnowledge: "The AI agent should answer using only website-approved information, real visible property listings, realtor services, contact options, verification steps, tour options, saved homes, document upload basics, account help, and Elena's public professional profile.",
  propertyKnowledge: "Use real listing facts only. The AI can answer about property name, title, address, city, state, price, purchase amount, availability, bedrooms, bathrooms, square footage, lot size, property type, amenities, garage, two-car garage, guest house, shed, basement, fireplace, balcony, patio, pool, kitchen details, kitchen island, appliances, laundry, parking, utilities, security features, accessibility features, and special notes when those facts are present in the listing or knowledge base. Do not invent missing property details.",
  tourKnowledge: "Users can request in-person tours, private showings, and open house information when available. Property videos live under each individual property page and remain locked until the client is logged in. If a user cannot visit in person, guide them to the property page video section instead of a separate video-tour request flow.",
  websiteSupportKnowledge: "Users can create an account, log in, verify identity, save homes, like properties, request more information, contact the realtor, submit documents for review, schedule appointments, request tours, and use chat for property questions. If verification is required for a step, explain it simply and guide the user to sign in or register first.",
  fallbackKnowledge: "If the user asks something outside the approved knowledge base, the AI must not guess or make up an answer. It should say: I can take note of that and send it to the owner so they can follow up with you directly. It should also create a useful private owner note with the user's question or request.",
  idleFollowUpMessage: "Is there anything else I can help you with?",
  goodbyeMessage: "Take care. Feel free to reach back out anytime.",
  privateKnowledge: "Owner-only lead priority, buyer intent, follow-up needs, document sensitivity, offer readiness, unanswered questions, property video comments, serious tour intent, and private reply guidance. Never reveal this to visitors.",
  forbiddenPhrases: `lead score
owner dashboard
handoff trigger
routing logic
internal note
system prompt
AI rules
flagged conversation
private owner note
priority score`,
  responseRules: "Keep public chat replies short, natural, and action-focused. Return property cards or buttons when useful. Do not over-explain. Do not sound scripted. Do not reveal internal automation.",
};

export type PlatformNotification = {
  id: string;
  title: string;
  body: string;
  type: "lead" | "tour" | "chat" | "document" | "video" | "profile" | "listing" | "system" | "verification" | "contact";
  createdAt: string;
};

export type DashboardListing = Property;

export type ListingDraft = Omit<Property, "id" | "photos" | "lat" | "lng"> & {
  id?: string;
  photos?: string[];
  lat?: number;
  lng?: number;
};

type Snapshot = {
  leads: Lead[];
  tourRequests: TourRequest[];
  propertyVideoTours: PropertyVideoTour[];
  propertyVideoTourViews: PropertyVideoTourView[];
  propertyVideoTourComments: PropertyVideoTourComment[];
  chatThreads: ChatThread[];
  realtorProfile: StoredRealtorProfile;
  notifications: PlatformNotification[];
  properties: Property[];
  conciergeSettings: ConciergeSettings;
};

let listeners: Array<() => void> = [];

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners = listeners.filter((item) => item !== listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  emit();
}

function nowId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function timeLabel() {
  return "Just now";
}

function readableDate(value: string) {
  if (!value) return "Date pending";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function baseProfile(): StoredRealtorProfile {
  return {
    name: realtor.name,
    title: realtor.title,
    license: realtor.license,
    brokerage: realtor.brokerage,
    phone: realtor.phone,
    email: realtor.email,
    bio: realtor.bio,
    tagline: realtor.tagline,
    headshotUrl: realtor.headshot,
    stats: realtor.stats,
    socials: realtor.socials.map((social) => ({ ...social, enabled: social.enabled !== false })),
  };
}

function readProperties() {
  return readJson<Property[]>(PROPERTIES_KEY, seedProperties);
}

export function getPublicProperties() {
  return readProperties();
}

export function getActivePublicProperties() {
  return readProperties().filter((property) => property.status === "active");
}

export function getSoldPublicProperties() {
  return readProperties().filter((property) => property.status === "sold");
}

function readConciergeSettings() {
  const stored = readJson<Partial<ConciergeSettings>>(AI_SETTINGS_KEY, {});
  return { ...defaultConciergeSettings, ...stored } as ConciergeSettings;
}

function readSnapshot(): Snapshot {
  return {
    leads: readJson<Lead[]>(LEADS_KEY, seedLeads),
    tourRequests: readJson<TourRequest[]>(TOURS_KEY, seedTourRequests),
    propertyVideoTours: readJson<PropertyVideoTour[]>(PROPERTY_VIDEO_TOURS_KEY, seedPropertyVideoTours),
    propertyVideoTourViews: readJson<PropertyVideoTourView[]>(PROPERTY_VIDEO_TOUR_VIEWS_KEY, seedPropertyVideoTourViews),
    propertyVideoTourComments: readJson<PropertyVideoTourComment[]>(PROPERTY_VIDEO_TOUR_COMMENTS_KEY, seedPropertyVideoTourComments),
    chatThreads: readJson<ChatThread[]>(CHATS_KEY, seedChatThreads),
    realtorProfile: readJson<StoredRealtorProfile>(PROFILE_KEY, baseProfile()),
    notifications: readJson<PlatformNotification[]>(NOTIFICATIONS_KEY, []),
    properties: readProperties(),
    conciergeSettings: readConciergeSettings(),
  };
}

function pushNotification(input: Omit<PlatformNotification, "id" | "createdAt">) {
  const current = readJson<PlatformNotification[]>(NOTIFICATIONS_KEY, []);
  const next = [
    {
      id: nowId("n"),
      createdAt: new Date().toISOString(),
      ...input,
    },
    ...current,
  ].slice(0, 75);
  writeJson(NOTIFICATIONS_KEY, next);
}

function upsertLead(capture: LeadCapture, status: Lead["status"] = "New") {
  const current = readJson<Lead[]>(LEADS_KEY, seedLeads);
  const existingIndex = current.findIndex(
    (lead) => normalize(lead.email) === normalize(capture.email) && lead.interest === capture.interest,
  );
  const existing = existingIndex >= 0 ? current[existingIndex] : undefined;
  const nextLead: Lead = {
    id: existing?.id || nowId("lead"),
    name: capture.name.trim() || "Private Member",
    email: normalize(capture.email || "member@example.com"),
    phone: capture.phone?.trim() || "Not provided",
    timeline: capture.timeline || "Not specified",
    budget: capture.budget || "Not specified",
    interest: capture.interest,
    status: existing?.status || status,
    createdAt: existing?.createdAt || timeLabel(),
    verificationStatus: capture.verificationStatus || existing?.verificationStatus || "unverified",
    verificationMethod: existing?.verificationMethod,
    verificationSubmittedAt: existing?.verificationSubmittedAt,
    verificationDocumentName: existing?.verificationDocumentName,
    verificationDocumentCount: existing?.verificationDocumentCount,
    verificationCaptureMethod: existing?.verificationCaptureMethod,
    verificationDocuments: existing?.verificationDocuments,
    verificationNote: existing?.verificationNote,
    source: capture.source || existing?.source || "Website lead capture",
    note: capture.message?.trim() || existing?.note,
  };

  const next = existingIndex >= 0
    ? current.map((lead, index) => (index === existingIndex ? nextLead : lead))
    : [nextLead, ...current];
  writeJson(LEADS_KEY, next);
  return nextLead;
}

function findPropertyTitle(propertyId?: string | null, fallback?: string) {
  const all = readProperties();
  if (!propertyId) return fallback || all.find((property) => property.status === "active")?.title || activeProperties[0]?.title || "Property not selected";
  return all.find((property) => property.id === propertyId)?.title || fallback || all[0]?.title || "Property not selected";
}

function threadKey(capture: LeadCapture) {
  return `${normalize(capture.email || "member@example.com")}::${capture.interest}`;
}

function makeThreadId(capture: LeadCapture) {
  return `thread_${threadKey(capture).replace(/[^a-z0-9]+/g, "_")}`;
}

function ensureThread(capture: LeadCapture) {
  const current = readJson<ChatThread[]>(CHATS_KEY, seedChatThreads);
  const id = makeThreadId(capture);
  const existing = current.find((thread) => thread.id === id);
  if (existing) return existing;

  const nextThread: ChatThread = {
    id,
    name: capture.name.trim() || "New Member",
    email: normalize(capture.email || "member@example.com"),
    property: capture.interest,
    unread: 0,
    verificationStatus: capture.verificationStatus || "unverified",
    messages: [
      {
        id: nowId("msg"),
        from: "realtor",
        text: `Hi ${capture.name.trim() || "there"}! I see you're interested in ${capture.interest}. How can I help?`,
        time: "Now",
        createdAt: Date.now(),
      },
      ...(capture.message?.trim()
        ? [
            {
              id: nowId("msg"),
              from: "member" as const,
              text: `Lead note: ${capture.message.trim()}`,
              time: "Now",
              createdAt: Date.now(),
            },
          ]
        : []),
    ],
  };
  writeJson(CHATS_KEY, [nextThread, ...current]);
  return nextThread;
}

function defaultBadges(status: PropertyStatus, badges?: string[]) {
  const clean = (badges || []).map((badge) => badge.trim()).filter(Boolean);
  if (clean.length) return clean;
  return status === "sold" ? ["Sold"] : ["Active"];
}

function makeListing(input: ListingDraft): Property {
  const status = input.status || "active";
  return {
    id: input.id || nowId("property"),
    title: input.title.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    price: Number(input.price) || 0,
    beds: Number(input.beds) || 0,
    baths: Number(input.baths) || 0,
    sqft: Number(input.sqft) || 0,
    type: input.type,
    status,
    badges: defaultBadges(status, input.badges),
    description: input.description?.trim() || "New listing details are being prepared by the realtor.",
    photos: input.photos?.length ? input.photos : [seedProperties[0].photos[0]],
    lat: input.lat ?? 33.7488,
    lng: input.lng ?? -84.3877,
    soldPrice: input.soldPrice ? Number(input.soldPrice) : undefined,
    represented: input.represented,
    soldDate: input.soldDate,
  };
}

export function selectedPropertyFromUrl() {
  const active = getActivePublicProperties();
  if (typeof window === "undefined") return active[0] || seedProperties[0];
  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get("propertyId");
  return readProperties().find((property) => property.id === propertyId) || active[0] || seedProperties[0];
}

export function usePublicProperties() {
  const [all, setAll] = useState<Property[]>(() => readProperties());

  useEffect(() => subscribe(() => setAll(readProperties())), []);

  return useMemo(
    () => ({
      properties: all,
      activeProperties: all.filter((property) => property.status === "active"),
      soldProperties: all.filter((property) => property.status === "sold"),
    }),
    [all],
  );
}

export function useRealtorProfile() {
  const [profile, setProfile] = useState(() => readSnapshot().realtorProfile);

  useEffect(() => subscribe(() => setProfile(readSnapshot().realtorProfile)), []);

  return {
    ...realtor,
    ...profile,
    headshot: profile.headshotUrl || realtor.headshot,
    hero: realtor.hero,
    stats: profile.stats || realtor.stats,
    socials: (profile.socials || realtor.socials).map((social) => ({ ...social, enabled: social.enabled !== false })),
  };
}

export function usePlatformData() {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => readSnapshot());

  useEffect(() => subscribe(() => setSnapshot(readSnapshot())), []);

  const addLead = useCallback((capture: LeadCapture) => {
    const lead = upsertLead(capture);
    pushNotification({
      type: "lead",
      title: "New member lead",
      body: `${lead.name} is interested in ${lead.interest}.`,
    });
    return lead;
  }, []);

  const updateLeadStatus = useCallback((id: string, status: Lead["status"]) => {
    const current = readJson<Lead[]>(LEADS_KEY, seedLeads);
    const next = current.map((lead) => (lead.id === id ? { ...lead, status } : lead));
    const lead = next.find((item) => item.id === id);
    writeJson(LEADS_KEY, next);
    if (lead) {
      pushNotification({ type: "lead", title: "Lead updated", body: `${lead.name} is now marked ${status}.` });
    }
  }, []);

  const deleteLead = useCallback((id: string) => {
    const current = readJson<Lead[]>(LEADS_KEY, seedLeads);
    const lead = current.find((item) => item.id === id);
    writeJson(LEADS_KEY, current.filter((item) => item.id !== id));
    if (lead) pushNotification({ type: "lead", title: "Lead removed", body: `${lead.name} was removed from the dashboard.` });
  }, []);

  const addTourRequest = useCallback(
    (input: LeadCapture & { date: string; time: string; type: TourRequest["type"] }) => {
      const lead = upsertLead(input, "Touring");
      const current = readJson<TourRequest[]>(TOURS_KEY, seedTourRequests);
      const nextTour: TourRequest = {
        id: nowId("tour"),
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone || "Not provided",
        property: input.interest,
        date: readableDate(input.date),
        time: input.time,
        type: input.type,
        status: "Requested",
      };
      writeJson(TOURS_KEY, [nextTour, ...current]);
      pushNotification({
        type: "tour",
        title: "New tour request",
        body: `${lead.name} requested a ${input.type.toLowerCase()} for ${input.interest} on ${nextTour.date} at ${nextTour.time}.`,
      });
      return nextTour;
    },
    [],
  );

  const updateTourRequest = useCallback((id: string, patch: Partial<TourRequest>) => {
    const current = readJson<TourRequest[]>(TOURS_KEY, seedTourRequests);
    const next = current.map((tour) => (tour.id === id ? { ...tour, ...patch } : tour));
    const tour = next.find((item) => item.id === id);
    writeJson(TOURS_KEY, next);
    if (tour) pushNotification({ type: "tour", title: "Tour updated", body: `${tour.name}'s tour is now ${tour.status}.` });
  }, []);

  const deleteTourRequest = useCallback((id: string) => {
    const current = readJson<TourRequest[]>(TOURS_KEY, seedTourRequests);
    const tour = current.find((item) => item.id === id);
    writeJson(TOURS_KEY, current.filter((item) => item.id !== id));
    if (tour) pushNotification({ type: "tour", title: "Tour removed", body: `${tour.name}'s tour request was removed.` });
  }, []);

  const confirmTourRequest = useCallback((id: string) => {
    updateTourRequest(id, { status: "Confirmed" });
  }, [updateTourRequest]);


  const upsertPropertyVideoTour = useCallback((input: {
    propertyId: string;
    title?: string;
    description?: string;
    videoUrl: string;
    posterUrl?: string;
    isEnabled?: boolean;
    chapters?: PropertyVideoTourChapter[];
  }) => {
    const cleanUrl = input.videoUrl.trim();

    if (!cleanUrl) {
      throw new Error("Video URL is required to save a property video tour.");
    }

    const current = readJson<PropertyVideoTour[]>(PROPERTY_VIDEO_TOURS_KEY, seedPropertyVideoTours);
    const existing = current.find((tour) => tour.propertyId === input.propertyId);
    const property = readProperties().find((item) => item.id === input.propertyId);
    const now = new Date().toISOString();

    const nextVideoTour: PropertyVideoTour = {
      id: existing?.id || nowId("pvt"),
      propertyId: input.propertyId,
      title: input.title?.trim() || existing?.title || `${property?.title || "Property"} Video Tour`,
      description: input.description?.trim() || existing?.description || "Owner-recorded walkthrough for this property.",
      videoUrl: cleanUrl,
      posterUrl: input.posterUrl?.trim() || existing?.posterUrl,
      isEnabled: input.isEnabled ?? existing?.isEnabled ?? true,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      chapters: input.chapters?.length
        ? input.chapters
        : existing?.chapters?.length
          ? existing.chapters
          : defaultPropertyVideoTourChapters,
    };

    const withoutThisProperty = current.filter((tour) => tour.propertyId !== input.propertyId);
    writeJson(PROPERTY_VIDEO_TOURS_KEY, [nextVideoTour, ...withoutThisProperty]);

    pushNotification({
      type: "video",
      title: existing ? "Property video updated" : "Property video added",
      body: `${nextVideoTour.title} is ${nextVideoTour.isEnabled ? "available" : "saved but locked"}.`,
    });

    return nextVideoTour;
  }, []);

  const removePropertyVideoTour = useCallback((propertyId: string) => {
    const currentTours = readJson<PropertyVideoTour[]>(PROPERTY_VIDEO_TOURS_KEY, seedPropertyVideoTours);
    const removed = currentTours.find((tour) => tour.propertyId === propertyId);

    writeJson(PROPERTY_VIDEO_TOURS_KEY, currentTours.filter((tour) => tour.propertyId !== propertyId));

    const currentViews = readJson<PropertyVideoTourView[]>(PROPERTY_VIDEO_TOUR_VIEWS_KEY, seedPropertyVideoTourViews);
    writeJson(PROPERTY_VIDEO_TOUR_VIEWS_KEY, currentViews.filter((view) => view.propertyId !== propertyId));

    const currentComments = readJson<PropertyVideoTourComment[]>(PROPERTY_VIDEO_TOUR_COMMENTS_KEY, seedPropertyVideoTourComments);
    writeJson(PROPERTY_VIDEO_TOUR_COMMENTS_KEY, currentComments.filter((comment) => comment.propertyId !== propertyId));

    if (removed) {
      pushNotification({
        type: "video",
        title: "Property video removed",
        body: `${removed.title} was removed from the property page.`,
      });
    }
  }, []);

  const recordPropertyVideoTourView = useCallback((input: {
    propertyId: string;
    videoTourId: string;
    clientId?: string;
    clientName: string;
    clientEmail: string;
  }) => {
    const current = readJson<PropertyVideoTourView[]>(PROPERTY_VIDEO_TOUR_VIEWS_KEY, seedPropertyVideoTourViews);
    const existingIndex = current.findIndex((view) =>
      view.videoTourId === input.videoTourId &&
      (
        Boolean(input.clientId && view.clientId === input.clientId) ||
        normalize(view.clientEmail) === normalize(input.clientEmail)
      ),
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const next = current.map((view, index) =>
        index === existingIndex
          ? {
              ...view,
              clientName: input.clientName || view.clientName,
              clientEmail: input.clientEmail || view.clientEmail,
              viewedAt: now,
              viewCount: view.viewCount + 1,
            }
          : view,
      );
      writeJson(PROPERTY_VIDEO_TOUR_VIEWS_KEY, next);
      return next[existingIndex];
    }

    const nextView: PropertyVideoTourView = {
      id: nowId("pvv"),
      propertyId: input.propertyId,
      videoTourId: input.videoTourId,
      clientId: input.clientId,
      clientName: input.clientName || "Client",
      clientEmail: input.clientEmail,
      viewedAt: now,
      viewCount: 1,
    };

    writeJson(PROPERTY_VIDEO_TOUR_VIEWS_KEY, [nextView, ...current]);
    return nextView;
  }, []);

  const togglePropertyVideoTourLike = useCallback((input: {
    propertyId: string;
    videoTourId: string;
    clientId?: string;
    clientName: string;
    clientEmail: string;
  }) => {
    const current = readJson<PropertyVideoTourComment[]>(PROPERTY_VIDEO_TOUR_COMMENTS_KEY, seedPropertyVideoTourComments);
    const existingIndex = current.findIndex((comment) =>
      comment.videoTourId === input.videoTourId &&
      (
        Boolean(input.clientId && comment.clientId === input.clientId) ||
        normalize(comment.clientEmail) === normalize(input.clientEmail)
      ),
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const next = current.map((comment, index) =>
        index === existingIndex
          ? { ...comment, liked: !comment.liked, createdAt: now }
          : comment,
      );
      writeJson(PROPERTY_VIDEO_TOUR_COMMENTS_KEY, next);
      return next[existingIndex];
    }

    const nextFeedback: PropertyVideoTourComment = {
      id: nowId("pvc"),
      propertyId: input.propertyId,
      videoTourId: input.videoTourId,
      clientId: input.clientId,
      clientName: input.clientName || "Client",
      clientEmail: input.clientEmail,
      comment: "",
      liked: true,
      createdAt: now,
    };

    writeJson(PROPERTY_VIDEO_TOUR_COMMENTS_KEY, [nextFeedback, ...current]);
    return nextFeedback;
  }, []);

  const addPropertyVideoTourComment = useCallback((input: {
    propertyId: string;
    videoTourId: string;
    clientId?: string;
    clientName: string;
    clientEmail: string;
    comment: string;
  }) => {
    const cleanComment = input.comment.trim().slice(0, 500);

    if (!cleanComment) {
      return undefined;
    }

    const property = readProperties().find((item) => item.id === input.propertyId);
    const videoTour = readJson<PropertyVideoTour[]>(PROPERTY_VIDEO_TOURS_KEY, seedPropertyVideoTours).find((tour) => tour.id === input.videoTourId);
    const now = new Date().toISOString();

    const thread = ensureThread({
      name: input.clientName || "Client",
      email: input.clientEmail,
      interest: property?.title || "Property video tour",
      source: "Property video tour comment",
      message: cleanComment,
    });

    const messageId = nowId("msg");
    const messageText = [
      `🎥 Property video comment for ${property?.title || "this property"}.`,
      "",
      cleanComment,
      "",
      `Video card: ${videoTour?.title || "Property Video Tour"}`,
      `Open property: /property/${input.propertyId}`,
    ].join("\\n");

    const chats = readJson<ChatThread[]>(CHATS_KEY, seedChatThreads);
    writeJson(CHATS_KEY, chats.map((item) =>
      item.id === thread.id
        ? {
            ...item,
            unread: item.unread + 1,
            messages: [
              ...item.messages,
              { id: messageId, from: "member" as const, text: messageText, time: "Now", createdAt: Date.now() },
            ],
          }
        : item,
    ));

    const current = readJson<PropertyVideoTourComment[]>(PROPERTY_VIDEO_TOUR_COMMENTS_KEY, seedPropertyVideoTourComments);
    const existingIndex = current.findIndex((comment) =>
      comment.videoTourId === input.videoTourId &&
      (
        Boolean(input.clientId && comment.clientId === input.clientId) ||
        normalize(comment.clientEmail) === normalize(input.clientEmail)
      ),
    );

    const nextComment: PropertyVideoTourComment = {
      id: existingIndex >= 0 ? current[existingIndex].id : nowId("pvc"),
      propertyId: input.propertyId,
      videoTourId: input.videoTourId,
      clientId: input.clientId,
      clientName: input.clientName || "Client",
      clientEmail: input.clientEmail,
      comment: cleanComment,
      liked: existingIndex >= 0 ? current[existingIndex].liked : false,
      createdAt: now,
      chatThreadId: thread.id,
      chatMessageId: messageId,
    };

    const next = existingIndex >= 0
      ? current.map((comment, index) => index === existingIndex ? nextComment : comment)
      : [nextComment, ...current];

    writeJson(PROPERTY_VIDEO_TOUR_COMMENTS_KEY, next);

    pushNotification({
      type: "video",
      title: "Property video comment",
      body: `${nextComment.clientName} commented on ${property?.title || "a property video"}.`,
    });

    return nextComment;
  }, []);

  const ensureChatThread = useCallback((capture: LeadCapture) => {
    upsertLead(capture);
    return ensureThread(capture);
  }, []);

  const addChatMessage = useCallback((threadId: string, from: ChatMessage["from"], text: string, actions?: ChatActionPayload) => {
    const current = readJson<ChatThread[]>(CHATS_KEY, seedChatThreads);
    const next = current.map((thread) => {
      if (thread.id !== threadId) return thread;
      return {
        ...thread,
        unread: from === "member" ? thread.unread + 1 : thread.unread,
        messages: [
          ...thread.messages,
          { id: nowId("msg"), from, text, time: "Now", createdAt: Date.now(), actions },
        ],
      };
    });
    writeJson(CHATS_KEY, next);
    const thread = next.find((item) => item.id === threadId);
    if (thread) {
      const isAiReply = from === "realtor" && (Boolean(actions) || text.startsWith("AI Concierge:"));
      pushNotification({
        type: text.startsWith("📎") ? "document" : "chat",
        title: from === "member"
          ? (text.startsWith("📎") ? "Document shared" : "New member message")
          : isAiReply
            ? "AI concierge replied"
            : "Owner reply sent",
        body: isAiReply
          ? `The AI concierge answered ${thread.name} about ${thread.property}.`
          : `${from === "member" ? thread.name : "You"} sent a message about ${thread.property}.`,
      });
    }
  }, []);

  const addSystemChatMessage = useCallback((threadId: string, text: string, kind: ChatMessage["kind"] = "system") => {
    const current = readJson<ChatThread[]>(CHATS_KEY, seedChatThreads);
    const next = current.map((thread) => {
      if (thread.id !== threadId) return thread;
      const last = thread.messages[thread.messages.length - 1];
      if (last?.kind === kind && last.text === text) return thread;
      return {
        ...thread,
        messages: [
          ...thread.messages,
          { id: nowId("msg"), from: "realtor" as const, text, time: "Now", createdAt: Date.now(), kind },
        ],
      };
    });
    writeJson(CHATS_KEY, next);
  }, []);

  const requestVideoCall = useCallback((capture: LeadCapture) => {
    const thread = ensureThread(capture);
    const text = `🎥 Video consultation requested for ${capture.interest}.`;
    const current = readJson<ChatThread[]>(CHATS_KEY, seedChatThreads);
    const next = current.map((item) =>
      item.id === thread.id
        ? { ...item, unread: item.unread + 1, messages: [...item.messages, { id: nowId("msg"), from: "member" as const, text, time: "Now", createdAt: Date.now() }] }
        : item,
    );
    writeJson(CHATS_KEY, next);
    pushNotification({ type: "video", title: "Video call requested", body: `${capture.name} requested a video consultation for ${capture.interest}.` });
  }, []);

  const markThreadRead = useCallback((threadId: string) => {
    const current = readJson<ChatThread[]>(CHATS_KEY, seedChatThreads);
    writeJson(CHATS_KEY, current.map((thread) => (thread.id === threadId ? { ...thread, unread: 0 } : thread)));
  }, []);

  const deleteChatThread = useCallback((threadId: string) => {
    const current = readJson<ChatThread[]>(CHATS_KEY, seedChatThreads);
    const thread = current.find((item) => item.id === threadId);
    writeJson(CHATS_KEY, current.filter((item) => item.id !== threadId));
    if (thread) pushNotification({ type: "chat", title: "Chat removed", body: `${thread.name}'s chat thread was removed.` });
  }, []);

  const updateConciergeSettings = useCallback((settings: ConciergeSettings) => {
    const clean: ConciergeSettings = {
      ...settings,
      agentName: settings.agentName.trim() || defaultConciergeSettings.agentName,
      serviceArea: settings.serviceArea.trim() || defaultConciergeSettings.serviceArea,
      welcomeMessage: settings.welcomeMessage.trim() || defaultConciergeSettings.welcomeMessage,
      ownerHandoffMessage: settings.ownerHandoffMessage.trim() || defaultConciergeSettings.ownerHandoffMessage,
      handoffScore: Math.max(25, Math.min(95, Number(settings.handoffScore) || defaultConciergeSettings.handoffScore)),
      financialDisclaimer: settings.financialDisclaimer.trim() || defaultConciergeSettings.financialDisclaimer,
      fairHousingNote: settings.fairHousingNote.trim() || defaultConciergeSettings.fairHousingNote,
      publicKnowledge: settings.publicKnowledge.trim() || defaultConciergeSettings.publicKnowledge,
      propertyKnowledge: settings.propertyKnowledge.trim() || defaultConciergeSettings.propertyKnowledge,
      tourKnowledge: settings.tourKnowledge.trim() || defaultConciergeSettings.tourKnowledge,
      websiteSupportKnowledge: settings.websiteSupportKnowledge.trim() || defaultConciergeSettings.websiteSupportKnowledge,
      fallbackKnowledge: settings.fallbackKnowledge.trim() || defaultConciergeSettings.fallbackKnowledge,
      chatKnowledgeRules: settings.chatKnowledgeRules.trim() || defaultConciergeSettings.chatKnowledgeRules,
      idleFollowUpMessage: settings.idleFollowUpMessage.trim() || defaultConciergeSettings.idleFollowUpMessage,
      goodbyeMessage: settings.goodbyeMessage.trim() || defaultConciergeSettings.goodbyeMessage,
      privateKnowledge: settings.privateKnowledge.trim() || defaultConciergeSettings.privateKnowledge,
      forbiddenPhrases: settings.forbiddenPhrases.trim() || defaultConciergeSettings.forbiddenPhrases,
      responseRules: settings.responseRules.trim() || defaultConciergeSettings.responseRules,
    };
    writeJson(AI_SETTINGS_KEY, clean);
    pushNotification({ type: "system", title: "AI concierge updated", body: `${clean.agentName} is now using the ${clean.tone.toLowerCase()} voice and a ${clean.handoffScore}/100 private follow-up trigger.` });
  }, []);

  const recordAiHandoff = useCallback((threadId: string, reason: string, score: number) => {
    const current = readJson<ChatThread[]>(CHATS_KEY, seedChatThreads);
    const thread = current.find((item) => item.id === threadId);
    if (!thread) return;
    pushNotification({
      type: "chat",
      title: score >= 82 ? "Serious member needs private follow-up" : "Private follow-up recommended",
      body: `${thread.name} scored ${score}/100 for ${thread.property}. Reason: ${reason}` ,
    });
  }, []);

  const updateRealtorProfile = useCallback((profile: StoredRealtorProfile) => {
    writeJson(PROFILE_KEY, profile);
    pushNotification({ type: "profile", title: "Profile updated", body: `${profile.name}'s public profile content was updated.` });
  }, []);

  const recordContactAction = useCallback((method: "call" | "email", context: string) => {
    const profile = readSnapshot().realtorProfile;
    pushNotification({
      type: "contact",
      title: method === "call" ? "Call button selected" : "Email button selected",
      body: method === "call"
        ? `A visitor selected a call button from ${context}. Phone opened for ${profile.phone || realtor.phone}.`
        : `A visitor selected an email button from ${context}. Email opened for ${profile.email || realtor.email}.`,
    });
  }, []);

  const addDashboardListing = useCallback((listing: ListingDraft) => {
    const current = readProperties();
    const nextListing = makeListing(listing);
    writeJson(PROPERTIES_KEY, [nextListing, ...current]);
    pushNotification({ type: "listing", title: "Listing added", body: `${nextListing.title} is now visible in the platform.` });
    return nextListing;
  }, []);

  const updateDashboardListing = useCallback((id: string, listing: ListingDraft) => {
    const current = readProperties();
    const existing = current.find((property) => property.id === id);
    if (!existing) return;
    const updated = makeListing({ ...existing, ...listing, id, photos: listing.photos?.length ? listing.photos : existing.photos, lat: listing.lat ?? existing.lat, lng: listing.lng ?? existing.lng });
    writeJson(PROPERTIES_KEY, current.map((property) => (property.id === id ? updated : property)));
    pushNotification({ type: "listing", title: "Listing updated", body: `${updated.title} was updated across the public site.` });
  }, []);

  const deleteDashboardListing = useCallback((id: string) => {
    const current = readProperties();
    const listing = current.find((property) => property.id === id);
    writeJson(PROPERTIES_KEY, current.filter((property) => property.id !== id));
    if (listing) pushNotification({ type: "listing", title: "Listing deleted", body: `${listing.title} was removed from the public site.` });
  }, []);

  const updateLeadVerification = useCallback((id: string, verificationStatus: VerificationStatus, note?: string) => {
    const current = readJson<Lead[]>(LEADS_KEY, seedLeads);
    const next = current.map((lead) =>
      lead.id === id
        ? {
            ...lead,
            verificationStatus,
            verificationNote: note || (verificationStatus === "verified" ? "Verified by owner dashboard." : verificationStatus === "pending" ? "Pending owner review." : "Not verified."),
            verificationSubmittedAt: verificationStatus === "unverified" ? lead.verificationSubmittedAt : lead.verificationSubmittedAt || timeLabel(),
          }
        : lead,
    );
    const lead = next.find((item) => item.id === id);
    writeJson(LEADS_KEY, next);
    if (lead) {
      const chats = readJson<ChatThread[]>(CHATS_KEY, seedChatThreads);
      writeJson(CHATS_KEY, chats.map((thread) =>
        (thread.email && normalize(thread.email) === normalize(lead.email)) || (thread.name === lead.name && thread.property === lead.interest)
          ? { ...thread, verificationStatus }
          : thread,
      ));
      pushNotification({
        type: "verification",
        title: verificationStatus === "verified" ? "Client verified" : verificationStatus === "pending" ? "Client verification pending" : "Client marked unverified",
        body: `${lead.name} is now marked ${verificationStatus}.`,
      });
    }
  }, []);

  const submitClientVerification = useCallback((input: {
    name: string;
    email: string;
    method: string;
    documentName?: string;
    documentCount?: number;
    captureMethod?: string;
    documents?: Record<string, string>;
  }) => {
    const current = readJson<Lead[]>(LEADS_KEY, seedLeads);
    const normalizedEmail = normalize(input.email);
    let found = false;
    const next = current.map((lead) => {
      if (normalize(lead.email) !== normalizedEmail) return lead;
      found = true;
      return {
        ...lead,
        verificationStatus: "pending" as VerificationStatus,
        verificationMethod: input.method,
        verificationDocumentName: input.documentName || lead.verificationDocumentName,
        verificationDocumentCount: input.documentCount || lead.verificationDocumentCount,
        verificationCaptureMethod: input.captureMethod || lead.verificationCaptureMethod,
        verificationDocuments: input.documents || lead.verificationDocuments,
        verificationSubmittedAt: timeLabel(),
        verificationNote: "Client submitted 3 live camera ID photos for owner review.",
      };
    });

    const finalLeads = found
      ? next
      : [
          {
            id: nowId("lead"),
            name: input.name.trim() || "Private Member",
            email: normalizedEmail,
            phone: "Not provided",
            timeline: "Not specified",
            budget: "Not specified",
            interest: "Client ID verification",
            status: "New" as const,
            createdAt: timeLabel(),
            verificationStatus: "pending" as VerificationStatus,
            verificationMethod: input.method,
            verificationDocumentName: input.documentName,
            verificationDocumentCount: input.documentCount,
            verificationCaptureMethod: input.captureMethod,
            verificationDocuments: input.documents,
            verificationSubmittedAt: timeLabel(),
            verificationNote: "Client submitted 3 live camera ID photos for owner review.",
            source: "Client ID verification",
            note: "Verification record created from the member account page.",
          },
          ...next,
        ];

    writeJson(LEADS_KEY, finalLeads);
    const chats = readJson<ChatThread[]>(CHATS_KEY, seedChatThreads);
    writeJson(CHATS_KEY, chats.map((thread) =>
      thread.email && normalize(thread.email) === normalizedEmail ? { ...thread, verificationStatus: "pending" as VerificationStatus } : thread,
    ));
    pushNotification({
      type: "verification",
      title: "Client ID verification submitted",
      body: `${input.name || input.email} submitted 3 live camera ID photos for owner review${found ? " for an existing lead" : ""}.`,
    });
  }, []);

  const clearNotifications = useCallback(() => {
    writeJson(NOTIFICATIONS_KEY, []);
  }, []);

  const clearPlatformData = useCallback(() => {
    if (typeof window === "undefined") return;
    [
      LEADS_KEY,
      TOURS_KEY,
      PROPERTY_VIDEO_TOURS_KEY,
      PROPERTY_VIDEO_TOUR_VIEWS_KEY,
      PROPERTY_VIDEO_TOUR_COMMENTS_KEY,
      CHATS_KEY,
      PROFILE_KEY,
      NOTIFICATIONS_KEY,
      PROPERTIES_KEY,
      AI_SETTINGS_KEY,
    ].forEach((key) => window.localStorage.removeItem(key));
    emit();
  }, []);

  return {
    ...snapshot,
    dashboardListings: snapshot.properties,
    activeProperties: snapshot.properties.filter((property) => property.status === "active"),
    soldProperties: snapshot.properties.filter((property) => property.status === "sold"),
    findPropertyTitle,
    addLead,
    updateLeadStatus,
    deleteLead,
    addTourRequest,
    updateTourRequest,
    deleteTourRequest,
    confirmTourRequest,
    upsertPropertyVideoTour,
    removePropertyVideoTour,
    recordPropertyVideoTourView,
    togglePropertyVideoTourLike,
    addPropertyVideoTourComment,
    ensureChatThread,
    addChatMessage,
    addSystemChatMessage,
    requestVideoCall,
    markThreadRead,
    deleteChatThread,
    updateConciergeSettings,
    recordAiHandoff,
    updateRealtorProfile,
    recordContactAction,
    addDashboardListing,
    updateDashboardListing,
    deleteDashboardListing,
    updateLeadVerification,
    submitClientVerification,
    clearNotifications,
    clearPlatformData,
  };
}
