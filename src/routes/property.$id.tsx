import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Heart,
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Phone,
  CalendarClock,
  MessageCircle,
  ChevronLeft,
  Home as HomeIcon,
  FileText,
  Video,
  ShieldCheck,
  LockKeyhole,
  Eye,
  ThumbsUp,
  Send,
  MessageSquare,
  Clock3,
  PlayCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { realtor } from "@/lib/data";
import { formatPrice, shortPrice } from "@/lib/format";
import { phoneToTelHref } from "@/lib/contact";
import { toast } from "sonner";
import { useSaved } from "@/lib/useSaved";
import { usePlatformData, usePublicProperties, useRealtorProfile } from "@/lib/platformStore";
import { useAuth } from "@/lib/useAuth";

const AMENITY_BADGES = new Set(["Pool", "Balcony", "Basement", "Kitchen Island", "Guesthouse"]);

export const Route = createFileRoute("/property/$id")({
  head: () => ({
    meta: [
      { title: "Property — Realtor Platform" },
      { name: "description", content: "View property details, photos, map, tour request, and chat actions." },
      { property: "og:image", content: realtor.hero },
    ],
  }),
  component: PropertyDetail,
});


function getPropertyPhotos(property: {
  photos?: string[];
  gallery?: string[];
  image?: string;
}) {
  const photos = [
    ...(Array.isArray(property.photos) ? property.photos : []),
    ...(Array.isArray(property.gallery) ? property.gallery : []),
    ...(property.image ? [property.image] : []),
  ].filter(Boolean);

  const uniquePhotos = Array.from(new Set(photos));
  return uniquePhotos.length ? uniquePhotos : [realtor.hero];
}

function PropertyDetail() {
  const { id } = Route.useParams();
  const { properties, activeProperties } = usePublicProperties();
  const property = properties.find((item) => item.id === id);
  const profile = useRealtorProfile();
  const { recordContactAction } = usePlatformData();
  const { isSaved, toggle } = useSaved();
  const callHref = phoneToTelHref(profile.phone);
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (!property) {
    return (
      <AppShell>
        <div className="px-6 py-24 text-center">
          <p className="font-serif text-2xl">Property not found</p>
          <Link to="/listings" className="mt-4 inline-block text-sm text-accent-foreground underline">Back to listings</Link>
        </div>
      </AppShell>
    );
  }

  const saved = isSaved(property.id);
  const sold = property.status === "sold";
  const amenityBadges = property.badges.filter((badge) => AMENITY_BADGES.has(badge));
  const listingBadges = property.badges.filter((badge) => !AMENITY_BADGES.has(badge));
  const similar = activeProperties.filter((item) => item.id !== property.id).slice(0, 4);
  const propertyPhotos = getPropertyPhotos(property);
  const propertyBadges = Array.isArray(property.badges) ? property.badges : [];


  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${property.lng - 0.012}%2C${
    property.lat - 0.008
  }%2C${property.lng + 0.012}%2C${property.lat + 0.008}&layer=mapnik&marker=${property.lat}%2C${property.lng}`;

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-5 flex items-center justify-between">
          <Link to="/listings" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm hover:text-foreground">
            <ChevronLeft className="size-4" /> Back to listings
          </Link>
          {!sold && (
            <button onClick={() => toggle(property.id)} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold shadow-sm">
              <Heart className={`size-4 ${saved ? "fill-destructive text-destructive" : ""}`} /> {saved ? "Saved" : "Save Home"}
            </button>
          )}
        </div>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div>
            <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
              <div className="relative lg:hidden">
                <div ref={scroller} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
                  {propertyPhotos.map((src: string, i: number) => (
                    <img key={i} src={src} alt={`${property.title} photo ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} className="aspect-[4/3] w-full flex-none snap-center object-cover" />
                  ))}
                </div>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {propertyPhotos.map((_: string, i: number) => (
                    <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-background" : "w-1.5 bg-background/60"}`} />
                  ))}
                </div>
              </div>

              <div className="hidden grid-cols-[1.5fr_0.75fr] gap-2 p-2 lg:grid">
                <img src={propertyPhotos[active] ?? propertyPhotos[0]} alt={`${property.title} main view`} className="h-[32rem] w-full rounded-[1.6rem] object-cover" />
                <div className="grid gap-2">
                  {propertyPhotos.slice(0, 3).map((src, i) => (
                    <button key={src} type="button" onClick={() => setActive(i)} className={`overflow-hidden rounded-[1.4rem] border-2 transition-colors ${i === active ? "border-accent" : "border-transparent"}`}>
                      <img src={src} alt={`${property.title} preview ${i + 1}`} className="h-full min-h-0 w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="no-scrollbar flex gap-2 overflow-x-auto py-3 lg:hidden">
              {propertyPhotos.map((src: string, i: number) => (
                <button key={i} onClick={() => goTo(i)} className={`size-16 flex-none overflow-hidden rounded-xl border-2 transition-colors ${i === active ? "border-accent" : "border-transparent"}`}>
                  <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>

            <section className="mt-7 rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {listingBadges.map((badge) => <Tag key={badge}>{badge}</Tag>)}
                    <Tag>{property.type}</Tag>
                  </div>
                  <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">{property.title}</h1>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4" /> {property.address}, {property.city}
                  </p>
                </div>
                <p className="font-serif text-4xl tracking-tight md:text-right">
                  {sold ? shortPrice(property.soldPrice ?? property.price) : shortPrice(property.price)}
                </p>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-3 rounded-3xl bg-secondary/70 p-4 text-center sm:grid-cols-4">
                <Spec icon={BedDouble} value={`${property.beds}`} label="Bedrooms" />
                <Spec icon={Bath} value={`${property.baths}`} label="Bathrooms" />
                <Spec icon={Maximize} value={Number(property.sqft || 0).toLocaleString()} label="Sq Ft" />
                <Spec icon={HomeIcon} value={property.type} label="Type" />
              </div>
            </section>

              {amenityBadges.length > 0 && (
                <div className="mt-6 rounded-3xl border border-border bg-background p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Amenities</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {amenityBadges.map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            <section className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
              <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
                <h2 className="font-serif text-2xl">About this home</h2>
                <p className="mt-4 text-sm leading-8 text-muted-foreground">{property.description}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Feature>Private tour scheduling</Feature>
                  <Feature>Instant realtor chat</Feature>
                  <Feature>Document upload via chat</Feature>
                  <Feature>Login-locked property video</Feature>
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                <div className="p-5">
                  <h2 className="font-serif text-2xl">Location</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Map preview for {property.city}</p>
                </div>
                <iframe title="Property location map" src={mapSrc} loading="lazy" className="h-80 w-full border-t border-border" />
              </div>
            </section>

            <PropertyVideoTourPanel propertyId={property.id} propertyTitle={property.title} />

            {similar.length > 0 && (
              <section className="mt-10">
                <div className="mb-5 flex items-center gap-2">
                  <HomeIcon className="size-4 text-accent-foreground" />
                  <h2 className="font-serif text-2xl">Homes you may love</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {similar.slice(0, 3).map((p) => (
                    <Link key={p.id} to="/property/$id" params={{ id: p.id }} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                      <img src={getPropertyPhotos(p)[0]} alt={p.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="p-4">
                        <p className="font-serif text-xl">{shortPrice(p.price)}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{p.title} · {p.city}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl">
              <div className="flex items-center gap-3">
                <img src={profile.headshot} alt={profile.name} width={56} height={56} className="size-14 rounded-2xl object-cover" />
                <div>
                  <p className="font-semibold">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.title}</p>
                </div>
              </div>

              {sold ? (
                <div className="mt-5 rounded-2xl bg-secondary p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Closed Property</p>
                  <p className="mt-2 font-serif text-2xl">Represented {property.represented}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Sold {property.soldDate}</p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  <a href={`/tours?propertyId=${property.id}`} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground">
                    <CalendarClock className="size-4" /> Schedule a Tour
                  </a>
                  <a href={`/chat?propertyId=${property.id}`} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary py-4 text-sm font-semibold">
                    <MessageCircle className="size-4" /> Instant Chat
                  </a>
                  {callHref ? (
                    <a
                      href={callHref}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 text-sm font-semibold transition-colors hover:bg-secondary"
                      aria-label={`Call ${profile.name} at ${profile.phone}`}
                      onClick={() => {
                        recordContactAction("call", `${property.title} property page`);
                        toast.success(`Opening phone call to ${profile.phone}.`);
                      }}
                    >
                      <Phone className="size-4" /> Call Realtor
                    </a>
                  ) : (
                    <button type="button" disabled className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 text-sm font-semibold opacity-50">
                      <Phone className="size-4" /> Call Realtor
                    </button>
                  )}
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniAction href={`/chat?propertyId=${property.id}&action=document`} icon={FileText} label="Documents" note="Upload/review" />
                <MiniAction href="#property-video-tour" icon={Video} label="Property Video" note="Login locked" />
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-background p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <ShieldCheck className="size-4 text-accent-foreground" /> Trusted Guidance
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Member questions, tour requests, documents, and property video activity are kept close to the property page.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}


type PropertyVideoUser = {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
};

function PropertyVideoTourPanel({ propertyId, propertyTitle }: { propertyId: string; propertyTitle: string }) {
  const { user } = useAuth();
  const {
    propertyVideoTours,
    propertyVideoTourViews,
    propertyVideoTourComments,
    recordPropertyVideoTourView,
    togglePropertyVideoTourLike,
    addPropertyVideoTourComment,
  } = usePlatformData();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [comment, setComment] = useState("");
  const [viewRecorded, setViewRecorded] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);

  const client = user as PropertyVideoUser | null | undefined;
  const clientId = client?.id;
  const clientEmail = client?.email || "";
  const clientName = client?.name || client?.fullName || clientEmail || "Member";
  const isLoggedIn = Boolean(user && clientEmail);

  const videoTour = propertyVideoTours.find((tour) => tour.propertyId === propertyId && tour.isEnabled);
  const isDirectVideo = Boolean(videoTour?.videoUrl && /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoTour.videoUrl));

  const videoViews = videoTour
    ? propertyVideoTourViews.filter((view) => view.videoTourId === videoTour.id)
    : [];

  const videoFeedback = videoTour
    ? propertyVideoTourComments.filter((item) => item.videoTourId === videoTour.id)
    : [];

  const clientView = videoViews.find((view) =>
    (clientId && view.clientId === clientId) || (clientEmail && view.clientEmail.toLowerCase() === clientEmail.toLowerCase()),
  );

  const clientFeedback = videoFeedback.find((item) =>
    (clientId && item.clientId === clientId) || (clientEmail && item.clientEmail.toLowerCase() === clientEmail.toLowerCase()),
  );

  const totalViews = videoViews.reduce((sum, view) => sum + view.viewCount, 0);
  const totalLikes = videoFeedback.filter((item) => item.liked).length;

  const recordView = () => {
    if (!videoTour || !isLoggedIn || viewRecorded) return;

    recordPropertyVideoTourView({
      propertyId,
      videoTourId: videoTour.id,
      clientId,
      clientName,
      clientEmail,
    });

    setViewRecorded(true);
  };

  const jumpToChapter = (index: number, seconds: number) => {
    setActiveChapter(index);

    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => undefined);
      recordView();
    }
  };

  const likeVideo = () => {
    if (!videoTour || !isLoggedIn) {
      toast.error("Please log in before liking this property video.");
      return;
    }

    const next = togglePropertyVideoTourLike({
      propertyId,
      videoTourId: videoTour.id,
      clientId,
      clientName,
      clientEmail,
    });

    toast.success(next?.liked ? "Video liked." : "Video like removed.");
  };

  const sendComment = () => {
    if (!videoTour || !isLoggedIn) {
      toast.error("Please log in before commenting on this property video.");
      return;
    }

    const saved = addPropertyVideoTourComment({
      propertyId,
      videoTourId: videoTour.id,
      clientId,
      clientName,
      clientEmail,
      comment,
    });

    if (!saved) {
      toast.error("Write a comment before sending.");
      return;
    }

    setComment("");
    toast.success("Comment sent to the owner chat.");
  };

  return (
    <section id="property-video-tour" className="mt-7 overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="border-b border-border bg-slate-950 p-4 text-white lg:border-b-0 lg:border-r">
          {videoTour ? (
            isLoggedIn ? (
              isDirectVideo ? (
                <video
                  ref={videoRef}
                  src={videoTour.videoUrl}
                  poster={videoTour.posterUrl}
                  controls
                  playsInline
                  onPlay={recordView}
                  className="aspect-video w-full rounded-[1.5rem] bg-black object-cover"
                />
              ) : (
                <div className="grid aspect-video place-items-center rounded-[1.5rem] border border-white/10 bg-black p-6 text-center">
                  <div>
                    <div className="mx-auto grid size-16 place-items-center rounded-full bg-white text-slate-950">
                      <PlayCircle className="size-8" />
                    </div>
                    <h3 className="mt-4 font-serif text-3xl">Owner video is ready</h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      This video is hosted outside the site. Opening it records your view for the owner.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        recordView();
                        window.open(videoTour.videoUrl, "_blank", "noopener,noreferrer");
                      }}
                      className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950"
                    >
                      Open Property Video
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="grid aspect-video place-items-center rounded-[1.5rem] border border-white/10 bg-black p-6 text-center">
                <div>
                  <div className="mx-auto grid size-16 place-items-center rounded-full bg-white text-slate-950">
                    <LockKeyhole className="size-8" />
                  </div>
                  <h3 className="mt-4 font-serif text-3xl">Video tour locked</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Log in to view the owner-recorded walkthrough for {propertyTitle}.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <Link to="/login" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">
                      Log In
                    </Link>
                    <Link to="/register" className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white">
                      Create Account
                    </Link>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="grid aspect-video place-items-center rounded-[1.5rem] border border-white/10 bg-black p-6 text-center">
              <div>
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-white text-slate-950">
                  <Video className="size-8" />
                </div>
                <h3 className="mt-4 font-serif text-3xl">No property video yet</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  The owner can add or remove this property video when ready.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Property Video</p>
          <h2 className="mt-2 font-serif text-3xl">{videoTour?.title || `${propertyTitle} Property Video`}</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {videoTour?.description || "Owner-recorded property videos appear here and stay locked until the client is logged in."}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <VideoStat icon={Eye} label="Views" value={`${totalViews}`} />
            <VideoStat icon={ThumbsUp} label="Likes" value={`${totalLikes}`} />
            <VideoStat icon={MessageSquare} label="Comments" value={`${videoFeedback.filter((item) => item.comment).length}`} />
          </div>

          {videoTour?.chapters?.length ? (
            <div className="mt-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                <Clock3 className="size-4" /> Timestamps
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {videoTour.chapters.map((chapter, index) => (
                  <button
                    key={`${chapter.label}-${chapter.timestamp}`}
                    type="button"
                    onClick={() => jumpToChapter(index, chapter.seconds)}
                    disabled={!isLoggedIn || !videoTour}
                    className={`rounded-2xl border px-4 py-3 text-left text-xs font-bold transition-colors ${
                      activeChapter === index
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-foreground hover:bg-accent/40"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="block">{chapter.label}</span>
                    <span className="mt-1 block font-mono text-[11px] opacity-70">{chapter.timestamp}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {videoTour && isLoggedIn ? (
            <div className="mt-5 rounded-3xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Your video activity</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {clientView ? `Viewed ${clientView.viewCount} time${clientView.viewCount === 1 ? "" : "s"}.` : "Play or open the video to record a view."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={likeVideo}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
                    clientFeedback?.liked ? "bg-primary text-primary-foreground" : "border border-border bg-card"
                  }`}
                >
                  <ThumbsUp className={`size-4 ${clientFeedback?.liked ? "fill-current" : ""}`} />
                  {clientFeedback?.liked ? "Liked" : "Like"}
                </button>
              </div>

              <div className="mt-4">
                <label htmlFor="property-video-comment" className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Comment to owner
                </label>
                <textarea
                  id="property-video-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={clientFeedback?.comment || "Ask a question or leave a note about this property video..."}
                  className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                  maxLength={500}
                />
                <button
                  type="button"
                  onClick={sendComment}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                >
                  <Send className="size-4" /> Send to Owner Chat
                </button>
              </div>
            </div>
          ) : videoTour ? (
            <div className="mt-5 rounded-3xl border border-dashed border-border bg-background p-4 text-sm leading-7 text-muted-foreground">
              Log in to unlock the video, like it, comment on it, and let the owner see your viewing activity.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function VideoStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-3 text-center">
      <Icon className="mx-auto size-4 text-accent-foreground" />
      <p className="mt-1 font-serif text-xl">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}


function Spec({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className="size-5 text-accent-foreground" />
      <p className="font-serif text-lg leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">{children}</span>;
}

function Feature({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-secondary/70 px-4 py-3 text-sm font-semibold text-foreground">{children}</div>;
}

function MiniAction({ href, icon: Icon, label, note }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; note: string }) {
  return (
    <a href={href} className="block rounded-2xl bg-secondary p-4 transition-colors hover:bg-accent/40">
      <Icon className="size-5 text-accent-foreground" />
      <p className="mt-2 text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </a>
  );
}
