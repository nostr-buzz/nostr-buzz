import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAppContext } from '@/App';
import { Loader2, ArrowLeft, Zap, Copy, Check, ExternalLink } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { motion } from 'framer-motion';
import { ZapMethodSelector } from '@/components/zap-method-selector';

// Animation
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

type PaymentMethod = 'lightning' | 'cashu' | 'ark' | 'bitcoin';
type PaymentState = 'loading' | 'ready' | 'processing' | 'success' | 'error';

export function ZapHandlerPage() {
  const { pubkey } = useParams<{ pubkey: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();

  // Extract parameters
  const amount = searchParams.get('amount') || '1000';
  const method = (searchParams.get('method') || 'lightning') as PaymentMethod;
  const comment = searchParams.get('comment') || '';

  // Component state
  const [paymentState, setPaymentState] = useState<PaymentState>('loading');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(method);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [recipientInfo, setRecipientInfo] = useState<{
    name?: string;
    picture?: string;
    displayName?: string;
  }>({});

  // Format the pubkey for display
  const formattedPubkey = pubkey?.startsWith('npub')
    ? pubkey
    : pubkey && /^[0-9a-f]{64}$/.test(pubkey)
      ? nip19.npubEncode(pubkey)
      : pubkey;
  
  // Helper to format satoshi amounts
  const formatAmount = (msatAmount: string) => {
    const sats = parseInt(msatAmount);
    return sats.toLocaleString();
  };

  useEffect(() => {
    // We'll simulate a fetch to the recipient info based on pubkey
    const fetchRecipientInfo = async () => {
      try {
        // In a real implementation, you would fetch profile data from Nostr relays
        setRecipientInfo({
          name: 'nostr_user',
          displayName: 'Nostr User',
          picture: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
        });
        
        // Set loading to false after data is loaded
        setIsLoading(false);
        setPaymentState('ready');
      } catch (error) {
        console.error('Error fetching recipient info:', error);
        setError('Failed to load recipient information.');
        setPaymentState('error');
        setIsLoading(false);
      }
    };

    fetchRecipientInfo();

    return () => {
      setIsLoading(false);
    };
  }, [pubkey, setIsLoading]);

  const handleMethodChange = (newMethod: PaymentMethod) => {
    setSelectedMethod(newMethod);
    // Reset payment data when method changes
    setPaymentData(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleProcessPayment = async () => {
    setPaymentState('processing');
    
    try {
      // Simulate payment processing with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate different responses based on payment method
      if (selectedMethod === 'lightning') {
        setPaymentData({
          method: 'lightning',
          invoice: 'lnbc10n1pjg3a29pp5rlpj43m8tf90p8czq7lek805ywtuz8k0z0w8d8umvay24xnrupvqdqqcqzzsxqyz5vqsp5jw0kw7qu3vp4xesw4y0hkgj3hgxpn3wmwqeupegjy24zat8dp7q9qyyssqnz4g8hu73t9xaqc230tll5ndpwpj2da5vwu2n6492uthpzkpyz5w2k4q2xxf6kct38r9ny7yvw6yae9dc4qyh32z6k457wpl6uh6cpkptnkd',
          expires: 600
        });
      } else if (selectedMethod === 'cashu') {
        setPaymentData({
          method: 'cashu',
          token: 'cashuAeyJwcGdoIjoibWVsbG93LXdhbG51dHMtY2hhcm0iLCJ0b2tlbiI6W3sicHJvb2ZzIjpbeyJhbW91bnQiOjEwLCJpZCI6IkMiLCJzZWNyZXQiOiJDSkdFd3dLUnVjYlRnVk1GMkNlVVBIRzNRSXhjWGZCUnhDV2E4Z3dzTHpRPSIsIkMiOiIwMmU2MWMzNDdjOGJlM2Q4MDFjYTkzZTMxYWRkMTc4NzEzMWFjMGYzYTVlMGMwNTAzNTFiYjVmYWIxNGYwODU2N2YifV0sIm1pbnQiOiJodHRwczovL2xlZ2VuZC5sbm1hcmtldC5zZXJ2ZXIiLCJpZCI6IksxMEFNIn1dfQ==',
          expires: 3600
        });
      } else if (selectedMethod === 'ark') {
        setPaymentData({
          method: 'ark',
          txid: '6e5c9f8d7b3a2c1e0d4f2a1b3c5d7e9f8a7b6c5d3e2f1a0b9c8d7e6f5a4b3c2d1',
          expires: 900
        });
      }

      setPaymentState('success');
    } catch (err) {
      console.error('Payment processing error:', err);
      setError('Failed to process payment. Please try again.');
      setPaymentState('error');
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-xl mx-auto p-4 md:p-6 flex flex-col"
    >
      <header className="mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground h-10 w-10"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </header>

      <Card className="bg-card mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Buzz Zap Gateway
          </CardTitle>
          <CardDescription>
            Sending {formatAmount(amount)} sats to {recipientInfo.displayName || formattedPubkey?.substring(0, 8) + '...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading payment options...</p>
            </div>
          )}

          {paymentState === 'error' && (
            <div className="text-center py-4">
              <p className="text-red-500 mb-4">{error}</p>
              <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
            </div>
          )}

          {(paymentState === 'ready' || paymentState === 'processing') && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-full overflow-hidden">
                  <img
                    src={recipientInfo.picture || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                    alt={recipientInfo.displayName || "Recipient"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{recipientInfo.displayName || "Nostr User"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formattedPubkey?.substring(0, 8)}...{formattedPubkey?.substring(formattedPubkey.length - 8)}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatAmount(amount)} sats</span>
                </div>
                {comment && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Comment</span>
                    <span className="text-sm max-w-[70%] text-right truncate">{comment}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Payment Method</label>
                <ZapMethodSelector
                  selectedMethod={selectedMethod}
                  onChange={handleMethodChange}
                  disabled={paymentState === 'processing'}
                />
              </div>
            </div>
          )}

          {paymentState === 'success' && paymentData && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-2">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-lg font-medium">Payment Ready</h3>
              </div>
              
              {paymentData.method === 'lightning' && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Lightning Invoice</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2"
                      onClick={() => handleCopy(paymentData.invoice)}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 mr-1 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      <span className="text-xs">
                        {copied ? 'Copied!' : 'Copy'}
                      </span>
                    </Button>
                  </div>
                  <div className="bg-background/50 p-2 rounded-md">
                    <p className="text-xs font-mono break-all">
                      {paymentData.invoice.substring(0, 80)}...
                    </p>
                  </div>
                </div>
              )}
              
              {paymentData.method === 'cashu' && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Cashu Token</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2"
                      onClick={() => handleCopy(paymentData.token)}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 mr-1 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      <span className="text-xs">
                        {copied ? 'Copied!' : 'Copy'}
                      </span>
                    </Button>
                  </div>
                  <div className="bg-background/50 p-2 rounded-md">
                    <p className="text-xs font-mono break-all">
                      {paymentData.token.substring(0, 80)}...
                    </p>
                  </div>
                </div>
              )}
              
              {paymentData.method === 'ark' && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Ark Transaction ID</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2"
                      onClick={() => handleCopy(paymentData.txid)}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 mr-1 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      <span className="text-xs">
                        {copied ? 'Copied!' : 'Copy'}
                      </span>
                    </Button>
                  </div>
                  <div className="bg-background/50 p-2 rounded-md">
                    <p className="text-xs font-mono break-all">
                      {paymentData.txid}
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground text-center">
                Expires in {Math.floor(paymentData.expires / 60)} minutes
              </p>
              
              {paymentData.method === 'lightning' && (
                <div className="flex justify-center">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-sm"
                    onClick={() => window.open(`lightning:${paymentData.invoice}`)}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Open in Wallet
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {(paymentState === 'ready' || paymentState === 'processing') && (
          <CardFooter>
            <Button 
              className="w-full" 
              disabled={paymentState === 'processing'}
              onClick={handleProcessPayment}
            >
              {paymentState === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Continue with {selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)}
                </>
              )}
            </Button>
          </CardFooter>
        )}
        
        {paymentState === 'success' && (
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => navigate('/')}
            >
              Return to Home
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}
