import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  ArrowLeft, Wallet, Send, Download, History, Bitcoin, QrCode, ScanLine, Copy, Check, ExternalLink,
  Zap as ZapIcon, AlertCircle, Loader2, Camera, CameraOff, RefreshCw
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
import { ZapMethodSelector } from "@/components/zap-method-selector";


const dummyTransactions = [
  { id: "1", type: "received", amount: 50000, currency: "sats", date: "2023-10-26", description: "From @user123", status: "confirmed" },
  { id: "2", type: "sent", amount: 25000, currency: "sats", date: "2023-10-25", description: "To @shopxyz", status: "confirmed" },
  { id: "3", type: "received", amount: 100000, currency: "sats", date: "2023-10-24", description: "Zap from post", status: "pending" },
];

type PaymentMethod = 'lightning' | 'cashu' | 'ark' | 'bitcoin';

const DUMMY_LN_ADDRESS = "admin@nostr.buzz";
const DUMMY_BTC_ADDRESS = "bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

export function WalletPage() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("lightning");
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string>("");
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannerInitializing, setScannerInitializing] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement | null>(null);
  const [sendAddress, setSendAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendNote, setSendNote] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("lightning");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{id: string, label: string}>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [setIsLoading]);
  // Enhanced QR scanner initialization
  useEffect(() => {
    if (!isScannerOpen) return;
    
    const initializeCameraList = async () => {
      try {
        setScannerInitializing(true);
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setAvailableCameras(devices);
          setSelectedCamera(devices[0].id);
        } else {
          setScannerError("No camera devices found");
        }
      } catch (err) {
        console.error("Error getting cameras:", err);
        setScannerError(`Error accessing cameras: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setScannerInitializing(false);
      }
    };

    initializeCameraList();
    
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, [isScannerOpen]);
  
  // Separate effect for starting the scanner with selected camera
  useEffect(() => {
    if (!showScanner || !scannerContainerRef.current || !selectedCamera) return;
    
    setScanResult("");
    setScannerError(null);
    setScannerInitializing(true);
    
    const containerId = "qr-scanner-container";
    const containerElement = scannerContainerRef.current;
    containerElement.innerHTML = '';  // Clear previous scanner elements
    containerElement.id = containerId;
    
    const initializeScanner = async () => {
      try {
        // Stop any existing scanner
        if (html5QrCodeRef.current?.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        
        html5QrCodeRef.current = new Html5Qrcode(containerId);
        
        await html5QrCodeRef.current.start(
          selectedCamera,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            setScanResult(decodedText);
            // Add a vibration feedback if supported
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }
            console.log("QR Code detected:", decodedText);
          },
          (errorMessage) => {
            // Silent error handling for frame errors
            console.debug("QR scan frame error:", errorMessage);
          }
        );
        setScannerInitializing(false);
      } catch (err) {
        console.error("Error initializing QR scanner:", err);
        setScannerError(`Camera access error: ${err instanceof Error ? err.message : String(err)}`);
        setScannerInitializing(false);
      }
    };

    initializeScanner();
    
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop QR scanner:", err));
      }
    };
  }, [showScanner, selectedCamera]);

  // Handle camera switching
  const handleCameraChange = async (cameraId: string) => {
    if (html5QrCodeRef.current?.isScanning) {
      await html5QrCodeRef.current.stop().catch(console.error);
    }
    setSelectedCamera(cameraId);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  // Enhanced retry scanner function
  const handleRetryScanner = async () => {
    setScannerError(null);
    setScannerInitializing(true);
    
    if (html5QrCodeRef.current?.isScanning) {
      await html5QrCodeRef.current.stop().catch(console.error);
    }
    
    // Re-initialize the camera list
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setAvailableCameras(devices);
        setSelectedCamera(devices[0].id);
      } else {
        setTimeout(() => {
          setScannerError("No cameras found. Please ensure camera access is enabled.");
          setScannerInitializing(false);
        }, 500);
      }
    } catch (err) {
      console.error("Error on camera retry:", err);
      setScannerError(`Camera access error: ${err instanceof Error ? err.message : String(err)}`);
      setScannerInitializing(false);
    }
  };

  const handleZap = () => {
    if (!sendAddress || !sendAmount) {
      alert("Please enter recipient address and amount");
      return;
    }

    setPaymentProcessing(true);
    
    // Extract pubkey from recipient address if it's a nostr address
    // This is a simplification - in a real app you'd need proper nostr address parsing
    let pubkey = sendAddress;
    if (sendAddress.includes('@')) {
      // For demo purposes, we'll use a dummy pubkey
      pubkey = "npub1tapj48eekk8lzvhupfxg4ugdgthaj97cqahk3wml97g76l20dfqspmpjyp";
    }
    
    // Navigate to zap handler with the appropriate parameters
    const zapUrl = `/zap/${pubkey}?amount=${sendAmount}&method=${selectedPaymentMethod}&comment=${encodeURIComponent(sendNote)}`;
    navigate(zapUrl);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 bg-background text-foreground flex flex-col">
      <header className="mb-6 sm:mt-6 lg:mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-10 w-10"
            onClick={() => {
              setIsLoading(true);
              navigate(-1);
            }}
            aria-label="Go back"
            title="Go back to previous page"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="hidden sm:block">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsLoading(true);
                navigate('/');
              }}
            >
              Home
            </Button>
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-center flex items-center justify-center mt-4 mb-2">
          <Wallet className="h-7 w-7 md:h-8 md:w-8 mr-2 md:mr-3 text-primary flex-shrink-0" />
          <span>Lightning Wallet</span>
        </h1>
      </header>

      {/* Rest of existing content */}
      <div className="flex flex-col flex-1 w-full gap-4">
        <Card className="mb-6 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-xl">
              <Bitcoin className="h-6 w-6 mr-2 text-yellow-500 flex-shrink-0" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl md:text-4xl font-bold break-words">1,234,567 <span className="text-xl md:text-2xl text-muted-foreground">sats</span></p>
            <p className="text-sm text-muted-foreground mt-1">~ $500.00 USD (approx.)</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" variant="default" className="w-full h-14 text-base">
                <Send className="h-5 w-5 mr-2 flex-shrink-0" /> Send
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card">
              <DialogHeader className="pb-2">
                <DialogTitle className="text-xl">Send Funds</DialogTitle>
                <DialogDescription className="text-sm md:text-base">
                  Enter recipient details and amount. Supports Lightning Addresses, LNURL, and on-chain Bitcoin.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient" className="text-sm font-medium">Recipient Address / LNURL</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="recipient" 
                      className="flex-1"
                      placeholder="username@domain.com or lnurl..." 
                      value={sendAddress} 
                      onChange={(e) => setSendAddress(e.target.value)} 
                    />
                    <Button 
                      variant="outline" 
                      className="px-3" 
                      onClick={() => setShowScanner(true)} 
                      title="Scan QR Code"
                    >
                      <QrCode className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">Amount (sats)</Label>
                  <Input id="amount" type="number" placeholder="e.g., 1000" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memo" className="text-sm font-medium">Memo (Optional)</Label>
                  <Textarea id="memo" placeholder="e.g., For coffee" className="resize-none" value={sendNote} onChange={(e) => setSendNote(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-method" className="text-sm font-medium">Payment Method</Label>
                  <ZapMethodSelector
                    selectedMethod={selectedPaymentMethod}
                    onChange={setSelectedPaymentMethod}
                    disabled={paymentProcessing}
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => {}} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
                <Button 
                  type="submit" 
                  onClick={handleZap}
                  disabled={paymentProcessing || !sendAddress || !sendAmount}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {paymentProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <ZapIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      Confirm & Send
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="w-full h-14 text-base">
                <Download className="h-5 w-5 mr-2 flex-shrink-0" /> Receive
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card">
              <DialogHeader className="pb-2">
                <DialogTitle className="text-xl">Receive Funds</DialogTitle>
                <DialogDescription className="text-sm md:text-base">
                  Share your address or QR code to receive payments.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-4">
                  <Button 
                    variant={activeTab === "lightning" ? "default" : "outline"}
                    onClick={() => setActiveTab("lightning")}
                    className="flex-1 min-w-[140px]"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 10L17 2L11 14L15 17L9 22L11 14L7 11L13 10Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Lightning
                  </Button>
                  <Button 
                    variant={activeTab === "bitcoin" ? "default" : "outline"}
                    onClick={() => setActiveTab("bitcoin")}
                    className="flex-1 min-w-[140px]"
                  >
                    <Bitcoin className="h-4 w-4 mr-2 flex-shrink-0" />
                    Bitcoin (On-chain)
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-md flex flex-col items-center justify-center space-y-3">
                  <div className="w-48 h-48 bg-white flex items-center justify-center rounded-lg border">
                    <QrCode className="h-32 w-32 text-black" />
                  </div>
                  <div className="w-full px-2">
                    <p className="text-sm font-mono break-all text-center text-muted-foreground bg-background p-2 rounded-md border border-border">
                      {activeTab === "lightning" ? DUMMY_LN_ADDRESS : DUMMY_BTC_ADDRESS}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy(activeTab === "lightning" ? DUMMY_LN_ADDRESS : DUMMY_BTC_ADDRESS)}
                    className="w-full sm:w-auto transition-all duration-200"
                  >
                    {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Address"}
                  </Button>
                </div>
                 {activeTab === 'bitcoin' && (
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
          
          {/* Enhanced Scanner Dialog */}
          <Dialog 
            open={isScannerOpen} 
            onOpenChange={(open) => {
              setIsScannerOpen(open);
              if (!open) {
                setShowScanner(false);
                if (html5QrCodeRef.current?.isScanning) {
                  html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop QR scanner:", err));
                }
              }
            }}
          >
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full h-14 text-base" 
                onClick={() => {
                  setIsScannerOpen(true);
                  setScanResult("");
                  setScannerError(null);
                }}
              >
                <ScanLine className="h-5 w-5 mr-2 flex-shrink-0" /> Scan QR
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card">
              <DialogHeader className="pb-2">
                <DialogTitle className="text-xl">Scan QR Code</DialogTitle>
                <DialogDescription className="text-sm">
                  Point your camera at a QR code to read its content.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 flex flex-col items-center">
                {/* Camera selection dropdown */}
                {availableCameras.length > 0 && (
                  <div className="w-full max-w-[320px] mb-2">
                    <Label htmlFor="camera-select" className="text-sm font-medium mb-1 block">
                      Select Camera
                    </Label>
                    <select
                      id="camera-select"
                      className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                      onChange={(e) => handleCameraChange(e.target.value)}
                      value={selectedCamera}
                      disabled={scannerInitializing}
                    >
                      {availableCameras.map(camera => (
                        <option key={camera.id} value={camera.id}>
                          {camera.label || `Camera ${camera.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Start scanner button */}
                {!showScanner && !scannerInitializing && (
                  <Button 
                    variant="default"
                    className="mb-2"
                    onClick={() => setShowScanner(true)}
                    disabled={!selectedCamera || scannerInitializing}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                )}
                
                {/* Stop scanner button */}
                {showScanner && !scannerInitializing && (
                  <Button 
                    variant="outline"
                    className="mb-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                    onClick={async () => {
                      if (html5QrCodeRef.current?.isScanning) {
                        await html5QrCodeRef.current.stop().catch(console.error);
                      }
                      setShowScanner(false);
                    }}
                  >
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Camera
                  </Button>
                )}
                
                {/* Scanner container */}
                <div 
                  ref={scannerContainerRef} 
                  className={`w-full max-w-[320px] aspect-square mb-4 bg-muted/70 rounded-md overflow-hidden border border-border shadow-sm flex items-center justify-center ${!showScanner ? 'hidden' : ''}`}
                >
                  {scannerInitializing && (
                    <div className="animate-pulse flex flex-col items-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Initializing camera...</p>
                    </div>
                  )}
                </div>
                
                {/* Scanner error display */}
                {scannerError && (
                  <div className="flex flex-col items-center p-4 bg-red-50 rounded-md w-full max-w-[320px]">
                    <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                    <p className="text-sm text-center mb-2 text-red-700">{scannerError}</p>
                    <Button size="sm" variant="outline" onClick={handleRetryScanner} className="mt-1">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Camera Access
                    </Button>
                  </div>
                )}
                
                {/* Scan result feedback */}
                <p className="text-sm text-muted-foreground min-h-[20px] text-center w-full px-4 mt-2">
                  {scanResult ? (
                    <span className="text-green-600 font-medium">QR Code detected!</span>
                  ) : (
                    showScanner && !scannerError && !scannerInitializing && 
                    "Ready to scan. Position QR code within the frame."
                  )}
                </p>
                
                {/* Scan result actions */}
                {scanResult && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md w-full max-w-[320px]">
                    <p className="text-xs text-green-700 font-medium mb-1">Scanned Successfully:</p>
                    <p className="text-sm break-all bg-white p-2 rounded border border-green-100 mb-3">
                      {scanResult.length > 60 ? `${scanResult.substring(0,60)}...` : scanResult}
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSendAddress(scanResult);
                          setIsScannerOpen(false);
                        }}
                      >
                        Use as Address
                      </Button>
                      
                      {scanResult.startsWith('lightning:') && (
                        <Button 
                          size="sm" 
                          variant="default"
                          className="flex-1"
                          onClick={() => {
                            const lightningAddress = scanResult.replace('lightning:', '');
                            setSendAddress(lightningAddress);
                            setIsScannerOpen(false);
                          }}
                        >
                          <ZapIcon className="h-4 w-4 mr-1" />
                          Use Lightning Address
                        </Button>
                      )}
                      
                      {scanResult.startsWith('nostr:') && (
                        <Button 
                          size="sm" 
                          variant="default"
                          className="flex-1"
                          onClick={() => {
                            const nostrUrl = scanResult.replace('nostr:', '');
                            navigate(`/zap/${nostrUrl}`);
                            setIsScannerOpen(false);
                          }}
                        >
                          <ZapIcon className="h-4 w-4 mr-1" />
                          Process Zap
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsScannerOpen(false)} className="w-full sm:w-auto">
                  Close Scanner
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-xl">
              <History className="h-5 w-5 mr-2 flex-shrink-0" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {dummyTransactions.length > 0 ? (
              <div>
                {/* Mobile view - card style */}
                <div className="block sm:hidden space-y-3 px-4">
                  {dummyTransactions.map((tx) => (
                    <div key={tx.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`capitalize px-2 py-1 text-xs rounded-full ${
                          tx.type === 'sent' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                        }`}>
                          {tx.type}
                        </span>
                        <span className={`capitalize px-2 py-1 text-xs rounded-full ${
                          tx.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {tx.amount.toLocaleString()} {tx.currency}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 truncate">
                        {tx.description}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop view - table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dummyTransactions.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-muted/50">
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
                          <TableCell className="text-muted-foreground max-w-[200px] truncate" title={tx.description}>
                            {tx.description}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</TableCell>
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
                </div>
              </div>
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
        
        {/* Add Zap features section */}
        <Card className="bg-card shadow-sm mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-xl">
              <ZapIcon className="h-5 w-5 mr-2 flex-shrink-0 text-yellow-500" />
              Zap Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quick Zap Templates */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Quick Zap Templates</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-between"
                    onClick={() => {
                      const zapUrl = `/zap/npub1tapj48eekk8lzvhupfxg4ugdgthaj97cqahk3wml97g76l20dfqspmpjyp?amount=1000&method=lightning&comment=${encodeURIComponent("Coffee tip!")}`;
                      navigate(zapUrl);
                    }}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">☕</span> Coffee Tip
                    </span>
                    <span className="text-muted-foreground text-xs">1,000 sats</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-between"
                    onClick={() => {
                      const zapUrl = `/zap/npub1tapj48eekk8lzvhupfxg4ugdgthaj97cqahk3wml97g76l20dfqspmpjyp?amount=5000&method=lightning&comment=${encodeURIComponent("Great content!")}`;
                      navigate(zapUrl);
                    }}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">🚀</span> Support 
                    </span>
                    <span className="text-muted-foreground text-xs">5,000 sats</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-between"
                    onClick={() => {
                      const zapUrl = `/zap/npub1tapj48eekk8lzvhupfxg4ugdgthaj97cqahk3wml97g76l20dfqspmpjyp?amount=10000&method=cashu&comment=${encodeURIComponent("Anonymous donation")}`;
                      navigate(zapUrl);
                    }}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">🔒</span> Private
                    </span>
                    <span className="text-muted-foreground text-xs">10,000 sats</span>
                  </Button>
                </div>
              </div>
              
              {/* Zap Features */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Zap Gateway</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Send sats to anyone on Nostr using multiple payment methods</p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>Lightning Network payments</li>
                    <li>Cashu Ecash tokens</li>
                    <li>Ark L2 transfers (beta)</li>
                    <li>Bitcoin on-chain (coming soon)</li>
                  </ul>
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full mt-2"
                    onClick={() => navigate('/zap-gateway')}
                  >
                    <ZapIcon className="h-4 w-4 mr-2" />
                    Open Zap Gateway
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
