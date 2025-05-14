import { ThemeProvider } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/theme-toggle";
import logoDark from "/logo-b.png"; // Import dark theme logo
import logoLight from "/logo-w.png"; // Import light theme logo
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ProfilePage } from "@/components/profile-page";
import { motion, AnimatePresence } from "framer-motion";
import { useState, createContext, useContext, useEffect, type FormEvent } from "react";
import { GlobalSpinner } from "@/components/global-spinner";
import { StandaloneNip05Button } from "@/components/standalone-nip05-button"; // Import the standalone button
import { Nip05MarketplacePage } from "@/components/nip05-marketplace-page"; // Import the new page
import { EcosystemDirectoryPage } from "@/components/ecosystem-directory-page"; // Import Ecosystem page
import { WalletPage } from "@/components/wallet-page"; // Import Wallet page
import { EcosystemItemPage } from "@/components/ecosystem-item-page"; // Import Ecosystem Item page
import { Compass, Wallet as WalletIcon } from "lucide-react"; // Import icons for buttons
import { NostrProvider } from "@/context/NostrContext"; // Import NostrProvider
import { useTheme } from "@/hooks/use-theme";
import React from "react";
import { StandaloneWalletButton } from "./components/standalone-wallet-button";

// Create a context for loading state
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
    x: "-5vw", // Slide in from left
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: "5vw", // Slide out to right
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
  const { theme, effectiveTheme } = useTheme(); // Replace resolvedTheme with effectiveTheme
  
  // Determine which logo to use based on theme and system preference
  const logoToUse = React.useMemo(() => {
    // If theme is explicitly set to dark or light, use that
    if (theme === "dark") return logoLight;
    if (theme === "light") return logoDark;
    
    // If theme is system, use the effective theme
    return effectiveTheme === "dark" ? logoLight : logoDark;
  }, [theme, effectiveTheme]); // Update dependency array

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    // Check if input is provided
    if (!searchQuery.trim()) {
      return;
    }

    const query = searchQuery.trim();
    
    // Validate if input is npub or hex key
    if (query.startsWith("npub1") || /^[0-9a-f]{64}$/.test(query)) {
      console.log(`Navigating to profile with identifier: ${query}`);
      setIsLoading(true);
      navigate(`/profile/${query}`);
    } else {
      // Show error message for invalid format
      setSearchError("Please enter a valid Nostr public key (npub) or hex key");
      setTimeout(() => setSearchError(null), 4000); // Clear error after 4 seconds
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
      className="flex flex-col items-center w-full max-w-xl"
    >
      {/* Theme-aware logo using the determined logo */}
      <img
        src={logoToUse}
        alt="NOSTR BUZZ"
        className="h-32 w-auto mb-8"
      />

      <form
        className="w-full flex flex-col space-y-2"
        onSubmit={handleSearch}
      >
        <div className="flex items-center space-x-2 rounded-full border border-input bg-card focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background dark:focus-within:ring-offset-background_dark p-1.5 shadow-md">
          <div className="pl-3 pr-1">
            <Search className="size-5 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="Enter a Nostr npub or hex key..."
            className="flex-grow h-10 px-0 py-2 text-base bg-transparent dark:bg-zinc-900 border-none focus:ring-0 focus:outline-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Error message */}
        {searchError && (
          <div className="text-sm text-red-500 font-medium text-center mt-1">
            {searchError}
          </div>
        )}

        {/* Example text */}
        <div className="text-xs text-muted-foreground text-center">
          Example: npub1z13g38a6qypp6py2z07shggg45cu8qex992xpss7d8zr128mu52s4cjajh
        </div>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="submit" size="sm" onClick={handleSearch}>
          Search Nostr Profile
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleNavigation("/ecosystem")}>
          <Compass className="h-4 w-4 mr-2" />
          Ecosystem
        </Button>

      </div>
    </motion.div>
  );
}

function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AppContext.Provider value={{ isLoading, setIsLoading }}>
      <ThemeProvider defaultTheme="system" storageKey="theme">
        <NostrProvider>
          {isLoading && <GlobalSpinner />}
          <div className="relative flex flex-col items-center justify-center min-h-svh p-4 bg-background text-foreground overflow-x-hidden">
            {/* Container for top-right buttons */}
            <div className="absolute top-4 right-4 z-50 flex items-center space-x-2">
              <StandaloneNip05Button /> 
              <StandaloneWalletButton /> 
              <ThemeToggle />
            </div>

            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<SearchPage />} />
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
              </Routes>
            </AnimatePresence>
          </div>
        </NostrProvider>
      </ThemeProvider>
    </AppContext.Provider>
  );
}

export default App;
