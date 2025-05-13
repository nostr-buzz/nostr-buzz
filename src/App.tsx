import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/theme-toggle";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <div className="relative flex flex-col items-center justify-center min-h-svh">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Button>Click me</Button>
      </div>
    </ThemeProvider>
  );
}

export default App;
