import { ThemeProvider } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/theme-toggle";
import viteLogo from "/logo.png"; // Import SVG as a URL
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <div className="relative flex flex-col items-center justify-center min-h-svh p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="flex flex-col items-center w-full max-w-xl">
          <img src={viteLogo} alt="Vite Logo" className="h-32 w-auto mb-8 text-sky-500 dark:text-sky-400" />

          <form className="w-full flex items-center space-x-2 rounded-full border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background dark:focus-within:ring-offset-background_dark p-1.5 shadow-md">
            <div className="pl-3 pr-1">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <Input
              type="search"
              placeholder="Search Nostr Buzz or type a command..."
              className="flex-grow h-10 px-0 py-2 text-base bg-transparent border-none focus:ring-0 focus:outline-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {/* Optional: Add a search button if needed, or rely on Enter key */}
            {/* <Button type="submit" size="icon" className="rounded-full">
              <Search className="size-5" />
            </Button> */}
          </form>
          <div className="mt-6 flex space-x-3">
            <Button variant="secondary" size="sm">Nostr Buzz Search</Button>
            <Button variant="secondary" size="sm">I'm Feeling Lucky</Button>
          </div>
        </div>

      </div>
    </ThemeProvider>
  );
}

export default App;
