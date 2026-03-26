import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,#172634_0,#05090d_55%,#020306_100%)] text-text-main font-sans">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 pb-12 min-h-screen">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
