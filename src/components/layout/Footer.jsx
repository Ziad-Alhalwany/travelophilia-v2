import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🌍</span>
              <span className="font-semibold text-base text-foreground">Travelophilia</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px]">
              Curated premium journeys for the modern explorer. We bring the world closer, with elegance.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground text-sm hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/choose-your-trip" className="text-muted-foreground text-sm hover:text-primary transition-colors">
                  Browse Trips
                </Link>
              </li>
              <li>
                <Link to="/customize-your-trip" className="text-muted-foreground text-sm hover:text-primary transition-colors">
                  Customize Trip
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Connect</h4>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              hello@travelophilia.com<br />
              +20 103 062 4545
            </p>
            <div className="flex gap-2">
              <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center bg-background border border-border text-muted-foreground text-xs hover:border-primary hover:text-primary transition-all">
                TW
              </a>
              <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center bg-background border border-border text-muted-foreground text-xs hover:border-primary hover:text-primary transition-all">
                IG
              </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Travelophilia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
