import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, LogOut, Star, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------
// Navbar
// -----------------------------------------------------------------

export function Navbar() {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    clearAuth();
    navigate("/");
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-space-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-stellar-400 to-stellar-600 flex items-center justify-center shadow-glow-stellar">
              <img
                src="/images/logo.png"
                alt="Stellar Logo"
                className="w-6 h-6"
              />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white group-hover:text-stellar-300 transition-colors">
              Stellar
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/explore"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Explore
            </Link>
            <Link
              to="/fleet"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Fleet
            </Link>
            {isAuthenticated && (
              <Link
                to="/bookings"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                My Voyages
              </Link>
            )}
          </div>

          {/* Auth controls */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-space-700 border border-white/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span>{user.firstName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white/40 hover:text-white/70 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Create account</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-white/60 hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-white/5 bg-space-950/95 backdrop-blur-md px-4 py-4 flex flex-col gap-4"
        >
          <Link
            to="/explore"
            className="text-sm text-white/60 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Explore
          </Link>
          <Link
            to="/fleet"
            className="text-sm text-white/60 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Fleet
          </Link>
          {isAuthenticated && (
            <Link
              to="/bookings"
              className="text-sm text-white/60 hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              My Voyages
            </Link>
          )}
          <div className="border-t border-white/10 pt-4 flex gap-3">
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sign out
              </Button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="secondary" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  <Button size="sm">Create account</Button>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}

// -----------------------------------------------------------------
// BookingStepIndicator — progress bar across booking flow pages
// -----------------------------------------------------------------

const STEPS = [
  { id: "results", label: "Search" },
  { id: "detail", label: "Voyage" },
  { id: "packages", label: "Packages" },
  { id: "passengers", label: "Passengers" },
  { id: "review", label: "Review" },
  { id: "confirmation", label: "Confirmed" },
];

export function BookingStepIndicator({ currentStep }: { currentStep: string }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="flex items-center">
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center",
              i < STEPS.length - 1 && "flex-1",
            )}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border transition-all duration-300",
                  i < currentIndex
                    ? "bg-stellar-500 border-stellar-500 text-white"
                    : i === currentIndex
                      ? "bg-stellar-500/20 border-stellar-400 text-stellar-300"
                      : "bg-space-800 border-white/10 text-white/30",
                )}
              >
                {i < currentIndex ? (
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap transition-colors",
                  i === currentIndex
                    ? "text-stellar-300 font-medium"
                    : "text-white/30",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 mx-2 mb-4 transition-colors duration-300",
                  i < currentIndex ? "bg-stellar-500" : "bg-white/10",
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// PageWrapper — consistent page padding and fade-in
// -----------------------------------------------------------------

export function PageWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("min-h-screen pt-16", className)}
    >
      {children}
    </motion.main>
  );
}
