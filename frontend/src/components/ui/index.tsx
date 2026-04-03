import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { cardHover, cardTap } from "@/lib/animations";
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  forwardRef,
} from "react";

// -----------------------------------------------------------------
// Button
// -----------------------------------------------------------------

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const base = [
      "inline-flex items-center justify-center font-sans font-bold rounded-xl",
      "transition-all duration-200 focus-visible:outline-none",
      "disabled:opacity-40 disabled:cursor-not-allowed",
    ].join(" ");

    const variants = {
      // White button — primary CTA against dark backgrounds
      primary: "bg-white text-black hover:bg-white/90 active:bg-white/80",
      // Dark indigo surface button — secondary action
      secondary:
        "bg-surface-800 hover:bg-surface-700 text-white border border-white/10 hover:border-accent-600/50",
      // Ghost — minimal, text only
      ghost: "bg-transparent hover:bg-white/5 text-white/60 hover:text-white",
      // Vivid accent — electric indigo
      accent: "bg-accent-600 hover:bg-accent-500 text-white shadow-glow-accent",
      // Danger
      danger:
        "bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30",
    };

    const sizes = {
      sm: "px-3.5 py-2 text-sm gap-1.5 tracking-wide",
      md: "px-5 py-2.5 text-sm gap-2 tracking-wide",
      lg: "px-7 py-3.5 text-base gap-2 tracking-wide",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

// -----------------------------------------------------------------
// Badge
// -----------------------------------------------------------------

interface BadgeProps {
  variant?:
    | "default"
    | "accent"
    | "success"
    | "warning"
    | "danger"
    | "outline"
    | "surface";
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = "default",
  size = "sm",
  className,
  children,
}: BadgeProps) {
  const variants = {
    default: "bg-white/8 text-white/70",
    accent: "bg-accent-600/20 text-accent-300 border border-accent-600/30",
    surface: "bg-surface-800 text-white/60 border border-white/8",
    success: "bg-success/10 text-success border border-success/25",
    warning: "bg-warning/10 text-warning border border-warning/25",
    danger: "bg-danger/10 text-danger border border-danger/25",
    outline: "border border-white/15 text-white/60",
  };
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center font-sans font-bold rounded-full tracking-wide uppercase",
        "text-[10px]",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

// -----------------------------------------------------------------
// Card
// -----------------------------------------------------------------

interface CardProps {
  className?: string;
  hover?: boolean;
  accent?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Card({
  className,
  hover,
  accent,
  children,
  onClick,
}: CardProps) {
  if (hover || onClick) {
    return (
      <motion.div
        whileHover={cardHover}
        whileTap={onClick ? cardTap : undefined}
        onClick={onClick}
        className={cn(
          "glass-card rounded-2xl overflow-hidden cursor-pointer",
          accent && "border-accent",
          className,
        )}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "glass-card rounded-2xl overflow-hidden",
        accent && "border-accent",
        className,
      )}
    >
      {children}
    </div>
  );
}

// -----------------------------------------------------------------
// Input
// -----------------------------------------------------------------

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-sans text-sm font-bold text-white/50 tracking-wide uppercase text-[11px]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-3 rounded-xl font-sans text-sm",
            "bg-surface-900 border text-white placeholder-white/25",
            "focus:outline-none focus:ring-2 focus:ring-accent-600/40 focus:border-accent-600/40",
            "transition-all duration-200",
            error
              ? "border-danger/50 focus:ring-danger/30"
              : "border-white/8 hover:border-accent-600/40",
            className,
          )}
          {...props}
        />
        {error && <p className="font-sans text-xs text-danger">{error}</p>}
        {hint && !error && (
          <p className="font-sans text-xs text-white/35">{hint}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

// -----------------------------------------------------------------
// Select
// -----------------------------------------------------------------

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string; disabled?: boolean }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="font-sans text-sm font-bold text-white/50 tracking-wide uppercase text-[11px]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full px-4 py-3 rounded-xl font-sans text-sm",
            "bg-surface-900 border text-white",
            "focus:outline-none focus:ring-2 focus:ring-accent-600/40 focus:border-accent-600/40",
            "transition-all duration-200",
            error
              ? "border-danger/50"
              : "border-white/8 hover:border-accent-600/40",
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-surface-900 text-white"
            >
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="font-sans text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";

// -----------------------------------------------------------------
// Spinner
// -----------------------------------------------------------------

export function Spinner({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
  return (
    <svg
      className={cn("animate-spin text-accent-400", sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// -----------------------------------------------------------------
// OrbitalWindowStars — 1–5 rating display
// -----------------------------------------------------------------

export function OrbitalWindowStars({
  rating,
  showLabel = false,
  size = "sm",
}: {
  rating: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const colors: Record<number, string> = {
    1: "text-[#ef4444]",
    2: "text-[#f97316]",
    3: "text-[#f59e0b]",
    4: "text-[#84cc16]",
    5: "text-[#22c55e]",
  };
  const labels: Record<number, string> = {
    1: "Unfavourable",
    2: "Poor",
    3: "Average",
    4: "Good",
    5: "Excellent",
  };
  const color = colors[rating] ?? "text-white/20";
  const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={cn(starSize, i <= rating ? color : "text-white/12")}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {showLabel && (
        <span className={cn("font-sans text-xs font-bold", color)}>
          {labels[rating] ?? "Unknown"}
        </span>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// Divider
// -----------------------------------------------------------------

export function Divider({ className }: { className?: string }) {
  return <div className={cn("divider", className)} />;
}
