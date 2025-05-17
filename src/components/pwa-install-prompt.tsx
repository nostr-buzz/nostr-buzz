import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Check if the app is already installed or in standalone mode
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosInstalled = 
      (window.navigator as any).standalone || // For iOS
      window.matchMedia('(display-mode: standalone)').matches; // For Android/others
      
    setIsInstalled(isStandalone || isIosInstalled);
    
    // Listen for install state changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      // Only show the prompt if the app is not already installed
      // and user hasn't seen it recently
      const lastPrompt = localStorage.getItem('pwa-prompt-last-shown');
      const now = new Date().getTime();
      
      if (!isInstalled && (!lastPrompt || now - parseInt(lastPrompt, 10) > 7 * 24 * 60 * 60 * 1000)) {
        setTimeout(() => {
          setShowPrompt(true);
          localStorage.setItem('pwa-prompt-last-shown', now.toString());
        }, 3000); // Show after 3 seconds
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isInstalled]);

  // Listen for app installed event
  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    try {
      // Show the install prompt
      await installPrompt.prompt();
      
      // Wait for the user's choice
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // The prompt can only be used once, so we need to clear it
      setInstallPrompt(null);
    } catch (err) {
      console.error('Error installing the app:', err);
    }
    
    // Hide the prompt regardless of the outcome
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    // Store the dismissal in localStorage to not show again for a period
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    localStorage.setItem('pwa-prompt-dismissed-time', new Date().getTime().toString());
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-96 z-50">
      <Card className="shadow-lg border-primary/10 bg-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Install Nostr Buzz</h3>
                <p className="text-sm text-muted-foreground">Add to home screen for better experience</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={dismissPrompt}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <div className="mt-3 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={dismissPrompt}>
              Not now
            </Button>
            <Button variant="default" size="sm" onClick={handleInstall}>
              <Download className="h-4 w-4 mr-1" />
              Install App
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PwaInstallPrompt;
