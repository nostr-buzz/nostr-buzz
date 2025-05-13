import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { useAppContext } from "@/App"; // Import useAppContext

export function Nip05MarketplaceButton() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();

  const handleClick = () => {
    setIsLoading(true);
    // Simulate API call delay before navigation
    setTimeout(() => {
      navigate("/nip05-marketplace");
      // setIsLoading will be set to false in Nip05MarketplacePage's useEffect
    }, 300); // Adjust delay as needed, shorter for internal nav
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick} // Updated onClick handler
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      NIP-05 Marketplace
    </Button>
  );
}
