// src/layouts/MainLayout.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="site-main">{children}</main>
      <Footer />
    </div>
  );
}

export default MainLayout;
