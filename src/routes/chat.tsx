import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  Home,
  ListChecks,
  Mail,
  MessageCircle,
  Paperclip,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Video,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { timelineOptions, budgetOptions, type ChatActionPayload } from "@/lib/data";
import { getSeriousConciergeReply } from "@/lib/ai/realConcierge.functions";
import { toClientConciergeResult } from "@/lib/ai/realConcierge.shared";
import { formatPrice, shortPrice } from "@/lib/format";
import {
  selectedPropertyFromUrl,
  usePlatformData,
  usePublicProperties,
  useRealtorProfile,
  type LeadCapture,
} from "@/lib/platformStore";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Member Concierge — Elena Valerius" },
      { name: "description", content: "Ask questions, share documents, view property videos, and let the AI property concierge guide your next step." },
    ],
  }),
  component: Chat,
});

const LEAD_KEY = "ev_lead";
const CHAT_SESSION_KEY = "ev_chat_session_state_v2";
const CHAT_IDLE_MS = 5 * 60 * 1000;
const CHAT_TIMEOUT_TEXT = "This session has timed out. If there is something I can help with, please leave a message at any time.";

type ChatSessionState = Record<string, { lastActivityAt: number; sessionStartedAt: number; timedOutAt?: number }>;

function readChatSessionState(): ChatSessionState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHAT_SESSION_KEY);
    return raw ? (JSON.parse(raw) as ChatSessionState) : {};
  } catch {
    return {};
  }
}

function writeChatSessionState(state: ChatSessionState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(state));
}

function getChatSession(threadId: string) {
  return readChatSessionState()[threadId];
}

function markChatSessionActive(threadId: string, resetSession = false) {
  const state = readChatSessionState();
  const now = Date.now();
  const previous = state[threadId];
  state[threadId] = {
    lastActivityAt: now,
    sessionStartedAt: resetSession || !previous?.sessionStartedAt ? now - 1000 : previous.sessionStartedAt,
  };
  writeChatSessionState(state);
}

function markChatSessionTimedOut(threadId: string) {
  const state = readChatSessionState();
  const previous = state[threadId];
  state[threadId] = {
    lastActivityAt: previous?.lastActivityAt || Date.now(),
    sessionStartedAt: previous?.sessionStartedAt || Date.now(),
    timedOutAt: Date.now(),
  };
  writeChatSessionState(state);
}

function messageCreatedAt(message: { createdAt?: number; id: string }) {
  if (message.createdAt) return message.createdAt;
  if (message.id.startsWith("msg_")) {
    const numeric = Number(message.id.split("_")[1]);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
}

function readLead(): LeadCapture | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEAD_KEY);
    return raw ? (JSON.parse(raw) as LeadCapture) : null;
  } catch {
    return null;
  }
}

function writeLead(lead: LeadCapture) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEAD_KEY, JSON.stringify(lead));
}

function selectedActionFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("action") || "";
}


const GOODBYE_TRIGGERS = [
  "bye",
  "goodbye",
  "good bye",
  "see you",
  "see ya",
  "see you later",
  "see ya later",
  "talk to you later",
  "talk later",
  "later",
  "catch you later",
  "take care",
  "peace",
  "peace out",
  "i'm leaving",
  "im leaving",
  "i have to go",
  "gotta go",
  "got to go",
  "i'm done",
  "im done",
  "done",
  "that's all",
  "thats all",
  "that is all",
  "that's it",
  "thats it",
  "that is it",
  "nothing else",
  "no thanks",
  "no thank you",
  "nope that's all",
  "nope thats all",
  "no that's all",
  "no thats all",
  "i'm good",
  "im good",
  "i am good",
  "i'm all set",
  "im all set",
  "i am all set",
  "all set",
  "i'm finished",
  "im finished",
  "finished",
  "we're done",
  "were done",
  "i'm okay",
  "im okay",
  "i am okay",
  "i'm fine",
  "im fine",
  "i am fine",
  "i don't need anything else",
  "i dont need anything else",
  "i do not need anything else",
  "i don't need more help",
  "i dont need more help",
  "i do not need more help",
  "i'm done here",
  "im done here",
  "i am done here",
  "i'm good for now",
  "im good for now",
  "i am good for now",
  "that helped",
  "you helped",
  "thanks that helped",
  "thank you that helped",
  "thanks for your help",
  "thank you for your help",
  "thanks for helping",
  "thank you for helping",
  "thanks",
  "thank you",
  "thank u",
  "thx",
  "ty",
  "appreciate it",
  "i appreciate it",
  "appreciate you",
  "much appreciated",
  "thanks a lot",
  "thank you so much",
  "thanks so much",
  "thanks again",
  "okay thanks",
  "ok thanks",
  "alright thanks",
  "cool thanks",
  "great thanks",
  "perfect thanks",
  "that works thanks",
  "sounds good thanks",
  "got it thanks",
  "i got it",
  "got it",
  "okay i got it",
  "ok i got it",
  "understood",
  "i understand",
  "makes sense",
  "that makes sense",
  "alright",
  "alright then",
  "okay then",
  "ok then",
  "cool",
  "cool cool",
  "perfect",
  "great",
  "awesome",
  "nice",
  "bet",
  "say less",
  "good looking",
  "good lookin",
  "good looks",
  "you're good",
  "youre good",
  "we good",
  "we're good",
  "that answers my question",
  "you answered my question",
  "question answered",
  "my question is answered",
  "i found what i needed",
  "found what i needed",
  "i got what i need",
  "got what i need",
  "i have what i need",
  "that's enough",
  "thats enough",
  "enough",
  "no more questions",
  "no other questions",
  "i have no other questions",
  "no further questions",
  "i'll come back later",
  "ill come back later",
  "i will come back later",
  "i'll check later",
  "ill check later",
  "i will check later",
  "i'll reach out later",
  "ill reach out later",
  "i will reach out later",
  "i'll contact later",
  "ill contact later",
  "i will contact later",
  "i'll call later",
  "ill call later",
  "i will call later",
  "i'll schedule later",
  "ill schedule later",
  "i will schedule later",
  "i'll think about it",
  "ill think about it",
  "i will think about it",
  "let me think about it",
  "i'll let you know",
  "ill let you know",
  "i will let you know",
  "not right now",
  "not now",
  "maybe later",
  "another time",
  "i'll be back",
  "ill be back",
  "i will be back",
  "be back later",
  "brb later",
  "not interested anymore",
  "i changed my mind",
  "never mind",
  "nevermind",
  "cancel",
  "cancel chat",
  "end chat",
  "end conversation",
  "close chat",
  "close this chat",
  "stop chat",
  "stop",
  "exit",
  "quit",
  "leave chat",
  "i'm logging out",
  "im logging out",
  "logging out",
  "signing out",
  "i'm signing out",
  "im signing out",
  "have a good day",
  "have a nice day",
  "have a great day",
  "have a good one",
  "have a blessed day",
  "enjoy your day",
  "good night",
  "goodnight",
  "night",
  "night night",
  "see you tomorrow",
  "talk tomorrow",
  "i'll message again",
  "ill message again",
  "i will message again",
  "i'll ask later",
  "ill ask later",
  "i will ask later",
  "i'll return",
  "ill return",
  "i will return",
  "thanks bye",
  "thank you bye",
  "ok bye",
  "okay bye",
  "alright bye",
  "cool bye",
  "bye thanks",
  "bye thank you",
  "thanks goodbye",
  "thank you goodbye",
  "thanks have a good day",
  "thank you have a good day",
  "that's all thank you",
  "thats all thank you",
  "that's all thanks",
  "thats all thanks",
  "no thanks bye",
  "no thank you bye",
  "i'm good bye",
  "im good bye",
  "i am good bye",
  "all set bye",
  "done thanks",
  "done thank you",
  "finished thanks",
  "finished thank you",
];

const GOODBYE_REPLIES = [
  "Take care. Feel free to reach back out anytime.",
  "Glad I could help. You can come back anytime if you have more questions.",
  "Thank you for visiting. Reach out anytime for property details, tours, or website support.",
  "Have a great day. I’m here whenever you need help with listings, pricing, tours, or verification.",
  "You’re welcome. Feel free to return anytime you need help with a property or the website.",
  "No problem. Reach back out whenever you’re ready to continue.",
  "Take care. I’ll be here if you need help finding listings, scheduling a tour, or contacting the realtor.",
  "Glad I could assist. Have a great day.",
  "You’re all set. Come back anytime if you need more property information.",
  "Thanks for stopping by. Reach out anytime you need help with listings or tours.",
  "No worries. I’m here whenever you need help again.",
  "Have a good one. You can return anytime for property details or tour help.",
  "Thanks for chatting. Feel free to reach back out whenever you need assistance.",
  "You’re welcome. I’m glad I could help.",
  "Take care. I hope you find the right property.",
  "Glad I could help. Let me know anytime you need more information.",
  "Thanks for visiting the site. Have a great day.",
  "No problem. Come back anytime to view listings, ask questions, or schedule a tour.",
  "Take care. Reach back out anytime for help with homes, tours, verification, or contact information.",
  "Sounds good. I’m here whenever you need help again.",
  "Perfect. Have a great day.",
  "Great. Feel free to come back if anything else comes up.",
  "Understood. Reach out anytime if you need more help.",
  "Got it. I’m here whenever you’re ready.",
  "All set. Have a good day.",
  "All set. Come back anytime.",
  "Glad that helped. Take care.",
  "Happy to help. Have a great day.",
  "Thanks for reaching out. Have a good one.",
  "Anytime. Have a great day.",
  "Take care. Good luck with your home search.",
  "Thanks for using the chat. Come back anytime.",
  "Take care. You can return anytime to continue your search.",
  "Thanks for stopping by. Feel free to browse listings anytime.",
  "Goodbye. Reach back out anytime.",
  "Bye. Take care.",
  "See you later. Come back anytime.",
  "Talk to you later. I’m here whenever you need help again.",
  "Good night. Reach out again whenever you need help.",
  "Thank you. Come back anytime.",
  "Thanks. Take care.",
];

function normalizeGoodbyeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function simpleGoodbyeReply(message: string, name?: string | null) {
  const clean = normalizeGoodbyeText(message);
  const matched = GOODBYE_TRIGGERS.some((trigger) => {
    const normalizedTrigger = normalizeGoodbyeText(trigger);
    return clean === normalizedTrigger || clean.startsWith(`${normalizedTrigger} `) || clean.endsWith(` ${normalizedTrigger}`);
  });

  if (!matched) return null;

  const index = Math.abs(clean.split("").reduce((total, char) => total + char.charCodeAt(0), 0)) % GOODBYE_REPLIES.length;
  const reply = GOODBYE_REPLIES[index];

  if (!name?.trim()) return reply;

  const firstName = name.trim().split(/\s+/)[0];
  return reply.replace(/^Take care\b/, `Take care, ${firstName}`).replace(/^Thank you\b/, `Thank you, ${firstName}`).replace(/^Thanks\b/, `Thanks, ${firstName}`);
}


type BudgetFilterResult = {
  minPrice?: number;
  maxPrice?: number;
  label: string;
};

function normalizeBudgetTourText(value: string) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBudgetMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseChatMoney(rawValue?: string | null) {
  if (!rawValue) return undefined;

  const raw = normalizeBudgetTourText(rawValue).replace(/\$/g, "");

  if (raw.includes("half a million") || raw.includes("half million")) return 500000;
  if (raw.includes("one million")) return 1000000;

  const match = raw.match(/(\d+(?:\.\d+)?)\s*(k|m|million|thousand)?/);
  if (!match) return undefined;

  const number = Number(match[1]);
  const suffix = match[2] || "";

  if (!Number.isFinite(number)) return undefined;
  if (suffix === "k" || suffix === "thousand") return Math.round(number * 1000);
  if (suffix === "m" || suffix === "million") return Math.round(number * 1000000);

  // In real estate chat, "under 500" usually means 500k, not $500.
  if (number > 0 && number < 5000) return Math.round(number * 1000);

  return Math.round(number);
}

function getBudgetFilter(message: string): BudgetFilterResult | null {
  const clean = normalizeBudgetTourText(message);
  const money = "(half a million|half million|one million|\\d+(?:\\.\\d+)?\\s*(?:k|m|million|thousand)?)";

  const between = clean.match(new RegExp(`(?:between|from)\\s+\\$?\\s*(${money})\\s+(?:and|to)\\s+\\$?\\s*(${money})`));
  if (between) {
    const min = parseChatMoney(between[1]);
    const max = parseChatMoney(between[2]);

    if (min && max) {
      const low = Math.min(min, max);
      const high = Math.max(min, max);
      return {
        minPrice: low,
        maxPrice: high,
        label: `between ${formatBudgetMoney(low)} and ${formatBudgetMoney(high)}`,
      };
    }
  }

  const around = clean.match(new RegExp(`(?:around|about|approximately|near|in the)\\s+\\$?\\s*(${money})(?:\\s+range)?`));
  if (around) {
    const center = parseChatMoney(around[1]);

    if (center) {
      const low = Math.round((center * 0.9) / 1000) * 1000;
      const high = Math.round((center * 1.1) / 1000) * 1000;

      return {
        minPrice: low,
        maxPrice: high,
        label: `around ${formatBudgetMoney(center)}`,
      };
    }
  }

  const plus = clean.match(new RegExp(`\\$?\\s*(${money})\\s*\\+`));
  if (plus) {
    const min = parseChatMoney(plus[1]);

    if (min) {
      return {
        minPrice: min,
        label: `${formatBudgetMoney(min)} and up`,
      };
    }
  }

  const under = clean.match(new RegExp(`(?:under|below|less than|no more than|max|maximum|up to|within)\\s+\\$?\\s*(${money})`));
  if (under) {
    const max = parseChatMoney(under[1]);

    if (max) {
      return {
        maxPrice: max,
        label: `under ${formatBudgetMoney(max)}`,
      };
    }
  }

  return null;
}

function isLiveTourRecognitionMessage(message: string) {
  const clean = normalizeBudgetTourText(message);

  return /live tour|in person tour|in-person tour|physical tour|property showing|house showing|home showing|private showing|schedule a tour|schedule tour|schedule a showing|book a tour|book tour|book a showing|set up a tour|setup a tour|i want to tour|i need a tour|i want a showing|i need a showing|can i tour|can i see it|can i visit|walk through|walkthrough|tour times|available tour times|tour availability|showing availability|open house|same day tour|weekend tour|next available showing/.test(clean);
}

function isVideoTourRecognitionMessage(message: string) {
  const clean = normalizeBudgetTourText(message);

  return /video tour|virtual tour|remote tour|online tour|live video tour|video showing|virtual showing|remote showing|online showing|video walkthrough|virtual walkthrough|facetime tour|zoom tour|google meet tour|video call tour|tour online|tour virtually|tour by video|see it online|view it online|someone show me .* video|live video showing|cannot come in person|can't come in person|cant come in person|out of town|not local|remote viewing|remote showing|virtual viewing|online viewing/.test(clean);
}


type OffTopicCategory =
  | "random"
  | "jokes"
  | "weather"
  | "politics"
  | "rude"
  | "profanity"
  | "nonsense"
  | "flirting"
  | "medical"
  | "legal"
  | "finance"
  | "spam"
  | "adult"
  | "religion"
  | "sports"
  | "food"
  | "travel"
  | "school"
  | "tech"
  | "security"
  | "general";

const OFF_TOPIC_LIBRARY: Record<OffTopicCategory, { triggers: string[]; replies: string[] }> = {
  random: {
    triggers: [
      "random", "nothing", "idk", "lol", "lmao", "haha", "hehe", "test", "testing", "123", "abc",
      "asdf", "qwerty", "blah", "whatever", "just looking", "just browsing", "no reason",
      "i'm bored", "bored", "tell me something", "say something", "what are you doing",
      "what is this", "who are you", "are you a bot", "are you human", "talk to me",
      "i don't know what to ask", "i'm just testing this", "wrong chat", "oops", "my bad"
    ],
    replies: [
      "No problem. This chat can help you view listings, check prices, request a tour, verify your profile, or contact the realtor.",
      "That’s okay. When you’re ready, I can help with homes, tours, listing details, verification, or realtor contact.",
      "Looks like you may just be testing the chat. I’m here to help with property questions, tours, verification, and contacting the realtor.",
      "Let’s focus on your home search. Are you interested in listings, pricing, a tour, or contacting the realtor?"
    ],
  },
  jokes: {
    triggers: [
      "tell me a joke", "say something funny", "make me laugh", "joke", "funny", "roast me",
      "be funny", "entertain me", "tell me something hilarious", "tell me a dark joke",
      "tell me a dirty joke", "say something crazy", "say something wild", "make fun of",
      "roast this listing", "roast the realtor", "roast buyers", "roast sellers"
    ],
    replies: [
      "I’ll keep things professional here. I can help with listings, prices, tours, verification, or contacting the realtor.",
      "I’m better at helping you find a home than telling jokes. Would you like to view listings or schedule a tour?",
      "This chat stays focused on real estate help. I can help you search homes, ask about pricing, or contact the realtor."
    ],
  },
  weather: {
    triggers: [
      "weather", "what's the weather", "is it raining", "will it rain", "is it hot", "is it cold",
      "temperature", "forecast", "weather today", "weather tomorrow", "umbrella", "sunny",
      "cloudy", "storm", "snow", "humidity", "windy", "weather in atlanta", "weather near me"
    ],
    replies: [
      "I don’t provide live weather here, but I can help you schedule a tour, ask about a listing, or contact the realtor.",
      "For weather, please check a current weather app. I can still help you plan a property tour or contact the realtor.",
      "Weather can affect tour timing. I can help you request a tour time or message the realtor to confirm availability."
    ],
  },
  politics: {
    triggers: [
      "politics", "president", "election", "who should i vote for", "republican", "democrat",
      "liberal", "conservative", "trump", "biden", "congress", "government", "governor",
      "mayor", "senator", "political", "vote", "campaign", "maga", "left wing", "right wing"
    ],
    replies: [
      "This chat is focused on real estate services, not political discussion. I can help with listings, tours, verification, or realtor contact.",
      "I’ll keep this space professional and property-focused. Would you like help finding a home, scheduling a tour, or contacting the realtor?",
      "Political topics are outside this chat’s purpose. I can help with homes, prices, amenities, tours, and verification."
    ],
  },
  rude: {
    triggers: [
      "stupid", "dumb", "idiot", "moron", "useless", "you suck", "this sucks", "shut up",
      "go away", "trash", "garbage", "bad bot", "terrible", "annoying", "i hate this",
      "site sucks", "realtor sucks", "ugly house", "scam", "fake", "clown", "worthless",
      "waste of time", "trash realtor", "bad realtor", "listing is garbage", "price is stupid",
      "you're broken", "youre broken"
    ],
    replies: [
      "I understand this may be frustrating. I can still help with listings, tours, verification, or connecting you with the realtor.",
      "I’m here to help professionally. Please ask about a property, tour, price, verification, or realtor contact.",
      "Let’s keep the conversation productive. What property or real estate question can I help with?"
    ],
  },
  profanity: {
    triggers: [
      "fuck", "shit", "bitch", "asshole", "wtf", "fuck this", "bullshit", "what the fuck",
      "screw this", "pissed off", "mad as hell", "angry", "this makes me mad"
    ],
    replies: [
      "I understand you may be upset. I can help you contact the realtor, ask about pricing, or review the listing details.",
      "Let’s keep the chat respectful and focused so I can help. What property question do you have?",
      "I hear the frustration. Would you like to message the realtor about the price, property condition, or tour availability?"
    ],
  },
  nonsense: {
    triggers: [
      "asdfgh", "zxcvbn", "aaaa", "bbbb", "cccc", "123456", "0000", "!!!!", "????",
      "////", "hshshsh", "jdjdjd", "ksksks", "lalala", "blahblahblah", "gibberish",
      "nonsense", "yo yo yo yo", "huh huh huh", "what what what", "test test test"
    ],
    replies: [
      "I didn’t understand that message. I can help with listings, prices, tours, verification, or realtor contact.",
      "That looks unclear. Please ask a property-related question so I can help.",
      "I may need a clearer message. You can ask about homes, pricing, amenities, tours, or contacting the realtor."
    ],
  },
  flirting: {
    triggers: [
      "are you single", "do you love me", "i love you", "you're cute", "youre cute", "send pic",
      "what do you look like", "date me", "marry me", "can i flirt", "are you a girl",
      "are you a boy", "what's your number", "whats your number", "can we hang out",
      "you're sexy", "youre sexy", "talk dirty", "be my girlfriend", "be my boyfriend",
      "what are you wearing"
    ],
    replies: [
      "I’m here to help with real estate, not personal conversations. I can help with listings, tours, verification, or realtor contact.",
      "Let’s keep things professional. Would you like to view homes or contact the realtor?",
      "This chat is for property support. Ask me about listings, pricing, tours, or verification."
    ],
  },
  medical: {
    triggers: [
      "medical advice", "doctor", "medicine", "symptoms", "pain", "headache", "chest pain",
      "mental health", "anxiety", "depression", "diagnosis", "hospital", "urgent care",
      "health advice", "covid", "flu", "injury", "panic attack", "i can't breathe",
      "i cant breathe", "suicidal", "hurt myself"
    ],
    replies: [
      "I’m not a medical service. Please contact a medical professional or emergency service if needed. I can help here with listings, tours, verification, or realtor contact.",
      "This chat is for real estate support, not medical advice. For health concerns, please contact a qualified professional.",
      "For urgent health concerns, contact emergency services or a medical provider. For real estate help, I can assist with listings and tours."
    ],
  },
  legal: {
    triggers: [
      "legal advice", "can i sue", "lawsuit", "lawyer", "attorney", "court", "tenant rights",
      "eviction", "arrest", "crime", "police", "criminal", "civil case", "legal question",
      "should i sue", "is this illegal", "can i break a contract", "fair housing lawsuit",
      "discrimination lawsuit", "file a case"
    ],
    replies: [
      "I’m not a lawyer and this chat does not provide legal advice. I can help with property information, tours, verification, and realtor contact.",
      "For legal concerns, please contact a qualified attorney. I can help you contact the realtor or ask for listing details.",
      "I can help you organize a question for the realtor, but legal advice should come from an attorney."
    ],
  },
  finance: {
    triggers: [
      "stocks", "crypto", "bitcoin", "forex", "trading", "lottery", "gambling",
      "investment advice", "should i buy stock", "should i sell stock", "get rich",
      "make money fast", "business loan", "tax advice", "irs", "credit card debt",
      "personal loan", "bankruptcy", "cash app", "send money", "loan me money"
    ],
    replies: [
      "This chat is focused on real estate services. I can help with listing prices, home search, tours, verification, or realtor contact.",
      "I don’t provide investment advice here. I can help with property pricing, available homes, and tour requests.",
      "If you’re asking about home affordability or pre-approval, I can help you contact the realtor for next steps."
    ],
  },
  spam: {
    triggers: [
      "buy my product", "check out my website", "click this link", "promo", "promotion",
      "free money", "advertise here", "i sell leads", "marketing service", "seo service",
      "web design service", "crypto offer", "investment opportunity", "partnership",
      "business proposal", "sponsor me", "follow me", "subscribe", "discount code",
      "telegram link", "whatsapp business", "leads for sale"
    ],
    replies: [
      "This chat is for property visitors and real estate support. For business inquiries, please use the realtor’s official contact option.",
      "I can’t handle promotions here. I can help with listings, tours, verification, or contacting the realtor.",
      "This chat does not process sales pitches or unrelated promotions."
    ],
  },
  adult: {
    triggers: [
      "sex", "sexual", "nude", "nudes", "send nude", "adult content", "hook up",
      "dirty talk", "porn", "onlyfans", "strip", "explicit", "sexual joke", "turn me on",
      "come over", "private fun", "freaky"
    ],
    replies: [
      "I can’t help with adult or sexual content. This chat is for real estate support, listings, tours, verification, and realtor contact.",
      "Let’s keep this professional. I can help with property questions or contacting the realtor.",
      "Please keep the conversation appropriate and property-focused."
    ],
  },
  religion: {
    triggers: [
      "religion", "god", "jesus", "bible", "quran", "church", "pray", "prayer",
      "christian", "muslim", "jewish", "atheist", "spiritual", "religious debate",
      "do you believe in god", "scripture", "faith debate"
    ],
    replies: [
      "This chat stays focused on real estate services. I can help with listings, tours, verification, and realtor contact.",
      "Religious discussion is outside this chat’s purpose. Would you like help finding a home or contacting the realtor?",
      "Let’s focus on homes, property details, tours, or realtor contact."
    ],
  },
  sports: {
    triggers: [
      "sports", "football", "basketball", "baseball", "soccer", "nba", "nfl", "mlb",
      "nhl", "college football", "who won", "score", "game", "team", "falcons",
      "hawks", "braves", "atlanta united", "super bowl", "playoffs", "championship"
    ],
    replies: [
      "I don’t cover sports here. I can help with listings, tours, property details, verification, or realtor contact.",
      "This chat is focused on real estate services, not sports updates.",
      "For sports, check a sports app. For property help, I’m ready here."
    ],
  },
  food: {
    triggers: [
      "food", "restaurant", "where should i eat", "pizza", "burger", "coffee", "lunch",
      "dinner", "breakfast", "menu", "recipe", "cook", "hungry", "best restaurant",
      "nearby food", "delivery", "doordash", "uber eats", "what should i cook", "bar", "club"
    ],
    replies: [
      "I’m focused on real estate help. I can help with listings, tours, property details, verification, or realtor contact.",
      "I don’t recommend restaurants here, but I can help you ask about a neighborhood or nearby amenities for a listing.",
      "If you’re interested in neighborhood amenities, I can help you ask about restaurants, shopping, and local conveniences near a property."
    ],
  },
  travel: {
    triggers: [
      "vacation", "flight", "hotel", "airbnb", "travel", "trip", "cruise", "airport",
      "plane ticket", "passport", "visa", "resort", "tourist", "book a flight",
      "rental car", "vacation package"
    ],
    replies: [
      "I don’t handle travel planning here. I can help with homes, listings, tours, verification, or realtor contact.",
      "This chat is focused on real estate services. Would you like to view available properties or schedule a tour?",
      "If you’re relocating or moving to the area, I can help you ask about listings and neighborhoods."
    ],
  },
  school: {
    triggers: [
      "homework", "essay", "math problem", "school", "class", "teacher", "assignment",
      "test", "quiz", "exam", "write my paper", "science project", "history question",
      "study", "college", "university", "school work"
    ],
    replies: [
      "This chat is for real estate support, not homework. I can help with listings, tours, verification, or realtor contact.",
      "I can’t help with school assignments here. Would you like help with a property question?",
      "Let’s keep this focused on your property needs."
    ],
  },
  tech: {
    triggers: [
      "phone is broken", "computer problem", "wifi not working", "app not working",
      "website bug", "password issue", "email problem", "reset password", "software help",
      "install app", "coding", "programming", "html", "css", "javascript", "python",
      "tech support", "internet problem", "printer problem"
    ],
    replies: [
      "I can help with this realtor site’s real estate features, but not general tech support.",
      "This chat is for listings, tours, verification, and realtor contact. For technical issues, please use the site’s support or contact option.",
      "For site-related issues, please describe what part of the realtor site is not working."
    ],
  },
  security: {
    triggers: [
      "hack", "give me password", "admin login", "owner login", "bypass", "break in",
      "access dashboard", "steal info", "get client info", "show ids", "show private documents",
      "download client documents", "private data", "ssn", "social security number",
      "credit card number", "bank account", "leak info", "database", "supabase key",
      "api key", "admin panel", "unlock account", "fake verification", "skip verification",
      "bypass verification", "approve me without id"
    ],
    replies: [
      "I can’t help with accessing private information or bypassing security. I can help with listings, tours, verification, or realtor contact.",
      "For privacy and safety, I can’t provide private account, document, or dashboard access.",
      "Verification must be completed through the official process. I can help explain how to start verification."
    ],
  },
  general: {
    triggers: [],
    replies: [
      "I’m here to help with real estate services, including listings, property details, pricing, tours, verification, saved homes, and contacting the realtor. What would you like help with?",
      "This concierge chat is designed to support your real estate experience. I can assist with available listings, property details, private tours, verification, saved homes, and direct realtor contact.",
      "I can help with listings, tours, verification, or realtor contact."
    ],
  },
};

function normalizeOffTopicText(value: string) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickCodedReply(message: string, replies: string[]) {
  const clean = normalizeOffTopicText(message);
  const index = Math.abs(clean.split("").reduce((total, char) => total + char.charCodeAt(0), 0)) % replies.length;
  return replies[index];
}

function simpleOffTopicReply(message: string) {
  const clean = normalizeOffTopicText(message);

  for (const [category, data] of Object.entries(OFF_TOPIC_LIBRARY) as Array<[OffTopicCategory, { triggers: string[]; replies: string[] }]>) {
    if (category === "general") continue;

    const matched = data.triggers.some((trigger) => {
      const normalizedTrigger = normalizeOffTopicText(trigger);
      return clean === normalizedTrigger || clean.includes(normalizedTrigger);
    });

    if (matched) return pickCodedReply(message, data.replies);
  }

  return null;
}


type DirectChatCommand =
  | "view_listings"
  | "search_by_price"
  | "search_by_city"
  | "search_by_bedrooms"
  | "search_by_bathrooms"
  | "search_by_amenities"
  | "schedule_tour"
  | "request_video_tour"
  | "contact_realtor"
  | "start_verification"
  | "create_account"
  | "sign_in"
  | "view_saved_homes"
  | "open_account";

const DIRECT_CHAT_COMMANDS: Array<{
  command: DirectChatCommand;
  labels: string[];
  response: string;
  buttons: string[];
}> = [
  {
    command: "view_listings",
    labels: [
      "view listings",
      "view all listings",
      "view all properties",
      "browse properties",
      "browse homes",
      "browse listings",
      "available homes",
      "available properties",
      "show listings",
      "show homes",
      "view available homes",
    ],
    response:
      "Yes — here are the active homes visible on the site right now. You can open a listing, search by price, search by city, search by bedrooms, or contact the realtor.",
    buttons: ["Search by Price", "Search by City", "Search by Bedrooms", "Search by Amenities", "Schedule Tour", "Contact Realtor"],
  },
  {
    command: "search_by_price",
    labels: [
      "search by price",
      "filter by price",
      "price search",
      "search under budget",
      "search by budget",
      "find homes by price",
      "homes in my budget",
      "change budget",
    ],
    response: "What price range would you like to search?",
    buttons: ["Under $300,000", "Under $400,000", "Under $500,000", "$500,000+", "View Listings", "Contact Realtor"],
  },
  {
    command: "search_by_city",
    labels: [
      "search by city",
      "search by location",
      "search by area",
      "search by neighborhood",
      "homes by city",
      "properties by city",
      "find homes by city",
      "find properties by city",
    ],
    response: "What city or area would you like to search?",
    buttons: ["Atlanta", "Decatur", "Sandy Springs", "Marietta", "Brookhaven", "View Listings"],
  },
  {
    command: "search_by_bedrooms",
    labels: [
      "search by bedrooms",
      "filter by bedrooms",
      "bedroom search",
      "search bedrooms",
      "homes by bedrooms",
      "houses by bedrooms",
      "find homes by bedrooms",
    ],
    response: "How many bedrooms are you looking for?",
    buttons: ["1 Bedroom", "2 Bedrooms", "3 Bedrooms", "4 Bedrooms", "5+ Bedrooms", "View Listings"],
  },
  {
    command: "search_by_bathrooms",
    labels: [
      "search by bathrooms",
      "filter by bathrooms",
      "bathroom search",
      "search bathrooms",
      "homes by bathrooms",
      "houses by bathrooms",
      "find homes by bathrooms",
    ],
    response: "How many bathrooms are you looking for?",
    buttons: ["1 Bathroom", "2 Bathrooms", "3 Bathrooms", "4+ Bathrooms", "View Listings"],
  },
  {
    command: "search_by_amenities",
    labels: [
      "search by amenities",
      "filter by amenities",
      "amenity search",
      "search amenities",
      "homes by amenities",
      "find homes by amenities",
      "search homes with pool",
      "search homes with garage",
      "search homes with basement",
      "search homes with balcony",
      "search homes with fireplace",
      "search homes with guest house",
      "search homes with fenced yard",
      "search homes with kitchen island",
    ],
    response: "What amenity or feature are you looking for?",
    buttons: ["Pool", "Garage", "Basement", "Balcony", "Fireplace", "Guest House", "Kitchen Island", "View Listings"],
  },
  {
    command: "schedule_tour",
    labels: [
      "schedule tour",
      "schedule a tour",
      "book tour",
      "book a tour",
      "schedule showing",
      "request showing",
      "tour this home",
      "see this home",
      "view available times",
    ],
    response: "Let’s get your tour started. Which property would you like to tour?",
    buttons: ["View Listings", "View Property Video", "Start Client ID Verification", "Contact Realtor"],
  },
  {
    command: "request_video_tour",
    labels: [
      "view property video",
      "open property video",
      "video tour",
      "virtual tour",
      "online tour",
      "remote tour",
      "can i tour online",
      "i can't come in person",
      "i cannot come in person",
      "show me property video",
      "view property video",
    ],
    response: "Sure — property videos now live under each property page. Which property are you interested in?",
    buttons: ["View Listings", "Schedule Tour", "Contact Realtor"],
  },
  {
    command: "contact_realtor",
    labels: [
      "contact realtor",
      "contact agent",
      "contact owner",
      "contact",
      "call realtor",
      "email realtor",
      "send message",
      "request callback",
      "talk to realtor",
      "speak to realtor",
      "ask realtor",
      "ask owner",
      "send question",
    ],
    response: "You can contact the realtor using the contact options below. You can also send a question or request a callback.",
    buttons: ["Call Realtor", "Email Realtor", "Request Callback", "View Listings"],
  },
  {
    command: "start_verification",
    labels: [
      "start verification",
      "verify account",
      "get verified",
      "verification",
      "begin verification",
      "continue verification",
      "check verification status",
      "upload id",
      "upload documents",
    ],
    response: "You can start Client ID Verification from your account. If you are not signed in, you may need to create an account or sign in first.",
    buttons: ["Sign In", "Create Account", "View Listings", "Contact Realtor"],
  },
  {
    command: "create_account",
    labels: ["create account", "register", "sign up", "make account", "open account"],
    response: "You can create an account to save homes, request tours, and complete Client ID Verification.",
    buttons: ["Sign In", "Start Client ID Verification", "View Listings"],
  },
  {
    command: "sign_in",
    labels: ["sign in", "login", "log in", "account login", "my account"],
    response: "You can sign in to access saved homes, Client ID Verification, and tour requests.",
    buttons: ["Create Account", "Start Client ID Verification", "View Listings"],
  },
  {
    command: "view_saved_homes",
    labels: ["view saved homes", "saved homes", "view liked homes", "liked homes", "favorites"],
    response: "You can view saved homes from your saved homes page. If you are not signed in, you may need to sign in first.",
    buttons: ["View Listings", "Sign In", "Create Account"],
  },
];

function normalizeDirectCommand(value: string) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getDirectChatCommand(message: string) {
  const clean = normalizeDirectCommand(message);

  for (const item of DIRECT_CHAT_COMMANDS) {
    const matched = item.labels.some((label) => clean === normalizeDirectCommand(label));
    if (matched) return item;
  }

  return null;
}


function isVerificationRecognitionMessage(message: string) {
  const clean = normalizeBudgetTourText(message);

  return /start verification|begin verification|verify account|verify my account|verify me|get verified|start my verification|continue verification|finish verification|complete verification|check verification|verification status|am i verified|do i need verification|do i need to verify|is verification required|how do i verify|how do i start verification|where do i verify|take me to verification|open verification|verification help|upload my id|upload documents|submit documents|id verification|identity verification|client verification|client id verification|profile verification|account verification/.test(clean);
}

function isExactVerificationButtonMessage(message: string) {
  const clean = normalizeBudgetTourText(message);

  return /^(start verification|start client id verification|continue verification|continue client id verification|check verification status|check client id verification status|view verification requirements|view client id verification requirements|upload documents|upload id)$/.test(clean);
}

function isSignInCommandMessage(message: string) {
  const clean = normalizeBudgetTourText(message);

  return /^(sign in|login|log in|sign in to schedule|sign in to schedule tour|sign in to view property video|sign in to verify)$/.test(clean);
}

function isCreateAccountCommandMessage(message: string) {
  const clean = normalizeBudgetTourText(message);

  return /^(create account|register|sign up|make account|open account)$/.test(clean);
}

function isExactScheduleTourButtonMessage(message: string) {
  const clean = normalizeBudgetTourText(message);

  return /^(schedule tour|schedule a tour|view available times|request showing|request private showing|book tour|book showing|tour this home|see this home)$/.test(clean);
}

function isExactVideoTourButtonMessage(message: string) {
  const clean = normalizeBudgetTourText(message);

  return /^(view property video|open property video|property video|view property video|schedule video tour|view virtual tour|request virtual tour|request remote tour|video tour|virtual tour)$/.test(clean);
}

function routeAfterChatMessage(href: string) {
  window.setTimeout(() => {
    window.location.href = href;
  }, 250);
}

type ChatPropertyVideoTourLookup = { propertyId: string; isEnabled?: boolean; videoUrl?: string };

function hasOwnerPropertyVideo(propertyVideoTours: ChatPropertyVideoTourLookup[], propertyId?: string) {
  if (!propertyId) return false;

  return propertyVideoTours.some(
    (tour) => tour.propertyId === propertyId && tour.isEnabled !== false && Boolean(tour.videoUrl?.trim()),
  );
}

function ownerVideoMissingReply(propertyTitle: string) {
  return `The owner has not created a property video for ${propertyTitle} yet. The best next step is to schedule an in-person tour so you can see the home directly, or contact the realtor and ask when the video will be added.`;
}


const PROPERTY_RECOGNITION_TRIGGERS = [
  "show me properties",
  "show properties",
  "show me homes",
  "show homes",
  "show me houses",
  "show houses",
  "show me listings",
  "show listings",
  "view listings",
  "view homes",
  "view houses",
  "view properties",
  "browse homes",
  "browse houses",
  "browse properties",
  "browse listings",
  "available homes",
  "available houses",
  "available properties",
  "available listings",
  "what homes are available",
  "what houses are available",
  "what properties are available",
  "what listings are available",
  "do you have any homes",
  "do you have any houses",
  "do you have any properties",
  "do you have any listings",
  "are there any homes available",
  "are there any houses available",
  "are there any properties available",
  "are there any listings available",
  "what do you have available",
  "what is available",
  "what's available",
  "whats available",
  "what homes do you have",
  "what houses do you have",
  "what properties do you have",
  "what listings do you have",
  "what can i see",
  "what can i view",
  "i want to see homes",
  "i want to see houses",
  "i want to see properties",
  "i want to see listings",
  "i want to view homes",
  "i want to view houses",
  "i want to view properties",
  "i want to view listings",
  "can i see homes",
  "can i see houses",
  "can i see properties",
  "can i see listings",
  "can you show me homes",
  "can you show me houses",
  "can you show me properties",
  "can you show me listings",
  "can you find me a home",
  "can you find me a house",
  "can you find me a property",
  "help me find a home",
  "help me find a house",
  "help me find a property",
  "i need a home",
  "i need a house",
  "i need a property",
  "i need somewhere to live",
  "i need a place",
  "looking for a home",
  "looking for a house",
  "looking for a property",
  "looking for listings",
  "property search",
  "home search",
  "house search",
  "listing search",
  "start property search",
  "start home search",
  "start listing search",

  "tell me about this property",
  "tell me about this home",
  "tell me about this house",
  "tell me about this listing",
  "more about this property",
  "more about this home",
  "more about this house",
  "more about this listing",
  "details about this property",
  "details about this home",
  "details about this house",
  "details about this listing",
  "property details",
  "home details",
  "house details",
  "listing details",
  "what are the details",
  "what are the home details",
  "what are the property details",
  "what are the listing details",
  "give me more information",
  "give me more info",
  "more information",
  "more info",
  "tell me more",
  "can i get more details",
  "what should i know about this home",
  "what should i know about this property",
  "what does this property include",
  "what does this home include",
  "what comes with this property",
  "what are the highlights",
  "property highlights",
  "home highlights",
  "listing highlights",
  "main features",
  "key features",
  "best features",
  "important details",
  "special notes",

  "what type of property is this",
  "what kind of property is this",
  "what type of home is this",
  "is this a house",
  "is this a home",
  "is this a condo",
  "is this a townhouse",
  "is this an apartment",
  "is this a rental",
  "is this for sale",
  "is this for rent",
  "is this a single family home",
  "single family home",
  "single-family home",
  "property type",
  "home type",
  "listing type",
  "rent or buy",
  "can i rent this",
  "can i buy this",
  "do you have rentals",
  "do you have homes for sale",

  "is this property available",
  "is this home available",
  "is this house available",
  "is this listing available",
  "is it available",
  "still available",
  "is it still available",
  "is this still available",
  "available now",
  "available today",
  "when is this available",
  "when can i move in",
  "move in date",
  "move-in ready",
  "move in ready",
  "is it occupied",
  "is this occupied",
  "is it vacant",
  "is this vacant",
  "is the listing active",
  "active listing",
  "is it sold",
  "is this sold",
  "is it pending",
  "under contract",
  "off market",
  "current listings",
  "active properties",
  "available properties right now",

  "where is this property located",
  "where is this home located",
  "where is this house located",
  "where is it located",
  "what is the location",
  "property location",
  "home location",
  "listing location",
  "what city is this in",
  "what state is this in",
  "what area is this in",
  "what neighborhood is this in",
  "where exactly is it",
  "what is the address",
  "what's the address",
  "whats the address",
  "property address",
  "home address",
  "house address",
  "listing address",
  "full address",
  "can i get the address",
  "send me the address",
  "show me the address",
  "homes in atlanta",
  "houses in atlanta",
  "properties in atlanta",
  "listings in atlanta",
  "homes in georgia",
  "search by city",
  "search by state",
  "search near me",

  "how many bedrooms",
  "how many beds",
  "bedroom count",
  "bed count",
  "number of bedrooms",
  "number of beds",
  "1 bedroom",
  "2 bedrooms",
  "3 bedrooms",
  "4 bedrooms",
  "5 bedrooms",
  "one bedroom",
  "two bedrooms",
  "three bedrooms",
  "four bedrooms",
  "five bedrooms",
  "homes with 1 bedroom",
  "homes with 2 bedrooms",
  "homes with 3 bedrooms",
  "homes with 4 bedrooms",
  "i need 2 bedrooms",
  "i need 3 bedrooms",
  "i need 4 bedrooms",
  "at least 2 bedrooms",
  "at least 3 bedrooms",
  "minimum 3 bedrooms",

  "how many bathrooms",
  "how many baths",
  "bathroom count",
  "bath count",
  "number of bathrooms",
  "number of baths",
  "1 bathroom",
  "2 bathrooms",
  "3 bathrooms",
  "4 bathrooms",
  "one bathroom",
  "two bathrooms",
  "three bathrooms",
  "four bathrooms",
  "homes with 2 bathrooms",
  "homes with 3 bathrooms",
  "i need 2 bathrooms",
  "at least 2 bathrooms",
  "minimum 2 bathrooms",
  "half bath",
  "guest bathroom",
  "master bathroom",
  "primary bathroom",

  "how many square feet",
  "square feet",
  "sq ft",
  "sqft",
  "square footage",
  "property square footage",
  "home square footage",
  "what is the square footage",
  "what's the square footage",
  "whats the square footage",
  "how big is it",
  "how large is it",
  "what size is the property",
  "property size",
  "home size",
  "house size",
  "large home",
  "small home",
  "homes over 1000 square feet",
  "homes over 1500 square feet",
  "homes over 2000 square feet",
  "homes over 2500 square feet",
  "homes over 3000 square feet",

  "lot size",
  "what is the lot size",
  "how big is the lot",
  "yard size",
  "acreage",
  "acres",
  "how many acres",
  "does it have land",
  "large lot",
  "big yard",
  "backyard",
  "front yard",
  "does it have a backyard",
  "is the yard fenced",
  "fenced yard",
  "private yard",
  "outdoor space",
  "deck",
  "porch",
  "patio",
  "balcony",
  "garden",

  "what condition is the property in",
  "what condition is the home in",
  "is it new",
  "new construction",
  "newly renovated",
  "renovated",
  "recently renovated",
  "updated home",
  "is it updated",
  "is the kitchen updated",
  "does it need work",
  "needs repairs",
  "fixer upper",
  "move in ready",
  "turnkey",
  "is it clean",
  "is it modern",
  "historic home",
  "well maintained",
  "recent upgrades",
  "what upgrades does it have",

  "can i see pictures",
  "can i see photos",
  "show me pictures",
  "show me photos",
  "property photos",
  "home photos",
  "house photos",
  "listing photos",
  "more pictures",
  "more photos",
  "photo gallery",
  "image gallery",
  "show images",
  "video of the property",
  "property video",
  "virtual tour",
  "3d tour",
  "walkthrough video",
  "can i see inside",
  "interior photos",
  "exterior photos",

  "find me a home with",
  "find me a house with",
  "show me homes with",
  "show me houses with",
  "do you have homes with",
  "homes with",
  "houses with",
  "i want a home with",
  "i need a home with",
  "looking for homes with",
  "search homes with",
  "filter homes by",
  "show me matching homes",
  "matching listings",
  "do you have anything with",
  "any homes with",

  "compare properties",
  "compare homes",
  "compare houses",
  "compare listings",
  "which home is better",
  "which property is better",
  "which one is better",
  "what is the difference",
  "compare price",
  "compare bedrooms",
  "compare bathrooms",
  "compare square footage",
  "compare amenities",
  "which is bigger",
  "which is cheaper",
  "which has more bedrooms",
  "which has a garage",
  "which has a pool",
  "help me choose",
  "help me decide",
  "which one should i tour",

  "is this active",
  "is this listing active",
  "is this pending",
  "is this sold",
  "is this under contract",
  "coming soon",
  "new listing",
  "new listings",
  "recent listings",
  "latest listings",
  "just listed",
  "back on market",
  "listing status",
  "property status",
  "home status",
  "what is the status",
  "is it still on the market",
];

function normalizePropertyText(value: string) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isPropertyRecognitionMessage(message: string) {
  const clean = normalizePropertyText(message);

  if (/\b\d+\s*(bed|beds|bedroom|bedrooms|bath|baths|bathroom|bathrooms)\b/.test(clean)) return true;
  if (/\b\$?\d{3,}(k|m|million|thousand)?\b/.test(clean) && /\b(home|house|property|listing|price|under|below|over|budget)\b/.test(clean)) return true;

  return PROPERTY_RECOGNITION_TRIGGERS.some((trigger) => {
    const normalizedTrigger = normalizePropertyText(trigger);
    return clean === normalizedTrigger || clean.includes(normalizedTrigger);
  });
}


const GREETING_TRIGGERS = [
  "hi",
  "hello",
  "hey",
  "hey there",
  "hello there",
  "hi there",
  "good morning",
  "morning",
  "good afternoon",
  "afternoon",
  "good evening",
  "evening",
  "good day",
  "greetings",
  "welcome",
  "yo",
  "what's up",
  "whats up",
  "sup",
  "wassup",
  "wsg",
  "howdy",
  "hey hey",
  "hello hello",
  "hi hi",
  "anyone there",
  "is anyone there",
  "is somebody there",
  "is someone there",
  "can anyone help me",
  "can someone help me",
  "can you help me",
  "could you help me",
  "i need help",
  "need help",
  "help me",
  "help",
  "i have a question",
  "quick question",
  "i need assistance",
  "can i ask a question",
  "are you available",
  "are you open",
  "are you real",
  "who is this",
  "what can you do",
  "what do you help with",
  "how does this work",
  "where do i start",
  "start",
  "begin",
  "let's start",
  "lets start",
  "i'm looking for a home",
  "im looking for a home",
  "i'm looking for a house",
  "im looking for a house",
  "i need a house",
  "i need a home",
  "looking for listings",
  "show me listings",
  "show me homes",
  "show me houses",
  "i want to see properties",
  "i want to view homes",
  "i want to tour a home",
  "i want to schedule a tour",
  "i need property help",
  "i need realtor help",
  "i need to contact the realtor",
  "i need verification help",
  "i need help verifying",
  "i need to verify my account",
  "i need account help",
  "i need login help",
  "i need help signing in",
  "i need help with this site",
  "can you show me around",
  "how do i use this site",
  "where are the listings",
  "where can i see homes",
  "i am interested",
  "i'm interested",
  "im interested",
  "interested",
  "i want more information",
  "more info",
  "tell me more",
  "can we talk",
  "i have questions",
  "i want to buy",
  "i want to rent",
  "i want to sell",
  "i want to schedule",
  "i want to speak with someone",
  "i want to talk to the realtor",
  "can i talk to someone",
  "can i speak to someone",
  "can i contact someone",
  "who can help me",
  "are you there",
  "you there",
  "still there",
  "hello?",
  "hi?",
  "hey?",
  "yo?",
  "how are you",
  "how's your day",
  "how is your day",
  "nice to meet you",
  "i'm new here",
  "first time here",
  "new visitor",
  "new user",
  "just browsing",
  "just looking",
  "browsing homes",
  "checking listings",
  "checking prices",
  "checking properties",
  "checking out the site",
  "information please",
  "property information",
  "home information",
  "listing information",
  "tour information",
  "verification information",
  "pricing information",
  "school information",
  "amenity information",
  "neighborhood information",
  "contact information",
  "please help",
  "pls help",
  "hey can you help",
  "hi can you help",
  "hello can you help",
  "i need help finding a home",
  "i need help finding a property",
  "i need help with listings",
  "i need help with prices",
  "i need help with tours",
  "i need help with verification",
  "i need help contacting the realtor",
  "can you find homes",
  "can you find listings",
  "can you find properties",
  "can you help me find a house",
  "can you help me find a home",
  "can you help me schedule a tour",
  "can you help me verify",
  "can you help me contact the realtor",
  "where should i click",
  "what should i do first",
  "what are my options",
  "show me my options",
  "i'm ready",
  "ready",
  "ready to start",
  "let's go",
  "lets go",
  "okay help me",
  "ok help me",
  "alright help me",
  "start chat",
  "open chat",
  "chat",
  "talk",
  "question",
  "support",
  "customer support",
  "website support",
  "property support",
  "listing support",
  "tour support",
  "realtor support",
  "client support",
  "buyer help",
  "renter help",
  "seller help",
  "homebuyer help",
  "new buyer",
  "new renter",
  "new seller",
];

const GREETING_REPLIES = [
  "Hi — I can help with listings, pricing, home details, tours, verification, saved homes, and contacting the realtor. What would you like help with?",
  "Hello — what can I help you find today?",
  "Welcome — are you looking for a home, a tour, verification help, or contact information?",
  "Hi there — I can help you search properties, check prices, view amenities, schedule a tour, or contact the realtor.",
  "Hello — I’m here to help with property details, pricing, tours, verification, and website support.",
  "Hey — how can I help with your home search today?",
  "Hi — would you like to view listings, ask about a specific property, or schedule a tour?",
  "Hello — I can help with available properties, prices, amenities, schools, neighborhoods, tours, and verification.",
  "Hi — tell me what you need help with, or choose one of the options below.",
  "Welcome — I can help with listings, tours, verification, account support, or contacting the realtor.",
];

function normalizeGreetingText(value: string) {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function simpleGreetingReply(message: string, name?: string | null) {
  const clean = normalizeGreetingText(message);
  const matched = GREETING_TRIGGERS.some((trigger) => {
    const normalizedTrigger = normalizeGreetingText(trigger);
    return clean === normalizedTrigger || clean.startsWith(`${normalizedTrigger} `);
  });

  if (!matched) return null;

  const index = Math.abs(clean.split("").reduce((total, char) => total + char.charCodeAt(0), 0)) % GREETING_REPLIES.length;
  const reply = GREETING_REPLIES[index];

  if (!name?.trim()) return reply;

  const firstName = name.trim().split(/\s+/)[0];
  return reply.replace(/^Hi\b/, `Hi ${firstName}`).replace(/^Hello\b/, `Hello ${firstName}`).replace(/^Welcome\b/, `Welcome ${firstName}`);
}


function parseDirectBudgetShortcut(message: string) {
  const clean = normalizeBudgetTourText(message);
  const directBudgetOnly = /^\$?\s*\d+(?:\.\d+)?\s*(k|m|million|thousand)?$/.test(clean);
  const propertyBudgetPhrase = /\b(under|below|less than|max|maximum|budget|price|prices|homes?|houses?|properties?|listings?)\b/.test(clean);

  if (!directBudgetOnly && !propertyBudgetPhrase) return null;

  const match = clean.match(/\$?\s*(\d+(?:\.\d+)?)\s*(k|m|million|thousand)?\b/);
  if (!match) return null;

  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;

  const suffix = match[2] || "";
  if (suffix === "m" || suffix === "million") return Math.round(numeric * 1000000);
  if (suffix === "k" || suffix === "thousand") return Math.round(numeric * 1000);

  return numeric < 10000 ? Math.round(numeric * 1000) : Math.round(numeric);
}

function isCityHomeShortcut(message: string) {
  const clean = normalizeBudgetTourText(message);
  return /\b(atlanta|atl|georgia|ga)\b/.test(clean) && /\b(homes?|houses?|properties?|listings?)\b/.test(clean);
}

function formatShortcutPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}


function hasSelectedPropertyInUrl() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("propertyId");
}

function selectedPropertyTitleOnlyFromUrl() {
  if (!hasSelectedPropertyInUrl()) return "";
  return selectedPropertyFromUrl().title;
}

function Chat() {
  const [captured, setCaptured] = useState(false);
  const [initialInterest, setInitialInterest] = useState(selectedPropertyTitleOnlyFromUrl());

  useEffect(() => {
    const hasPropertyParam = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("propertyId");
    const selected = selectedPropertyFromUrl();
    const savedLead = readLead();
    const interest = hasPropertyParam ? selected.title : savedLead?.interest || "";
    setInitialInterest(interest);
    if (savedLead) {
      const next = { ...savedLead, interest };
      writeLead(next);
      setCaptured(true);
    } else {
      setCaptured(false);
    }
  }, []);

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {captured ? <ChatRoom /> : <LeadCapture initialInterest={initialInterest} onDone={() => setCaptured(true)} />}
      </main>
    </AppShell>
  );
}

function LeadCapture({ initialInterest, onDone }: { initialInterest: string; onDone: () => void }) {
  const profile = useRealtorProfile();
  const { activeProperties } = usePublicProperties();
  const { addLead, ensureChatThread, conciergeSettings } = usePlatformData();
  const [form, setForm] = useState<LeadCapture>({
    name: "",
    email: "",
    phone: "",
    timeline: timelineOptions[0],
    budget: budgetOptions[2],
    interest: initialInterest,
  });

  useEffect(() => {
    setForm((current) => ({ ...current, interest: initialInterest }));
  }, [initialInterest]);

  const set = (k: keyof LeadCapture, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please add your name and email.");
      return;
    }
    writeLead(form);
    addLead(form);
    ensureChatThread(form);
    toast.success("Your private concierge chat is ready.");
    onDone();
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
      <div className="overflow-hidden rounded-[2.25rem] border border-border bg-card shadow-xl">
        <div className="bg-[radial-gradient(circle_at_top_left,oklch(0.92_0.035_78),transparent_28%),linear-gradient(135deg,oklch(0.12_0.025_260),oklch(0.19_0.025_270))] p-6 text-primary-foreground sm:p-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"><Sparkles className="size-3.5" /> {conciergeSettings.agentName} · AI Member Concierge</p>
          <h2 className="mt-5 max-w-xl font-serif text-4xl tracking-tight sm:text-5xl">A smarter first conversation for serious members.</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
            {conciergeSettings.welcomeMessage}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4 rounded-3xl bg-secondary p-4">
            <img src={profile.headshot} alt={profile.name} width={64} height={64} className="size-16 rounded-2xl object-cover" />
            <div>
              <p className="font-semibold">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-accent-foreground"><span className="size-2 rounded-full bg-green-500" /> Concierge online</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <Trust icon={BrainCircuit} title="Smart replies" text="Property-aware answers" />
            <Trust icon={FileText} title="Documents" text="Prepared for review" />
            <Trust icon={ListChecks} title="Next steps" text="Clear guidance" />
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-[2rem] border border-border bg-card p-6 shadow-xl sm:p-8">
        <p className="section-kicker"><MessageCircle className="size-3.5" /> Start AI-guided chat</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">Member details</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {conciergeSettings.agentName} uses this information to personalize the conversation and keep your next step clear, discreet, and efficient.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="ev-input" placeholder="Your name" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="ev-input" placeholder="you@email.com" />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="ev-input" placeholder="(310) 555-0000" />
          </Field>
          <Field label="Buying timeline">
            <select value={form.timeline} onChange={(e) => set("timeline", e.target.value)} className="ev-input">
              {timelineOptions.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Budget">
            <select value={form.budget} onChange={(e) => set("budget", e.target.value)} className="ev-input">
              {budgetOptions.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Property of interest">
            <select value={form.interest} onChange={(e) => set("interest", e.target.value)} className="ev-input">
              {activeProperties.map((p) => <option key={p.id}>{p.title}</option>)}
            </select>
          </Field>
        </div>
        <button type="submit" className="mt-6 w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
          Open AI Concierge Chat
        </button>
        <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">
          This is our custom AI concierge flow — no outside bot widget. Production will connect to a secure AI/backend service.
        </p>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Trust({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-background p-4">
      <Icon className="size-5 text-accent-foreground" />
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function ChatRoom() {
  const profile = useRealtorProfile();
  const { user } = useAuth();
  const { properties,
    propertyVideoTours, activeProperties } = usePublicProperties();
  const { chatThreads, ensureChatThread, addChatMessage, addSystemChatMessage, requestVideoCall, markThreadRead, conciergeSettings, recordAiHandoff, recordContactAction } = usePlatformData();
  const [threadId, setThreadId] = useState("");
  const [text, setText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [lastActions, setLastActions] = useState<string[]>([]);
  const [lastPropertyCards, setLastPropertyCards] = useState<typeof properties>([]);
  const [sessionTimedOut, setSessionTimedOut] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutMessageAddedRef = useRef(false);

  useEffect(() => {
    const hasPropertyParam = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("propertyId");
    const selected = selectedPropertyFromUrl();
    const savedLead = readLead() || {
      name: "Private Member",
      email: "member@example.com",
      phone: "Not provided",
      timeline: "Not specified",
      budget: "Not specified",
      interest: hasPropertyParam ? selected.title : "",
    };
    const nextLead = { ...savedLead, interest: hasPropertyParam ? selected.title : savedLead.interest || "" };
    writeLead(nextLead);
    const thread = ensureChatThread(nextLead);
    const existingSession = getChatSession(thread.id);
    if (!existingSession) {
      markChatSessionActive(thread.id, true);
      setSessionTimedOut(false);
      timeoutMessageAddedRef.current = false;
    } else if (existingSession.timedOutAt) {
      setSessionTimedOut(true);
      timeoutMessageAddedRef.current = true;
    }
    setThreadId(thread.id);
    markThreadRead(thread.id);

    if (selectedActionFromUrl() === "document") {
      toast("Use the paperclip to attach documents for this property.", { icon: "📎" });
    }
    if (selectedActionFromUrl() === "video") {
      toast("Tap the Video button to log a video-tour request for this property.", { icon: "🎥" });
    }
  }, [ensureChatThread, markThreadRead]);

  const thread = useMemo(
    () => chatThreads.find((item) => item.id === threadId) || chatThreads[0],
    [chatThreads, threadId],
  );
  const allMessages = thread?.messages || [];
  const sessionInfo = thread?.id ? getChatSession(thread.id) : undefined;
  const sessionStartedAt = sessionInfo?.sessionStartedAt || 0;
  const messages = sessionTimedOut
    ? []
    : allMessages.filter((message) => messageCreatedAt(message) >= sessionStartedAt);
  const lead = readLead();
  const concierge: any = {
    title: hasSelectedPropertyInUrl() && thread?.property ? `Ask about ${thread.property}` : "Member Concierge",
    subtitle: hasSelectedPropertyInUrl()
      ? "Ask about this property, request a tour, or choose the next step."
      : "Ask about homes, tours, verification, documents, saved homes, or next steps.",
    description: hasSelectedPropertyInUrl()
      ? "I can help you understand this property and decide what to do next."
      : "I can help you navigate the site and connect with the right real estate next step.",
    highlights: [],
    nextSteps: [],
    prompts: [],
    cards: [],
  };

  const shouldHandoff = (intent: string, score: number) => {
    if (!conciergeSettings.enableOwnerHandoff) return false;
    return score >= conciergeSettings.handoffScore || ["tour", "documents", "offer", "video"].includes(intent);
  };

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const endChatSession = useCallback(() => {
    if (!thread?.id || timeoutMessageAddedRef.current) return;
    timeoutMessageAddedRef.current = true;
    markChatSessionTimedOut(thread.id);
    setSessionTimedOut(true);
    clearIdleTimer();
    addSystemChatMessage(thread.id, CHAT_TIMEOUT_TEXT, "timeout");
  }, [addSystemChatMessage, clearIdleTimer, thread?.id]);

  const startNewChatSession = useCallback(() => {
    if (!thread?.id) return;
    clearIdleTimer();
    timeoutMessageAddedRef.current = false;
    markChatSessionActive(thread.id, true);
    setSessionTimedOut(false);
    idleTimerRef.current = setTimeout(endChatSession, CHAT_IDLE_MS);
    setText("");
    setLastActions([]);
    toast.success("New chat session started.");
  }, [clearIdleTimer, endChatSession, thread?.id]);

  const touchChatSession = useCallback(() => {
    if (!thread?.id) return;
    markChatSessionActive(thread.id);
    timeoutMessageAddedRef.current = false;
    setSessionTimedOut(false);
  }, [thread?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isThinking, sessionTimedOut]);

  useEffect(() => () => clearIdleTimer(), [clearIdleTimer]);

  useEffect(() => {
    clearIdleTimer();
    if (!thread?.id) return;

    const last = messages[messages.length - 1];
    const stored = getChatSession(thread.id);
    const lastWasTimeout = last?.kind === "timeout";
    if (stored?.timedOutAt || lastWasTimeout) {
      timeoutMessageAddedRef.current = true;
      setSessionTimedOut(true);
      return;
    }

    timeoutMessageAddedRef.current = false;
    setSessionTimedOut(false);
    const lastActivityAt = stored?.lastActivityAt || Date.now();
    if (!stored) markChatSessionActive(thread.id, true);
    const remaining = Math.max(0, CHAT_IDLE_MS - (Date.now() - lastActivityAt));
    idleTimerRef.current = setTimeout(endChatSession, remaining);
  }, [allMessages.length, clearIdleTimer, endChatSession, messages.length, thread?.id]);

  const pushAiReply = async (memberMessage: string) => {
    if (!thread?.id) return;
    if (!conciergeSettings.autoReply) {
      recordAiHandoff(thread.id, "website chat auto-reply is off; realtor response needed", 72);
      toast("A realtor follow-up has been requested.", { icon: "🔔" });
      return;
    }

    setIsThinking(true);
    try {
      const goodbyeReply = simpleGoodbyeReply(memberMessage.trim(), lead?.name);
      if (goodbyeReply) {
        setLastPropertyCards([]);
        setLastActions([]);
        addChatMessage(thread.id, "realtor", goodbyeReply);
        return;
      }

      const budgetFilter = getBudgetFilter(memberMessage.trim());
      const isLiveTourMessage = isLiveTourRecognitionMessage(memberMessage.trim());
      const isVideoTourMessage = isVideoTourRecognitionMessage(memberMessage.trim());
      const isVerificationMessage = isVerificationRecognitionMessage(memberMessage.trim());
      const isSignedIn = Boolean(user);

      const activeHomesForAction = properties.filter((property) => property.status === "active");
      const selectedHomeForAction = hasSelectedPropertyInUrl()
        ? activeHomesForAction.find((property) => property.title === thread.property)
        : undefined;

      const accountVerificationRoute = "/account";
      const tourRoute = selectedHomeForAction ? `/tours?propertyId=${selectedHomeForAction.id}` : "/tours";
      const videoTourRoute = selectedHomeForAction
        ? `/property/${selectedHomeForAction.id}#property-video-tour`
        : "/listings";
      const selectedHomeVideoReady = hasOwnerPropertyVideo(propertyVideoTours, selectedHomeForAction?.id);

      if (isSignInCommandMessage(memberMessage.trim())) {
        setLastPropertyCards([]);
        setLastActions([]);
        addChatMessage(thread.id, "realtor", "Opening the sign-in page so your tour, saved homes, and verification steps can connect to your account.");
        routeAfterChatMessage("/login");
        return;
      }

      if (isCreateAccountCommandMessage(memberMessage.trim())) {
        setLastPropertyCards([]);
        setLastActions([]);
        addChatMessage(thread.id, "realtor", "Opening the account creation page so you can save homes, request tours, and complete verification.");
        routeAfterChatMessage("/register");
        return;
      }

      if (isVerificationMessage) {
        setLastPropertyCards([]);

        if (!isSignedIn) {
          setLastActions(["Sign In", "Create Account", "Contact Realtor"]);
          addChatMessage(
            thread.id,
            "realtor",
            "Client ID Verification is connected to your member profile. To start or continue, please sign in or create an account first. After signing in, you can continue Client ID Verification from your account page.",
          );
          return;
        }

        setLastActions(["Open Account", "Contact Realtor"]);
        addChatMessage(
          thread.id,
          "realtor",
          "You’re signed in. Client ID Verification is handled from your account page. Use the account button below, then continue from the Client ID Verification section.",
        );
        return;
      }

      if ((isLiveTourMessage || isVideoTourMessage) && !budgetFilter) {
        if (!isSignedIn) {
          setLastPropertyCards([]);
          setLastActions(["Sign In", "Create Account", "View Listings", "Contact Realtor"]);
          addChatMessage(
            thread.id,
            "realtor",
            isVideoTourMessage
              ? "Property videos are login-locked under each property page. Sign in or create an account first, then open the property video section."
              : "To schedule a tour, you may need to sign in or create an account first. Once signed in, you can choose the property and continue scheduling.",
          );
          return;
        }

        if (selectedHomeForAction) {
          setLastPropertyCards([selectedHomeForAction]);
          setLastActions(
            isVideoTourMessage
              ? ["View Property Video", "Schedule Tour", "View Listings", "Contact Realtor"]
              : ["Schedule Tour", "View Property Video", "View Listings", "Contact Realtor"],
          );

          if (isExactVideoTourButtonMessage(memberMessage.trim())) {
            if (!selectedHomeVideoReady) {
              setLastActions(["Schedule Tour", "View Listings", "Contact Realtor"]);
              addChatMessage(thread.id, "realtor", ownerVideoMissingReply(selectedHomeForAction.title));
              return;
            }

            setLastActions(["Schedule Tour", "View Listings", "Contact Realtor"]);
            addChatMessage(
              thread.id,
              "realtor",
              `You’re signed in. The property video section for ${selectedHomeForAction.title} is available from that property's detail page. If the video does not open cleanly, use View Listings and open the property directly.`,
            );
            return;
          }

          if (isExactScheduleTourButtonMessage(memberMessage.trim())) {
            setLastActions(["View Listings", "View Property Video", "Contact Realtor"]);
            addChatMessage(
              thread.id,
              "realtor",
              `You’re signed in. You can schedule an in-person tour for ${selectedHomeForAction.title} from the Tours page or from the property detail page. Use View Listings if you want to choose the property again.`,
            );
            return;
          }

          if (isVideoTourMessage && !selectedHomeVideoReady) {
            setLastActions(["Schedule Tour", "View Listings", "Contact Realtor"]);
            addChatMessage(thread.id, "realtor", ownerVideoMissingReply(selectedHomeForAction.title));
            return;
          }

          addChatMessage(
            thread.id,
            "realtor",
            isVideoTourMessage
              ? `You’re signed in. You can open the login-locked property video section for ${selectedHomeForAction.title} using the button below.`
              : `You’re signed in. You can schedule an in-person tour for ${selectedHomeForAction.title} using the button below.`,
          );
          return;
        }

        setLastPropertyCards(activeHomesForAction.slice(0, 3));
        setLastActions(["View Listings", "Search by Price", "Search by City", "Contact Realtor"]);
        addChatMessage(
          thread.id,
          "realtor",
          isVideoTourMessage
            ? "You’re signed in. Which property video would you like to view? Use the related home options below or open all listings."
            : "You’re signed in. Which property would you like to tour? Use the related home options below or open all listings.",
        );
        return;
      }

      const directCommand = getDirectChatCommand(memberMessage.trim());
      if (directCommand) {
        if (directCommand.command === "open_account") {
          setLastPropertyCards([]);
          setLastActions([]);
          addChatMessage(thread.id, "realtor", "Opening your account page now.");
          routeAfterChatMessage("/account");
          return;
        }

        const activeHomesForCommand = properties.filter((property) => property.status === "active").slice(0, 3);

        if (["view_listings", "schedule_tour", "request_video_tour"].includes(directCommand.command)) {
          setLastPropertyCards(activeHomesForCommand);
        } else {
          setLastPropertyCards([]);
        }

        setLastActions(directCommand.buttons);
        addChatMessage(thread.id, "realtor", directCommand.response);
        return;
      }

      const isPropertyMessage =
        isPropertyRecognitionMessage(memberMessage.trim()) ||
        Boolean(budgetFilter) ||
        isLiveTourMessage ||
        isVideoTourMessage;

      if (isPropertyMessage) {
        const cleanPropertyMessage = memberMessage.trim().toLowerCase();
        const activeHomes = properties.filter((property) => property.status === "active");

        const selectedHome = hasSelectedPropertyInUrl()
          ? activeHomes.find((property) => property.title === thread.property)
          : undefined;

        const asksForSpecificPropertyContext =
          /square footage|sq ft|sqft|how big|how large|still available|is it available|is this available|property available|home available|listing available|address|where is it located|photos|pictures|gallery/i.test(cleanPropertyMessage);

        const bedroomMatch = cleanPropertyMessage.match(/(\d+)\s*(bed|beds|bedroom|bedrooms)/);
        const minimumBeds = bedroomMatch ? Number(bedroomMatch[1]) : undefined;

        const bathroomMatch = cleanPropertyMessage.match(/(\d+)\s*(bath|baths|bathroom|bathrooms)/);
        const minimumBaths = bathroomMatch ? Number(bathroomMatch[1]) : undefined;

        const minPrice = budgetFilter?.minPrice;
        const maxPrice = budgetFilter?.maxPrice;
        const budgetLabel = budgetFilter?.label;

        if ((isLiveTourMessage || isVideoTourMessage) && selectedHome && !minimumBeds && !minimumBaths && !budgetFilter) {
          setLastPropertyCards([selectedHome]);
          setLastActions(
            isVideoTourMessage
              ? ["View Property Video", "Schedule Tour", "View Listings", "Contact Realtor"]
              : ["Schedule Tour", "View Property Video", "View Listings", "Contact Realtor"],
          );
          addChatMessage(
            thread.id,
            "realtor",
            isVideoTourMessage
              ? `Yes — you can view the property video for ${selectedHome.title} if the owner has created one. If not, the best next step is to schedule an in-person tour.`
              : `You can schedule an in-person tour for ${selectedHome.title} if tour options are available.`,
          );
          return;
        }

        if ((isLiveTourMessage || isVideoTourMessage) && !selectedHome && !minimumBeds && !minimumBaths && !budgetFilter) {
          setLastPropertyCards(activeHomes.slice(0, 3));
          setLastActions(
            isVideoTourMessage
              ? ["View Property Video", "View Listings", "Schedule Tour", "Contact Realtor"]
              : ["Schedule Tour", "View Property Video", "View Listings", "Contact Realtor"],
          );
          addChatMessage(
            thread.id,
            "realtor",
            isVideoTourMessage
              ? "Yes — property videos live under each property page when the owner has created them. If a video is not available yet, schedule an in-person tour so you can see the home directly."
              : "You can schedule an in-person tour if tour options are available. Use the related home options below or view all listings to choose a home.",
          );
          return;
        }

        if (asksForSpecificPropertyContext && !selectedHome && !minimumBeds && !minimumBaths && !minPrice && !maxPrice && !isLiveTourMessage && !isVideoTourMessage) {
          setLastPropertyCards(activeHomes.slice(0, 3));
          setLastActions(["View Listings", "Schedule Tour", "View Property Video", "Contact Realtor"]);
          addChatMessage(
            thread.id,
            "realtor",
            "Which property are you asking about? Use the related home options below, open all listings, or tell me the property name, address, price range, bedroom count, or city so I can point you in the right direction.",
          );
          return;
        }

        const matchedHomes = activeHomes
          .filter((property) => {
            const propertyPrice = typeof property.price === "number" ? property.price : 0;
            if (minPrice && propertyPrice < minPrice) return false;
            if (maxPrice && propertyPrice > maxPrice) return false;
            if (minimumBeds && property.beds < minimumBeds) return false;
            if (minimumBaths && property.baths < minimumBaths) return false;
            return true;
          })
          .slice(0, 3);

        const hasStrictPropertyFilters = Boolean(minimumBeds || minimumBaths || budgetFilter);
        const homesToShow = matchedHomes.length ? matchedHomes : hasStrictPropertyFilters ? [] : activeHomes.slice(0, 3);

        const formatHome = (property: (typeof properties)[number]) => {
          const price = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(property.price);

          const sqft = property.sqft ? `, ${property.sqft.toLocaleString()} sq ft` : "";
          return `• ${property.title}\n  ${price} · ${property.beds} bed · ${property.baths} bath${sqft}\n  ${property.city}`;
        };

        const filterParts: string[] = [];
        if (minimumBeds) filterParts.push(`at least ${minimumBeds} bedrooms`);
        if (minimumBaths) filterParts.push(`at least ${minimumBaths} bathrooms`);
        if (budgetLabel) filterParts.push(budgetLabel);

        const propertyActionButtons = isVideoTourMessage
          ? ["View Property Video", "Schedule Tour", "View Listings", "Search by Price", "Contact Realtor"]
          : isLiveTourMessage
            ? ["Schedule Tour", "View Property Video", "View Listings", "Search by Price", "Contact Realtor"]
            : budgetFilter
              ? ["View Listings", "Search by Price", "Search by City", "Search by Bedrooms", "Search by Amenities", "Contact Realtor"]
              : filterParts.length
                ? ["View Listings", "Schedule Tour", "View Property Video", "Search by Price", "Search by Amenities", "Contact Realtor"]
                : ["View Listings", "Search by Price", "Search by City", "Search by Bedrooms", "Search by Amenities", "Contact Realtor"];

        const message = (() => {
          if (homesToShow.length) {
            if (budgetFilter && isVideoTourMessage) {
              return `I found homes matching ${budgetLabel} where you can view a property video when available. Use the related home options to view details, schedule a tour, or view a property video.`;
            }

            if (budgetFilter && isLiveTourMessage) {
              return `I found homes matching ${budgetLabel} where you can request an in-person tour when available. Use the related home options to view details, schedule a tour, or view a property video.`;
            }

            if (budgetFilter) {
              return `I found homes ${budgetLabel}. Use the related home options to view details, schedule a tour, or view a property video.`;
            }

            if (isVideoTourMessage) {
              return "Yes — property videos live under each property page when the owner has created them. If a video is not available yet, schedule an in-person tour so you can see the home directly.";
            }

            if (isLiveTourMessage) {
              return "You can schedule an in-person tour if tour options are available. Use the related home options below or view all listings to choose a home.";
            }

            if (filterParts.length) {
              return `Yes — I found ${homesToShow.length} home${homesToShow.length === 1 ? "" : "s"} matching ${filterParts.join(", ")}. Swipe through the cards below to view details, schedule a tour, or view a property video.`;
            }

            return "Yes — here are active homes visible on the site right now. Swipe through the cards below to view details, schedule a tour, or view a property video.";
          }

          if (budgetFilter) {
            return `I do not currently see homes matching ${budgetLabel}. You can search a different budget, view all listings, or contact the realtor for similar options.`;
          }

          if (filterParts.length) {
            return `I do not see an exact visible match for ${filterParts.join(", ")} right now. You can adjust your search or contact the realtor for similar options.`;
          }

          return "I do not see matching active homes right now. You can view all listings or contact the realtor for help.";
        })();

        setLastPropertyCards(homesToShow);
        setLastActions(propertyActionButtons);
        addChatMessage(thread.id, "realtor", message);
        return;
      }

      const greetingReply = simpleGreetingReply(memberMessage.trim(), lead?.name);
      if (greetingReply) {
        setLastPropertyCards([]);
        setLastActions([]);
        addChatMessage(thread.id, "realtor", greetingReply);
        return;
      }

      const offTopicReply = simpleOffTopicReply(memberMessage.trim());
      if (offTopicReply) {
        setLastPropertyCards([]);
        setLastActions([]);
        addChatMessage(thread.id, "realtor", offTopicReply);
        return;
      }

    const rawReply = await getSeriousConciergeReply({
        data: {
          message: memberMessage,
          history: [
            ...messages.slice(-8).map((message) => ({ from: message.from, text: message.text })),
            { from: "member" as const, text: memberMessage },
          ],
          lead,
          properties,
          selectedPropertyTitle: hasSelectedPropertyInUrl() ? thread.property : undefined,
          realtor: {
            name: profile.name,
            title: profile.title,
            brokerage: profile.brokerage,
            phone: profile.phone,
            email: profile.email,
          },
          settings: conciergeSettings,
          isLoggedIn: Boolean(user),
        },
      });
      const reply = toClientConciergeResult({
        response: rawReply,
        properties,
        profile,
        isLoggedIn: Boolean(user),
      });
      setLastActions([]);
      addChatMessage(thread.id, "realtor", reply.message, reply.actionCard);
      markChatSessionActive(thread.id);
      if (shouldHandoff(reply.intent, reply.priorityScore) || reply.shouldHandoff) {
        recordAiHandoff(thread.id, reply.privateOwnerNote || `${reply.intent} intent detected`, reply.priorityScore);
      }
    } catch (error) {
      console.error(error);
      addChatMessage(
        thread.id,
        "realtor",
        "I’m here with you. I can help with property listings, pricing, tours, Client ID Verification, account support, saved homes, or contacting the realtor. What would you like to do next?",
      );
    } finally {
      setIsThinking(false);
    }
  };

  const sendText = (value: string) => {
    const clean = value.trim();
    if (!clean || !thread?.id) return;
    if (sessionTimedOut) {
      toast("Start a new chat session to continue.", { icon: "⏱️" });
      return;
    }
    touchChatSession();
    addChatMessage(thread.id, "member", clean);
    setText("");

    const immediateGreetingReply = simpleGreetingReply(clean, lead?.name);
    if (immediateGreetingReply) {
      setLastPropertyCards([]);
      setLastActions(["View Listings", "Schedule Tour", "Contact Realtor"]);
      addChatMessage(thread.id, "realtor", immediateGreetingReply);
      markChatSessionActive(thread.id);
      return;
    }

    const directBudgetAmount = parseDirectBudgetShortcut(clean);
    const cityHomeShortcut = isCityHomeShortcut(clean);

    if (directBudgetAmount || cityHomeShortcut) {
      const matchingProperties = directBudgetAmount
        ? properties
            .filter((property) => property.price <= directBudgetAmount)
            .sort((a, b) => b.price - a.price)
            .slice(0, 6)
        : properties.slice(0, 6);

      const relatedHomes = matchingProperties.slice(0, 3);
      setLastPropertyCards(relatedHomes);
      setLastActions(["View Listings", "Schedule Tour", "Contact Realtor"]);

      if (matchingProperties.length) {
        const relatedHomeText = relatedHomes
          .map((property) => {
            const price = formatShortcutPrice(property.price);
            return `• ${property.title} — ${price}, ${property.beds} bed, ${property.baths} bath, ${property.city}`;
          })
          .join("\n");

        const reply = directBudgetAmount
          ? `I found related homes under ${formatShortcutPrice(directBudgetAmount)}.\n\n${relatedHomeText}\n\nUse the related home references and options below to view listings, schedule a tour, or contact the realtor.`
          : `Here are available Atlanta-area homes.\n\n${relatedHomeText}\n\nUse the related home references and options below to view listings, schedule a tour, or contact the realtor.`;

        addChatMessage(thread.id, "realtor", reply);
      } else {
        const reply = directBudgetAmount
          ? `I do not see homes under ${formatShortcutPrice(directBudgetAmount)} right now. You can view all listings, adjust the budget, or contact the realtor for off-market options.`
          : "I do not see matching Atlanta homes right now. You can view all listings or contact the realtor for help.";

        addChatMessage(thread.id, "realtor", reply);
      }

      markChatSessionActive(thread.id);
      return;
    }

    void pushAiReply(clean);
  };

  const send = () => sendText(text);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !thread?.id) return;
    if (sessionTimedOut) {
      toast("Start a new chat session before attaching a document.", { icon: "⏱️" });
      e.target.value = "";
      return;
    }
    touchChatSession();
    addChatMessage(thread.id, "member", `📎 Uploaded for review: ${f.name}`);
    toast.success("Document attached to this private conversation.");
    void pushAiReply(`I uploaded a document named ${f.name}. What happens next?`);
    e.target.value = "";
  };

  const videoRequest = () => {
    if (!thread?.id) return;

    const interest = thread.property || lead?.interest || selectedPropertyTitleOnlyFromUrl() || "the selected property";
    const selectedVideoProperty = properties.find((property) => property.title === interest) ||
      (hasSelectedPropertyInUrl() ? selectedPropertyFromUrl() : undefined);

    const capture = {
      ...(lead || {
        name: "Private Member",
        email: "member@example.com",
        phone: "Not provided",
        timeline: "Not specified",
        budget: "Not specified",
        interest,
      }),
      interest,
      source: "Chat video request",
      message: `Video consultation requested for ${interest}.`,
    };

    touchChatSession();
    requestVideoCall(capture);
    setLastPropertyCards(selectedVideoProperty?.id ? [selectedVideoProperty] : []);
    setLastActions(["Schedule Tour", "View Listings", "Contact Realtor"]);
    addChatMessage(thread.id, "member", `🎥 Video consultation requested for ${interest}.`);
    addChatMessage(
      thread.id,
      "realtor",
      `The owner has been notified. Your video request for ${interest} is saved in the owner dashboard. If the property video is not posted yet, you can also schedule an in-person showing.`,
    );
    markChatSessionActive(thread.id);
    toast.success("The owner has been notified.");
  };

  const selectedPropertyId = activeProperties.find((property) => property.title === thread?.property)?.id || activeProperties[0]?.id || "";

  return (
    <section className="grid h-[calc(100dvh-7rem)] min-h-[34rem] gap-8 lg:h-[calc(100vh-9rem)] lg:grid-cols-[22rem_minmax(0,1fr)]">
      <aside className="hidden min-h-0 space-y-4 overflow-y-auto pr-1 lg:block">
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <img src={profile.headshot} alt={profile.name} width={52} height={52} className="size-12 rounded-2xl object-cover" />
            <div>
              <p className="font-semibold">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.title}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <a href={`/tours?propertyId=${selectedPropertyId}`} className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-sm font-semibold text-primary-foreground">
              <CalendarClock className="size-5" /> Schedule a Tour
            </a>
            <button type="button" onClick={videoRequest} className="flex w-full items-center gap-3 rounded-2xl bg-secondary p-4 text-left text-sm font-semibold">
              <Video className="size-5" /> Request Video Call
            </button>
            <button type="button" onClick={() => fileInput.current?.click()} className="flex w-full items-center gap-3 rounded-2xl bg-secondary p-4 text-left text-sm font-semibold">
              <FileText className="size-5" /> Upload Documents
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
          <p className="section-kicker"><Bot className="size-3.5" /> {conciergeSettings.agentName} Concierge</p>

          <div className="mt-4 rounded-3xl bg-secondary p-4">
            <p className="text-sm font-semibold">Chat is ready.</p>
          </div>
        </div>
      </aside>

      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl">
        <div className="shrink-0 border-b border-border p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"><WandSparkles className="size-5" /></div>
              <div>
                <p className="text-sm font-semibold">{conciergeSettings.agentName} · AI Member Concierge</p>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-2 rounded-full bg-green-500" /> {thread?.property || "Property chat"}
                </p>
              </div>
            </div>
            <button type="button" onClick={videoRequest} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-semibold">
              <Video className="size-4" /> Video
            </button>
          </div>

          <div className="mt-4 grid gap-3 rounded-3xl bg-secondary/70 p-4 sm:grid-cols-3">
            <MiniStat icon={BrainCircuit} label="Concierge" value="Ready to help" />
            <MiniStat icon={Home} label="Property" value={hasSelectedPropertyInUrl() && thread.property ? thread.property : "Choose or ask"} />
            <MiniStat icon={ShieldCheck} label="Privacy" value="Discreet intake" />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-secondary/35 p-4 scroll-smooth sm:p-6">
          <div className="max-w-3xl rounded-3xl border border-border bg-card p-4 text-sm leading-7 shadow-sm">
            <p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-accent-foreground" /> {conciergeSettings.agentName} is ready</p>
            <p className="mt-2 text-muted-foreground">
              {conciergeSettings.welcomeMessage}
            </p>
          </div>

          {messages.map((m) => {
            const isAi = m.from !== "member" && m.text.startsWith("AI Concierge:");
            const isSystem = m.kind === "system" || m.kind === "timeout";
            if (isSystem) {
              return (
                <div key={m.id} className="flex justify-center">
                  <div className="max-w-2xl rounded-2xl border border-border bg-background/90 px-4 py-3 text-center text-xs leading-6 text-muted-foreground shadow-sm">
                    {m.text}
                  </div>
                </div>
              );
            }
            return (
              <div key={m.id} className={`flex ${m.from === "member" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[68%] ${
                  m.from === "member"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : isAi
                      ? "rounded-bl-md border border-border bg-card text-foreground"
                      : "rounded-bl-md bg-card text-foreground"
                }`}>
                  {isAi && <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-accent-foreground"><Bot className="size-3.5" /> {conciergeSettings.agentName}</p>}
                  <p className="whitespace-pre-line">{isAi ? m.text.replace(/^AI Concierge:\s*/, "") : m.text}</p>
                  {m.actions && (
                    <ChatActionCard
                      actions={m.actions}
                      onVideo={videoRequest}
                      onUpload={() => fileInput.current?.click()}
                      onContact={recordContactAction}
                    />
                  )}
                </div>
              </div>
            );
          })}
              {lastPropertyCards.length > 0 ? (
                <div className="mt-3 flex max-w-full gap-3 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-2 pb-3">
                  {lastPropertyCards.slice(0, 3).map((property) => {
                    const image =
                      property.image ||
                      property.gallery?.[0] ||
                      "/placeholder-property.jpg";

                    const price = new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(property.price);

                    const sqft = property.sqft ? `${property.sqft.toLocaleString()} sq ft` : "Size not listed";
                    const propertyUrl = `/property/${property.id}`;
                    const tourUrl = `/tours?propertyId=${property.id}`;
                    const videoTourReady = hasOwnerPropertyVideo(propertyVideoTours, property.id);
                    const videoTourUrl = `/property/${property.id}#property-video-tour`;

                    return (
                      <div
                        key={property.id}
                        className="min-w-[215px] max-w-[215px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = propertyUrl;
                          }}
                          className="block w-full text-left"
                        >
                          <img
                            src={image}
                            alt={property.title}
                            className="h-20 w-full object-cover"
                          />
                        </button>

                        <div className="space-y-2 p-2.5">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {property.status || "Available"}
                            </p>
                            <h3 className="mt-1 line-clamp-1 text-sm font-bold text-slate-950">
                              {property.title}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                              {property.city}, {property.state}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-950">{price}</p>
                            <p className="line-clamp-1 text-[11px] text-slate-600">
                              {property.beds} beds · {property.baths} baths · {sqft}
                            </p>
                          </div>

                          {property.amenities?.length ? (
                            <p className="line-clamp-1 rounded-xl bg-slate-50 px-2 py-1 text-[10px] text-slate-700">
                              Highlight: {property.amenities[0]}
                            </p>
                          ) : null}

                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                window.location.href = propertyUrl;
                              }}
                              className="rounded-full bg-slate-950 px-2 py-1.5 text-[10px] font-semibold text-white"
                            >
                              View Property
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                window.location.href = tourUrl;
                              }}
                              className="rounded-full border border-slate-300 px-2 py-1.5 text-[10px] font-semibold text-slate-800"
                            >
                              Schedule Tour
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                window.location.href = videoTourUrl;
                              }}
                              className="rounded-full border border-slate-300 px-2 py-1.5 text-[10px] font-semibold text-slate-800"
                            >
                              {videoTourReady ? "Video Ready" : "No Video Yet"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}


          {isThinking && (
            <div className="flex justify-start">
              <div className="rounded-3xl rounded-bl-md border border-border bg-card px-4 py-3 text-sm shadow-sm">
                <span className="inline-flex items-center gap-2 text-muted-foreground"><Bot className="size-4" /> Concierge is thinking…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="shrink-0 border-t border-border bg-card p-4">
          {sessionTimedOut ? (
            <div className="rounded-[1.5rem] border border-border bg-secondary/70 p-4 text-center">
              <p className="text-sm font-semibold">This session has timed out.</p>
              <p className="mx-auto mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">
                If there is something I can help with, please leave a message at any time.
              </p>
              <button type="button" onClick={startNewChatSession} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
                <MessageCircle className="size-4" /> Start a New Chat
              </button>
            </div>
          ) : (
            <>
              {lastActions.length > 0 ? (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {lastActions.filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 6).map((prompt) => (
                    <button type="button"
                      key={prompt}
                      onClick={() => sendText(prompt)}
                      className="flex-none rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><FileText className="size-3.5" /> Documents stay attached to this private conversation.</span>
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5" /> Smart actions can suggest tours, contact, video, verification, or matching properties.</span>
              </div>
              <div className="flex items-center gap-2">
                <input ref={fileInput} type="file" hidden onChange={onFile} />
                <button type="button" onClick={() => fileInput.current?.click()} aria-label="Attach document" className="grid size-12 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
                  <Paperclip className="size-4" />
                </button>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="h-12 w-full rounded-full border border-border bg-background px-4 text-sm outline-none"
                />
                <button type="button" onClick={send} aria-label="Send" className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Send className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-background p-3">
      <Icon className="size-4 text-accent-foreground" />
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="truncate text-xs font-semibold">{value}</p>
    </div>
  );
}

function ChatActionCard({
  actions,
  onVideo,
  onUpload,
  onContact,
}: {
  actions: ChatActionPayload;
  onVideo: () => void;
  onUpload: () => void;
  onContact: (method: "call" | "email", context: string) => void;
}) {
  const handleButton = (button: NonNullable<ChatActionPayload["buttons"]>[number]) => {
    if (button.action === "video") {
      onVideo();
      return;
    }
    if (button.action === "upload") {
      onUpload();
      return;
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-[1.5rem] border border-border bg-secondary/55 p-3">
      {(actions.title || actions.subtitle) && (
        <div>
          {actions.title && <p className="text-sm font-semibold text-foreground">{actions.title}</p>}
          {actions.subtitle && <p className="mt-1 text-xs leading-5 text-muted-foreground">{actions.subtitle}</p>}
        </div>
      )}

      {actions.properties && actions.properties.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {actions.properties.map((property) => (
            <div key={property.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <a href={`/property/${property.id}`} className="block">
                <img src={property.photo} alt={property.title} className="h-20 w-full object-cover" />
              </a>
              <div className="space-y-2 p-2.5">
                <div>
                  <p className="line-clamp-1 text-xs font-bold uppercase tracking-[0.12em] text-accent-foreground">{shortPrice(property.price)}</p>
                  <p className="line-clamp-2 text-sm font-semibold leading-5">{property.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{property.city}</p>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
                  <span className="rounded-xl bg-secondary px-2 py-1">{property.beds} bed</span>
                  <span className="rounded-xl bg-secondary px-2 py-1">{property.baths} bath</span>
                  <span className="rounded-xl bg-secondary px-2 py-1">{property.sqft.toLocaleString()} sf</span>
                </div>
                <div className="grid gap-2">
                  <a href={`/property/${property.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-[11px] font-semibold hover:bg-secondary">
                    View <ArrowRight className="size-3" />
                  </a>
                  <a href={`/tours?propertyId=${property.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground hover:opacity-90">
                    Tour <CalendarClock className="size-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {actions.notice && <p className="rounded-2xl bg-background p-3 text-xs leading-5 text-muted-foreground">{actions.notice}</p>}

      {actions.buttons && actions.buttons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.buttons.map((button) => {
            const classes = button.kind === "primary"
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "border border-border bg-background text-foreground hover:bg-secondary";
            const content = (
              <>
                {button.label.toLowerCase().includes("call") && <Phone className="size-3.5" />}
                {button.label.toLowerCase().includes("email") && <Mail className="size-3.5" />}
                {button.label.toLowerCase().includes("verification") && <UserCheck className="size-3.5" />}
                {button.label.toLowerCase().includes("tour") && <CalendarClock className="size-3.5" />}
                {button.label.toLowerCase().includes("video") && <Video className="size-3.5" />}
                {button.label}
                {button.external && <ExternalLink className="size-3" />}
              </>
            );

            if (button.action) {
              return (
                <button type="button" key={button.label} onClick={() => handleButton(button)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${classes}`}>
                  {content}
                </button>
              );
            }

            if (button.href?.startsWith("tel:")) {
              return (
                <a key={button.label} href={button.href} onClick={() => onContact("call", "AI chat action card")} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${classes}`}>
                  {content}
                </a>
              );
            }

            if (button.href?.startsWith("mailto:")) {
              return (
                <a key={button.label} href={button.href} onClick={() => onContact("email", "AI chat action card")} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${classes}`}>
                  {content}
                </a>
              );
            }

            return (
              <a key={button.label} href={button.href || "#"} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${classes}`}>
                {content}
              </a>
            );
          })}
        </div>
      )}

      {actions.properties && actions.properties.length > 0 && (
        <p className="text-[11px] leading-5 text-muted-foreground">
          Prices and availability should be confirmed before making plans. These cards are suggestions based on the question, not a promise that the property is still available.
        </p>
      )}
    </div>
  );
}
