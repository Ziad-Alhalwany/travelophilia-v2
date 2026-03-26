import { Link } from "react-router-dom";
import { User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-6 flex-wrap sm:flex-nowrap">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-text-main shrink-0">
          <span className="text-2xl">🌍</span>
          <div className="flex flex-col leading-[1.1]">
            <span className="font-semibold text-[1.05rem]">Travelophilia</span>
            <span className="text-xs text-text-muted">Premium Journeys</span>
          </div>
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-5 ml-0 sm:ml-6 text-sm flex-1 order-3 sm:order-none w-full sm:w-auto mt-2 sm:mt-0">
          <Link
            to="/choose-your-trip"
            className="relative text-text-muted py-1 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-accent-strong after:rounded-full after:transition-all hover:text-accent-strong hover:after:w-full"
          >
            Destinations
          </Link>
          <Link
            to="/customize-your-trip"
            className="relative text-text-muted py-1 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-accent-strong after:rounded-full after:transition-all hover:text-accent-strong hover:after:w-full"
          >
            Customize Trip
          </Link>
          <Link
            to="/about"
            className="relative text-text-muted py-1 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-accent-strong after:rounded-full after:transition-all hover:text-accent-strong hover:after:w-full"
          >
            About
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5 ml-auto">
          <Button variant="outline" asChild className="rounded-full border-border/60 bg-background/60 text-foreground text-xs px-3 py-1.5 h-auto hover:border-primary/60 hover:bg-background/80 hover:-translate-y-[1px] transition-all">
            <Link to="/login" className="inline-flex items-center gap-1.5">
              <User size={14} />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          </Button>
          
          <Button className="rounded-full bg-gradient-to-br from-[#00d8c0] to-[#00a5ff] text-[#050711] font-semibold text-xs px-4 py-1.5 shadow-[0_10px_25px_rgba(0,168,255,0.35)] transition-all hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,168,255,0.5)] border-none h-auto">
            Book Now
          </Button>
          
          {/* Mobile Menu Toggle (Visual only for MVP) */}
          <Button variant="ghost" size="icon" className="sm:hidden text-text-muted hover:text-white ml-1 h-8 w-8">
             <Menu size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
}
