import { ThemeProvider } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/theme-toggle";
import viteLogo from "/logo.png"; // Import SVG as a URL
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ProfilePage } from "@/components/profile-page";
import { motion, AnimatePresence } from "framer-motion";
import { useState, createContext, useContext, useEffect } from "react";
import { GlobalSpinner } from "@/components/global-spinner";
import { Nip05MarketplaceButton } from "@/components/nip05-marketplace-button"; // Import the new component
import { Nip05MarketplacePage } from "@/components/nip05-marketplace-page"; // Import the new page
import { EcosystemDirectoryPage } from "@/components/ecosystem-directory-page"; // Import Ecosystem page
import { WalletPage } from "@/components/wallet-page"; // Import Wallet page
import { EcosystemItemPage } from "@/components/ecosystem-item-page"; // Import Ecosystem Item page
import { Compass, Wallet as WalletIcon } from "lucide-react"; // Import icons for buttons

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

  const handleNavigation = (path: string) => {
    setIsLoading(true);
    setTimeout(() => {
      navigate(path);
    }, 500); // Adjust delay as needed
  };

  useEffect(() => {
    setIsLoading(false);
  }, [setIsLoading]);

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="flex flex-col items-center w-full max-w-xl"
    >
      <img
        src={viteLogo}
        alt="Vite Logo"
        className="h-32 w-auto mb-8 text-sky-500 dark:text-sky-400"
      />

      <form
        className="w-full flex items-center space-x-2 rounded-full border border-input bg-card focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background dark:focus-within:ring-offset-background_dark p-1.5 shadow-md"
        onSubmit={(e) => {
          e.preventDefault();
          handleNavigation("/profile"); // Default search action
        }}
      >
        <div className="pl-3 pr-1">
          <Search className="size-5 text-muted-foreground" />
        </div>
        <Input
          type="search"
          placeholder="Search Nostr Buzz or type a command..."
          className="flex-grow h-10 px-0 py-2 text-base bg-transparent dark:bg-zinc-900 border-none focus:ring-0 focus:outline-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </form>
      <div className="mt-6 flex flex-wrap justify-center gap-3"> {/* Changed to flex-wrap and gap */}
        <Button size="sm" onClick={() => handleNavigation("/profile")}>
          Nostr Buzz Search
        </Button>
        <Button variant="secondary" size="sm">
          I'm Feeling Lucky
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleNavigation("/ecosystem")}>
          <Compass className="h-4 w-4 mr-2" />
          Ecosystem
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleNavigation("/wallet")}>
          <WalletIcon className="h-4 w-4 mr-2" />
          Wallet
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
        {isLoading && <GlobalSpinner />}
        <div className="relative flex flex-col items-center justify-center min-h-svh p-4 bg-background text-foreground overflow-x-hidden">
          {/* Container for top-right buttons */}
          <div className="absolute top-4 right-4 z-50 flex items-center space-x-2">
            <Nip05MarketplaceButton /> {/* Add the new button here */}
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
                path="/ecosystem/:categorySlug/:itemSlug" // New dynamic route
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
              {/* Example for dynamic profile: <Route path="/profile/:npub" element={<ProfilePage />} /> */}
            </Routes>
          </AnimatePresence>
        </div>
      </ThemeProvider>
    </AppContext.Provider>
  );
}

export default App;
