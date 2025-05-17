import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Zap, Coins, ArrowRight, Bitcoin } from "lucide-react";

type PaymentMethod = 'lightning' | 'cashu' | 'ark' | 'bitcoin';

interface ZapMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export function ZapMethodSelector({
  selectedMethod,
  onChange,
  disabled = false
}: ZapMethodSelectorProps) {
  return (
    <RadioGroup
      value={selectedMethod}
      onValueChange={(value) => onChange(value as PaymentMethod)}
      className="space-y-3"
      disabled={disabled}
    >
      <div className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer ${selectedMethod === 'lightning' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <RadioGroupItem value="lightning" id="lightning" className="sr-only" />
        <Label htmlFor="lightning" className="flex flex-1 items-center cursor-pointer">
          <div className="bg-yellow-500/10 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <div className="font-medium flex items-center">
              Lightning Network
              {selectedMethod === 'lightning' && (
                <ArrowRight className="h-3 w-3 ml-2" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">Fast, low-fee payments</div>
          </div>
        </Label>
      </div>
      
      <div className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer ${selectedMethod === 'cashu' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <RadioGroupItem value="cashu" id="cashu" className="sr-only" />
        <Label htmlFor="cashu" className="flex flex-1 items-center cursor-pointer">
          <div className="bg-green-500/10 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
            <Coins className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1">
            <div className="font-medium flex items-center">
              Cashu (Ecash)
              {selectedMethod === 'cashu' && (
                <ArrowRight className="h-3 w-3 ml-2" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">Private digital cash tokens</div>
          </div>
        </Label>
      </div>
      
      <div className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer ${selectedMethod === 'ark' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <RadioGroupItem value="ark" id="ark" className="sr-only" />
        <Label htmlFor="ark" className="flex flex-1 items-center cursor-pointer">
          <div className="bg-blue-500/10 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
            <span className="text-blue-500 text-lg">🌀</span>
          </div>
          <div className="flex-1">
            <div className="font-medium flex items-center">
              Ark
              <span className="ml-2 text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full">BETA</span>
              {selectedMethod === 'ark' && (
                <ArrowRight className="h-3 w-3 ml-2" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">Next-gen Bitcoin L2</div>
          </div>
        </Label>
      </div>

      <div className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer ${selectedMethod === 'bitcoin' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <RadioGroupItem value="bitcoin" id="bitcoin" className="sr-only" />
        <Label htmlFor="bitcoin" className="flex flex-1 items-center cursor-pointer">
          <div className="bg-orange-500/10 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
            <Bitcoin className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="font-medium flex items-center">
              Bitcoin On-Chain
              <span className="ml-2 text-xs bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full">FUTURE</span>
              {selectedMethod === 'bitcoin' && (
                <ArrowRight className="h-3 w-3 ml-2" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">Standard Bitcoin transactions</div>
          </div>
        </Label>
      </div>
    </RadioGroup>
  );
}
