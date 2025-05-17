import { ThemeProvider } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/theme-toggle";
import logoDark from "/logo-b.png";
import logoLight from "/logo-w.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ProfilePage } from "@/pages/profile-page";
import { motion, AnimatePresence } from "framer-motion";
import {
  useState,
  createContext,
  useContext,
  useEffect,
  type FormEvent,
} from "react";
import { GlobalSpinner } from "@/components/global-spinner";
import { StandaloneNip05Button } from "@/components/standalone-nip05-button";
import { Nip05MarketplacePage } from "@/pages/nip05-marketplace";
import { EcosystemDirectoryPage } from "@/pages/ecosystem-directory";
import { WalletPage } from "@/pages/wallet";
import { EcosystemItemPage } from "@/pages/ecosystem-item";
import { Compass, UserPlus } from "lucide-react";
import { NostrProvider } from "@/context/NostrContext";
import { useTheme } from "@/hooks/use-theme";
import React from "react";
import { StandaloneWalletButton } from "./components/standalone-wallet-button";
import { JoinNostrWizardPage } from "@/pages/join-nostr-wizard";
import { SearchResultsPage } from "@/pages/search-results";
import { EventPage } from "@/pages/event-page";

interface AppContextType {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

const pageVariants = {
  initial: {
    opacity: 0,
    x: "-5vw",
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: "5vw",
  },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};

function SearchPage() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const { theme, effectiveTheme } = useTheme();

  const logoToUse = React.useMemo(() => {
    if (theme === "dark") return logoLight;
    if (theme === "light") return logoDark;

    return effectiveTheme === "dark" ? logoLight : logoDark;
  }, [theme, effectiveTheme]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    if (!searchQuery.trim()) {
      return;
    }

    const query = searchQuery.trim();

    if (query.startsWith("npub1") || /^[0-9a-f]{64}$/.test(query)) {
      console.log(`Navigating to profile with identifier: ${query}`);
      setIsLoading(true);
      navigate(`/profile/${query}`);
    } else if (query.startsWith("note1") || query.startsWith("nevent1")) {
      console.log(`Navigating to event: ${query}`);
      setIsLoading(true);
      navigate(`/event/${query}`);
    } else {
      console.log(`Searching for: ${query}`);
      setIsLoading(true);
      navigate(`/search/${encodeURIComponent(query)}`);
    }
  };

  useEffect(() => {
    setIsLoading(false);
  }, [setIsLoading]);

  const handleNavigation = (path: string) => {
    setIsLoading(true);
    setTimeout(() => {
      navigate(path);
      setIsLoading(false);
    }, 500);
  };
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="flex flex-col items-center w-full max-w-xl sm:max-w-2xl md:max-w-3xl mx-auto px-4 justify-center min-h-[85vh] py-10"
    >
      <img
        src={logoToUse}
        alt="NOSTR BUZZ"
        className="h-32 sm:h-40 md:h-48 lg:h-56 w-auto mb-6 sm:mb-8 md:mb-10"
      />
      <form
        className="w-full flex flex-col space-y-3 max-w-md sm:max-w-lg md:max-w-xl mx-auto"
        onSubmit={handleSearch}
      >
        <div className="flex items-center rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background dark:focus-within:ring-offset-background_dark p-1.5 md:p-2 shadow-md">
          <div className="pl-3 pr-1 md:pl-4">
            <Search className="size-4 sm:size-5 md:size-6 text-muted-foreground" />
          </div>          <Input
            type="search"
            placeholder="Search Nostr: profiles, notes, events..."
            className="flex-grow h-9 sm:h-10 md:h-12 px-0 py-1 sm:py-2 text-sm sm:text-base md:text-lg bg-transparent dark:bg-transparent border-none focus:ring-0 focus:outline-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 placeholder:text-sm md:placeholder:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchError && (
          <div className="text-sm text-red-500 font-medium text-center mt-1 animate-pulse">
            {searchError}
          </div>
        )}{" "}
        <div className="text-xs md:text-sm text-muted-foreground text-center mt-0 mb-2 px-4">
          <span className="hidden sm:inline">
            Search for anything in Nostr: profiles, keywords, events, or enter an npub/note ID
          </span>
          <span className="sm:hidden">
            Search profiles, notes, or events
          </span>
        </div>
      </form>{" "}      <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap justify-center gap-3 w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto">
        <Button
          type="submit"
          size="default"
          onClick={handleSearch}
          className="w-full sm:w-auto md:px-6 md:text-lg"
        >
          <Search className="h-4 w-4 mr-2 flex-shrink-0" />
          Search Nostr
        </Button>
        <Button
          variant="secondary"
          size="default"
          onClick={() => handleNavigation("/ecosystem")}
          className="w-full sm:w-auto md:px-6 md:text-lg"
        >
          <Compass className="h-4 w-4 mr-2 flex-shrink-0" />
          Explore Ecosystem
        </Button>
      </div>
    </motion.div>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  return (
    <AppContext.Provider value={{ isLoading, setIsLoading }}>
      <ThemeProvider defaultTheme="system" storageKey="theme">
        <NostrProvider>
          {" "}
          {isLoading && <GlobalSpinner />}
          <div className="relative flex flex-col items-center min-h-svh p-0 sm:p-4 bg-background text-foreground overflow-x-hidden">            {/* Fixed bottom navigation for mobile, top-right for desktop */}
            <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center bg-card border-t p-2 z-50 sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                aria-label="Home"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/join-nostr")}
                aria-label="Join Nostr"
                className="text-purple-500"
              >
                <UserPlus className="h-5 w-5" />
              </Button>
              <StandaloneNip05Button />
              <StandaloneWalletButton />
              <ThemeToggle />
            </div>
            {/* Desktop navigation */}
            <div className="absolute top-4 right-4 z-50 hidden sm:flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/join-nostr")}
                className="mr-2 text-purple-500 border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-900 dark:hover:bg-purple-950"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Join Nostr
              </Button>
              <StandaloneNip05Button />
              <StandaloneWalletButton />
              <ThemeToggle />
            </div>{" "}
            <div className="w-full pb-16 sm:pb-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<SearchPage />} />
                  <Route
                    path="/search/:query"
                    element={<SearchResultsPage />}
                  />
                  <Route
                    path="/event/:identifier"
                    element={<EventPage />}
                  />
                  <Route
                    path="/profile"
                    element={
                      <motion.div
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                        className="w-full"
                      >
                        <ProfilePage />
                      </motion.div>
                    }
                  />
                  <Route
                    path="/profile/:identifier"
                    element={
                      <motion.div
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                        className="w-full"
                      >
                        <ProfilePage />
                      </motion.div>
                    }
                  />
                  <Route
                    path="/nip05-marketplace"
                    element={
                      <motion.div
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                        className="w-full"
                      >
                        <Nip05MarketplacePage />
                      </motion.div>
                    }
                  />
                  <Route
                    path="/ecosystem"
                    element={
                      <motion.div
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                        className="w-full"
                      >
                        <EcosystemDirectoryPage />
                      </motion.div>
                    }
                  />
                  <Route
                    path="/ecosystem/:categorySlug/:itemSlug"
                    element={
                      <motion.div
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                        className="w-full"
                      >
                        <EcosystemItemPage />
                      </motion.div>
                    }
                  />
                  <Route
                    path="/wallet"
                    element={
                      <motion.div
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                        className="w-full"
                      >
                        <WalletPage />
                      </motion.div>
                    }
                  />
                  <Route
                    path="/join-nostr"
                    element={
                      <motion.div
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                        className="w-full"
                      >
                        <JoinNostrWizardPage />
                      </motion.div>
                    }
                  />
                </Routes>
              </AnimatePresence>
            </div>
          </div>
        </NostrProvider>
      </ThemeProvider>
    </AppContext.Provider>
  );
}

export default App;
