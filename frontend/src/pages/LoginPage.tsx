import { PageTransition } from "@/components/common";
import { Button, Input } from "@/components/ui";
import {
  fadeIn,
  fadeUp,
  loomUp,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";
import { login } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Scan, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type LoginMode = "password" | "face";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const from = (location.state as { from?: string })?.from ?? "/";

  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Face auth state
  const [faceStatus, setFaceStatus] = useState<
    "idle" | "scanning" | "success" | "failed"
  >("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up camera on unmount or mode switch
  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setFaceStatus("idle");
  }

  async function startFaceScan() {
    setFaceStatus("scanning");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      // In a real implementation, face-api.js would detect landmarks here
      // and send the vector to /api/vision/authenticate
      // For now we show the UI flow
    } catch {
      setFaceStatus("failed");
    }
  }

  const mutation = useMutation({
    mutationFn: () => login({ email, password }),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate(from, { replace: true });
    },
    onError: () => {
      setErrors({ form: "Invalid email or password." });
    },
  });

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    if (!password.trim()) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-void flex">
        {/* Left panel — decorative */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-void" />
          <div className="absolute inset-0 star-field opacity-40" />

          {/* Orbiting decorative rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[280, 380, 480].map((size, i) => (
              <motion.div
                key={size}
                className="absolute rounded-full border border-white/5"
                style={{ width: size, height: size }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 40 + i * 20,
                  repeat: Infinity,
                  ease: "linear",
                  direction: i % 2 === 0 ? "normal" : "reverse",
                }}
              >
                {/* Orbit dot */}
                <div
                  className="absolute w-1.5 h-1.5 rounded-full bg-accent-400/60"
                  style={{
                    top: "0%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </motion.div>
            ))}

            {/* Centre planet placeholder */}
            <div className="w-24 h-24 rounded-full bg-gradient-radial from-surface-700 to-surface-950 border border-white/10 shadow-glow-surface" />
          </div>

          {/* Quote */}
          <div className="absolute bottom-12 left-12 right-12">
            <motion.div
              variants={loomUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-3"
            >
              <p className="font-display text-display-md text-white/80 leading-tight">
                The void between stars
                <br />
                <span className="text-gradient-accent">is not empty.</span>
              </p>
              <p className="font-sans text-sm text-white/30">
                Welcome back to the Solara system.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-16 lg:px-16">
          {/* Logo */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="absolute top-6 left-6 lg:left-auto lg:right-8"
          >
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-full bg-accent-600/20 border border-accent-500/30 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-accent-300 fill-accent-300/30" />
              </div>
              <span className="font-display text-sm text-white/60 group-hover:text-white transition-colors">
                Stellar
              </span>
            </Link>
          </motion.div>

          <div className="w-full max-w-md flex flex-col gap-8">
            {/* Heading */}
            <motion.div
              variants={loomUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2"
            >
              <h1 className="font-display text-display-xl text-white">
                Sign in
              </h1>
              <p className="font-sans text-sm text-white/40">
                New to Stellar?{" "}
                <Link
                  to="/register"
                  className="text-accent-300 hover:text-accent-200 transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </motion.div>

            {/* Mode toggle */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
            >
              <div className="flex gap-1 bg-surface-900/80 border border-white/8 rounded-xl p-1">
                <button
                  onClick={() => {
                    setMode("password");
                    stopCamera();
                  }}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg font-sans text-sm font-bold transition-all duration-300",
                    mode === "password"
                      ? "bg-white text-black"
                      : "text-white/40 hover:text-white/70",
                  )}
                >
                  Email & Password
                </button>
                <button
                  onClick={() => setMode("face")}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg font-sans text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5",
                    mode === "face"
                      ? "bg-white text-black"
                      : "text-white/40 hover:text-white/70",
                  )}
                >
                  <Scan className="w-3.5 h-3.5" />
                  Face ID
                </button>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {/* Password form */}
              {mode === "password" && (
                <motion.form
                  key="password"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-5"
                >
                  <motion.div variants={staggerItem}>
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      error={errors.email}
                      placeholder="your@email.com"
                      autoComplete="email"
                      autoFocus
                    />
                  </motion.div>

                  <motion.div variants={staggerItem} className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      error={errors.password}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 bottom-3 text-white/30 hover:text-white/60 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </motion.div>

                  {errors.form && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-4 py-3 bg-danger/10 border border-danger/25 rounded-xl"
                    >
                      <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                      <p className="font-sans text-sm text-danger">
                        {errors.form}
                      </p>
                    </motion.div>
                  )}

                  <motion.div variants={staggerItem}>
                    <Button
                      type="submit"
                      size="lg"
                      loading={mutation.isPending}
                      className="w-full"
                    >
                      {mutation.isPending ? "Signing in…" : "Sign in"}
                      {!mutation.isPending && (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </Button>
                  </motion.div>

                  <motion.div variants={staggerItem} className="text-center">
                    <button
                      type="button"
                      className="font-sans text-sm text-white/30 hover:text-white/60 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </motion.div>
                </motion.form>
              )}

              {/* Face auth */}
              {mode === "face" && (
                <motion.div
                  key="face"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-6 items-center"
                >
                  {/* Camera / scan UI */}
                  <div className="relative w-64 h-64 rounded-3xl overflow-hidden border border-white/10 bg-surface-900">
                    <video
                      ref={videoRef}
                      className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                        faceStatus === "scanning" ? "opacity-100" : "opacity-0",
                      )}
                      muted
                      playsInline
                    />

                    {/* Overlay when not scanning */}
                    {faceStatus !== "scanning" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className={cn(
                            "w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                            faceStatus === "success"
                              ? "border-success bg-success/10"
                              : faceStatus === "failed"
                                ? "border-danger bg-danger/10"
                                : "border-white/20",
                          )}
                        >
                          <Scan
                            className={cn(
                              "w-10 h-10 transition-colors",
                              faceStatus === "success"
                                ? "text-success"
                                : faceStatus === "failed"
                                  ? "text-danger"
                                  : "text-white/30",
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Scanning animation overlay */}
                    {faceStatus === "scanning" && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Corner brackets */}
                        {[
                          "top-4 left-4 border-t-2 border-l-2",
                          "top-4 right-4 border-t-2 border-r-2",
                          "bottom-4 left-4 border-b-2 border-l-2",
                          "bottom-4 right-4 border-b-2 border-r-2",
                        ].map((cls, i) => (
                          <div
                            key={i}
                            className={cn(
                              "absolute w-6 h-6 border-accent-400",
                              cls,
                            )}
                          />
                        ))}

                        {/* Scanning line */}
                        <motion.div
                          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-400 to-transparent"
                          animate={{ top: ["10%", "90%", "10%"] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-center flex flex-col gap-2">
                    <p className="font-display text-display-sm text-white">
                      {faceStatus === "idle" && "Ready to scan"}
                      {faceStatus === "scanning" && "Scanning…"}
                      {faceStatus === "success" && "Identity confirmed"}
                      {faceStatus === "failed" && "Scan failed"}
                    </p>
                    <p className="font-sans text-xs text-white/40 max-w-xs">
                      {faceStatus === "idle" &&
                        "Your face is processed locally. No images are sent to any server."}
                      {faceStatus === "scanning" &&
                        "Hold still and look at the camera."}
                      {faceStatus === "success" && "Redirecting…"}
                      {faceStatus === "failed" &&
                        "Could not detect your face. Try again or use password sign-in."}
                    </p>
                  </div>

                  {faceStatus === "idle" && (
                    <Button
                      size="lg"
                      onClick={startFaceScan}
                      className="w-full max-w-xs"
                    >
                      <Scan className="w-4 h-4" />
                      Begin Scan
                    </Button>
                  )}
                  {faceStatus === "failed" && (
                    <div className="flex gap-3 w-full max-w-xs">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setFaceStatus("idle")}
                        className="flex-1"
                      >
                        Try Again
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => {
                          setMode("password");
                          stopCamera();
                        }}
                        className="flex-1"
                      >
                        Use Password
                      </Button>
                    </div>
                  )}

                  <p className="font-sans text-xs text-white/25 text-center max-w-xs">
                    Face ID requires prior enrolment from your profile settings.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
