import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

export function StandaloneNip05Button() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/nip05-marketplace');
  };

  return (
    <Button variant="outline" size="icon" onClick={handleClick}>
      <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
