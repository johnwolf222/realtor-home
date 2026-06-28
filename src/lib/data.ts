import headshot from "@/assets/headshot.jpg";
import hero from "@/assets/hero.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import s1 from "@/assets/s1.jpg";
import s2 from "@/assets/s2.jpg";
import int1 from "@/assets/int1.jpg";
import int2 from "@/assets/int2.jpg";
import { realZillowListings } from "@/lib/realZillowListings";

export const images = { headshot, hero, p1, p2, p3, p4, s1, s2, int1, int2 };

export type VerificationStatus = "verified" | "pending" | "unverified";
export type ClientVerificationMethod = "Government ID" | "Pre-approval letter" | "Proof of funds" | "Manual owner review";

export type SocialLink = {
  label: string;
  short: string;
  url: string;
  enabled?: boolean;
};

export const realtor = {
  name: "Elena Valerius",
  title: "Georgia Luxury Advisor",
  license: "GA Lic. #8829402",
  brokerage: "Prestige Realty Group Georgia",
  phone: "+1 (310) 555-0192",
  email: "elena@prestigega.com",
  headshot,
  hero,
  tagline: "Excellence in Every Detail.",
  bio: "With over a decade representing the world's most exceptional properties, Elena pairs white-glove service with deep market intelligence. From first showing to final signature, every client receives a calm, concierge-level experience built on trust.",
  stats: [
    { label: "Closed Volume", value: "$480M+" },
    { label: "Homes Sold", value: "210+" },
    { label: "Avg. Days on Market", value: "21" },
    { label: "Client Rating", value: "5.0" },
  ],
  socials: [
    { label: "Instagram", short: "IG", url: "https://instagram.com", enabled: true },
    { label: "Facebook", short: "FB", url: "https://facebook.com", enabled: true },
    { label: "TikTok", short: "TT", url: "https://tiktok.com", enabled: true },
    { label: "LinkedIn", short: "in", url: "https://linkedin.com", enabled: true },
    { label: "YouTube", short: "YT", url: "https://youtube.com", enabled: true },
    { label: "Website", short: "WWW", url: "https://example.com", enabled: true },
  ],
};

export type PropertyType = "House";
export type PropertyStatus = "active" | "sold";

export type PropertyVideoTourChapterLabel =
  | "Front Yard"
  | "Entryway"
  | "Living Room"
  | "Kitchen"
  | "Master Bedroom"
  | "Guest Bedroom"
  | "Bathroom"
  | "Basement"
  | "Backyard";

export interface PropertyVideoTourChapter {
  label: PropertyVideoTourChapterLabel;
  timestamp: string;
  seconds: number;
}

export interface PropertyVideoTour {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  videoUrl: string;
  posterUrl?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  chapters: PropertyVideoTourChapter[];
}

export interface PropertyVideoTourView {
  id: string;
  propertyId: string;
  videoTourId: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  viewedAt: string;
  viewCount: number;
}

export interface PropertyVideoTourComment {
  id: string;
  propertyId: string;
  videoTourId: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  comment: string;
  liked: boolean;
  createdAt: string;
  chatThreadId?: string;
  chatMessageId?: string;
}

export const defaultPropertyVideoTourChapters: PropertyVideoTourChapter[] = [
  { label: "Front Yard", timestamp: "0:00", seconds: 0 },
  { label: "Entryway", timestamp: "0:45", seconds: 45 },
  { label: "Living Room", timestamp: "1:20", seconds: 80 },
  { label: "Kitchen", timestamp: "2:10", seconds: 130 },
  { label: "Master Bedroom", timestamp: "3:05", seconds: 185 },
  { label: "Guest Bedroom", timestamp: "4:00", seconds: 240 },
  { label: "Bathroom", timestamp: "4:40", seconds: 280 },
  { label: "Basement", timestamp: "5:25", seconds: 325 },
  { label: "Backyard", timestamp: "6:15", seconds: 375 },
];

export const propertyVideoTours: PropertyVideoTour[] = [];
export const propertyVideoTourViews: PropertyVideoTourView[] = [];
export const propertyVideoTourComments: PropertyVideoTourComment[] = [];


export interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  type: PropertyType;
  status: PropertyStatus;
  badges: string[];
  description: string;
  image?: string;
  gallery?: string[];
  sourceUrl?: string;
  photos: string[];
  lat: number;
  lng: number;
  // sold-only
  soldPrice?: number;
  represented?: "Buyer" | "Seller";
  soldDate?: string;
}

function normalizePropertyPhotos(property: Property): Property {
  const incoming = property as Property & { image?: string; gallery?: string[]; photos?: string[] };

  const photos = [
    ...(Array.isArray(incoming.photos) ? incoming.photos : []),
    ...(Array.isArray(incoming.gallery) ? incoming.gallery : []),
    ...(incoming.image ? [incoming.image] : []),
  ].filter(Boolean);

  const uniquePhotos = Array.from(new Set(photos));

  return {
    ...property,
    photos: uniquePhotos.length ? uniquePhotos : [images.hero],
    image: incoming.image || uniquePhotos[0] || images.hero,
    gallery: uniquePhotos.length ? uniquePhotos : [images.hero],
  };
}

export const properties: Property[] = (realZillowListings.length ? realZillowListings : originalLuxuryProperties).map((property) =>
  normalizePropertyPhotos(property as Property),
);
export const activeProperties = properties.filter((p) => p.status === "active");
export const soldProperties = properties.filter((p) => p.status === "sold");

export function getProperty(id: string) {
  return properties.find((p) => p.id === id);
}

export function similarTo(property: Property) {
  return activeProperties.filter((p) => p.id !== property.id).slice(0, 4);
}

// ---- Dashboard sample data ----

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  timeline: string;
  budget: string;
  interest: string;
  status: "New" | "Contacted" | "Touring" | "Closed";
  createdAt: string;
  verificationStatus?: VerificationStatus;
  verificationMethod?: ClientVerificationMethod | string;
  verificationSubmittedAt?: string;
  verificationDocumentName?: string;
  verificationDocumentCount?: number;
  verificationCaptureMethod?: string;
  verificationDocuments?: Record<string, string>;
  verificationNote?: string;
  source?: string;
  note?: string;
}

export const leads: Lead[] = [
  {
    id: "l1",
    name: "Marcus Chen",
    email: "marcus.chen@email.com",
    phone: "(310) 555-2841",
    timeline: "0-3 months",
    budget: "$3M – $5M",
    interest: "The Bel Air Glass Villa",
    status: "New",
    createdAt: "2h ago",
  },
  {
    id: "l2",
    name: "Sophia Laurent",
    email: "sophia.l@email.com",
    phone: "(424) 555-9920",
    timeline: "3-6 months",
    budget: "$1.5M – $2M",
    interest: "The Vista Penthouse",
    status: "Contacted",
    createdAt: "Yesterday",
  },
  {
    id: "l3",
    name: "David & Amara Okafor",
    email: "okafor.family@email.com",
    phone: "(213) 555-7733",
    timeline: "0-3 months",
    budget: "$6M+",
    interest: "Ocean Bluff Residence",
    status: "Touring",
    createdAt: "2 days ago",
  },
  {
    id: "l4",
    name: "Priya Anand",
    email: "priya.anand@email.com",
    phone: "(818) 555-1247",
    timeline: "Just browsing",
    budget: "$1M – $1.5M",
    interest: "Marble Row Condominium",
    status: "New",
    createdAt: "3 days ago",
  },
];

export interface TourRequest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  property: string;
  date: string;
  time: string;
  type: "In Person";
  status: "Requested" | "Confirmed";
  videoCodeCreatedAt?: string;
  videoClientMessageText?: string;
  videoClientMessageSentAt?: string;
  videoOwnerStartedAt?: string;
  videoOwnerEndedAt?: string;
  videoLikes?: number;
  videoFeedback?: {
    likedMost: string[];
    finalComment: string;
    submittedAt: string;
  };
}

export const tourRequests: TourRequest[] = [
  {
    id: "t1",
    name: "Marcus Chen",
    property: "The Bel Air Glass Villa",
    date: "Sat, Jun 20",
    time: "11:00 AM",
    type: "In Person",
    status: "Requested",
  },
  {
    id: "t2",
    name: "David & Amara Okafor",
    property: "Ocean Bluff Residence",
    date: "Sun, Jun 21",
    time: "2:30 PM",
    type: "In Person",
    status: "Confirmed",
  },
  {
    id: "t3",
    name: "Sophia Laurent",
    property: "The Vista Penthouse",
    date: "Mon, Jun 22",
    time: "5:00 PM",
    type: "In Person",
    status: "Requested",
  },
];

export type ChatActionButton = {
  label: string;
  href?: string;
  action?: "video" | "upload";
  kind?: "primary" | "secondary";
  external?: boolean;
};

export type ChatActionProperty = {
  id: string;
  title: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  photo: string;
};

export type ChatActionPayload = {
  title?: string;
  subtitle?: string;
  notice?: string;
  properties?: ChatActionProperty[];
  buttons?: ChatActionButton[];
};

export interface ChatMessage {
  id: string;
  from: "member" | "realtor";
  text: string;
  time: string;
  createdAt?: number;
  actions?: ChatActionPayload;
  kind?: "normal" | "system" | "timeout";
}

export interface ChatThread {
  id: string;
  name: string;
  email?: string;
  property: string;
  unread: number;
  verificationStatus?: VerificationStatus;
  messages: ChatMessage[];
}

export const chatThreads: ChatThread[] = [
  {
    id: "c1",
    name: "Marcus Chen",
    property: "The Bel Air Glass Villa",
    unread: 2,
    messages: [
      { id: "m1", from: "member", text: "Hi Elena! Is the Bel Air villa still available?", time: "9:02 AM" },
      { id: "m2", from: "realtor", text: "Hi Marcus — yes it is! We have an open house this Saturday.", time: "9:05 AM" },
      { id: "m3", from: "member", text: "Perfect. What are the HOA and property taxes like?", time: "9:08 AM" },
      { id: "m4", from: "member", text: "Also, could I get the floor plans?", time: "9:08 AM" },
    ],
  },
  {
    id: "c2",
    name: "Sophia Laurent",
    property: "The Vista Penthouse",
    unread: 0,
    messages: [
      { id: "m1", from: "member", text: "Loved the penthouse photos. Is parking included?", time: "Yesterday" },
      { id: "m2", from: "realtor", text: "Two reserved spaces plus valet for guests. Want to tour it?", time: "Yesterday" },
      { id: "m3", from: "member", text: "Yes please — Monday evening if possible.", time: "Yesterday" },
    ],
  },
  {
    id: "c3",
    name: "Priya Anand",
    property: "Marble Row Condominium",
    unread: 1,
    messages: [
      { id: "m1", from: "member", text: "What's the earliest move-in date for Marble Row?", time: "Tue" },
    ],
  },
];

export const timelineOptions = ["0-3 months", "3-6 months", "6-12 months", "Just browsing"];
export const budgetOptions = ["Under $1M", "$1M – $2M", "$2M – $4M", "$4M – $6M", "$6M+"];
