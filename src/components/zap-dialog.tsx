import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, QrCode, Copy, Check, Zap } from "lucide-react";

type ZapRequest = {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  commentAllowed: number;
  nostrPubkey?: string;
  allowsNostr?: boolean;
};

type ZapDialogProps = {
  recipientPubkey: string;
  recipientNpub: string;
  lud16?: string; 
  lud06?: string; 
  eventId?: string; 
  trigger?: React.ReactNode; 
};

export function ZapDialog({ 
  recipientPubkey, 
  recipientNpub,
  lud16, 
  lud06, 
  eventId,
  trigger
}: ZapDialogProps) {
  const [amount, setAmount] = useState<number>(1000);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lightningInvoice, setLightningInvoice] = useState<string>("");
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [displayQRCode, setDisplayQRCode] = useState<boolean>(false);
  const [payRequest, setPayRequest] = useState<ZapRequest | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  
  
  console.log("ZapDialog component loaded with props:", { 
    recipientPubkey, 
    recipientNpub, 
    lud16, 
    lud06 
  });
  
  
  const zapAmounts = [
    { icon: "👍", label: "21", value: 21 },
    { icon: "❤️", label: "50", value: 50 },
    { icon: "😊", label: "100", value: 100 },
    { icon: "⭐", label: "500", value: 500 },
    { icon: "🎉", label: "1k", value: 1000 },
    { icon: "🚀", label: "5k", value: 5000 },
    { icon: "🔥", label: "10k", value: 10000 },
    { icon: "⚡", label: "100k", value: 100000 },
    { icon: "💎", label: "500k", value: 500000 },
  ];  const getLightningAddress = () => {
    console.log("Lightning Address data:", { lud16, lud06, recipientPubkey, recipientNpub });
    return lud16 || lud06 || null;
  };

  const resetState = () => {
    console.log("Resetting state in ZapDialog");
    setError(null);
    setLoading(true);
    setLightningInvoice("");
    setShowInvoice(false);
    setDisplayQRCode(false);
  };

  const getCallbackUrl = (lightningAddress: string): string | null => {
    if (lightningAddress.includes('@')) {
      const [username, domain] = lightningAddress.split('@');
      return `https://${domain}/.well-known/lnurlp/${username}`;
    } else if (lightningAddress.toLowerCase().startsWith('lnurl')) {
      
      
      console.warn("LNURL bech32 decoding not implemented");
      return null;
    }
    return null;
  };
  const fetchPayRequest = async () => {
    resetState();
    
    const lightningAddress = getLightningAddress();
    console.log("Lightning address from getLightningAddress:", lightningAddress);
    
    if (!lightningAddress) {
      console.error("No Lightning Address found!");
      setError("No Lightning Address available for this user");
      setLoading(false);
      return;
    }
    
    try {
      const callbackUrl = getCallbackUrl(lightningAddress);
      console.log("Generated callback URL:", callbackUrl);
      
      if (!callbackUrl) {
        console.error("Invalid Lightning Address format");
        setError("Invalid Lightning Address format");
        setLoading(false);
        return;
      }
      
      const response = await fetch(callbackUrl);
      if (!response.ok) throw new Error('Failed to fetch pay request');
      
      const data = await response.json();
      if (data.status === 'ERROR') {
        setError(data.reason || 'Error fetching the pay request');
        setLoading(false);
        return;
      }
      
      setPayRequest(data as ZapRequest);
      setLoading(false);    } catch (error) {
      console.error('Error fetching pay request:', error);
      setError(
        `Error: ${error instanceof Error ? error.message : 'Error connecting to the server'}.
        Lightning Address: ${lightningAddress}`
      );
      setLoading(false);
    }
  };

  const generateInvoice = async () => {
    if (!payRequest) {
      setError('Payment request not loaded');
      return;
    }
    
    setLoading(true);
    
    try {
      const callbackUrl = new URL(payRequest.callback);
      const queryParams = new URLSearchParams({
        amount: (amount * 1000).toString(), 
      });
      
      if (comment && payRequest.commentAllowed > 0) {
        queryParams.set('comment', comment);
      }
      
      if (eventId && payRequest.allowsNostr) {
        
        
        const zapRequestEvent = await createZapRequest(eventId, comment);
        queryParams.set('nostr', JSON.stringify(zapRequestEvent));
      }
      
      const response = await fetch(`${callbackUrl.origin}${callbackUrl.pathname}?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      
      const invoiceData = await response.json();
      if (invoiceData.status === 'ERROR') {
        setError(invoiceData.reason || 'Error fetching the invoice');
        setLoading(false);
        return;
      }
      
      setLightningInvoice(invoiceData.pr);
      setShowInvoice(true);
      setDisplayQRCode(true);
      setLoading(false);
    } catch (error) {
      console.error('Error generating invoice:', error);
      setError(error instanceof Error ? error.message : 'Error generating the invoice');
      setLoading(false);
    }
  };
  
  
  const createZapRequest = async (eventId: string, comment: string) => {
    
    
    return {
      kind: 9734,
      content: comment || "",
      tags: [
        ["e", eventId],
        ["p", recipientPubkey],
        ["relays", "wss://relay.damus.io", "wss://relay.primal.net"]
      ],
      pubkey: "demo-pubkey", 
      created_at: Math.floor(Date.now() / 1000),
      id: "placeholder-id",
      sig: "placeholder-sig"
    };
  };

  const handleCopyToClipboard = () => {
    if (lightningInvoice) {
      navigator.clipboard.writeText(lightningInvoice).then(() => {
        setCopiedInvoice(true);
        setTimeout(() => setCopiedInvoice(false), 2000);
      }).catch(err => {
        console.error("Failed to copy invoice: ", err);
      });
    }
  };
  
  useEffect(() => {
    console.log("Dialog open state changed:", open);
    console.log("User lightning data:", { lud16, lud06 });
    if (open && getLightningAddress()) {
      console.log("Dialog opened with valid lightning address, fetching pay request");
      fetchPayRequest();
    }
  }, [open]);

  
  useEffect(() => {
    if (!open) {
      setAmount(1000);
      setComment("");
      setError(null);
      setLightningInvoice("");
      setShowInvoice(false);
      setDisplayQRCode(false);
      setPayRequest(null);
      setCopiedInvoice(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Zap
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Send Zap</DialogTitle>
          <DialogDescription>
            Send a Lightning payment to{" "}
            {lud16 ? lud16 : (recipientNpub ? recipientNpub.substring(0, 8) + "..." : "this user")}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : showInvoice ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-md flex flex-col items-center justify-center space-y-3">
              {displayQRCode ? (
                <div className="w-48 h-48 bg-background flex items-center justify-center rounded-lg">
                  <QrCode className="h-32 w-32 text-muted-foreground" />
                  {/* In a real implementation, we would use a QR code generator here */}
                  {/* <QRCodeComponent value={lightningInvoice} size={180} /> */}
                </div>
              ) : null}
              
              <p className="text-sm font-mono break-all text-center text-muted-foreground px-2 max-h-28 overflow-auto">
                {lightningInvoice}
              </p>
              
              <Button variant="ghost" size="sm" onClick={handleCopyToClipboard}>
                {copiedInvoice ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                {copiedInvoice ? "Copied!" : "Copy Invoice"}
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Open your Lightning wallet and scan the QR code or paste the invoice to pay.
            </p>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <div>
            {/* Quick amount selection */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {zapAmounts.map((btn) => (
                <Button
                  key={btn.value}
                  variant={amount === btn.value ? "default" : "outline"}
                  className="h-auto py-2"
                  onClick={() => setAmount(btn.value)}
                >
                  <span className="mr-1">{btn.icon}</span>
                  <span>{btn.label}</span>
                </Button>
              ))}
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (sats)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={payRequest ? payRequest.minSendable / 1000 : 1}
                  max={payRequest ? payRequest.maxSendable / 1000 : 500000}
                />
                {payRequest && (
                  <p className="text-xs text-muted-foreground">
                    Min: {payRequest.minSendable / 1000} sats, Max: {payRequest.maxSendable / 1000} sats
                  </p>
                )}
              </div>
              
              {payRequest?.commentAllowed ? (
                <div className="space-y-2">
                  <Label htmlFor="comment">Comment (Optional)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Add a message with your zap"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={payRequest.commentAllowed}
                  />
                  <p className="text-xs text-muted-foreground">
                    {comment.length}/{payRequest.commentAllowed} characters
                  </p>
                </div>
              ) : null}
            </div>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={generateInvoice}>
                Generate Invoice
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
