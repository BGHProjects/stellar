import { Star } from "lucide-react";
import { Link } from "react-router-dom";

const LandingPageFooter = () => {
  return (
    <footer className="border-t border-white/5 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-300 to-accent-600 flex items-center justify-center">
            <img
              src="/images/logo.png"
              alt="Stellar Logo"
              className="w-3 h-3"
            />
          </div>
          <span className="font-display text-sm text-white">Stellar</span>
        </div>
        <p className="font-sans text-xs text-white/20 text-center">
          Interplanetary voyage booking for the Taunor system. All journeys
          subject to orbital window availability.
        </p>
        <div className="flex gap-6">
          <Link
            to="/fleet"
            className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Fleet
          </Link>
          <Link
            to="/explore"
            className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            System
          </Link>
          <Link
            to="/profile"
            className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Account
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default LandingPageFooter;
