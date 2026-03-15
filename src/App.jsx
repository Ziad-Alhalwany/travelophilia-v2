import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import TripDetails from "./pages/TripDetails";
import ChooseYourTripPage from "./pages/ChooseYourTripPage";
import CustomizeYourTripPage from "./pages/CustomizeYourTripPage";
import TripReservationPage from "./pages/TripReservationPage";
import AfterSubmitPage from "./pages/AfterSubmitPage";
import { AppLayout } from "./components/layout/AppLayout";
import "./styles.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/destinations/:slug" element={<TripDetails />} />
          <Route path="/trips/:slug" element={<TripDetails />} />
          <Route path="/choose-your-trip" element={<ChooseYourTripPage />} />
          <Route path="/customize-your-trip" element={<CustomizeYourTripPage />} />
          <Route path="/reserve/:slug" element={<TripReservationPage />} />
          <Route path="/after-submit" element={<AfterSubmitPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
