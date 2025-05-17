import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { useAppContext } from "@/App";

export function StandaloneZapGatewayButton() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();
  
  const handleClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/zap-gateway');
      setIsLoading(false);
    }, 300);
  };

  return (
    <Button variant="outline" size="icon" onClick={handleClick} title="Buzz Zap Gateway">
      <Zap className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
