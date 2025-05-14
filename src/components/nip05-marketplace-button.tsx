import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useAppContext } from "@/App";

export function Nip05MarketplaceButton() {
  const navigate = useNavigate();
  
  // Conditionally use context with try-catch to prevent errors
  let setIsLoading: React.Dispatch<React.SetStateAction<boolean>> | undefined;
  try {
    const context = useAppContext();
    setIsLoading = context.setIsLoading;
  } catch (error) {
    // Context not available, handle gracefully
    console.log("AppContext not available yet");
  }

  const handleClick = () => {
    // Only use setIsLoading if it's available
    if (setIsLoading) {
      setIsLoading(true);
    }
    
    setTimeout(() => {
      navigate('/nip05-marketplace');
      if (setIsLoading) {
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <Button variant="outline" size="icon" onClick={handleClick}>
      <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
