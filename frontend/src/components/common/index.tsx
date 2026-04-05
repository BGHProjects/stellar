import { motion, AnimatePresence } from "framer-motion";
import {
  loomUp,
  letterContainer,
  letterVariant,
  modalOverlay,
  modalExpand,
  modalContent,
  pageEnter,
  fadeIn,
  viewportOnce,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { X } from "lucide-react";

// -----------------------------------------------------------------
// AnimatedText — letter-by-letter animation for titles
// -----------------------------------------------------------------

interface AnimatedTextProps {
  text: string;
  className?: string;
  /** Use 'loom' for hero titles, 'letter' for snappy UI labels */
  variant?: "loom" | "letter";
  delay?: number;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export function AnimatedText({
  text,
  className,
  variant = "letter",
  delay = 0,
  as: Tag = "span",
}: AnimatedTextProps) {
  if (variant === "loom") {
    return (
      <motion.div
        variants={loomUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        transition={{ delay }}
        className={className}
      >
        <Tag>{text}</Tag>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={letterContainer}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delayChildren: delay }}
      aria-label={text}
      className={className}
    >
      <Tag className="inline">
        {text.split("").map((char, i) => (
          <motion.span
            key={i}
            variants={letterVariant}
            className="inline-block"
            style={{ whiteSpace: char === " " ? "pre" : undefined }}
          >
            {char}
          </motion.span>
        ))}
      </Tag>
    </motion.div>
  );
}

// -----------------------------------------------------------------
// ImagePlaceholder — consistent image slot with shimmer loading state
// -----------------------------------------------------------------

interface ImagePlaceholderProps {
  aspectRatio?: "16/9" | "4/3" | "1/1" | "3/4" | "21/9";
  label?: string;
  className?: string;
  rounded?: string;
}

export function ImagePlaceholder({
  aspectRatio = "16/9",
  label,
  className,
  rounded = "rounded-2xl",
}: ImagePlaceholderProps) {
  const ratioClass = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "3/4": "aspect-[3/4]",
    "21/9": "aspect-[21/9]",
  }[aspectRatio];

  return (
    <div
      className={cn(
        "img-placeholder overflow-hidden flex items-center justify-center",
        ratioClass,
        rounded,
        className,
      )}
      style={{
        backgroundSize: "200% 100%",
        animation: "shimmer 2.5s linear infinite",
      }}
    >
      {label && (
        <div className="flex flex-col items-center gap-2 text-white/20 p-4">
          <svg
            className="w-8 h-8 opacity-40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <span className="label text-center">{label}</span>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// Modal — circle-expand animation with overlay
// -----------------------------------------------------------------

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className,
}: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Overlay */}
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal container — circle expand */}
          <motion.div
            variants={modalExpand}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full glass-card overflow-hidden z-10",
              sizeClass,
              className,
            )}
          >
            {/* Modal content — fades in after container expands */}
            <motion.div
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                  <h3 className="font-display text-display-sm text-white">
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-white/40 hover:text-white transition-colors rounded-lg p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Close button if no title */}
              {!title && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10 rounded-lg p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Content */}
              <div className={cn(!title && "pt-8")}>{children}</div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// -----------------------------------------------------------------
// PageTransition — wraps page content for route transitions
// -----------------------------------------------------------------

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={pageEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// -----------------------------------------------------------------
// SectionReveal — wraps a section to animate in on scroll
// -----------------------------------------------------------------

export function SectionReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// -----------------------------------------------------------------
// MobileGate — shows a message for screens below the threshold
// -----------------------------------------------------------------

interface MobileGateProps {
  /** Minimum breakpoint to allow access. 'md' = 768px, 'lg' = 1024px */
  minBreakpoint?: "md" | "lg";
  featureName?: string;
  children: React.ReactNode;
}

export function MobileGate({
  minBreakpoint = "md",
  featureName = "This feature",
  children,
}: MobileGateProps) {
  const hiddenBelow = minBreakpoint === "md" ? "md:block" : "lg:block";
  const showBelow = minBreakpoint === "md" ? "md:hidden" : "lg:hidden";

  return (
    <>
      {/* Shown on small screens */}
      <div
        className={cn(
          "flex items-center justify-center min-h-screen p-8 text-center",
          showBelow,
        )}
      >
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="max-w-xs flex flex-col items-center gap-6"
        >
          {/* Planet illustration placeholder */}
          <div className="w-24 h-24 rounded-full bg-surface-800 border border-white/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white/20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-display-sm text-white">
              {featureName}
            </h3>
            <p className="font-sans text-sm text-white/50 leading-relaxed">
              {minBreakpoint === "md"
                ? "requires a tablet or desktop display for the best experience."
                : "requires a desktop display for the best experience."}
            </p>
          </div>
          <div className="label">Switch to a larger screen to continue</div>
        </motion.div>
      </div>

      {/* Shown on qualifying screens */}
      <div className={cn("hidden", hiddenBelow)}>{children}</div>
    </>
  );
}
