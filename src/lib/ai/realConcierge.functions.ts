import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { SeriousConciergeAction, SeriousConciergeInput, SeriousConciergeIntent, SeriousConciergeResponse } from "./realConcierge.types";

const actionEnum = z.enum([
  "view_all",
  "schedule_tour",
  "video_tour",
  "contact_call",
  "contact_email",
  "verification",
  "upload_documents",
  "owner_followup",
]);

const intentEnum = z.enum([
  "greeting",
  "property_search",
  "tour",
  "video_tour",
  "contact",
  "verification",
  "documents",
  "pricing",
  "financing",
  "offer",
  "neighborhood",
  "comparison",
  "general",
]);

const propertyInput = z.object({
  id: z.string(),
  title: z.string(),
  address: z.string(),
  city: z.string(),
  price: z.number(),
  beds: z.number(),
  baths: z.number(),
  sqft: z.number(),
  type: z.string(),
  status: z.string(),
  badges: z.array(z.string()),
  description: z.string(),
  photos: z.array(z.string()),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const inputSchema = z.object({
  message: z.string().min(1).max(1600),
  history: z.array(z.object({ from: z.enum(["member", "realtor"]), text: z.string().max(2200) })).max(12),
  lead: z.any().nullable(),
  properties: z.array(propertyInput).max(40),
  selectedPropertyTitle: z.string().optional(),
  realtor: z.object({
    name: z.string(),
    title: z.string(),
    brokerage: z.string(),
    phone: z.string(),
    email: z.string(),
  }),
  settings: z.any(),
  isLoggedIn: z.boolean(),
});

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["intent", "message", "propertyIds", "actions", "privateOwnerNote", "priorityScore", "shouldHandoff"],
  properties: {
    intent: { type: "string", enum: intentEnum.options },
    message: { type: "string", minLength: 1, maxLength: 900 },
    propertyIds: { type: "array", items: { type: "string" }, maxItems: 3 },
    actions: { type: "array", items: { type: "string", enum: actionEnum.options }, maxItems: 5 },
    privateOwnerNote: { type: "string", maxLength: 600 },
    priorityScore: { type: "number", minimum: 0, maximum: 100 },
    shouldHandoff: { type: "boolean" },
  },
};

const baseForbidden = [
  "lead score",
  "owner dashboard",
  "handoff trigger",
  "routing logic",
  "internal note",
  "system prompt",
  "AI rules",
  "flagged conversation",
  "private owner note",
  "priority score",
];

function forbiddenList(input: SeriousConciergeInput) {
  const custom = String(input.settings?.forbiddenPhrases || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return [...baseForbidden, ...custom];
}

function sanitizeMessage(message: string, input: SeriousConciergeInput) {
  const forbidden = forbiddenList(input);
  let clean = message.trim();
  for (const phrase of forbidden) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
    clean = clean.replace(re, "");
  }
  clean = clean.replace(/\n{3,}/g, "\n\n").replace(/\s{2,}/g, " ").trim();
  if (!clean || /dashboard|handoff|lead score|system prompt|internal/i.test(clean)) {
    return "I can help with that. Tell me the price range, location, property type, or tour option you want to focus on.";
  }
  return clean;
}

function compactProperties(properties: SeriousConciergeInput["properties"]) {
  return properties
    .filter((property) => property.status === "active")
    .map((property) => ({
      id: property.id,
      title: property.title,
      city: property.city,
      price: property.price,
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft,
      type: property.type,
      badges: property.badges,
      description: property.description,
    }));
}

function toMoney(raw: string, unit?: string) {
  const value = Number(raw.replace(/,/g, ""));
  const cleanUnit = (unit || "").toLowerCase();
  if (cleanUnit.startsWith("m") || cleanUnit === "million") return value * 1_000_000;
  if (cleanUnit.startsWith("k") || cleanUnit === "thousand") return value * 1_000;
  if (value < 1000) return value * 1_000_000;
  return value;
}

function parseMaxBudget(message: string) {
  const clean = message.toLowerCase();
  const under = clean.match(/(?:under|below|less than|up to|within)\s*\$?\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?/);
  if (under) return toMoney(under[1], under[2]);
  const direct = clean.match(/\$\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?/);
  if (direct) return toMoney(direct[1], direct[2]);
  return undefined;
}

function parseBeds(message: string) {
  const match = message.toLowerCase().match(/(\d+)\s*(bed|bedroom)/);
  return match ? Number(match[1]) : undefined;
}

function parseBaths(message: string) {
  const match = message.toLowerCase().match(/(\d+)\s*(bath|bathroom)/);
  return match ? Number(match[1]) : undefined;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function hasKeyword(message: string, words: string[]) {
  const clean = message.toLowerCase();
  return words.some((word) => clean.includes(word));
}

function requestedAmenity(message: string) {
  const clean = message.toLowerCase();
  const options = [
    { label: "pool", badge: "Pool", words: ["pool", "swimming"] },
    { label: "balcony or patio", badge: "Balcony", words: ["balcony", "patio", "terrace"] },
    { label: "basement", badge: "Basement", words: ["basement"] },
    { label: "garage", badge: "Garage", words: ["garage", "parking"] },
    { label: "two-car garage", badge: "Two-car garage", words: ["two-car garage", "2 car garage", "2-car garage"] },
    { label: "guest house", badge: "Guesthouse", words: ["guest house", "guesthouse"] },
    { label: "shed or storage", badge: "Shed", words: ["shed", "storage"] },
    { label: "fireplace", badge: "Fireplace", words: ["fireplace"] },
    { label: "kitchen island", badge: "Kitchen Island", words: ["kitchen island", "island"] },
    { label: "updated kitchen", badge: "Kitchen", words: ["updated kitchen", "modern kitchen", "large kitchen", "renovated kitchen"] },
  ];
  return options.find((item) => item.words.some((word) => clean.includes(word)));
}

function propertySearchText(property: SeriousConciergeInput["properties"][number]) {
  return [
    property.title,
    property.address,
    property.city,
    property.type,
    property.description,
    ...(property.badges || []),
  ].join(" ").toLowerCase();
}

function propertySummary(property: SeriousConciergeInput["properties"][number]) {
  const sqft = property.sqft ? `, ${property.sqft.toLocaleString()} sq ft` : "";
  return `${property.title} — ${formatMoney(property.price)}, ${property.beds} bed, ${property.baths} bath${sqft}, ${property.city}`;
}

function ownerRuleResponse(input: SeriousConciergeInput): SeriousConciergeResponse | null {
  const raw = input.settings?.chatKnowledgeRules || "";
  const message = input.message.toLowerCase();

  const rows = raw
    .split(/\n+/)
    .map((row) => row.trim())
    .filter(Boolean);

  for (const row of rows) {
    const parts = row.split("|").map((part) => part.trim());
    const [category, keywordText, responseText, buttonLabel, link] = parts;

    if (!category || !keywordText || !responseText) continue;

    const keywords = keywordText
      .split(",")
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean);

    const matched = keywords.some((keyword) => message.includes(keyword));
    if (!matched) continue;

    let intent: SeriousConciergeIntent = "general";
    let actions: SeriousConciergeAction[] = [];

    const cleanLink = (link || "").toLowerCase();
    const cleanCategory = category.toLowerCase();

    if (cleanCategory.includes("tour") || cleanLink.includes("/tours")) {
      intent = cleanCategory.includes("video") ? "video_tour" : "tour";
      actions = cleanCategory.includes("video") ? ["video_tour", "schedule_tour"] : ["schedule_tour", "video_tour"];
    } else if (cleanCategory.includes("verification") || cleanLink.includes("/account")) {
      intent = "verification";
      actions = ["verification"];
    } else if (cleanCategory.includes("contact") || cleanLink.includes("/chat")) {
      intent = "contact";
      actions = ["contact_email", "contact_call"];
    } else if (cleanCategory.includes("listing") || cleanLink.includes("/listings")) {
      intent = "property_search";
      actions = ["view_all"];
    }

    const suffix = buttonLabel && link ? ` ${buttonLabel}: ${link}` : "";

    return {
      intent,
      message: `${responseText}${suffix}`,
      propertyIds: [],
      actions: gateActions(input, intent, actions, []),
      privateOwnerNote: `Owner-coded chat rule matched: ${category}. Visitor asked: "${input.message}"`,
      priorityScore: ["tour", "video_tour", "contact"].includes(intent) ? 74 : 52,
      shouldHandoff: ["tour", "video_tour", "contact"].includes(intent),
      mode: "guided_fallback",
    };
  }

  return null;
}

function localChatRuleResponse(input: SeriousConciergeInput): SeriousConciergeResponse | null {
  const ownerRule = ownerRuleResponse(input);
  if (ownerRule) return ownerRule;

  const message = input.message;
  const clean = message.toLowerCase().trim();
  const active = input.properties.filter((property) => property.status === "active");
  const firstName = input.lead?.name?.trim()?.split(/\s+/)[0] || "";
  const prefix = firstName ? `${firstName}, ` : "";
  const maxBudget = parseMaxBudget(message);
  const beds = parseBeds(message);
  const baths = parseBaths(message);
  const amenity = requestedAmenity(message);

  const selected = input.selectedPropertyTitle
    ? active.find((property) => property.title === input.selectedPropertyTitle)
    : undefined;

  const asksPropertyContext =
    /what homes are available|what houses are available|what properties are available|what listings are available|what is available|what's available|whats available|show me homes|show homes|show me houses|show houses|show me listings|show listings|view listings|view homes|browse homes|browse listings/i.test(message);

  const asksSpecificMissingContext =
    /square footage|sq ft|sqft|how big|how large|still available|is it available|is this available|property available|home available|listing available|address|where is it located|where is this located|photos|pictures|gallery/i.test(message);

  if (asksSpecificMissingContext && !selected && !input.selectedPropertyTitle && !/\b\d+\s*(bed|beds|bedroom|bedrooms|bath|baths|bathroom|bathrooms)\b/i.test(message) && !maxBudget && !amenity) {
    return {
      intent: "property_search",
      message: "Which property are you asking about? You can open a listing first, or tell me the property name, address, price range, bedroom count, or city so I can point you in the right direction.",
      propertyIds: active.slice(0, 3).map((property) => property.id),
      actions: gateActions(input, "property_search", ["view_all"], active.slice(0, 3).map((property) => property.id)),
      privateOwnerNote: `Visitor asked a property-specific question without enough context: "${message}"`,
      priorityScore: 58,
      shouldHandoff: false,
      mode: "guided_fallback",
    };
  }

  const filtered = active.filter((property) => {
    if (maxBudget && property.price > maxBudget) return false;
    if (beds && property.beds < beds) return false;
    if (baths && property.baths < baths) return false;
    if (amenity && !propertySearchText(property).includes(amenity.badge.toLowerCase()) && !propertySearchText(property).includes(amenity.label.toLowerCase())) return false;
    if (clean.includes("atlanta") && !property.city.toLowerCase().includes("atlanta")) return false;
    return true;
  });

  const matches = filtered.slice(0, 3);
  const propertyIds = matches.map((property) => property.id);

  const reply = (
    intent: SeriousConciergeIntent,
    text: string,
    actions: SeriousConciergeAction[] = [],
    score = 52,
    ownerNote = "No owner follow-up needed yet.",
  ): SeriousConciergeResponse => ({
    intent,
    message: text,
    propertyIds,
    actions: gateActions(input, intent, actions, propertyIds),
    privateOwnerNote: ownerNote,
    priorityScore: score,
    shouldHandoff: score >= Number(input.settings?.handoffScore || 72),
    mode: "guided_fallback",
  });

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(clean)) {
    return reply(
      "greeting",
      firstName
        ? `Hi ${firstName} — I can help you search homes, check prices, compare bedrooms and bathrooms, look for amenities, schedule tours, view property videos, verify your account, or contact ${input.realtor.name}.`
        : `Hi — I can help you search homes, check prices, compare bedrooms and bathrooms, look for amenities, schedule tours, view property videos, verify your account, or contact ${input.realtor.name}.`,
      ["view_all"],
    );
  }

  if (/\b(goodbye|bye|thanks|thank you|that's all|that is all|talk to you later)\b/.test(clean)) {
    return reply("general", input.settings?.goodbyeMessage || "Take care. Feel free to reach back out anytime.");
  }

  if (hasKeyword(clean, ["video tour", "virtual tour", "zoom tour", "remote tour", "facetime"])) {
    return reply(
      "video_tour",
      `${prefix}yes — if you cannot make it in person, you can view a property video. I can guide you to the property video section${selected ? ` for ${selected.title}` : matches.length ? " for one of the suggested homes" : ""}.`,
      ["video_tour", "schedule_tour"],
      76,
      `Visitor asked about a property video: "${message}"`,
    );
  }

  if (hasKeyword(clean, ["tour", "showing", "appointment", "open house", "visit", "walkthrough", "walk through"])) {
    return reply(
      "tour",
      `${prefix}you can request a private showing when available. Pick the home you like, then use the schedule tour option so ${input.realtor.name} can confirm availability.`,
      ["schedule_tour", "video_tour", "contact_call"],
      76,
      `Visitor asked about scheduling a tour: "${message}"`,
    );
  }

  if (hasKeyword(clean, ["verify", "verification", "identity", "client id"])) {
    return reply(
      "verification",
      input.isLoggedIn
        ? `${prefix}you can start verification from your member account. Verification helps protect private showings, document review, and serious next steps.`
        : `${prefix}you’ll need to sign in or create an account first so verification attaches to your profile.`,
      ["verification"],
      60,
    );
  }

  if (hasKeyword(clean, ["account", "login", "log in", "sign in", "register", "create account"])) {
    return reply(
      "general",
      `${prefix}you can create an account or sign in to save homes, request tours, verify your identity, and keep your chat connected to your profile.`,
      ["verification"],
    );
  }

  if (hasKeyword(clean, ["save", "saved homes", "like", "favorite"])) {
    return reply(
      "general",
      `${prefix}you can save homes from the listings or property pages. Saved homes help you keep track of properties you want to compare or tour later.`,
      ["view_all"],
    );
  }

  if (hasKeyword(clean, ["contact", "call", "phone", "email", "speak", "reach"])) {
    return reply(
      "contact",
      `${prefix}you can contact ${input.realtor.name} by phone at ${input.realtor.phone} or by email at ${input.realtor.email}.`,
      ["contact_call", "contact_email"],
      72,
      `Visitor asked for contact help: "${message}"`,
    );
  }

  if (hasKeyword(clean, ["address", "where is", "located", "city", "state"])) {
    const target = selected || matches[0] || active[0];
    if (target) {
      return reply(
        "property_search",
        `${prefix}${target.title} is located at ${target.address}, ${target.city}.`,
        ["view_property", "schedule_tour"],
      );
    }
  }

  if (hasKeyword(clean, ["square feet", "sq ft", "sqft", "size", "how big"])) {
    const target = selected || matches[0] || active[0];
    if (target) {
      return reply(
        "property_search",
        target.sqft
          ? `${prefix}${target.title} is listed at ${target.sqft.toLocaleString()} square feet.`
          : `${prefix}I do not see square footage listed for that home yet. I can send that question to ${input.realtor.name} for confirmation.`,
        ["view_property", "schedule_tour"],
        target.sqft ? 52 : 74,
        target.sqft ? "No owner follow-up needed yet." : `Visitor asked for missing square footage: "${message}"`,
      );
    }
  }

  if (maxBudget || beds || baths || amenity || hasKeyword(clean, ["home", "house", "property", "listing", "atlanta", "price", "under"])) {
    if (matches.length) {
      const filterParts = [];
      if (maxBudget) filterParts.push(`under ${formatMoney(maxBudget)}`);
      if (beds) filterParts.push(`at least ${beds} bedrooms`);
      if (baths) filterParts.push(`at least ${baths} bathrooms`);
      if (amenity) filterParts.push(`with ${amenity.label}`);
      const filterText = filterParts.length ? ` matching ${filterParts.join(", ")}` : "";
      return reply(
        "property_search",
        asksPropertyContext && !filterParts.length
          ? `${prefix}yes — there are ${active.length} active homes visible on the site right now. Here are a few available options: ${matches.map(propertySummary).join(" ")} You can view all listings or narrow the search by price, city, bedrooms, bathrooms, or amenities.`
          : `${prefix}I found ${matches.length} visible home${matches.length === 1 ? "" : "s"}${filterText}. ${matches.map(propertySummary).join(" ")} You can open the suggested homes or schedule a tour if one looks right.`,
        ["view_all", "schedule_tour", "video_tour"],
      );
    }

    return reply(
      "property_search",
      `${prefix}I do not see an exact visible match for that request right now. I can broaden the search, show all listings, or send this request to ${input.realtor.name} for follow-up.`,
      ["view_all", "contact_email"],
      74,
      `No visible property matched this request: "${message}"`,
    );
  }

  if (clean.length < 3 || /^[^a-z0-9]+$/i.test(clean)) {
    return reply(
      "general",
      "I’m not sure I understood that. I can help with property listings, pricing, tours, verification, account support, or contacting the realtor.",
    );
  }

  return reply(
    "general",
    input.settings?.fallbackKnowledge || `I can take note of that and send it to ${input.realtor.name} so they can follow up with you directly.`,
    ["contact_email"],
    74,
    `Visitor asked a question outside the coded Chat Knowledge Base: "${message}"`,
  );
}

function detectFallbackIntent(message: string): SeriousConciergeIntent {
  const clean = message.toLowerCase().trim();
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|yo|help|can you help)/.test(clean)) return "greeting";
  if (/verify|verification|identity|\bid\b|client id/.test(clean)) return "verification";
  if (/video|virtual|zoom|facetime/.test(clean)) return "video_tour";
  if (/tour|showing|appointment|see it|walk ?through|visit/.test(clean)) return "tour";
  if (/contact|call|phone|text|email|number|reach|speak/.test(clean)) return "contact";
  if (/document|docs|pre.?approval|proof of funds|paperwork|sign|signature/.test(clean)) return "documents";
  if (/offer|bid|negotiate|contingency|asking/.test(clean)) return "offer";
  if (/mortgage|loan|lender|financ|monthly|payment|afford|down payment/.test(clean)) return "financing";
  if (/compare|similar|options|recommend|suggest/.test(clean)) return "comparison";
  if (/area|neighborhood|location|school|commute|nearby|safe/.test(clean)) return "neighborhood";
  if (/home|house|property|listing|bed|bath|under|over|between|range/.test(clean)) return "property_search";
  return "general";
}

function matchedProperties(input: SeriousConciergeInput, intent: SeriousConciergeIntent) {
  const active = input.properties.filter((property) => property.status === "active");
  if (!["property_search", "comparison", "tour", "video_tour", "pricing"].includes(intent)) return [];
  const maxBudget = parseMaxBudget(input.message);
  const beds = parseBeds(input.message);
  const cityWords = input.properties
    .map((property) => property.city.split(",")[0].toLowerCase())
    .filter((city, index, arr) => arr.indexOf(city) === index);
  const city = cityWords.find((city) => input.message.toLowerCase().includes(city));

  const filtered = active.filter((property) => {
    if (maxBudget && property.price > maxBudget) return false;
    if (beds && property.beds < beds) return false;
    if (city && !property.city.toLowerCase().includes(city)) return false;
    return true;
  });

  const selected = input.selectedPropertyTitle
    ? active.filter((property) => property.title === input.selectedPropertyTitle)
    : [];
  return (filtered.length ? filtered : selected.length ? selected : active).slice(0, 3).map((property) => property.id);
}

function actionsFor(intent: SeriousConciergeIntent): SeriousConciergeAction[] {
  switch (intent) {
    case "property_search":
    case "comparison":
      return ["view_all", "schedule_tour", "video_tour"];
    case "tour":
      return ["schedule_tour", "video_tour", "contact_call"];
    case "video_tour":
      return ["video_tour", "schedule_tour"];
    case "contact":
      return ["contact_call", "contact_email"];
    case "verification":
      return ["verification"];
    case "documents":
      return ["upload_documents", "verification", "contact_email"];
    case "offer":
      return ["contact_call", "upload_documents"];
    case "financing":
      return ["contact_call"];
    default:
      return [];
  }
}

function isDocumentQuestionOnly(message: string) {
  const clean = message.toLowerCase();
  const mentionsDocs = /document|docs|paperwork|pre.?approval|proof of funds|proof of income|bank statement|photo id|\bid\b/.test(clean);
  const asksInfo = /what|why|purpose|for|prepare|need|explain|mean/.test(clean);
  const asksAction = /upload|attach|send|submit|share|review|start|begin|verify me|move forward|ready to offer|make an offer/.test(clean);
  return mentionsDocs && asksInfo && !asksAction;
}

function shouldShowDocumentActions(message: string, intent: SeriousConciergeIntent) {
  const clean = message.toLowerCase();

  if (isDocumentQuestionOnly(message)) return false;

  const explicitDocAction =
    /upload|attach|send|submit|share|review|start|begin/.test(clean) &&
    /document|docs|paperwork|pre.?approval|proof|photo id|\bid\b|bank statement|offer|sign/.test(clean);

  const seriousStep =
    /make an offer|submit an offer|ready to offer|proof of funds|pre.?approval|sign|signature|private review/.test(clean);

  return intent === "documents" ? explicitDocAction || seriousStep : seriousStep;
}

function shouldShowVerificationAction(message: string, intent: SeriousConciergeIntent) {
  const clean = message.toLowerCase();

  const asksPurposeOnly =
    /what|why|purpose|for|explain|mean/.test(clean) &&
    /verification|verify|client id|\bid\b|identity/.test(clean) &&
    !/start|begin|do it|verify me|upload|submit/.test(clean);

  if (asksPurposeOnly) return false;

  return (
    intent === "verification" &&
    /verify|verification|client id|identity|upload id|submit id|start|begin|do it/.test(clean)
  );
}

function shouldShowTourAction(message: string, intent: SeriousConciergeIntent, propertyIds: string[]) {
  const clean = message.toLowerCase();
  return (
    intent === "tour" ||
    /tour|showing|appointment|walk.?through|see it|see the home|visit|schedule/.test(clean) ||
    (propertyIds.length > 0 && /interested|like this|that one|this one/.test(clean))
  );
}

function shouldShowVideoTourAction(message: string, intent: SeriousConciergeIntent) {
  const clean = message.toLowerCase();
  return intent === "video_tour" || /video|virtual|zoom|facetime|remote/.test(clean);
}

function shouldShowContactAction(message: string, intent: SeriousConciergeIntent) {
  const clean = message.toLowerCase();
  return (
    intent === "contact" ||
    /call|phone|text|email|contact|reach|speak|talk|agent|realtor|elena/.test(clean)
  );
}

function gateActions(
  input: SeriousConciergeInput,
  intent: SeriousConciergeIntent,
  actions: SeriousConciergeAction[],
  propertyIds: string[],
): SeriousConciergeAction[] {
  const result: SeriousConciergeAction[] = [];

  for (const action of actions) {
    if (action === "view_all" && (intent === "property_search" || intent === "comparison" || propertyIds.length > 0)) {
      result.push(action);
    }

    if (action === "schedule_tour" && shouldShowTourAction(input.message, intent, propertyIds)) {
      result.push(action);
    }

    if (action === "video_tour" && shouldShowVideoTourAction(input.message, intent)) {
      result.push(action);
    }

    if (action === "contact_call" && shouldShowContactAction(input.message, intent)) {
      result.push(action);
    }

    if (action === "contact_email" && shouldShowContactAction(input.message, intent)) {
      result.push(action);
    }

    if (action === "verification" && shouldShowVerificationAction(input.message, intent)) {
      result.push(action);
    }

    if (action === "upload_documents" && shouldShowDocumentActions(input.message, intent)) {
      result.push(action);
    }
  }

  return Array.from(new Set(result)).slice(0, 5);
}

function fallbackResponse(input: SeriousConciergeInput, mode: SeriousConciergeResponse["mode"] = "guided_fallback"): SeriousConciergeResponse {
  const localRule = localChatRuleResponse(input);
  if (localRule) return { ...localRule, mode };

  const intent = detectFallbackIntent(input.message);
  const propertyIds = matchedProperties(input, intent);
  const firstName = input.lead?.name?.trim()?.split(/\s+/)[0] || "";
  const prefix = firstName ? `${firstName}, ` : "";
  const clean = input.message.toLowerCase();

  const activeCount = input.properties.filter((property) => property.status === "active").length;

  let message = "Message received.";

  if (/how many.*(properties|homes|listings)|number of.*(properties|homes|listings)/i.test(input.message)) {
    message = `${prefix}there are ${activeCount} active properties visible on the site right now.`;
  } else if (/what can you help|what do you help|how can you help/i.test(input.message)) {
    message = "Message received.";
  } else if (/how are you|how's it going|how are things/i.test(input.message)) {
    message = "I’m doing well — and ready to help whenever you want to look at homes, tours, documents, or next steps.";
  } else if (intent === "property_search") {
    message = propertyIds.length
      ? `${prefix}these are the closest visible matches based on what you shared.`
      : `${prefix}I do not see an exact match in the visible listings yet. Want to widen the price, location, or property style?`;
  } else if (intent === "tour") {
    message = `${prefix}a tour makes sense once the home fits your basics. Which property are you considering?`;
  } else if (intent === "video_tour") {
    message = `${prefix}a property video can help when the owner has created one. If no property video is available yet, scheduling an in-person tour is the best next step.`;
  } else if (intent === "contact") {
    message = `${prefix}the cleanest move is to contact ${input.realtor.name} directly for anything time-sensitive or property-specific.`;
  } else if (intent === "verification") {
    const purposeOnly = /what|why|purpose|for|explain|mean/.test(clean);
    message = purposeOnly
      ? `${prefix}verification helps protect private showings, document review, and serious next steps by confirming the account belongs to a real person.`
      : input.isLoggedIn
        ? `${prefix}you can start verification from your member account.`
        : `${prefix}sign in first so verification attaches to your account.`;
  } else if (intent === "documents") {
    const asksPurpose = /what.*for|why|purpose|documents.*for/i.test(input.message);
    const asksPrepare = /what.*document|documents.*prepare|bring|need|pre.?approval|proof/i.test(input.message);

    if (asksPurpose) {
      message = `${prefix}documents help confirm readiness and give ${input.realtor.name} the right context before a serious tour, review, or offer conversation.`;
    } else if (asksPrepare) {
      message = `${prefix}usually, have a photo ID, proof of funds or pre-approval, and any property-specific paperwork ready if you’re moving toward a tour, offer, or private review.`;
    } else {
      message = `${prefix}documents are only needed when you move into a serious step like verification, financing, an offer, or private review.`;
    }
  } else if (intent === "offer") {
    message = `${prefix}offer strategy should be handled with ${input.realtor.name}, especially if timing, proof of funds, or negotiation terms matter.`;
  } else if (intent === "financing") {
    message = `${prefix}I can help you prepare for that conversation, but actual loan numbers should be confirmed by a lender.`;
  } else if (intent === "greeting") {
    message = firstName
      ? `Hi ${firstName} — good to see you. Are you browsing, looking for a specific type of home, or trying to plan a next step?`
      : "Hi — good to see you. Are you browsing, looking for a specific type of home, or trying to plan a next step?";
  }

  const priorityScore = intent === "offer" ? 88 : ["tour", "video_tour", "documents", "financing"].includes(intent) ? 76 : 52;
  const actions = gateActions(input, intent, actionsFor(intent), propertyIds);

  return {
    intent,
    message,
    propertyIds,
    actions,
    privateOwnerNote: mode === "guided_fallback"
      ? `Chat Knowledge Base response used. Intent detected: ${intent}. If this was unexpected, review the user wording and improve the concierge prompt.`
      : `Intent detected: ${intent}.`,
    priorityScore,
    shouldHandoff: priorityScore >= Number(input.settings?.handoffScore || 72) || ["offer", "tour", "video_tour"].includes(intent),
    mode,
  };
}

function buildSystemPrompt(input: SeriousConciergeInput) {
  const forbidden = forbiddenList(input).join(", ");
  const activeCount = input.properties.filter((property) => property.status === "active").length;

  return `You are the customer-facing AI realtor concierge for ${input.realtor.name}, ${input.realtor.title} at ${input.realtor.brokerage}.

MAIN VISION
You are a smart real estate website concierge, not a generic chatbot.
You understand the website experience and help visitors take the next useful step.
You can discuss listings, property details, price ranges, tours, property videos, contact options, verification, account features, saved homes, liked properties, document uploads, appointments, and general website navigation.

PERSONALITY
Professional, warm, lightly bubbly, caring, and clear.
Sound like a helpful human assistant who is paying attention.
Avoid robotic repetition.
Avoid default sales questions like “Are you browsing today, comparing homes, or trying to plan a next step?” unless the user specifically asks what they should do next.
Do not keep saying “I can help.”
Do not sound like a script, brochure, or support ticket.
Be concise most of the time: usually 1 to 3 short sentences.
Use natural variation so every visitor feels listened to.

HOW TO RESPOND
Answer the user’s actual message first.
Only provide a useful insight, next step, or clarifying question when the user’s message actually asks for help, property guidance, tour help, contact help, verification, documents, or navigation.
Ask only one question at a time when clarity is needed.
If the visitor is vague but clearly asking for real-estate help, help them narrow the search. If they only greet you, do not narrow anything yet.
If the visitor is serious, guide them directly.
If the visitor is browsing, keep it relaxed.
If the visitor sends a greeting, casual small talk, or a short message like “hey,” “hi,” “hello,” or “what’s up,” answer briefly and naturally only.
Do not ask whether they are browsing, comparing homes, planning next steps, scheduling, verifying, uploading documents, or doing anything real-estate related unless they ask first.
Do not turn a greeting into a sales prompt.
For a simple greeting, one short sentence is enough.

PROPERTY CARD RULES
If the visitor asks for properties by price, location, bedroom count, home type, style, or features, use only the provided active listings.
If matching properties exist, return up to 3 propertyIds and explain briefly why they fit.
If no exact match exists, say that clearly and offer to widen the search by price, location, or style.
Do not invent properties, prices, addresses, availability, schools, crime facts, market facts, or guarantees.
Do not return random propertyIds just because the visitor says “this property” or asks a general question.

SPECIFIC PROPERTY RULES
If the visitor says “this property,” “this home,” “this one,” or “that one,” only answer about a selected/current property if selectedPropertyTitle is provided.
If no selected property is provided, ask which property they mean.
Do not guess.

TOUR RULES
If the visitor asks to schedule a tour, include schedule_tour.
If they ask about a specific property, connect the tour to that property when possible.
If they ask generally, guide them to choose a property or offer a general appointment path.
If they cannot attend in person, explain that property videos may be available under each listing when the owner has added them and include video_tour.

CONTACT RULES
If the visitor asks how to contact the realtor, provide the available contact path using the provided realtor information.
If office hours or preferred call times are not provided, be honest and say you do not see that listed.
Include contact_call or contact_email only when contact is actually relevant.

VERIFICATION RULES
If the visitor asks about verification, explain it simply.
If they are logged in, include verification when they want to begin.
If they are not logged in, explain they need to sign in or register first so verification attaches to their account.
Do not push verification randomly.

DOCUMENT RULES
Do not trigger upload_documents just because documents are mentioned.
If the visitor asks what documents are for, explain the purpose.
If they ask what to prepare, answer plainly.
Only include upload_documents if they ask to upload, attach, send, submit, share, review, or are clearly moving toward an offer/signing/private review step.

NO RESULT AND KNOWLEDGE BASE RULES
Never leave the visitor stuck.
If the current visible data does not answer the request, say what is missing and offer the next useful path.
If there are no matching properties, offer to broaden the search or have the owner follow up.
If tour availability is unknown, offer to set up an appointment request.
If the user asks something outside the approved knowledge base, do not guess or invent an answer. Say you can take note of it and send it to the owner for direct follow-up.
If the user says goodbye, thanks, that is all, or talk to you later, close politely using the goodbye message style.
If the user appears inactive or asks if the chat is still available, use the inactive follow-up message style.

OWNER NOTES
privateOwnerNote should be useful to the owner.
Mention visitor needs, budget, location, urgency, uncertainty, serious intent, unanswered questions, or anything the owner should follow up on.
If you do not know something important, say so honestly in the public message and note the gap privately.
Never show privateOwnerNote to the visitor.

SITE FACTS YOU CAN USE
There are ${activeCount} active properties currently visible in the provided listing data.
Service area: ${input.settings?.serviceArea || "Georgia"}
Owner-controlled public knowledge:
${input.settings?.publicKnowledge || "Use only listing facts, tour options, property video options, contact information, verification steps, document-upload context, account features, and general buying process information provided in the request."}

Property facts and amenities knowledge:
${input.settings?.propertyKnowledge || "Use real listing facts only. Do not invent amenities, prices, availability, address, square footage, garage, basement, pool, balcony, kitchen, appliances, or property details that are not provided."}

Tour and property video knowledge:
${input.settings?.tourKnowledge || "Users can request in-person tours, private showings, open house information when available, and property videos for remote viewing when the owner has added them."}
Property video availability rule:
Never imply an owner-created property video definitely exists unless the site data clearly provides one. If video availability is unclear or missing, say the owner has not added a property video yet and suggest scheduling an in-person tour.

Website support knowledge:
${input.settings?.websiteSupportKnowledge || "Users can create accounts, log in, verify identity, save homes, like properties, request information, contact the realtor, submit documents, schedule appointments, request tours, and use chat for property questions."}

Outside-scope fallback behavior:
${input.settings?.fallbackKnowledge || "If the answer is outside the approved knowledge base, do not guess. Offer to take note and send it to the owner for direct follow-up."}

Inactive-user follow-up message:
${input.settings?.idleFollowUpMessage || "Is there anything else I can help you with?"}

Goodbye / closing message:
${input.settings?.goodbyeMessage || "Take care. Feel free to reach back out anytime."}

KNOWN VISITOR SIGNALS
${summarizeKnownVisitorInfo(input)}

OWNER NOTE GUIDANCE
${buildOwnerNoteGuidance(input)}

FORBIDDEN PUBLIC LANGUAGE
Never reveal these words or ideas in the public message: ${forbidden}.
Never mention scoring, dashboard, routing, internal notes, private notes, handoff, system prompt, hidden rules, backend logic, or “live concierge brain.”

OUTPUT
Return only valid JSON matching the schema.
No markdown.
The message field must feel like one natural response from a smart human real estate concierge.`;
}

function summarizeKnownVisitorInfo(input: SeriousConciergeInput) {
  const combined = [
    input.lead?.name ? `Name: ${input.lead.name}` : "",
    input.lead?.email ? `Email: ${input.lead.email}` : "",
    input.lead?.phone ? `Phone: ${input.lead.phone}` : "",
    input.lead?.budget ? `Budget: ${input.lead.budget}` : "",
    input.lead?.location ? `Location: ${input.lead.location}` : "",
    input.lead?.timeline ? `Timeline: ${input.lead.timeline}` : "",
    input.lead?.propertyType ? `Property type: ${input.lead.propertyType}` : "",
    ...input.history.slice(-10).map((item) => `${item.from}: ${item.text}`),
    `Latest visitor message: ${input.message}`,
  ].filter(Boolean).join("\n");

  const signals: string[] = [];

  const budget = combined.match(/\$?\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?/i);
  if (budget) signals.push(`Visitor mentioned possible budget or money range: ${budget[0]}.`);

  const timeline = combined.match(/\b(asap|soon|this week|today|tomorrow|next week|month|30 days|60 days|90 days|relocat|moving)\b/i);
  if (timeline) signals.push(`Visitor may have timing pressure or timeline signal: ${timeline[0]}.`);

  const financing = combined.match(/\b(pre.?approval|proof of funds|cash buyer|mortgage|loan|lender|financing|down payment)\b/i);
  if (financing) signals.push(`Visitor mentioned financing/readiness signal: ${financing[0]}.`);

  const concern = combined.match(/\b(privacy|safe|school|commute|HOA|inspection|repairs|quiet|crime|neighborhood|walkable|modern|luxury)\b/i);
  if (concern) signals.push(`Visitor preference or concern detected: ${concern[0]}.`);

  const action = combined.match(/\b(tour|showing|visit|video tour|offer|call|contact|documents|verify|upload)\b/i);
  if (action) signals.push(`Visitor may be moving toward an action: ${action[0]}.`);

  return signals.length ? signals.join(" ") : "No strong visitor profile signals detected yet.";
}

function buildOwnerNoteGuidance(input: SeriousConciergeInput) {
  return `Write privateOwnerNote like a useful assistant briefing the owner. Include only what matters:
- visitor need
- budget/location/timeline if mentioned
- concern or hesitation
- unanswered question
- possible next step
- whether owner follow-up would help

If there is nothing meaningful yet, write: "No owner follow-up needed yet."

Do not put privateOwnerNote content in the public message.`;
}

function buildUserPayload(input: SeriousConciergeInput) {
  return JSON.stringify({
    memberMessage: input.message,
    memberProfile: input.lead,
    isLoggedIn: input.isLoggedIn,
    selectedPropertyTitle: input.selectedPropertyTitle,
    recentHistory: input.history.slice(-10),
    knownVisitorSignals: summarizeKnownVisitorInfo(input),
    currentListings: compactProperties(input.properties),
    desiredPublicActions: actionEnum.options,
  });
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  const parts: string[] = [];
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") parts.push(content.text);
      if (typeof content?.output_text === "string") parts.push(content.output_text);
    }
  }
  return parts.join("\n").trim();
}

function cleanResponse(candidate: unknown, input: SeriousConciergeInput, mode: SeriousConciergeResponse["mode"]): SeriousConciergeResponse {
  const parsed = z.object({
    intent: intentEnum,
    message: z.string().min(1).max(1200),
    propertyIds: z.array(z.string()).max(3),
    actions: z.array(actionEnum).max(5),
    privateOwnerNote: z.string().max(800),
    priorityScore: z.number().min(0).max(100),
    shouldHandoff: z.boolean(),
  }).parse(candidate);

  const activeIds = new Set(input.properties.filter((property) => property.status === "active").map((property) => property.id));
  return {
    ...parsed,
    message: sanitizeMessage(parsed.message, input),
    propertyIds: parsed.propertyIds.filter((id) => activeIds.has(id)),
    actions: gateActions(input, parsed.intent, parsed.actions, parsed.propertyIds),
    mode,
  };
}

async function callOpenAI(input: SeriousConciergeInput): Promise<SeriousConciergeResponse> {
  const processModule = await import("node:process");
  const apiKey = processModule.default.env.OPENAI_API_KEY;
  const model = processModule.default.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) return fallbackResponse(input);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: buildSystemPrompt(input) },
        { role: "user", content: buildUserPayload(input) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "realtor_concierge_response",
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("OpenAI concierge request failed", response.status, detail.slice(0, 800));
    return fallbackResponse(input);
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  if (!text) return fallbackResponse(input);

  try {
    return cleanResponse(JSON.parse(text), input, "live_ai");
  } catch (error) {
    console.error("Unable to parse structured concierge response", error, text.slice(0, 800));
    return fallbackResponse(input);
  }
}


function visitorFirstName(input: SeriousConciergeInput) {
  return input.lead?.name?.trim()?.split(/\s+/)[0] || "";
}

function withName(input: SeriousConciergeInput, message: string) {
  const firstName = visitorFirstName(input);
  return firstName ? `${firstName}, ${message}` : message;
}

function activeVisibleCount(input: SeriousConciergeInput) {
  return input.properties.filter((property) => property.status === "active").length;
}

function isPropertyCountQuestion(message: string) {
  const clean = message.toLowerCase();
  return (
    /(how many|number of|count).*(houses|homes|properties|listings)/.test(clean) ||
    /(houses|homes|properties|listings).*(how many|number of|count)/.test(clean)
  );
}

function isDocumentInfoQuestion(message: string) {
  const clean = message.toLowerCase();
  const mentionsDocs = /document|docs|paperwork|pre.?approval|proof of funds|proof of income|bank statement|photo id|\bid\b/.test(clean);
  const asksInfo = /what|why|purpose|for|prepare|need|bring|explain|mean/.test(clean);
  const asksAction = /upload|attach|send|submit|share|review|start|begin|verify me|move forward|ready to offer|make an offer/.test(clean);
  return mentionsDocs && asksInfo && !asksAction;
}

function isDocumentHesitation(message: string) {
  const clean = message.toLowerCase();
  return (
    /document|docs|paperwork|pre.?approval|proof|photo id|\bid\b/.test(clean) &&
    /not sure|unsure|not ready|hesitant|comfortable|uncomfortable|do not want|don't want|rather not|should i|need to/.test(clean)
  );
}

function isCallTimingQuestion(message: string) {
  const clean = message.toLowerCase();
  return /best time.*call|when.*call|what time.*call|call.*hours|available.*call|good time.*call/.test(clean);
}

function isHowToContactQuestion(message: string) {
  const clean = message.toLowerCase();
  return /how.*contact|how.*reach|contact.*elena|reach.*elena|email.*elena|call.*elena|phone.*elena/.test(clean);
}

function isCasualGreeting(message: string) {
  const clean = message.toLowerCase().trim();
  return /^(hi|hello|hey|good morning|good afternoon|good evening|yo|hey, how are you|how are you|how's it going)[?.! ]*$/.test(clean);
}

function isCapabilityQuestion(message: string) {
  const clean = message.toLowerCase();
  return /what can you help|what do you help|how can you help|what are you able to do|what can you do/.test(clean);
}

function addOwnerNote(existing: string, note: string) {
  const base = existing && existing !== "No owner follow-up needed yet." ? existing.trim() : "";
  return base ? `${base} ${note}` : note;
}

function tightenActionsForExactMessage(
  input: SeriousConciergeInput,
  response: SeriousConciergeResponse,
): SeriousConciergeAction[] {
  const clean = input.message.toLowerCase();
  let actions = [...response.actions];

  if (isPropertyCountQuestion(input.message) || isCasualGreeting(input.message) || isCapabilityQuestion(input.message)) {
    return [];
  }

  if (isDocumentInfoQuestion(input.message) || isDocumentHesitation(input.message)) {
    actions = actions.filter((action) => action !== "upload_documents" && action !== "verification" && action !== "contact_email");
  }

  const explicitDocumentAction =
    /upload|attach|send|submit|share|review|private review/.test(clean) &&
    /document|docs|paperwork|pre.?approval|proof|photo id|\bid\b|bank statement|offer|sign/.test(clean);

  if (!explicitDocumentAction) {
    actions = actions.filter((action) => action !== "upload_documents");
  }

  const explicitVerificationAction =
    /verify|verification|client id|identity|upload id|submit id|start verification|begin verification|verify me/.test(clean) &&
    !/what|why|purpose|for|explain|mean|not sure|not ready|should i/.test(clean);

  if (!explicitVerificationAction) {
    actions = actions.filter((action) => action !== "verification");
  }

  const explicitContactAction =
    /call|phone|text|email|contact|reach|speak|talk|agent|realtor|elena|best time/.test(clean);

  if (!explicitContactAction) {
    actions = actions.filter((action) => action !== "contact_call" && action !== "contact_email");
  }

  const explicitTourAction =
    /tour|showing|appointment|walk.?through|see it|see the home|visit|schedule/.test(clean);

  if (!explicitTourAction && response.propertyIds.length === 0) {
    actions = actions.filter((action) => action !== "schedule_tour" && action !== "video_tour");
  }

  return Array.from(new Set(actions)).slice(0, 5);
}

function applyConciergeJudgment(
  response: SeriousConciergeResponse,
  input: SeriousConciergeInput,
): SeriousConciergeResponse {
  const clean = input.message.toLowerCase();
  let next: SeriousConciergeResponse = {
    ...response,
    actions: tightenActionsForExactMessage(input, response),
  };

  if (isPropertyCountQuestion(input.message)) {
    const count = activeVisibleCount(input);
    return {
      ...next,
      intent: "general",
      message: withName(input, `there are ${count} active homes visible on the site right now.`),
      propertyIds: [],
      actions: [],
      privateOwnerNote: addOwnerNote(next.privateOwnerNote, "Visitor asked how many homes are visible on the site."),
      priorityScore: Math.min(next.priorityScore, 55),
      shouldHandoff: false,
    };
  }

  if (isDocumentHesitation(input.message)) {
    return {
      ...next,
      intent: "documents",
      message: withName(input, "no pressure — documents are only needed when you move into a serious step like verification, financing, an offer, or private review."),
      propertyIds: [],
      actions: [],
      privateOwnerNote: addOwnerNote(next.privateOwnerNote, "Visitor showed hesitation about uploading documents. Owner should avoid pushing documents too early."),
      shouldHandoff: false,
    };
  }

  if (isDocumentInfoQuestion(input.message)) {
    const asksPurpose = /what.*for|why|purpose|documents.*for|docs.*for/i.test(input.message);
    const asksPrepare = /what.*document|documents.*prepare|docs.*prepare|bring|need|pre.?approval|proof/i.test(input.message);

    let message = "documents are only needed when you move into a serious step like verification, financing, an offer, or private review.";

    if (asksPurpose) {
      message = `documents help confirm readiness and give ${input.realtor.name} the right context before a serious tour, review, or offer conversation.`;
    } else if (asksPrepare) {
      message = "usually, have a photo ID, proof of funds or pre-approval, and any property-specific paperwork ready if you’re moving toward a tour, offer, or private review.";
    }

    return {
      ...next,
      intent: "documents",
      message: withName(input, message),
      propertyIds: [],
      actions: [],
      privateOwnerNote: addOwnerNote(next.privateOwnerNote, "Visitor asked an informational document question, not an upload request."),
      shouldHandoff: false,
    };
  }

  if (isCallTimingQuestion(input.message)) {
    return {
      ...next,
      intent: "contact",
      message: withName(input, `I do not see ${input.realtor.name}’s preferred call hours listed here, so the safest move is to call during normal business hours or email if it is not urgent.`),
      propertyIds: [],
      actions: ["contact_call", "contact_email"],
      privateOwnerNote: addOwnerNote(next.privateOwnerNote, "Visitor asked for the best time to call. Preferred call hours are not listed in the public site data."),
      shouldHandoff: true,
    };
  }

  if (isHowToContactQuestion(input.message)) {
    return {
      ...next,
      intent: "contact",
      message: withName(input, `you can use the call or email option here to reach ${input.realtor.name}.`),
      propertyIds: [],
      actions: ["contact_call", "contact_email"],
      privateOwnerNote: addOwnerNote(next.privateOwnerNote, "Visitor asked how to contact the realtor."),
      shouldHandoff: true,
    };
  }

  if (isCasualGreeting(input.message)) {
    return {
      ...next,
      intent: "greeting",
      message: visitorFirstName(input)
        ? `Hi ${visitorFirstName(input)} — I can help with listings, pricing, home details, tours, verification, saved homes, and contacting the realtor.`
        : "Hi — I can help with listings, pricing, home details, tours, verification, saved homes, and contacting the realtor.",
      propertyIds: [],
      actions: [],
      privateOwnerNote: "No owner follow-up needed yet.",
      priorityScore: 35,
      shouldHandoff: false,
    };
  }

  if (isCapabilityQuestion(input.message)) {
    return {
      ...next,
      intent: "general",
      message: "I can help you understand the listings, compare options, prepare for a tour, figure out documents, or decide what step makes sense next.",
      propertyIds: [],
      actions: [],
      privateOwnerNote: "Visitor asked what the concierge can help with.",
      priorityScore: 40,
      shouldHandoff: false,
    };
  }

  return next;
}


export const getSeriousConciergeReply = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }) => {
    const input = data as SeriousConciergeInput;
    const rawResponse = await callOpenAI(input);
    const response = applyConciergeJudgment(rawResponse, input);

    return {
      ...response,
      message: sanitizeMessage(response.message, input),
    } satisfies SeriousConciergeResponse;
  });
