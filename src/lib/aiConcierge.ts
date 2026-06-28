import type { ChatActionPayload, Property, PropertyType } from "@/lib/data";
import type { ConciergeSettings, LeadCapture } from "@/lib/platformStore";
import { formatPrice, shortPrice } from "@/lib/format";

export type ConciergeIntent =
  | "greeting"
  | "search"
  | "tour"
  | "video"
  | "documents"
  | "pricing"
  | "monthly-cost"
  | "availability"
  | "comparison"
  | "neighborhood"
  | "offer"
  | "financing"
  | "features"
  | "contact"
  | "verification"
  | "general";

export type ConciergeReply = {
  intent: ConciergeIntent;
  priorityScore: number;
  priorityLabel: string;
  text: string;
  nextActions: string[];
  actionCard?: ChatActionPayload;
};

const moneyKeywords = ["price", "cost", "payment", "monthly", "mortgage", "tax", "hoa", "afford", "down payment"];
const tourKeywords = ["tour", "show", "showing", "visit", "walk through", "walkthrough", "appointment", "see it"];
const docKeywords = ["document", "docs", "pre approval", "preapproval", "proof of funds", "disclosure", "sign", "signature", "paperwork", "offer letter"];
const videoKeywords = ["video", "zoom", "virtual", "facetime"];
const offerKeywords = ["offer", "bid", "negotiate", "asking", "below", "over asking", "contingency"];
const neighborhoodKeywords = ["area", "neighborhood", "school", "commute", "walk", "nearby", "location", "safe"];
const compareKeywords = ["compare", "similar", "another", "other homes", "options", "recommend", "match"];
const availabilityKeywords = ["available", "still", "status", "open house", "active"];
const searchKeywords = ["home", "homes", "house", "houses", "property", "properties", "listing", "listings", "bedroom", "bed", "bath", "under", "over", "between", "range"];
const contactKeywords = ["contact", "phone", "call", "text", "email", "number", "reach", "speak", "talk to", "get in touch"];
const verificationKeywords = ["verify", "verified", "verification", "id", "identity", "account verified", "client id"];

export const memberQuickPrompts = [
  "Show me homes under $2M",
  "Can I schedule a private tour?",
  "Can we do a property video?",
  "How do I contact Elena?",
  "How do I verify my account?",
  "Compare this with similar homes.",
  "What documents should I prepare?",
  "What is the smartest next step?",
];

function hasAny(message: string, words: string[]) {
  return words.some((word) => message.includes(word));
}

function isGreetingOnly(message: string) {
  const clean = message.toLowerCase().trim().replace(/[.!?]+$/g, "");
  if (!clean) return false;
  const simpleGreetings = [
    "hi",
    "hello",
    "hey",
    "yo",
    "good morning",
    "good afternoon",
    "good evening",
    "how are you",
    "how are you doing",
    "are you there",
    "can you help",
    "can you help me",
    "help",
  ];
  if (simpleGreetings.includes(clean)) return true;
  return /^(hi|hello|hey|good morning|good afternoon|good evening)\s+(there|valeria|elena)?$/.test(clean);
}

function isSearchQuestion(message: string) {
  const clean = message.toLowerCase();
  const mentionsHome = hasAny(clean, searchKeywords);
  const hasPriceSignal = /\$\s*\d|\bunder\b|\bover\b|\bbetween\b|\bup to\b|\bwithin\b|\b\d+(\.\d+)?\s*(m|million|k|thousand)\b/.test(clean);
  const hasBedBathSignal = /\b\d+\s*(bed|bedroom|bath|bathroom)s?\b/.test(clean);
  const asksToFind = /\b(show|find|send|recommend|suggest|what do you have|available)\b/.test(clean);
  return mentionsHome && (hasPriceSignal || hasBedBathSignal || asksToFind);
}

function detectIntent(message: string): ConciergeIntent {
  const clean = message.toLowerCase();
  if (isGreetingOnly(clean)) return "greeting";
  if (hasAny(clean, verificationKeywords)) return "verification";
  if (isSearchQuestion(clean)) return "search";
  if (hasAny(clean, tourKeywords)) return "tour";
  if (hasAny(clean, videoKeywords)) return "video";
  if (hasAny(clean, docKeywords)) return "documents";
  if (hasAny(clean, contactKeywords)) return "contact";
  if (hasAny(clean, availabilityKeywords)) return "availability";
  if (hasAny(clean, compareKeywords)) return "comparison";
  if (hasAny(clean, neighborhoodKeywords)) return "neighborhood";
  if (hasAny(clean, offerKeywords)) return "offer";
  if (clean.includes("finance") || clean.includes("loan") || clean.includes("lender")) return "financing";
  if (hasAny(clean, moneyKeywords)) return "monthly-cost";
  if (clean.includes("bed") || clean.includes("bath") || clean.includes("sqft") || clean.includes("feature") || clean.includes("pool")) return "features";
  if (clean.includes("price") || clean.includes("worth") || clean.includes("value")) return "pricing";
  return "general";
}

function findProperty(propertyTitle: string | undefined, properties: Property[]) {
  if (!propertyTitle) return properties.find((property) => property.status === "active") || properties[0];
  return properties.find((property) => property.title === propertyTitle) || properties.find((property) => property.status === "active") || properties[0];
}

function estimateMonthly(price: number) {
  const twentyPercentDown = price * 0.2;
  const loan = price - twentyPercentDown;
  const estimatedPrincipalInterest = loan * 0.0068;
  const estimatedTaxes = price * 0.00092;
  const estimatedInsurance = price * 0.00012;
  const total = estimatedPrincipalInterest + estimatedTaxes + estimatedInsurance;
  return {
    down: Math.round(twentyPercentDown),
    total: Math.round(total),
  };
}

function matchSimilar(property: Property, properties: Property[]) {
  return properties
    .filter((item) => item.status === "active" && item.id !== property.id)
    .sort((a, b) => {
      const scoreA = Math.abs(a.price - property.price) + (a.type === property.type ? 0 : 1_000_000) + Math.abs(a.beds - property.beds) * 250_000;
      const scoreB = Math.abs(b.price - property.price) + (b.type === property.type ? 0 : 1_000_000) + Math.abs(b.beds - property.beds) * 250_000;
      return scoreA - scoreB;
    })
    .slice(0, 3);
}

function scoreLead(lead: LeadCapture | null, message: string) {
  let score = 42;
  const clean = message.toLowerCase();
  if (lead?.phone && lead.phone !== "Not provided") score += 8;
  if (lead?.timeline?.includes("0-3")) score += 24;
  if (lead?.timeline?.includes("3-6")) score += 14;
  if (lead?.budget?.includes("$6M") || lead?.budget?.includes("$4M")) score += 12;
  if (hasAny(clean, tourKeywords)) score += 12;
  if (hasAny(clean, docKeywords)) score += 10;
  if (hasAny(clean, offerKeywords)) score += 12;
  if (hasAny(clean, contactKeywords)) score += 8;
  if (isSearchQuestion(clean)) score += 6;
  return Math.min(98, score);
}

function priorityLabel(score: number) {
  if (score >= 82) return "Private priority";
  if (score >= 65) return "Serious interest";
  if (score >= 50) return "Qualified inquiry";
  return "Exploring";
}

function firstNameOf(lead: LeadCapture | null) {
  return lead?.name?.trim()?.split(/\s+/)[0] || "Absolutely";
}

function opening(lead: LeadCapture | null, intent: ConciergeIntent) {
  const firstName = firstNameOf(lead);

  switch (intent) {
    case "greeting":
      return firstName === "Absolutely" ? "Hi — I can help." : `Hi ${firstName} — I can help.`;
    case "search":
      return `${firstName}, I found a few options worth looking at.`;
    case "tour":
      return `${firstName}, yes — seeing it in person would answer the right questions.`;
    case "video":
      return `${firstName}, a property video is a practical first step.`;
    case "documents":
      return `${firstName}, yes. Keep the paperwork simple until there is a clear reason to share more.`;
    case "monthly-cost":
    case "financing":
      return `${firstName}, I can give you a rough planning view.`;
    case "availability":
      return `${firstName}, let’s confirm the status before you spend time on it.`;
    case "comparison":
      return `${firstName}, comparison is where buyers usually make the better decision.`;
    case "offer":
      return `${firstName}, before talking offer strategy, the buying position needs to be clear.`;
    case "contact":
      return `${firstName}, you can reach Elena directly.`;
    case "verification":
      return `${firstName}, yes — verification is handled through your member account.`;
    default:
      return `${firstName}, I can help with that.`;
  }
}

function propertyLine(property: Property) {
  return `${property.title}: ${property.beds} bedrooms, ${property.baths} baths, ${property.sqft.toLocaleString()} sq ft, listed at ${formatPrice(property.price)} in ${property.city}.`;
}

function complianceLine(intent: ConciergeIntent, settings: ConciergeSettings) {
  if (intent === "monthly-cost" || intent === "financing") {
    return settings.financialDisclaimer;
  }
  if (intent === "neighborhood") {
    return settings.fairHousingNote;
  }
  return "";
}

function closeLine(intent: ConciergeIntent) {
  switch (intent) {
    case "greeting":
      return "";
    case "search":
      return "Start with the homes that match your budget and lifestyle, then narrow by layout, privacy, location, and whether the home still feels right once you see it.";
    case "tour":
      return "Choose a tour window only if the home fits your real needs on paper. A good showing should confirm fit, not create confusion.";
    case "documents":
      return "Send only what is necessary for the conversation. Save sensitive details for formal review.";
    case "video":
      return "Ask to see the entry, main living flow, kitchen, primary suite, outdoor space, and anything the photos do not answer.";
    case "monthly-cost":
    case "financing":
      return "Use this as a planning range, then verify the numbers with a lender before making a decision.";
    case "offer":
      return "Get proof of funds or pre-approval ready first. A clean buying position changes the conversation.";
    case "comparison":
      return "Start with lifestyle fit, then compare price, condition, privacy, and resale story.";
    case "availability":
      return "I’d confirm availability first, then decide whether a tour is worth your time.";
    case "contact":
      return "Use whichever method is easiest for you. If this is time-sensitive, calling is usually the cleanest move.";
    case "verification":
      return "Once verified, tour requests and document conversations are easier to keep organized inside your account.";
    default:
      return "";
  }
}

function joinReply(parts: string[]) {
  return parts.filter((part) => part.trim().length > 0).join("\n\n");
}

function toMoney(raw: string, unit?: string) {
  const value = Number(raw.replace(/,/g, ""));
  const cleanUnit = (unit || "").toLowerCase();
  if (cleanUnit.startsWith("m") || cleanUnit === "million") return value * 1_000_000;
  if (cleanUnit.startsWith("k") || cleanUnit === "thousand") return value * 1_000;
  if (value < 1000) return value * 1_000_000;
  return value;
}

function parsePriceRange(message: string) {
  const clean = message.toLowerCase();
  const hasPriceContext = /\$|\b(price|budget|range|under|below|less than|over|above|between|up to|within)\b|\d+(\.\d+)?\s*(m|million|k|thousand)\b/.test(clean);
  if (!hasPriceContext) return {};

  const amounts = [...clean.matchAll(/\$?\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?\b/g)]
    .map((match) => toMoney(match[1], match[2]))
    .filter((amount) => amount >= 100_000);

  if (!amounts.length) return {};

  if (/\bbetween\b|\bfrom\b/.test(clean) && amounts.length >= 2) {
    return { minPrice: Math.min(amounts[0], amounts[1]), maxPrice: Math.max(amounts[0], amounts[1]) };
  }
  if (/\bover\b|\babove\b|\bmore than\b/.test(clean)) return { minPrice: amounts[0] };
  return { maxPrice: amounts[0] };
}

function parseCount(message: string, words: string[]) {
  const pattern = new RegExp(`\\b(\\d+)\\s*(${words.join("|")})s?\\b`);
  const match = message.toLowerCase().match(pattern);
  return match ? Number(match[1]) : undefined;
}

function parseType(message: string): PropertyType | undefined {
  const clean = message.toLowerCase();
  if (clean.includes("penthouse")) return "Penthouse";
  if (clean.includes("condo")) return "Condo";
  if (clean.includes("villa")) return "Villa";
  if (clean.includes("house") || clean.includes("home") || clean.includes("estate")) return "House";
  return undefined;
}

function parseLocation(message: string) {
  const clean = message.toLowerCase();
  const cities = ["atlanta", "buckhead", "savannah", "roswell", "alpharetta", "sandy springs", "vinings"];
  return cities.find((city) => clean.includes(city));
}

function propertyToAction(property: Property) {
  return {
    id: property.id,
    title: property.title,
    city: property.city,
    price: property.price,
    beds: property.beds,
    baths: property.baths,
    sqft: property.sqft,
    photo: property.photos[0],
  };
}

function makeFilterUrl(input: { query?: string; type?: PropertyType; minBeds?: number; minBaths?: number; maxPrice?: number }) {
  const params = new URLSearchParams();
  if (input.query) params.set("q", input.query);
  if (input.type) params.set("type", input.type);
  if (input.minBeds) params.set("beds", String(input.minBeds));
  if (input.minBaths) params.set("baths", String(input.minBaths));
  if (input.maxPrice) params.set("maxPrice", String(input.maxPrice));
  params.set("sort", "price-asc");
  return `/listings?${params.toString()}`;
}

function matchSearchProperties(message: string, properties: Property[]) {
  const clean = message.toLowerCase();
  const active = properties.filter((property) => property.status === "active");
  const { minPrice, maxPrice } = parsePriceRange(clean);
  const minBeds = parseCount(clean, ["bed", "bedroom"]);
  const minBaths = parseCount(clean, ["bath", "bathroom"]);
  const type = parseType(clean);
  const location = parseLocation(clean);

  const matches = active.filter((property) => {
    if (minPrice && property.price < minPrice) return false;
    if (maxPrice && property.price > maxPrice) return false;
    if (minBeds && property.beds < minBeds) return false;
    if (minBaths && property.baths < minBaths) return false;
    if (type && property.type !== type) return false;
    if (location) {
      const searchBlob = `${property.title} ${property.address} ${property.city}`.toLowerCase();
      if (!searchBlob.includes(location)) return false;
    }
    return true;
  });

  const fallback = active
    .slice()
    .sort((a, b) => {
      const anchor = maxPrice || minPrice || active.reduce((sum, item) => sum + item.price, 0) / Math.max(active.length, 1);
      return Math.abs(a.price - anchor) - Math.abs(b.price - anchor);
    })
    .slice(0, 3);

  return {
    matches: (matches.length ? matches : fallback).slice(0, 3),
    filterUrl: makeFilterUrl({ query: location, type, minBeds, minBaths, maxPrice }),
    minBeds,
    minBaths,
    maxPrice,
  };
}

function propertyActionCard(property: Property, title = "Next steps for this property"): ChatActionPayload {
  return {
    title,
    subtitle: `${shortPrice(property.price)} · ${property.beds} bed · ${property.baths} bath · ${property.city}`,
    properties: [propertyToAction(property)],
    buttons: [
      { label: "View property", href: `/property/${property.id}`, kind: "secondary" },
      { label: "Schedule private tour", href: `/tours?propertyId=${property.id}`, kind: "primary" },
      { label: "View property video", href: `/property/${property.id}#property-video-tour`, kind: "secondary" },
    ],
  };
}

export function buildConciergeReply(args: {
  memberMessage: string;
  lead: LeadCapture | null;
  propertyTitle?: string;
  properties: Property[];
  realtorName: string;
  realtorPhone?: string;
  realtorEmail?: string;
  settings: ConciergeSettings;
  isLoggedIn?: boolean;
}): ConciergeReply {
  const intent = detectIntent(args.memberMessage);
  const property = findProperty(args.propertyTitle || args.lead?.interest, args.properties);
  const similar = matchSimilar(property, args.properties);
  const search = matchSearchProperties(args.memberMessage, args.properties);
  const score = scoreLead(args.lead, args.memberMessage);
  const monthly = estimateMonthly(property.price);
  const intro = opening(args.lead, intent);
  const details = propertyLine(property);
  const compliance = complianceLine(intent, args.settings);
  const actions: string[] = [];
  let body = "";
  let actionCard: ChatActionPayload | undefined;

  switch (intent) {
    case "greeting":
      body = "What would you like to do today? You can ask me to find homes by budget or location, schedule a private tour, open a property video, contact Elena, or help with account verification.";
      actions.push("Show me homes under $2M", "Schedule a private tour", "Contact Elena");
      actionCard = {
        title: "How can I help?",
        subtitle: "Choose a starting point, or type what you are looking for.",
        buttons: [
          { label: "View listings", href: "/listings", kind: "primary" },
          { label: "Schedule private tour", href: `/tours?propertyId=${property.id}`, kind: "secondary" },
          { label: "Contact Elena", href: `mailto:${args.realtorEmail || "elena@prestigega.com"}`, kind: "secondary", external: true },
          { label: args.isLoggedIn ? "Open verification" : "Sign in to verify", href: args.isLoggedIn ? "/account#client-verification" : "/login", kind: "secondary" },
        ],
      };
      break;
    case "search":
      body = search.matches.length
        ? `These are the strongest matches I would start with based on what you asked. Look at price first, then layout, location, and whether the property still feels worth the number once you see it.`
        : "I don’t see a clean match yet, so I’d widen the search slightly and compare the closest options.";
      actions.push("Show similar homes", "Schedule private tour", "Compare by budget");
      actionCard = {
        title: "Suggested homes",
        subtitle: search.maxPrice ? `Filtered around ${shortPrice(search.maxPrice)} and your search criteria.` : "Filtered from active listings based on your question.",
        properties: search.matches.map(propertyToAction),
        buttons: [{ label: "View all matching homes", href: search.filterUrl, kind: "primary" }],
      };
      break;
    case "tour":
      body = `${details}\n\nA tour makes sense when the home already fits on paper. In person, pay attention to the flow, privacy, light, room scale, and whether the home still feels worth the price.`;
      actions.push("Schedule a private tour", "Ask for open house windows", "View property video");
      actionCard = propertyActionCard(property);
      break;
    case "video":
      body = `${details}\n\nA property video is useful when you cannot make it in person or want a cleaner first look before committing time. Ask to see the parts photos usually hide: approach, street feel, room transitions, storage, outdoor privacy, and natural light.`;
      actions.push("View property video", "Ask for layout walkthrough", "Schedule in person later");
      actionCard = {
        ...propertyActionCard(property, "Video tour options"),
        buttons: [
          { label: "View property video", href: `/property/${property.id}#property-video-tour`, kind: "primary" },
          { label: "Schedule private tour", href: `/tours?propertyId=${property.id}`, kind: "secondary" },
          { label: "View property", href: `/property/${property.id}`, kind: "secondary" },
        ],
      };
      break;
    case "documents":
      body = "For a serious purchase conversation, useful documents may include pre-approval, proof of funds, key questions, disclosures, or documents you want reviewed before moving forward.";
      actions.push("Upload document", "Ask what documents are needed", "Request secure signing later");
      actionCard = {
        title: "Document options",
        subtitle: "Attach only what is needed for the conversation. Keep sensitive documents for formal review.",
        buttons: [
          { label: "Upload document", action: "upload", kind: "primary" },
          { label: "Open member account", href: "/account", kind: "secondary" },
        ],
      };
      break;
    case "monthly-cost":
    case "financing":
      body = `${details}\n\nWith 20% down, a rough planning estimate is about ${formatPrice(monthly.down)} down and approximately ${formatPrice(monthly.total)}/month before final lender terms, taxes, insurance, HOA, credits, or negotiated concessions.`;
      actions.push("Ask for lender-ready estimate", "Request HOA/tax details", "Schedule private tour");
      actionCard = propertyActionCard(property, "Financial planning next steps");
      break;
    case "availability":
      body = `${details}\n\nThis listing is currently presented as ${property.status === "active" ? "available" : "not active"} on the platform. Before making plans, the showing window, disclosure status, and offer timing should be confirmed.`;
      actions.push("Confirm availability", "Schedule showing", "Ask for disclosure package");
      actionCard = propertyActionCard(property, "Confirm availability");
      break;
    case "comparison":
      body = `${details}\n\nI would compare it against a few nearby or similar active options before deciding whether it deserves a tour.`;
      actions.push("Show similar homes", "Compare by budget", "Compare by lifestyle needs");
      actionCard = {
        title: "Comparable active options",
        subtitle: "Use these to compare price, condition, privacy, and fit.",
        properties: similar.map(propertyToAction),
        buttons: [{ label: "View active listings", href: "/listings", kind: "primary" }],
      };
      break;
    case "neighborhood":
      body = `${details}\n\nFor location fit, look at commute routes, nearby services, noise exposure, privacy, walkability, school information from official sources, and long-term resale demand.`;
      actions.push("Ask about commute", "Ask about nearby amenities", "Schedule local preview");
      actionCard = propertyActionCard(property, "Location and showing options");
      break;
    case "offer":
      body = `${details}\n\nA strong offer is not only price. It is proof of ability, clean terms, timing, confidence, and knowing where the seller may have leverage.`;
      actions.push("Prepare offer checklist", "Upload proof of funds", "Ask the realtor to call me");
      actionCard = {
        title: "Offer preparation",
        subtitle: "The realtor should review offer strategy directly before anything is submitted.",
        buttons: [
          { label: "Upload document", action: "upload", kind: "primary" },
          { label: "Schedule private tour", href: `/tours?propertyId=${property.id}`, kind: "secondary" },
        ],
      };
      break;
    case "features":
      body = `${details}\n\nCurrent listing note: ${property.description}\n\nThe real question is whether those features match your lifestyle, timeline, and comfort with the price.`;
      actions.push("Compare features", "Schedule tour", "Ask for floor plan");
      actionCard = propertyActionCard(property, "Property details");
      break;
    case "contact":
      body = `${args.realtorName} can be reached by phone or email. Use the direct buttons below.`;
      actions.push(`Call ${args.realtorName.split(" ")[0] || "the realtor"}`, `Email ${args.realtorName.split(" ")[0] || "the realtor"}`, "Schedule a tour");
      actionCard = {
        title: `Contact ${args.realtorName}`,
        subtitle: "For time-sensitive questions, call first. For documents or details, email is usually cleaner.",
        buttons: [
          { label: `Call ${args.realtorName.split(" ")[0] || "Realtor"}`, href: `tel:${args.realtorPhone || "+13105550192"}`, kind: "primary", external: true },
          { label: `Email ${args.realtorName.split(" ")[0] || "Realtor"}`, href: `mailto:${args.realtorEmail || "elena@prestigega.com"}`, kind: "secondary", external: true },
          { label: "Schedule a tour", href: `/tours?propertyId=${property.id}`, kind: "secondary" },
        ],
      };
      break;
    case "verification":
      body = args.isLoggedIn
        ? "Your verification section is inside the member account area. Complete the three live camera steps so the owner can review it."
        : "You’ll need to sign in or create an account first so the verification is attached to the right member profile.";
      actions.push(args.isLoggedIn ? "Open verification" : "Sign in first", "Create account", "Ask why verification matters");
      actionCard = args.isLoggedIn
        ? {
            title: "Account verification",
            subtitle: "Complete the front ID, back ID, and face photo steps from your member account.",
            buttons: [{ label: "Open verification", href: "/account#client-verification", kind: "primary" }],
          }
        : {
            title: "Sign in to verify",
            subtitle: "Verification needs to be connected to your account before photos are submitted.",
            buttons: [
              { label: "Sign in", href: "/login", kind: "primary" },
              { label: "Create account", href: "/register", kind: "secondary" },
            ],
          };
      break;
    default:
      body = "Tell me what you are trying to accomplish, and I’ll point you to the cleanest next step. You can ask by budget, location, bedrooms, tour timing, property video, contact, documents, or verification.";
      actions.push("Show me homes under $2M", "Schedule a private tour", "How do I contact Elena?");
      actionCard = {
        title: "Suggested next steps",
        subtitle: "Start with search, scheduling, contact, or account verification.",
        buttons: [
          { label: "View listings", href: "/listings", kind: "primary" },
          { label: "Schedule private tour", href: `/tours?propertyId=${property.id}`, kind: "secondary" },
          { label: "View property video", href: `/property/${property.id}#property-video-tour`, kind: "secondary" },
          { label: args.isLoggedIn ? "Open verification" : "Sign in to verify", href: args.isLoggedIn ? "/account#client-verification" : "/login", kind: "secondary" },
        ],
      };
      break;
  }

  return {
    intent,
    priorityScore: score,
    priorityLabel: priorityLabel(score),
    nextActions: actions,
    actionCard,
    text: joinReply([intro, body, compliance, closeLine(intent)]),
  };
}

export function buildConciergeSummary(lead: LeadCapture | null, propertyTitle: string | undefined, properties: Property[]) {
  const property = findProperty(propertyTitle || lead?.interest, properties);
  const score = scoreLead(lead, lead?.interest || property.title);
  return {
    property,
    priorityScore: score,
    priorityLabel: priorityLabel(score),
    summary: `${property.beds} bed · ${property.baths} bath · ${property.sqft.toLocaleString()} sq ft · ${shortPrice(property.price)}`,
  };
}
