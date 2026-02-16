import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Home } from "@/pages/Home";
import { Leaderboard } from "@/pages/Leaderboard";
import { Graveyard } from "@/pages/Graveyard";
import { About } from "@/pages/About";
import { NotFound } from "@/pages/NotFound";

function Nav() {
  return (
    <nav className="border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
        <Link to="/" className="font-mono text-terminal font-bold text-lg">
          lncurl.lol
        </Link>
        <div className="flex gap-4 font-mono text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <Link
            to="/leaderboard"
            className="hover:text-foreground transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            to="/graveyard"
            className="hover:text-foreground transition-colors"
          >
            Graveyard
          </Link>
          <Link
            to="/about"
            className="hover:text-foreground transition-colors"
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border mt-12 py-6 text-center text-sm text-muted-foreground">
      Powered by{" "}
      <a
        href="https://getalby.com/alby-hub"
        target="_blank"
        rel="noopener noreferrer"
        className="text-terminal hover:underline"
      >
        Alby Hub
      </a>{" "}
      +{" "}
      <a
        href="https://nwc.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="text-terminal hover:underline"
      >
        Nostr Wallet Connect
      </a>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/graveyard" element={<Graveyard />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </TooltipProvider>
    </BrowserRouter>
  );
}
