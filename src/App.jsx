import React from "react";
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

// Pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import SupportTeamPage from "./pages/SupportTeamPage";
import WorkWithUsPage from "./pages/WorkWithUsPage";
import CollaborateWithUsPage from "./pages/CollaborateWithUsPage";
import BeOneOfUsPage from "./pages/BeOneOfUsPage";
import BeAmbassadorPage from "./pages/BeAmbassadorPage";
import TicketFlightPage from "./pages/TicketFlightPage";
import ChooseYourTripPage from "./pages/ChooseYourTripPage";
import CustomizeYourTripPage from "./pages/CustomizeYourTripPage";
import TransportationPage from "./pages/TransportationPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import VisaPage from "./pages/VisaPage";
import DestinationPage from "./pages/DestinationPage";

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/support-team" element={<SupportTeamPage />} />
        <Route path="/work-with-us" element={<WorkWithUsPage />} />
        <Route path="/collaborate-with-us" element={<CollaborateWithUsPage />} />
        <Route path="/be-one-of-us" element={<BeOneOfUsPage />} />
        <Route path="/be-ambassador" element={<BeAmbassadorPage />} />
        <Route path="/ticket-flight" element={<TicketFlightPage />} />
        <Route path="/choose-your-trip" element={<ChooseYourTripPage />} />
        <Route path="/customize-your-trip" element={<CustomizeYourTripPage />} />
        <Route path="/transportation" element={<TransportationPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/visa" element={<VisaPage />} />
        <Route path="/destinations/:slug" element={<DestinationPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
