import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  ArrowLeft, Wallet, Send, Download, History, Bitcoin, QrCode, ScanLine, Copy, Check, ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAppContext } from "@/App";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Html5Qrcode } from "html5-qrcode";
import { Html5QrcodeScannerState, type Html5QrcodeResult } from "html5-qrcode";


const dummyTransactions = [
  { id: "1", type: "received", amount: 50000, currency: "sats", date: "2023-10-26", description: "From @user123", status: "confirmed" },
  { id: "2", type: "sent", amount: 25000, currency: "sats", date: "2023-10-25", description: "To @shopxyz", status: "confirmed" },
  { id: "3", type: "received", amount: 100000, currency: "sats", date: "2023-10-24", description: "Zap from post", status: "pending" },
];


const DUMMY_LN_ADDRESS = "nostrbuzz@getalby.com";
const DUMMY_BTC_ADDRESS = "bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

export function WalletPage() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();
  const [receiveAddressType, setReceiveAddressType] = useState<"lightning" | "bitcoin">("lightning");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const html5QrCodeInstance = useRef<Html5Qrcode | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scannerMessage, setScannerMessage] = useState<string>("Initializing scanner...");
  const [sendRecipient, setSendRecipient] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [setIsLoading]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  const currentReceiveAddress = receiveAddressType === "lightning" ? DUMMY_LN_ADDRESS : DUMMY_BTC_ADDRESS;

  const qrReaderElementId = "qr-reader";

  const startScanner = async () => {
    if (html5QrCodeInstance.current) {
      try {
        if (html5QrCodeInstance.current.getState() === Html5QrcodeScannerState.SCANNING || 
            html5QrCodeInstance.current.getState() === Html5QrcodeScannerState.PAUSED) {
          await html5QrCodeInstance.current.stop();
        }
        await html5QrCodeInstance.current.clear();
      } catch (error) {
        console.warn("Error stopping/clearing previous scanner instance:", error);
      }
      html5QrCodeInstance.current = null;
    }
  
    setScannerMessage("Initializing camera...");
    const newHtml5QrCode = new Html5Qrcode(qrReaderElementId, false);
    html5QrCodeInstance.current = newHtml5QrCode;

    const qrCodeSuccessCallback = (decodedText: string, decodedResult: Html5QrcodeResult) => {
      console.log(`QR Code detected: ${decodedText}`, decodedResult);
      setScannedData(decodedText);
      setSendRecipient(decodedText);
      setIsScannerOpen(false);
      alert(`Scanned: ${decodedText}\nRecipient field in Send dialog has been populated.`);
    };

    const qrCodeErrorCallback = (errorMessage: string, error: any) => {
      if (error) {
        if (errorMessage.includes("Cannot start camera")) {
          setScannerMessage("Error: Cannot start camera. Check permissions.");
        } else if (errorMessage.includes("Camera not found")) {
          setScannerMessage("Error: Camera not found.");
        }
      }
    };

    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      aspectRatio: 1.0
    };

    try {
      await newHtml5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );
      setScannerMessage("Scanning... Point camera at a QR code.");
    } catch (err: any) {
      console.error("Error starting QR scanner:", err);
      setScannerMessage(`Error: ${err.message || "Failed to start scanner."}`);
      if (html5QrCodeInstance.current) {
        try {
          await html5QrCodeInstance.current.clear();
        } catch (clearError) {
          console.warn("Error clearing scanner UI after start failure:", clearError);
        }
        html5QrCodeInstance.current = null;
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeInstance.current) {
      const scannerState = html5QrCodeInstance.current.getState();
      if (scannerState === Html5QrcodeScannerState.SCANNING || scannerState === Html5QrcodeScannerState.PAUSED) {
        try {
          setScannerMessage("Stopping scanner...");
          await html5QrCodeInstance.current.stop();
          console.log("QR Scanner stopped.");
          setScannerMessage("Scanner stopped.");
        } catch (err) {
          console.error("Error stopping QR scanner:", err);
          setScannerMessage("Error stopping scanner.");
        }
      }
      try {
        await html5QrCodeInstance.current.clear();
      } catch(clearError) {
        console.warn("Error clearing scanner UI elements:", clearError);
      }
      html5QrCodeInstance.current = null;
    }
  };
  

  useEffect(() => {
    let startTimeoutId: NodeJS.Timeout;
    if (isScannerOpen) {
      startTimeoutId = setTimeout(() => {
        startScanner();
      }, 100); 
    } else {
      stopScanner();
    }
    return () => {
      clearTimeout(startTimeoutId);
      stopScanner();
    };
  }, [isScannerOpen]);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6 bg-background text-foreground flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="outline"
          size="default"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => navigate(-1), 300);
          }}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-center flex items-center">
          <Wallet className="h-8 w-8 mr-3 text-primary" />
          Nostr Buzz Wallet
        </h1>
        <div className="w-24 hidden md:block"></div>
      </div>

      <Card className="mb-6 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bitcoin className="h-6 w-6 mr-2 text-yellow-500" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">1,234,567 <span className="text-2xl text-muted-foreground">sats</span></p>
          <p className="text-sm text-muted-foreground">~ $500.00 USD (approx.)</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" variant="default" className="w-full">
              <Send className="h-5 w-5 mr-2" /> Send
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <DialogTitle>Send Funds</DialogTitle>
              <DialogDescription>
                Enter recipient details and amount. Supports Lightning Addresses, LNURL, and on-chain Bitcoin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address / LNURL</Label>
                <Input 
                  id="recipient" 
                  placeholder="username@domain.com or lnurl..." 
                  value={sendRecipient} 
                  onChange={(e) => setSendRecipient(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (sats)</Label>
                <Input id="amount" type="number" placeholder="e.g., 1000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memo">Memo (Optional)</Label>
                <Textarea id="memo" placeholder="e.g., For coffee" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {}}>Cancel</Button>
              <Button type="submit" onClick={() => alert("Send action placeholder: Connect to WebLN or backend.")}>
                Confirm & Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" variant="outline" className="w-full">
              <Download className="h-5 w-5 mr-2" /> Receive
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <DialogTitle>Receive Funds</DialogTitle>
              <DialogDescription>
                Share your address or QR code to receive payments.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex space-x-2 mb-4">
                <Button 
                  variant={receiveAddressType === "lightning" ? "default" : "outline"}
                  onClick={() => setReceiveAddressType("lightning")}
                  className="flex-1"
                >
                  Lightning
                </Button>
                <Button 
                  variant={receiveAddressType === "bitcoin" ? "default" : "outline"}
                  onClick={() => setReceiveAddressType("bitcoin")}
                  className="flex-1"
                >
                  Bitcoin (On-chain)
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-md flex flex-col items-center justify-center space-y-3">
                <div className="w-48 h-48 bg-background flex items-center justify-center rounded-lg">
                  <QrCode className="h-32 w-32 text-muted-foreground" />
                </div>
                <p className="text-sm font-mono break-all text-center text-muted-foreground px-2">
                  {currentReceiveAddress}
                </p>
                <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(currentReceiveAddress)}>
                  {copiedAddress === currentReceiveAddress ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copiedAddress === currentReceiveAddress ? "Copied!" : "Copy Address"}
                </Button>
              </div>
               {receiveAddressType === 'bitcoin' && (
                 <p className="text-xs text-muted-foreground text-center">
                    Note: On-chain Bitcoin transactions may incur higher fees and take longer to confirm.
                 </p>
               )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {}}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isScannerOpen} onOpenChange={(open) => {
          setIsScannerOpen(open);
          if (!open) {
            stopScanner();
          }
        }}>
          <DialogTrigger asChild>
            <Button size="lg" variant="outline" className="w-full" onClick={() => {
                setScannedData(null);
                setScannerMessage("Initializing scanner...");
            }}>
              <ScanLine className="h-5 w-5 mr-2" /> Scan QR
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Point your camera at a QR code.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 flex flex-col items-center">
              <div 
                id={qrReaderElementId} 
                className="w-full md:w-[300px] h-auto md:h-[300px] mb-4 bg-muted rounded-md overflow-hidden"
              >
              </div>
              <p className="text-sm text-muted-foreground min-h-[20px] text-center">
                {scannerMessage}
              </p>
              {scannedData && (
                <p className="text-xs text-green-500 mt-1">Last Scanned: {scannedData.substring(0,30)}...</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScannerOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dummyTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description/To/From</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <span className={`capitalize px-2 py-1 text-xs rounded-full ${
                        tx.type === 'sent' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                      }`}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {tx.amount.toLocaleString()} {tx.currency}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={`capitalize px-2 py-1 text-xs rounded-full ${
                        tx.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {tx.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No transactions yet.</p>
          )}
        </CardContent>
        {dummyTransactions.length > 0 && (
          <CardFooter className="justify-center">
            <Button variant="link" size="sm">View all transactions <ExternalLink className="h-3 w-3 ml-1" /></Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
