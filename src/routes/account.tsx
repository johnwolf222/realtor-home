import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Building2, CalendarClock, Camera, CheckCircle2, FileCheck2, Heart, Home, ImageUp, LogOut, MessageCircle, RefreshCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { type Property } from "@/lib/data";
import { shortPrice } from "@/lib/format";
import { useAuth } from "@/lib/useAuth";
import { useSaved } from "@/lib/useSaved";
import { usePlatformData, usePublicProperties } from "@/lib/platformStore";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Member Portal — Luxury Realtor Platform" },
      { name: "description", content: "Manage member saved homes, tours, chat, and documents." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, loginAsDemo, updateUser } = useAuth();
  const { saved } = useSaved();
  const { activeProperties } = usePublicProperties();
  const { submitClientVerification, chatThreads, tourRequests } = usePlatformData();
  const [verificationPhotos, setVerificationPhotos] = useState<VerificationPhotos>(emptyVerificationPhotos);
  const savedHomes = activeProperties.filter((property) => saved.includes(property.id));
  const memberEmail = user?.email?.trim().toLowerCase() || "";
  const memberMessages = chatThreads
    .filter((thread) => thread.email?.trim().toLowerCase() === memberEmail)
    .flatMap((thread) =>
      thread.messages
        .filter((message) => message.from === "realtor")
        .map((message) => {
          const codeMatch = message.text.match(/\b[A-Z]{1,4}-[A-Z0-9]{4,8}\b/);
          return {
            id: `${thread.id}-${message.id}`,
            property: thread.property,
            text: message.text,
            time: message.time || "Now",
            code: codeMatch?.[0] || "",
          };
        }),
    )
    .slice(-6)
    .reverse();


  // client-verification-auto-open
  useEffect(() => {
    if (typeof window === "undefined") return;

    const openClientVerification = () => {
      const hash = window.location.hash.replace("#", "");
      if (!["client-verification", "verification"].includes(hash)) return;

      window.setTimeout(() => {
        const section = document.getElementById("client-verification") as HTMLDetailsElement | null;
        if (!section) return;

        section.open = true;
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    };

    openClientVerification();
    window.addEventListener("hashchange", openClientVerification);

    return () => window.removeEventListener("hashchange", openClientVerification);
  }, []);

  const setVerificationPhoto = (key: VerificationPhotoKey, value: string) => {
    setVerificationPhotos((current) => ({ ...current, [key]: value }));
  };

  const updateAccountPhoto = (value: string) => {
    updateUser({ avatarUrl: value.trim() });
    toast.success(value.trim() ? "Account photo updated." : "Account photo removed.");
  };

  const readAccountPhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateAccountPhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const signOut = () => {
    logout();
    toast.success("Signed out.");
    navigate({ to: "/" });
  };

  const submitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const missing = verificationSteps.filter((step) => !verificationPhotos[step.key]).map((step) => step.shortLabel);
    if (missing.length) {
      toast.error(`Capture all 3 live camera photos first: ${missing.join(", ")}.`);
      return;
    }

    const payload = {
      verificationStatus: "pending" as const,
      verificationMethod: "Government ID",
      verificationDocumentName: "Live camera submission: front of ID, back of ID, forward face picture",
      verificationDocumentCount: 3,
      verificationCaptureMethod: "Live camera only — no file picker or photo-library upload.",
      verificationDocuments: verificationPhotos,
      verificationSubmittedAt: new Date().toISOString(),
      verificationNote: "Submitted 3 required live camera photos for owner review.",
    };
    updateUser(payload);
    submitClientVerification({
      name: user.name,
      email: user.email,
      method: payload.verificationMethod,
      documentName: payload.verificationDocumentName,
      documentCount: payload.verificationDocumentCount,
      captureMethod: payload.verificationCaptureMethod,
      documents: payload.verificationDocuments,
    });
    toast.success("Client ID Verification submitted for owner review.");
  };

  if (!user) {
    return (
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[1fr_0.75fr]">
              <div className="p-8 sm:p-10">
                <p className="section-kicker"><ShieldCheck className="size-3.5" /> Private portal</p>
                <h1 className="mt-3 font-serif text-5xl tracking-tight sm:text-6xl">Access your member portal.</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Sign in to save homes, request tours, chat with the realtor, and complete Client ID Verification from your private member portal.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/login" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm">Sign in</Link>
                  <Link to="/register" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold shadow-sm">Create account</Link>
                  <button onClick={() => { loginAsDemo("member"); toast.success("Member demo unlocked."); }} className="rounded-full border border-border bg-secondary px-6 py-3 text-sm font-semibold">Try member demo</button>
                </div>
              </div>
              <div className="bg-primary p-8 text-primary-foreground sm:p-10">
                <p className="font-serif text-3xl">Premium portal features</p>
                <div className="mt-6 grid gap-3">
                  <Feature icon={Heart} text="Saved homes and preferences" />
                  <Feature icon={CalendarClock} text="Tour requests and scheduling" />
                  <Feature icon={MessageCircle} text="Instant chat and Client ID Verification flow" />
                  <Feature icon={Building2} text="Owner-only dashboard access" />
                </div>
              </div>
            </div>
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <aside className="rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:h-fit">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="size-16 rounded-3xl object-cover" />
                  ) : (
                    <div className="grid size-16 place-items-center rounded-3xl bg-primary font-serif text-xl text-primary-foreground">
                      {user.avatarInitials}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold">{user.name}</p>
                    <ClientStatusBadge status={user.verificationStatus || "unverified"} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{user.verificationStatus === "verified" ? "Verified Client" : user.verificationStatus === "pending" ? "ID Pending Review" : "Unverified Client"}</p>
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-xs font-semibold shadow-sm hover:bg-secondary">
                <ImageUp className="size-4" /> Upload photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => readAccountPhoto(event.target.files?.[0])}
                />
              </label>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <Info label="Email" value={user.email} />
              <Info label="Phone" value={user.phone || "Not added"} />
              <Info label="Timeline" value={user.buyingTimeline || "Not selected"} />
              <Info label="Budget" value={user.budgetRange || "Not selected"} />
            </div>
            <button onClick={signOut} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-xs font-semibold shadow-sm transition-colors hover:bg-secondary">
              <LogOut className="size-4" /> Sign out
            </button>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
              <p className="section-kicker"><BadgeCheck className="size-3.5" /> Portal Status</p>
              <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Your luxury account is active.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Use this portal to manage saved homes, tour requests, chat access, account details, and Client ID Verification.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <Stat label="Saved homes" value={saved.length.toString()} />
                <Stat label="Portal" value="Member" />
                <Stat label="Onboarding" value={user.onboardingComplete ? "Done" : "Open"} />
                <Stat label="Client ID" value={user.verificationStatus || "unverified"} />
              </div>
            </div>

            <ClientVerificationCard
              status={user.verificationStatus || "unverified"}
              photos={verificationPhotos}
              onCapture={setVerificationPhoto}
              onClear={(key) => setVerificationPhoto(key, "")}
              onSubmit={submitVerification}
            />

            <MemberMessagesCard messages={memberMessages} />

            <MemberActions savedHomes={savedHomes} fallbackHomes={activeProperties} />
          </section>
        </section>
      </main>
    </AppShell>
  );
}

function ClientStatusBadge({ status }: { status: "verified" | "pending" | "unverified" }) {
  const label = status === "verified" ? "Verified" : status === "pending" ? "Pending" : "Unverified";
  const classes = status === "verified"
    ? "bg-green-100 text-green-800"
    : status === "pending"
      ? "bg-amber-100 text-amber-800"
      : "bg-secondary text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${classes}`}>
      {status === "verified" ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
      {label}
    </span>
  );
}

type VerificationPhotoKey = "frontId" | "backId" | "facePhoto";

type VerificationPhotos = Record<VerificationPhotoKey, string>;

type VerificationStep = {
  key: VerificationPhotoKey;
  shortLabel: string;
  label: string;
  description: string;
  facingMode: "user" | "environment";
};

type CameraPermissionState = "unknown" | "prompt" | "granted" | "denied" | "unavailable";

const emptyVerificationPhotos: VerificationPhotos = {
  frontId: "",
  backId: "",
  facePhoto: "",
};

const verificationSteps: VerificationStep[] = [
  {
    key: "frontId",
    shortLabel: "front ID",
    label: "Front of government ID",
    description: "Use the rear camera. Place the front of the ID inside the frame and capture it live.",
    facingMode: "environment",
  },
  {
    key: "backId",
    shortLabel: "back ID",
    label: "Back of government ID",
    description: "Use the rear camera again. Capture the back of the same ID live.",
    facingMode: "environment",
  },
  {
    key: "facePhoto",
    shortLabel: "face photo",
    label: "Forward-facing face picture",
    description: "Use the front camera. Take a current face picture looking forward.",
    facingMode: "user",
  },
];

function ClientVerificationCard({
  status,
  photos,
  onCapture,
  onClear,
  onSubmit,
}: {
  status: "verified" | "pending" | "unverified";
  photos: VerificationPhotos;
  onCapture: (key: VerificationPhotoKey, value: string) => void;
  onClear: (key: VerificationPhotoKey) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const capturedCount = verificationSteps.filter((step) => photos[step.key]).length;

  return (
    <details id="client-verification" className="group overflow-hidden rounded-[2rem] border border-primary/20 bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
      <summary className="flex cursor-pointer list-none flex-col justify-between gap-4 p-6 transition-colors hover:bg-white/5 sm:flex-row sm:items-center sm:p-8 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="inline-flex items-center gap-2 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-white/70"><FileCheck2 className="size-3.5" /> Client ID Verification</p>
          <h2 className="mt-3 font-serif text-3xl text-white">Client ID Verification</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
            This step confirms the member profile belongs to a real person before serious private actions. Use the live camera flow to capture the front of your government ID, the back of your ID, and a current face picture.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <ClientStatusBadge status={status} />
          <span className="rounded-full bg-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white group-open:hidden">Open</span>
          <span className="hidden rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary group-open:inline-flex">Close</span>
        </div>
      </summary>

      <form onSubmit={onSubmit} className="border-t border-white/10 p-6 pt-5 sm:p-8 sm:pt-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-3xl border border-white/80 bg-white p-5 text-primary shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Verification identification method</span>
            <div className="mt-3 rounded-2xl border border-border bg-secondary p-4">
              <p className="font-semibold text-foreground">Government ID</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Government ID is the only supported identity verification method. Financial documents stay separate from client identity verification.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white p-5 text-primary shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Document file</span>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {capturedCount}/3 live camera photos captured. No upload picker is shown for this ID flow.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                Camera only
              </span>
            </div>
          </div>
        </div>

        <CameraCaptureSequence photos={photos} onCapture={onCapture} onClear={onClear} />

        <button type="submit" disabled={capturedCount < 3} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-semibold text-primary shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45">
          Submit 3 Live Photos for Owner Review
        </button>
      </form>
    </details>
  );
}

function CameraCaptureSequence({
  photos,
  onCapture,
  onClear,
}: {
  photos: VerificationPhotos;
  onCapture: (key: VerificationPhotoKey, value: string) => void;
  onClear: (key: VerificationPhotoKey) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeRetakeKey, setActiveRetakeKey] = useState<VerificationPhotoKey | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraPermission, setCameraPermission] = useState<CameraPermissionState>("unknown");

  const nextOpenStep = verificationSteps.find((step) => !photos[step.key]);
  const activeStep = activeRetakeKey
    ? verificationSteps.find((step) => step.key === activeRetakeKey) || nextOpenStep
    : nextOpenStep;
  const capturedCount = verificationSteps.filter((step) => photos[step.key]).length;
  const isComplete = capturedCount === verificationSteps.length;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;

    const checkCameraPermission = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCameraPermission("unavailable");
        return;
      }

      const permissionsApi = navigator.permissions as (Permissions & {
        query?: (descriptor: PermissionDescriptor) => Promise<PermissionStatus>;
      }) | undefined;

      if (!permissionsApi?.query) {
        setCameraPermission("prompt");
        return;
      }

      try {
        permissionStatus = await permissionsApi.query({ name: "camera" as PermissionName });
        setCameraPermission(permissionStatus.state as CameraPermissionState);
        permissionStatus.onchange = () => setCameraPermission(permissionStatus?.state as CameraPermissionState);
      } catch {
        setCameraPermission("prompt");
      }
    };

    void checkCameraPermission();

    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  const requestStream = async (facingMode: VerificationStep["facingMode"], preferExact: boolean) => {
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: preferExact ? { exact: facingMode } : { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
  };

  const openCamera = async () => {
    if (!activeStep) return;

    setCameraError("");
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const message = "Live camera access is not available in this browser.";
      setCameraPermission("unavailable");
      setCameraError(message);
      toast.error(message);
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      const message = "Camera permission requires HTTPS or localhost. Run the app locally or deploy to HTTPS.";
      setCameraPermission("unavailable");
      setCameraError(message);
      toast.error(message);
      return;
    }

    try {
      stopCamera();
      setCameraPermission((current) => current === "granted" ? "granted" : "prompt");
      let stream: MediaStream;

      try {
        stream = await requestStream(activeStep.facingMode, true);
      } catch (exactCameraError) {
        if (exactCameraError instanceof DOMException && exactCameraError.name === "OverconstrainedError") {
          stream = await requestStream(activeStep.facingMode, false);
        } else {
          throw exactCameraError;
        }
      }

      streamRef.current = stream;
      setCameraPermission("granted");
      setIsCameraOpen(true);
      toast.success("Camera permission granted. Live camera is ready.");
    } catch (error) {
      const blocked = error instanceof DOMException && ["NotAllowedError", "SecurityError"].includes(error.name);
      const message = blocked
        ? "Camera permission was blocked. Allow camera access in your browser settings, then try Open Camera again."
        : "Camera permission could not be opened. Check that a camera is available, then try again.";
      setCameraPermission(blocked ? "denied" : "unavailable");
      setCameraError(message);
      toast.error(message);
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!activeStep) return;

    if (!video || !video.videoWidth || !video.videoHeight) {
      toast.error("Camera is not ready yet. Wait a moment and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    const maxWidth = 720;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(activeStep.key, canvas.toDataURL("image/jpeg", 0.82));
    setActiveRetakeKey(null);
    stopCamera();
    toast.success(`${activeStep.shortLabel} captured.`);
  };

  const retakePhoto = (key: VerificationPhotoKey) => {
    stopCamera();
    onClear(key);
    setActiveRetakeKey(key);
    const step = verificationSteps.find((item) => item.key === key);
    toast.message(step ? `Ready to retake ${step.shortLabel}.` : "Ready to retake photo.");
  };

  const instruction = activeStep?.description || "All three live photos have been captured. Review the thumbnails below, retake any photo if needed, then submit for owner review.";
  const buttonLabel = isCameraOpen
    ? "Capture Live Photo"
    : activeStep
      ? activeRetakeKey
        ? `Open Camera to Retake ${activeStep.shortLabel}`
        : cameraPermission === "granted"
          ? "Open Camera"
          : "Open Camera & Allow Permission"
      : "All Photos Captured";

  return (
    <div className="mt-5 rounded-[1.75rem] border border-white/80 bg-white p-5 text-foreground shadow-sm sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Live camera sequence</span>
              <h3 className="mt-2 font-serif text-2xl text-foreground">{activeStep?.label || "Ready for review"}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{instruction}</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Step {Math.min(capturedCount + 1, 3)} of 3
            </span>
          </div>

          <CameraPermissionPanel permission={cameraPermission} activeStep={activeStep} />

          <div className="relative mt-5 overflow-hidden rounded-[1.5rem] border border-border bg-secondary">
            {isCameraOpen ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="h-72 w-full bg-primary object-cover" />
                <div className="pointer-events-none absolute inset-5 rounded-[1.25rem] border-2 border-dashed border-white/85 shadow-[0_0_0_999px_rgba(15,23,42,0.25)]" />
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary/85 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                  Align inside frame
                </div>
              </>
            ) : (
              <div className="grid h-72 place-items-center px-6 text-center">
                <div>
                  <Camera className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">Camera preview opens here.</p>
                  <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                    The flow uses the rear camera for both sides of the ID, then switches to the front camera for the face picture.
                  </p>
                </div>
              </div>
            )}
          </div>

          {cameraError ? <p className="mt-3 text-xs leading-5 text-destructive">{cameraError}</p> : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={isCameraOpen ? captureFrame : openCamera}
              disabled={!activeStep && !isCameraOpen}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Camera className="size-4" /> {buttonLabel}
            </button>
            {isCameraOpen ? (
              <button type="button" onClick={stopCamera} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-muted-foreground">
                Cancel Camera
              </button>
            ) : (
              <div className="rounded-2xl border border-border bg-secondary px-4 py-3 text-xs leading-5 text-muted-foreground">
                One camera button controls all 3 required live captures.
              </div>
            )}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Submission thumbnails</span>
          <div className="mt-3 grid gap-3">
            {verificationSteps.map((step, index) => (
              <VerificationThumbnail
                key={step.key}
                step={step}
                index={index}
                image={photos[step.key]}
                onRetake={() => retakePhoto(step.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraPermissionPanel({
  permission,
  activeStep,
}: {
  permission: CameraPermissionState;
  activeStep?: VerificationStep;
}) {
  const meta: Record<CameraPermissionState, { label: string; text: string; className: string }> = {
    unknown: {
      label: "Camera check",
      text: "Tap Open Camera to trigger the browser camera permission request.",
      className: "border-border bg-secondary text-muted-foreground",
    },
    prompt: {
      label: "Permission needed",
      text: "Your browser will ask for camera access. Choose Allow so the live capture can begin.",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    },
    granted: {
      label: "Camera allowed",
      text: activeStep
        ? `Ready for live capture: ${activeStep.label}.`
        : "Camera access is ready. Review your photos and submit when complete.",
      className: "border-green-200 bg-green-50 text-green-900",
    },
    denied: {
      label: "Camera blocked",
      text: "Camera access is blocked. Open browser settings, allow camera for this site, then try Open Camera again.",
      className: "border-red-200 bg-red-50 text-red-900",
    },
    unavailable: {
      label: "Camera unavailable",
      text: "Camera access needs a supported browser, an available camera, and HTTPS or localhost.",
      className: "border-red-200 bg-red-50 text-red-900",
    },
  };

  const selected = meta[permission];

  return (
    <div className={`mt-5 rounded-2xl border px-4 py-3 text-xs leading-5 ${selected.className}`}>
      <p className="font-extrabold uppercase tracking-[0.14em]">{selected.label}</p>
      <p className="mt-1">{selected.text}</p>
    </div>
  );
}

function VerificationThumbnail({
  step,
  index,
  image,
  onRetake,
}: {
  step: VerificationStep;
  index: number;
  image: string;
  onRetake: () => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Photo {index + 1}</p>
          <p className="mt-1 text-sm font-semibold">{step.label}</p>
        </div>
        {image ? <CheckCircle2 className="size-5 text-green-700" /> : <Camera className="size-5 text-muted-foreground" />}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-secondary">
        {image ? (
          <img src={image} alt={`${step.label} captured preview`} className="h-32 w-full object-cover" />
        ) : (
          <div className="grid h-32 place-items-center px-4 text-center text-xs leading-5 text-muted-foreground">
            Empty thumbnail
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRetake}
        disabled={!image}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 text-xs font-bold text-muted-foreground disabled:cursor-not-allowed disabled:opacity-45"
      >
        <RefreshCcw className="size-3.5" /> Retake
      </button>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4">
      <Icon className="size-5 text-gold" />
      <span className="text-sm font-semibold text-white/85">{text}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-secondary p-5 text-center">
      <p className="font-serif text-3xl capitalize">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    </div>
  );
}

type MemberPortalMessage = {
  id: string;
  property: string;
  text: string;
  time: string;
  code: string;
};

function MemberMessagesCard({ messages }: { messages: MemberPortalMessage[] }) {
  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker"><MessageCircle className="size-3.5" /> Messages & notifications</p>
          <h2 className="mt-3 font-serif text-3xl">Owner messages for your account.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            Owner updates, property video activity, and private follow-up messages appear here when they are sent to your account.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/chat" className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold shadow-sm hover:bg-secondary">
            Open Chat
          </Link>
          <Link to="/listings" className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm">
            View Listings
          </Link>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {messages.length ? (
          messages.map((message) => (
            <article key={message.id} className={`rounded-3xl border p-4 ${
              message.code ? "border-green-200 bg-green-50 text-green-950" : "border-border bg-background"
            }`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{message.property}</p>
                  <p className="mt-2 text-sm leading-6">{message.text}</p>
                </div>

                {message.code ? (
                  <div className="rounded-2xl border border-green-200 bg-white px-4 py-3 text-center shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-green-700">Owner note</p>
                    <p className="mt-1 font-mono text-lg font-black tracking-[0.2em] text-green-950">{message.code}</p>
                  </div>
                ) : null}
              </div>

              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{message.time}</p>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-background p-5 text-sm leading-6 text-muted-foreground">
            No owner messages yet. When the owner sends a property video update or account update, it will appear here.
          </div>
        )}
      </div>
    </section>
  );
}

function MemberActions({ savedHomes, fallbackHomes }: { savedHomes: Property[]; fallbackHomes: Property[] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <ActionCard to="/listings" icon={Home} title="Browse Homes" text="Search and save homes that match your preferences." />
        <ActionCard to="/tours" icon={CalendarClock} title="Request Tours" text="Book private showings. Property videos live under each listing when added by the owner." />
        <ActionCard to="/chat" icon={MessageCircle} title="Start Chat" text="Ask questions and prepare documents for review." />
      </div>
      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-3xl">Saved home preview</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(savedHomes.length ? savedHomes : fallbackHomes.slice(0, 2)).map((home) => (
            <Link key={home.id} to="/property/$id" params={{ id: home.id }} className="flex items-center gap-4 rounded-3xl border border-border bg-secondary p-3 transition-colors hover:bg-card">
              <img src={(home.image || home.photos?.[0] || "/placeholder-property.jpg")} alt={home.title} className="size-20 rounded-2xl object-cover" />
              <div>
                <p className="text-sm font-semibold">{home.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{shortPrice(home.price)} · {home.beds}bd · {home.city}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ to, icon: Icon, title, text }: { to: "/dashboard" | "/listings" | "/tours" | "/chat"; icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <Link to={to} className="rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-transform hover:-translate-y-1">
      <Icon className="size-6 text-accent-foreground" />
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
    </Link>
  );
}
