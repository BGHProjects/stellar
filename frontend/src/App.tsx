import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout";
import { Suspense, lazy } from "react";
import { Spinner } from "@/components/ui";
import ChatWidget from "@/components/common/ChatWidget";

// Lazy-load pages for code splitting
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const SearchResultsPage = lazy(() => import("@/pages/SearchResultsPage"));
const VoyageDetailPage = lazy(() => import("@/pages/VoyageDetailPage"));
const VoyageSearchPage = lazy(() => import("@/pages/VoyageSearchPage"));
const PackagesPage = lazy(() => import("@/pages/PackagesPage"));
const PassengerDetailsPage = lazy(() => import("@/pages/PassengerDetailsPage"));
const ReviewPaymentPage = lazy(() => import("@/pages/ReviewPaymentPage"));
const ConfirmationPage = lazy(() => import("@/pages/ConfirmationPage"));
const ExplorePage = lazy(() => import("@/pages/ExplorePage"));
const PlanetPage = lazy(() => import("@/pages/PlanetPage"));
const FleetPage = lazy(() => import("@/pages/FleetPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const BookingsPage = lazy(() => import("@/pages/BookingsPage"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-void star-field">
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Landing */}
              <Route path="/" element={<LandingPage />} />

              {/* Booking flow */}
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/book" element={<VoyageSearchPage />} />
              <Route path="/voyage/:id" element={<VoyageDetailPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/passengers" element={<PassengerDetailsPage />} />
              <Route path="/review" element={<ReviewPaymentPage />} />
              <Route path="/confirmation" element={<ConfirmationPage />} />

              {/* Discovery */}
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/planet/:bodyId" element={<PlanetPage />} />
              <Route path="/fleet" element={<FleetPage />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Account */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/bookings" element={<BookingsPage />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
        {/* Global floating chatbot — available on all pages */}
        <ChatWidget />
      </div>
    </BrowserRouter>
  );
}
