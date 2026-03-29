import { cn } from "@/lib/utils";
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
  variant?: "primary" | "secondary" | "ghost" | "danger";
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
    const base =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-space-900 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-stellar-500 hover:bg-stellar-400 text-white focus:ring-stellar-500 shadow-glow-stellar hover:shadow-glow-stellar",
      secondary:
        "bg-space-700 hover:bg-space-600 text-white border border-white/10 hover:border-white/20 focus:ring-stellar-500",
      ghost:
        "bg-transparent hover:bg-white/5 text-white/70 hover:text-white focus:ring-white/20",
      danger:
        "bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 focus:ring-danger",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2.5 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
    | "stellar"
    | "success"
    | "warning"
    | "danger"
    | "outline";
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
    default: "bg-white/10 text-white/80",
    stellar: "bg-stellar-500/20 text-stellar-300 border border-stellar-500/30",
    success: "bg-success/10 text-success border border-success/30",
    warning: "bg-warning/10 text-warning border border-warning/30",
    danger: "bg-danger/10 text-danger border border-danger/30",
    outline: "border border-white/20 text-white/70",
  };
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
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
  children: React.ReactNode;
  onClick?: () => void;
}

export function Card({ className, hover, children, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-gradient-card border border-white/8 rounded-2xl backdrop-blur-sm",
        hover &&
          "transition-all duration-300 hover:border-white/15 hover:shadow-card-hover cursor-pointer",
        onClick && "cursor-pointer",
        "shadow-card",
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
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-white/70">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl bg-space-800 border text-white placeholder-white/30",
          "focus:outline-none focus:ring-2 focus:ring-stellar-500/50 focus:border-stellar-500/50",
          "transition-colors duration-200",
          error ? "border-danger/50" : "border-white/10 hover:border-white/20",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  ),
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
  ({ label, error, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-white/70">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl bg-space-800 border text-white",
          "focus:outline-none focus:ring-2 focus:ring-stellar-500/50 focus:border-stellar-500/50",
          "transition-colors duration-200",
          error ? "border-danger/50" : "border-white/10 hover:border-white/20",
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            className="bg-space-800"
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  ),
);
Select.displayName = "Select";

// -----------------------------------------------------------------
// Spinner
// -----------------------------------------------------------------

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin text-stellar-400", className ?? "h-6 w-6")}
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
  );
}

// -----------------------------------------------------------------
// OrbitalWindowStars — 1–5 star rating display
// -----------------------------------------------------------------

export function OrbitalWindowStars({
  rating,
  showLabel = false,
}: {
  rating: number;
  showLabel?: boolean;
}) {
  const colors = [
    "",
    "text-rating1",
    "text-rating2",
    "text-rating3",
    "text-rating4",
    "text-rating5",
  ];
  const labels = ["", "Unfavourable", "Poor", "Average", "Good", "Excellent"];
  const color = colors[rating] ?? "text-white/40";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              i <= rating ? color : "text-white/15",
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", color)}>
          {labels[rating]}
        </span>
      )}
    </div>
  );
}
