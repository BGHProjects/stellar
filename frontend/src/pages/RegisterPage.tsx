import { PageTransition } from "@/components/common";
import { Button, Input } from "@/components/ui";
import {
  fadeIn,
  fadeUp,
  loomUp,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";
import { register } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Three-step registration flow
type Step = "account" | "personal" | "confirm";

const STEPS: { id: Step; label: string; description: string }[] = [
  { id: "account", label: "Account", description: "Email and password" },
  { id: "personal", label: "Personal", description: "Your details" },
  { id: "confirm", label: "Confirm", description: "Review and create" },
];

interface FormData {
  email: string;
  password: string;
  confirmPass: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

function emptyForm(): FormData {
  return {
    email: "",
    password: "",
    confirmPass: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
  };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<Step>("account");
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData & { form: string }>>(
    {},
  );

  const currentIndex = STEPS.findIndex((s) => s.id === step);

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  // Per-step validation
  function validateStep(s: Step): boolean {
    const e: Partial<FormData & { form: string }> = {};

    if (s === "account") {
      if (!form.email.trim()) e.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email))
        e.email = "Enter a valid email";
      if (!form.password) e.password = "Password is required";
      else if (form.password.length < 8) e.password = "Minimum 8 characters";
      if (form.confirmPass !== form.password)
        e.confirmPass = "Passwords do not match";
    }

    if (s === "personal") {
      if (!form.firstName.trim()) e.firstName = "First name is required";
      if (!form.lastName.trim()) e.lastName = "Last name is required";
      if (!form.dateOfBirth) e.dateOfBirth = "Date of birth is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  }

  function handleBack() {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  }

  const mutation = useMutation({
    mutationFn: () =>
      register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
      }),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate("/");
    },
    onError: () => {
      setErrors({
        form: "This email is already registered. Try signing in instead.",
      });
      setStep("account");
    },
  });

  function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    mutation.mutate();
  }

  // Password strength
  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel =
    ["", "Weak", "Fair", "Good", "Strong", "Excellent"][strength] ?? "";
  const strengthColor =
    [
      "",
      "text-danger",
      "text-warning",
      "text-warning",
      "text-success",
      "text-success",
    ][strength] ?? "";
  const strengthBg =
    ["", "bg-danger", "bg-warning", "bg-warning", "bg-success", "bg-success"][
      strength
    ] ?? "";

  return (
    <PageTransition>
      <div className="min-h-screen bg-void flex">
        {/* Left panel — decorative */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-void" />
          <div className="absolute inset-0 star-field opacity-40" />

          {/* Animated particle field */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-accent-400/40"
                style={{
                  left: `${10 + ((i * 7) % 80)}%`,
                  top: `${15 + ((i * 13) % 70)}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + (i % 3),
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Benefit list */}
          <div className="absolute bottom-12 left-12 right-12 flex flex-col gap-6">
            <motion.p
              variants={loomUp}
              initial="hidden"
              animate="visible"
              className="font-display text-display-md text-white/80 leading-tight"
            >
              Begin your
              <br />
              <span className="text-gradient-accent">
                interplanetary journey.
              </span>
            </motion.p>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-3"
            >
              {[
                "Track all your upcoming voyages",
                "Earn Frequent Traveller points",
                "Opt in to facial recognition boarding",
                "Exclusive member pricing windows",
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-accent-600/30 border border-accent-500/40 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-accent-300" />
                  </div>
                  <span className="font-sans text-sm text-white/50">
                    {benefit}
                  </span>
                </motion.div>
              ))}
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
                <img
                  src="/images/logo.png"
                  alt="Stellar Logo"
                  className="w-3.5 h-3.5"
                />
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
                Create account
              </h1>
              <p className="font-sans text-sm text-white/40">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-accent-300 hover:text-accent-200 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>

            {/* Step indicator */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center">
                {STEPS.map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center",
                      i < STEPS.length - 1 && "flex-1",
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-sans border-2 transition-all duration-300",
                          i < currentIndex
                            ? "bg-accent-600 border-accent-600 text-white"
                            : i === currentIndex
                              ? "bg-transparent border-accent-400 text-accent-300"
                              : "bg-transparent border-white/10 text-white/25",
                        )}
                      >
                        {i < currentIndex ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          "font-sans text-xs transition-colors",
                          i === currentIndex
                            ? "text-accent-300"
                            : "text-white/25",
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "h-px flex-1 mx-2 mb-4 transition-colors duration-300",
                          i < currentIndex ? "bg-accent-600" : "bg-white/10",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Form steps */}
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* Step 1 — Account credentials */}
                {step === "account" && (
                  <motion.div
                    key="account"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                    className="flex flex-col gap-5"
                  >
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
                      <Input
                        label="Email address"
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        error={errors.email}
                        placeholder="your@email.com"
                        autoComplete="email"
                        autoFocus
                      />
                    </motion.div>

                    <motion.div
                      variants={staggerItem}
                      className="flex flex-col gap-2"
                    >
                      <div className="relative">
                        <Input
                          label="Password"
                          type={showPass ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => update("password", e.target.value)}
                          error={errors.password}
                          placeholder="Minimum 8 characters"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((s) => !s)}
                          className="absolute right-3 bottom-3 text-white/30 hover:text-white/60 transition-colors"
                          tabIndex={-1}
                        >
                          {showPass ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Password strength bar */}
                      {form.password.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col gap-1.5"
                        >
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={cn(
                                  "h-1 flex-1 rounded-full transition-all duration-300",
                                  i <= strength ? strengthBg : "bg-white/10",
                                )}
                              />
                            ))}
                          </div>
                          <span
                            className={cn("font-sans text-xs", strengthColor)}
                          >
                            {strengthLabel}
                          </span>
                        </motion.div>
                      )}
                    </motion.div>

                    <motion.div variants={staggerItem} className="relative">
                      <Input
                        label="Confirm password"
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPass}
                        onChange={(e) => update("confirmPass", e.target.value)}
                        error={errors.confirmPass}
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        className="absolute right-3 bottom-3 text-white/30 hover:text-white/60 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </motion.div>

                    <motion.div variants={staggerItem}>
                      <Button
                        type="button"
                        size="lg"
                        className="w-full"
                        onClick={handleNext}
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {/* Step 2 — Personal details */}
                {step === "personal" && (
                  <motion.div
                    key="personal"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                    className="flex flex-col gap-5 "
                  >
                    <motion.div
                      variants={staggerItem}
                      className="grid grid-cols-2 gap-4"
                    >
                      <Input
                        label="First name"
                        value={form.firstName}
                        onChange={(e) => update("firstName", e.target.value)}
                        error={errors.firstName}
                        placeholder="Given name"
                        autoComplete="given-name"
                        autoFocus
                      />
                      <Input
                        label="Last name"
                        value={form.lastName}
                        onChange={(e) => update("lastName", e.target.value)}
                        error={errors.lastName}
                        placeholder="Family name"
                        autoComplete="family-name"
                      />
                    </motion.div>

                    <motion.div variants={staggerItem}>
                      <Input
                        label="Date of birth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => update("dateOfBirth", e.target.value)}
                        error={errors.dateOfBirth}
                        hint="Used to calculate passenger age for booking purposes"
                      />
                    </motion.div>

                    <motion.div variants={staggerItem} className="flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        onClick={handleBack}
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        onClick={handleNext}
                        className="flex-1"
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {/* Step 3 — Review and confirm */}
                {step === "confirm" && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: { duration: 0.3 },
                    }}
                    exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                    className="flex flex-col gap-5"
                  >
                    {/* Summary card */}
                    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                      <span className="label">Account Summary</span>

                      <div className="grid grid-cols-2 gap-4">
                        {[
                          {
                            label: "Name",
                            value: `${form.firstName} ${form.lastName}`,
                          },
                          { label: "Email", value: form.email },
                          { label: "Birthday", value: form.dateOfBirth },
                          { label: "Password", value: "••••••••" },
                        ].map((row) => (
                          <div
                            key={row.label}
                            className="flex flex-col gap-0.5"
                          >
                            <span className="label">{row.label}</span>
                            <span className="font-sans text-sm text-white truncate">
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep("account")}
                        className="font-sans text-xs text-accent-300 hover:text-accent-200 transition-colors self-start"
                      >
                        Edit details →
                      </button>
                    </div>

                    {/* Terms */}
                    <div className="glass-card rounded-xl p-4">
                      <p className="font-sans text-xs text-white/40 leading-relaxed">
                        By creating an account you agree to Stellar's voyage
                        terms of service and privacy policy. Facial recognition
                        data, if enabled, is processed locally and stored only
                        as encrypted landmark vectors.
                      </p>
                    </div>

                    {mutation.isError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-4 py-3 bg-danger/10 border border-danger/25 rounded-xl"
                      >
                        <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                        <p className="font-sans text-sm text-danger">
                          {errors.form ??
                            "Something went wrong. Please try again."}
                        </p>
                      </motion.div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        onClick={handleBack}
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </Button>
                      <Button
                        type="submit"
                        size="lg"
                        loading={mutation.isPending}
                        className="flex-1"
                      >
                        {mutation.isPending ? "Creating…" : "Create Account"}
                        {!mutation.isPending && (
                          <img
                            src="/images/logo.png"
                            alt="Stellar Logo"
                            className="w-4 h-4"
                          />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
