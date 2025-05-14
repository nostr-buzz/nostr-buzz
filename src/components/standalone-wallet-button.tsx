import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";

export function StandaloneWalletButton() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/wallet');
  };

  return (
    <Button variant="outline" size="icon" onClick={handleClick}>
      <Wallet className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
