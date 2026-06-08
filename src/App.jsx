import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import TripDetails from "./pages/TripDetails";
import ChooseYourTripPage from "./pages/ChooseYourTripPage";
import CustomizeYourTripPage from "./pages/CustomizeYourTripPage";
import TripReservationPage from "./pages/TripReservationPage";
import AfterSubmitPage from "./pages/AfterSubmitPage";
import CRMLoginPage from "./pages/CRMLoginPage";
import CRMLeadsPage from "./pages/CRMLeadsPage";

// TP-OTA-FE-EXTRANET-003: B2B Extranet routes (Sprint 2 - Ticket 3)
import InventoryDashboard from "./pages/partners/InventoryDashboard";
import MarkupRulesManager from "./pages/admin/MarkupRulesManager";

import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer"; 

// TP-OTA-UI-BIND-006A: Global error toast pipeline
import { Toaster, toast } from "react-hot-toast";
import { setGlobalErrorHandler } from "./services/apiClient";

import "./styles.css";

// TP-OTA-UI-BIND-006A: Register the centralized network error handler
// at module scope (outside React tree) — single registration, zero re-render risk.
// Styling mirrors Travelophilia dark premium tokens:
//   --bg-card: #101b23 | --text-main: #f5f7fa | --border-subtle: rgba(255,255,255,0.08)
setGlobalErrorHandler((message) => {
  toast.error(message, {
    style: {
      background: '#101b23',
      color: '#f5f7fa',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    },
  });
});

function App() {
  return (
// السطر ده شيلنا منه كلمة "dark"
<div className="min-h-screen flex flex-col bg-background text-foreground">
  <Navbar />
  
  {/* السطر ده غيرنا max-w-7xl لـ max-w-[85%] عشان نوسع الموقع */}
  <main className="flex-1 w-full max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
    <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/destinations/:slug" element={<TripDetails />} />
          <Route path="/trips/:slug" element={<TripDetails />} />
          <Route path="/choose-your-trip" element={<ChooseYourTripPage />} />
          <Route path="/customize-your-trip" element={<CustomizeYourTripPage />} />
          <Route path="/reserve/:slug" element={<TripReservationPage />} />
          <Route path="/after-submit" element={<AfterSubmitPage />} />
          
          {/* حلينا مشكلة الـ CRM: لو حد كتب /crm هيتحول أوتوماتيك لـ /crm/leads */}
          <Route path="/crm" element={<Navigate to="/crm/leads" replace />} />
          <Route path="/crm/login" element={<CRMLoginPage />} />
          <Route path="/crm/leads" element={<CRMLeadsPage />} />

          {/* TP-OTA-FE-EXTRANET-003: B2B Extranet routes */}
          <Route path="/partners/inventory" element={<InventoryDashboard />} />
          <Route path="/admin/markup-rules" element={<MarkupRulesManager />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      <Footer />

      {/* TP-OTA-UI-BIND-006A: Global toast notification container */}
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}

export default App;