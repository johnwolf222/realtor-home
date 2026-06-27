import type { ChatActionPayload, Property } from "@/lib/data";
import type { StoredRealtorProfile } from "@/lib/platformStore";
import type { SeriousConciergeAction, SeriousConciergeClientResult, SeriousConciergeResponse } from "./realConcierge.types";

export const seriousQuickPrompts: string[] = [];

function actionLabel(action: SeriousConciergeAction) {
  switch (action) {
    case "view_all":
      return "View matching homes";
    case "schedule_tour":
      return "Schedule a private tour";
    case "video_tour":
      return "Request a video tour";
    case "contact_call":
      return "Call Elena";
    case "contact_email":
      return "Email Elena";
    case "verification":
      return "Verify account";
    case "upload_documents":
      return "Upload documents";
    case "owner_followup":
      return "Request private follow-up";
    default:
      return "Next step";
  }
}

function shouldShowPropertyCards(response: SeriousConciergeResponse) {
  return ["property_search", "comparison", "pricing"].includes(response.intent) && response.propertyIds.length > 0;
}

function titleFor(intent: SeriousConciergeResponse["intent"], hasProperties: boolean) {
  if (hasProperties && ["property_search", "comparison", "pricing"].includes(intent)) return "Suggested homes";
  switch (intent) {
    case "tour":
      return "Tour options";
    case "video_tour":
      return "Video tour options";
    case "contact":
      return "Contact Elena";
    case "verification":
      return "Account verification";
    case "documents":
      return "Document options";
    default:
      return "Helpful actions";
  }
}

function firstPropertyId(response: SeriousConciergeResponse, properties: Property[]) {
  return response.propertyIds.find((id) => properties.some((property) => property.id === id && property.status === "active")) || "";
}

function buttonForAction(action: SeriousConciergeAction, propertyId: string, profile: StoredRealtorProfile, isLoggedIn: boolean): NonNullable<ChatActionPayload["buttons"]>[number] | null {
  switch (action) {
    case "view_all":
      return { label: actionLabel(action), href: "/listings", kind: "secondary" };
    case "schedule_tour":
      return { label: actionLabel(action), href: propertyId ? `/tours?propertyId=${propertyId}` : "/tours", kind: "primary" };
    case "video_tour":
      return { label: actionLabel(action), href: propertyId ? `/tours?propertyId=${propertyId}&mode=video` : "/tours?mode=video", kind: "primary" };
    case "contact_call":
      return { label: actionLabel(action), href: `tel:${profile.phone}`, kind: "primary" };
    case "contact_email":
      return { label: actionLabel(action), href: `mailto:${profile.email}`, kind: "secondary" };
    case "verification":
      return { label: actionLabel(action), href: isLoggedIn ? "/account#verification" : "/login?next=/account", kind: "primary" };
    case "upload_documents":
      return { label: actionLabel(action), action: "upload", kind: "secondary" };
    case "owner_followup":
      return { label: "Contact Elena", href: `mailto:${profile.email}`, kind: "secondary" };
    default:
      return null;
  }
}

export function buildSeriousActionCard({
  response,
  properties,
  profile,
  isLoggedIn,
}: {
  response: SeriousConciergeResponse;
  properties: Property[];
  profile: StoredRealtorProfile;
  isLoggedIn: boolean;
}): ChatActionPayload | undefined {
  const matchedProperties = shouldShowPropertyCards(response)
    ? response.propertyIds
        .map((id) => properties.find((property) => property.id === id && property.status === "active"))
        .filter(Boolean)
        .slice(0, 3) as Property[]
    : [];

  const propertyId = firstPropertyId(response, properties);
  const buttons = response.actions
    .map((action) => buttonForAction(action, propertyId, profile, isLoggedIn))
    .filter(Boolean) as NonNullable<ChatActionPayload["buttons"]>;

  const card: ChatActionPayload = {
    title: titleFor(response.intent, matchedProperties.length > 0),
    subtitle: matchedProperties.length
      ? "Click a home to review the details or schedule a tour."
      : undefined,
    properties: matchedProperties.map((property) => ({
      id: property.id,
      title: property.title,
      city: property.city,
      price: property.price,
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft,
      photo: property.photos[0],
    })),
    buttons,
  };

  if (!card.properties?.length && !card.buttons?.length) return undefined;
  return card;
}

export function toClientConciergeResult({
  response,
  properties,
  profile,
  isLoggedIn,
}: {
  response: SeriousConciergeResponse;
  properties: Property[];
  profile: StoredRealtorProfile;
  isLoggedIn: boolean;
}): SeriousConciergeClientResult {
  return {
    ...response,
    actionCard: buildSeriousActionCard({ response, properties, profile, isLoggedIn }),
    nextActions: response.actions.map(actionLabel).slice(0, 5),
  };
}
