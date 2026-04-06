import { PageTransition } from "@/components/common";
import { Badge, Button, Card, Divider } from "@/components/ui";
import { loomUp, staggerContainer, staggerItem } from "@/lib/animations";
import { getMe, updateFaceVector } from "@/lib/api";
import { cn, formatCredits, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { UserPublic } from "@/types/voyage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Camera,
  Check,
  ChevronRight,
  Edit2,
  LogOut,
  Scan,
  Shield,
  Star,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";

// Loyalty tier display config
const TIER_CONFIG: Record<
  string,
  { color: string; glow: string; label: string; icon: string }
> = {
  drifter: {
    color: "text-white/50",
    glow: "border-white/10",
    label: "Drifter",
    icon: "○",
  },
  navigator: {
    color: "text-info",
    glow: "border-info/30",
    label: "Navigator",
    icon: "◈",
  },
  pathfinder: {
    color: "text-warning",
    glow: "border-warning/30",
    label: "Pathfinder",
    icon: "◆",
  },
  stellar: {
    color: "text-accent-300",
    glow: "border-accent-500/50",
    label: "Stellar",
    icon: "✦",
  },
};

const TIER_BENEFITS: Record<string, string[]> = {
  drifter: ["Standard booking access", "Points accumulation on all voyages"],
  navigator: [
    "Priority boarding",
    "5% fare discount",
    "Bonus points on scenic voyages",
  ],
  pathfinder: [
    "Priority boarding",
    "10% fare discount",
    "One complimentary cabin upgrade per year",
    "Access to exclusive routes",
  ],
  stellar: [
    "Priority boarding",
    "15% fare discount",
    "Complimentary Helix upgrade when available",
    "Dedicated concierge",
    "Complimentary spacewalk per voyage",
  ],
};

const TIER_ORDER = ["drifter", "navigator", "pathfinder", "stellar"];

function pointsToNextTier(
  points: number,
  tier: string,
): { next: string | null; needed: number; progress: number } {
  const thresholds: Record<string, number> = {
    drifter: 0,
    navigator: 5000,
    pathfinder: 20000,
    stellar: 60000,
  };
  const currentIdx = TIER_ORDER.indexOf(tier);
  if (currentIdx === TIER_ORDER.length - 1)
    return { next: null, needed: 0, progress: 100 };
  const nextTier = TIER_ORDER[currentIdx + 1];
  const currentMin = thresholds[tier] ?? 0;
  const nextMin = thresholds[nextTier] ?? 0;
  const rangeSize = nextMin - currentMin;
  const progress =
    rangeSize > 0
      ? Math.min(100, ((points - currentMin) / rangeSize) * 100)
      : 100;
  const needed = Math.max(0, nextMin - points);
  return { next: nextTier, needed, progress };
}

// Sections of the profile
type ProfileSection = "overview" | "loyalty" | "security" | "face";

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, clearAuth, updateUser } = useAuthStore();
  const [activeSection, setActiveSection] =
    useState<ProfileSection>("overview");

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated)
      navigate("/login", { state: { from: "/profile" }, replace: true });
  }, [isAuthenticated]);

  const { data: freshUser } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: isAuthenticated,
    onSuccess: (data: any) => updateUser(data),
  } as Parameters<typeof useQuery>[0]);

  const displayUser = (freshUser as UserPublic) ?? user;

  function handleLogout() {
    clearAuth();
    navigate("/");
  }

  if (!displayUser) return null;

  const tierCfg = TIER_CONFIG[displayUser.loyaltyTier] ?? TIER_CONFIG.drifter;
  const tierInfo = pointsToNextTier(
    displayUser.loyaltyPoints,
    displayUser.loyaltyTier,
  );

  const NAV_ITEMS: {
    id: ProfileSection;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "overview", label: "Overview", icon: <User className="w-4 h-4" /> },
    { id: "loyalty", label: "Loyalty", icon: <Star className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    { id: "face", label: "Face ID", icon: <Scan className="w-4 h-4" /> },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-void pt-16">
        {/* Page header */}
        <div className="border-b border-white/5">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <motion.div
              variants={loomUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2"
            >
              <span className="label">Account</span>
              <h1 className="font-display text-display-xl text-white">
                {displayUser.firstName} {displayUser.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="font-sans text-sm text-white/40">
                  {displayUser.email}
                </span>
                <Badge variant="surface">
                  <span className={cn("mr-1", tierCfg.color)}>
                    {tierCfg.icon}
                  </span>
                  {tierCfg.label}
                </Badge>
                {displayUser.faceVectorEnrolled && (
                  <Badge variant="accent">
                    <Scan className="w-2.5 h-2.5 mr-1" />
                    Face ID enrolled
                  </Badge>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar nav */}
            <aside className="w-full lg:w-56 shrink-0">
              <div className="glass-card rounded-2xl p-2 flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-bold transition-all duration-200 text-left",
                      activeSection === item.id
                        ? "bg-white/8 text-white"
                        : "text-white/40 hover:text-white/70 hover:bg-white/4",
                    )}
                  >
                    <span
                      className={
                        activeSection === item.id ? "text-accent-300" : ""
                      }
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}

                <Divider className="my-1" />

                <Link to="/bookings">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-bold text-white/40 hover:text-white/70 hover:bg-white/4 transition-all duration-200">
                    <Star className="w-4 h-4" />
                    My Voyages
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </button>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-bold text-danger/60 hover:text-danger hover:bg-danger/5 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {/* Overview */}
                {activeSection === "overview" && (
                  <motion.div
                    key="overview"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    className="flex flex-col gap-6"
                  >
                    {/* Profile image placeholder + info */}
                    <motion.div variants={staggerItem}>
                      <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl bg-surface-700 border border-white/10 flex items-center justify-center overflow-hidden">
                            <User className="w-9 h-9 text-white/20" />
                          </div>
                          {/* Avatar placeholder label */}
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface-800 border border-white/10 flex items-center justify-center">
                            <Edit2 className="w-3 h-3 text-white/30" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <h2 className="font-display text-display-md text-white">
                            {displayUser.firstName} {displayUser.lastName}
                          </h2>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="label">Email</span>
                              <span className="font-sans text-sm text-white/60">
                                {displayUser.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="label">Member since</span>
                              <span className="font-sans text-sm text-white/60">
                                {formatDate(displayUser.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    {/* Quick stats */}
                    <motion.div
                      variants={staggerItem}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                    >
                      {[
                        {
                          label: "Loyalty Points",
                          value: displayUser.loyaltyPoints.toLocaleString(),
                          sub: `${tierCfg.icon} ${tierCfg.label}`,
                          color: tierCfg.color,
                        },
                        {
                          label: "Points to Next Tier",
                          value: tierInfo.next
                            ? tierInfo.needed.toLocaleString()
                            : "—",
                          sub: tierInfo.next
                            ? `Until ${TIER_CONFIG[tierInfo.next]?.label}`
                            : "Max tier reached",
                          color: "text-white/50",
                        },
                        {
                          label: "Face ID",
                          value: displayUser.faceVectorEnrolled
                            ? "Enrolled"
                            : "Not enrolled",
                          sub: displayUser.faceVectorEnrolled
                            ? "Active on this account"
                            : "Enable in Security",
                          color: displayUser.faceVectorEnrolled
                            ? "text-success"
                            : "text-white/30",
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="glass-card rounded-xl p-4 flex flex-col gap-1"
                        >
                          <span className="label">{stat.label}</span>
                          <span
                            className={cn(
                              "font-display text-display-sm",
                              stat.color,
                            )}
                          >
                            {stat.value}
                          </span>
                          <span className="font-sans text-xs text-white/30">
                            {stat.sub}
                          </span>
                        </div>
                      ))}
                    </motion.div>

                    {/* Loyalty progress bar */}
                    {tierInfo.next && (
                      <motion.div variants={staggerItem}>
                        <Card className="p-5 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <span className="label">
                              Progress to {TIER_CONFIG[tierInfo.next]?.label}
                            </span>
                            <span className="font-sans text-xs text-white/40">
                              {Math.round(tierInfo.progress)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-accent-600 to-accent-400 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${tierInfo.progress}%` }}
                              transition={{
                                duration: 1,
                                ease: [0.16, 1, 0.3, 1],
                                delay: 0.3,
                              }}
                            />
                          </div>
                          <p className="font-sans text-xs text-white/30">
                            {tierInfo.needed.toLocaleString()} more points to
                            unlock {TIER_CONFIG[tierInfo.next]?.label} benefits
                          </p>
                        </Card>
                      </motion.div>
                    )}

                    {/* CTA: view bookings */}
                    <motion.div variants={staggerItem}>
                      <Card
                        hover
                        onClick={() => navigate("/bookings")}
                        className="p-5 flex items-center justify-between"
                      >
                        <div className="flex flex-col gap-0.5">
                          <p className="font-display text-display-sm text-white">
                            My Voyages
                          </p>
                          <p className="font-sans text-xs text-white/40">
                            View upcoming and past bookings
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/30" />
                      </Card>
                    </motion.div>
                  </motion.div>
                )}

                {/* Loyalty */}
                {activeSection === "loyalty" && (
                  <motion.div
                    key="loyalty"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    className="flex flex-col gap-6"
                  >
                    <motion.div variants={staggerItem}>
                      <span className="label">
                        Frequent Traveller Programme
                      </span>
                      <h2 className="font-display text-display-md text-white mt-1">
                        Loyalty Status
                      </h2>
                    </motion.div>

                    {/* Current tier card */}
                    <motion.div variants={staggerItem}>
                      <div
                        className={cn(
                          "glass-card rounded-2xl p-6 border",
                          tierCfg.glow,
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-display text-display-2xl",
                                  tierCfg.color,
                                )}
                              >
                                {tierCfg.icon}
                              </span>
                              <div>
                                <p className="label">Current Tier</p>
                                <p
                                  className={cn(
                                    "font-display text-display-md",
                                    tierCfg.color,
                                  )}
                                >
                                  {tierCfg.label}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-display text-display-xl text-white">
                                {displayUser.loyaltyPoints.toLocaleString()}
                              </span>
                              <span className="font-sans text-sm text-white/40">
                                points
                              </span>
                            </div>
                          </div>

                          {/* Image placeholder for tier badge */}
                          <div className="w-20 h-20 rounded-xl bg-surface-800/50 border border-white/8 flex items-center justify-center shrink-0">
                            <span className={cn("text-3xl", tierCfg.color)}>
                              {tierCfg.icon}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Tier progression */}
                    <motion.div
                      variants={staggerItem}
                      className="flex flex-col gap-4"
                    >
                      <span className="label">Tier Progression</span>
                      <div className="flex flex-col gap-3">
                        {TIER_ORDER.map((tid, i) => {
                          const cfg = TIER_CONFIG[tid];
                          const isCurrent = displayUser.loyaltyTier === tid;
                          const isPassed =
                            TIER_ORDER.indexOf(displayUser.loyaltyTier) > i;
                          const benefits = TIER_BENEFITS[tid] ?? [];

                          return (
                            <div
                              key={tid}
                              className={cn(
                                "glass-card rounded-xl p-4 border transition-all duration-300",
                                isCurrent
                                  ? cn("border", cfg.glow)
                                  : "border-white/5",
                                isPassed && "opacity-50",
                              )}
                            >
                              <div className="flex items-center justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "font-display text-display-sm",
                                      cfg.color,
                                    )}
                                  >
                                    {cfg.icon}
                                  </span>
                                  <span
                                    className={cn(
                                      "font-display text-display-sm",
                                      isCurrent
                                        ? "text-white"
                                        : "text-white/50",
                                    )}
                                  >
                                    {cfg.label}
                                  </span>
                                </div>
                                {isCurrent && (
                                  <Badge variant="accent">Current</Badge>
                                )}
                                {isPassed && (
                                  <Check className="w-4 h-4 text-success" />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {benefits.slice(0, 2).map((b) => (
                                  <span
                                    key={b}
                                    className="font-sans text-xs text-white/35"
                                  >
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>

                    {/* Redemption info */}
                    <motion.div variants={staggerItem}>
                      <Card className="p-5 flex flex-col gap-3">
                        <span className="label">Redemption Rate</span>
                        <p className="font-sans text-sm text-white/50">
                          100 points = ₢1 credit discount. Points are applied
                          during the booking review step. You earn 1 point per
                          credit spent on base fares.
                        </p>
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex flex-col gap-0.5">
                            <span className="label">Available to redeem</span>
                            <span className="font-display text-display-sm text-white">
                              {formatCredits(displayUser.loyaltyPoints * 0.01)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </motion.div>
                )}

                {/* Security */}
                {activeSection === "security" && (
                  <motion.div
                    key="security"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    className="flex flex-col gap-6"
                  >
                    <motion.div variants={staggerItem}>
                      <span className="label">Account Security</span>
                      <h2 className="font-display text-display-md text-white mt-1">
                        Security Settings
                      </h2>
                    </motion.div>

                    {/* Password change placeholder */}
                    <motion.div variants={staggerItem}>
                      <Card className="p-6 flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <p className="font-display text-display-sm text-white">
                              Password
                            </p>
                            <p className="font-sans text-xs text-white/40">
                              Last changed: unknown
                            </p>
                          </div>
                          <Button variant="secondary" size="sm">
                            Change Password
                          </Button>
                        </div>

                        <Divider />

                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <p className="font-display text-display-sm text-white">
                                Face ID
                              </p>
                              <p className="font-sans text-xs text-white/40">
                                {displayUser.faceVectorEnrolled
                                  ? "Enrolled — biometric boarding enabled"
                                  : "Not enrolled — enable for faster boarding"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {displayUser.faceVectorEnrolled && (
                                <Badge variant="success">Active</Badge>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setActiveSection("face")}
                              >
                                {displayUser.faceVectorEnrolled
                                  ? "Re-enrol"
                                  : "Set up"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    {/* Privacy note */}
                    <motion.div variants={staggerItem}>
                      <div className="glass-card rounded-xl p-4 flex items-start gap-3">
                        <Shield className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                        <p className="font-sans text-xs text-white/35 leading-relaxed">
                          Stellar stores only encrypted facial landmark vectors
                          — never images or raw biometric data. Your face is
                          processed locally on your device by face-api.js before
                          any data is transmitted.
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Face ID enrolment */}
                {activeSection === "face" && (
                  <FaceEnrolmentSection
                    isEnrolled={displayUser.faceVectorEnrolled}
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ["me"] });
                      setActiveSection("security");
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ─────────────────────────────────────────────────────────────────
// FaceEnrolmentSection
// ─────────────────────────────────────────────────────────────────

function FaceEnrolmentSection({
  isEnrolled,
  onSuccess,
}: {
  isEnrolled: boolean;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState<
    "idle" | "camera" | "scanning" | "processing" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    setStatus("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setStatus("error");
      setErrorMsg(
        "Camera access denied. Please allow camera access and try again.",
      );
    }
  }

  const enrolMutation = useMutation({
    mutationFn: async () => {
      // In a real implementation, face-api.js would extract landmarks from videoRef
      // and we'd send the vector to updateFaceVector(vector)
      // For now we simulate the process
      setStatus("scanning");
      await new Promise((r) => setTimeout(r, 2000));
      setStatus("processing");
      await new Promise((r) => setTimeout(r, 1000));

      // Load models once
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      // Extract descriptor from the live video element
      const detection = await faceapi
        .detectSingleFace(videoRef.current!)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus("error");
        setErrorMsg(
          "No face detected. Make sure your face is clearly visible.",
        );
        return;
      }

      const vector = Array.from(detection.descriptor); // Float32Array → number[]
      await updateFaceVector(vector);
    },
    onSuccess: () => {
      stopCamera();
      setStatus("success");
      setTimeout(onSuccess, 1500);
    },
    onError: () => {
      setStatus("error");
      setErrorMsg("Enrolment failed. Please try again.");
    },
  });

  return (
    <motion.div
      key="face"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="flex flex-col gap-6"
    >
      <motion.div variants={staggerItem}>
        <span className="label">Biometric Security</span>
        <h2 className="font-display text-display-md text-white mt-1">
          {isEnrolled ? "Re-enrol Face ID" : "Enrol Face ID"}
        </h2>
        <p className="font-sans text-sm text-white/40 mt-2 max-w-lg">
          Face ID allows you to sign in and authenticate at boarding without a
          password. Your facial landmarks are processed locally and only the
          encrypted vector is stored.
        </p>
      </motion.div>

      {/* Camera viewer */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative w-72 h-72 rounded-3xl overflow-hidden border border-white/10 bg-surface-900">
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
              ["camera", "scanning", "processing"].includes(status)
                ? "opacity-100"
                : "opacity-0",
            )}
            muted
            playsInline
          />

          {/* Status overlays */}
          {status === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-24 h-24 rounded-full border-2 border-white/15 flex items-center justify-center">
                <Camera className="w-10 h-10 text-white/20" />
              </div>
              <p className="font-sans text-xs text-white/30 text-center px-6">
                Click below to start your camera
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="absolute inset-0 bg-success/10 flex flex-col items-center justify-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-full bg-success/20 border-2 border-success/60 flex items-center justify-center"
              >
                <Check className="w-8 h-8 text-success" />
              </motion.div>
              <p className="font-sans text-sm text-success font-bold">
                Enrolled!
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 bg-danger/10 flex flex-col items-center justify-center gap-3 p-6">
              <AlertCircle className="w-10 h-10 text-danger/60" />
              <p className="font-sans text-xs text-danger text-center">
                {errorMsg}
              </p>
            </div>
          )}

          {/* Scanning overlay */}
          {(status === "scanning" || status === "camera") && (
            <div className="absolute inset-0 pointer-events-none">
              {[
                "top-6 left-6 border-t-2 border-l-2",
                "top-6 right-6 border-t-2 border-r-2",
                "bottom-6 left-6 border-b-2 border-l-2",
                "bottom-6 right-6 border-b-2 border-r-2",
              ].map((cls, i) => (
                <div
                  key={i}
                  className={cn("absolute w-8 h-8 border-accent-400/70", cls)}
                />
              ))}
              {status === "scanning" && (
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-400 to-transparent"
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}
            </div>
          )}

          {/* Processing spinner */}
          {status === "processing" && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-accent-400 border-t-transparent animate-spin" />
              <p className="font-sans text-xs text-white/60">
                Processing landmarks…
              </p>
            </div>
          )}
        </div>

        {/* Status label */}
        <p className="font-display text-display-sm text-white text-center">
          {status === "idle" &&
            (isEnrolled ? "Ready to re-enrol" : "Ready to enrol")}
          {status === "camera" && "Position your face in the frame"}
          {status === "scanning" && "Capturing landmarks…"}
          {status === "processing" && "Encrypting vector…"}
          {status === "success" && "Enrolment complete"}
          {status === "error" && "Something went wrong"}
        </p>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          {status === "idle" && (
            <Button size="lg" onClick={startCamera}>
              <Camera className="w-4 h-4" />
              Start Camera
            </Button>
          )}
          {status === "camera" && (
            <>
              <Button size="lg" onClick={() => enrolMutation.mutate()}>
                <Scan className="w-4 h-4" />
                Capture
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  stopCamera();
                  setStatus("idle");
                }}
              >
                Cancel
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <Button
                size="lg"
                onClick={() => {
                  setStatus("idle");
                  setErrorMsg("");
                }}
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Privacy note */}
      <motion.div variants={staggerItem}>
        <div className="glass-card rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
          <p className="font-sans text-xs text-white/35 leading-relaxed">
            Landmark extraction runs entirely in your browser using face-api.js
            and TensorFlow.js. No images or video frames are ever transmitted.
            Only the resulting 128-dimensional numeric vector is sent to
            Stellar's servers, where it is stored encrypted.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
