import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, ExternalLink, Copy, Check, Bolt, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppContext } from "@/App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export function ZapGatewayPage() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  // Example public key for demonstration
  const demoPublicKey = "npub1tapj48eekk8lzvhupfxg4ugdgthaj97cqahk3wml97g76l20dfqspmpjyp";

  // Payment demos data - improved with more minimal design
  const zapDemos = [
    { 
      title: "Coffee Tip", 
      description: "Quick appreciation", 
      amount: 1000, 
      method: "lightning",
      comment: "Thanks for the great work!",
      icon: "☕",
      color: "bg-amber-500"
    },
    { 
      title: "Support", 
      description: "Fund development", 
      amount: 5000, 
      method: "lightning",
      comment: "Keep building awesome stuff!",
      icon: "🚀",
      color: "bg-blue-500"
    },
    { 
      title: "Private", 
      description: "Anonymous donation", 
      amount: 10000, 
      method: "cashu",
      comment: "Anonymous contribution",
      icon: "🔒",
      color: "bg-green-500"
    },
    { 
      title: "Major", 
      description: "Significant support", 
      amount: 50000, 
      method: "lightning",
      comment: "Major support for your project",
      icon: "💎",
      color: "bg-purple-500"
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [setIsLoading]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied({ ...copied, [key]: true });
      setTimeout(() => {
        setCopied({ ...copied, [key]: false });
      }, 2000);
    });
  };

  const handleZapDemo = (demo: typeof zapDemos[0]) => {
    setIsLoading(true);
    const zapUrl = `/zap/${demoPublicKey}?amount=${demo.amount}&method=${demo.method}&comment=${encodeURIComponent(demo.comment)}`;
    navigate(zapUrl);
  };

  // Ensure sats amount is displayed properly (as whole numbers)
  const formatSatsAmount = (amount: number): string => {
    return amount.toLocaleString();
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 bg-background text-foreground flex flex-col">
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
          <Zap className="h-7 w-7 md:h-8 md:w-8 mr-2 md:mr-3 text-primary flex-shrink-0" />
          <span>Buzz Zap Gateway</span>
        </h1>
      </header>

      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-xl">Overview</CardTitle>
            <CardDescription>
              A universal Nostr zap gateway that abstracts payment complexity across multiple Bitcoin Layer 2 solutions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong className="font-semibold">Buzz</strong> provides a single, standard API for zapping users and events using:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-yellow-500 bg-yellow-500/10">⚡️</Badge>
                <span>Lightning Network</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-green-500 bg-green-500/10">🪙</Badge>
                <span>Cashu (Ecash)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-blue-500 bg-blue-500/10">🌀</Badge>
                <span>Ark (Future-ready)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-orange-500 bg-orange-500/10">🟠</Badge>
                <span>Bitcoin On-chain (optional/future)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-xl">Why Use Buzz?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Nostr clients can integrate Buzz as a unified zap handler without needing to manage different wallet implementations, tokens, or node communications.
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li className="text-green-500">
                <span className="text-foreground">Simplifies client-side logic</span>
              </li>
              <li className="text-green-500">
                <span className="text-foreground">Supports multiple payment layers</span>
              </li>
              <li className="text-green-500">
                <span className="text-foreground">Customizable and extensible</span>
              </li>
              <li className="text-green-500">
                <span className="text-foreground">Compatible with NIP-57 Zap Requests</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Tabs defaultValue="quickstart">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="response">Response Format</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quickstart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Zap URL Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="p-3 bg-muted rounded-md font-mono text-sm overflow-auto whitespace-pre">
                    https://nostr.buzz/zap/{'{pubkey}'}?[amount={'{msats}'}]&[method={'{lightning|cashu|ark}'}]&[event_id={'{optional}'}]&[comment=...]&[relay=...]
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy("https://nostr.buzz/zap/{pubkey}?amount={msats}&method={lightning|cashu|ark}&event_id={optional}&comment=...&relay=...", "url-format")}
                  >
                    {copied["url-format"] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Example</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="p-3 bg-muted rounded-md font-mono text-sm overflow-auto whitespace-pre">
                    https://nostr.buzz/zap/npub1...xyz?amount=5000&method=cashu&comment=Support+from+Buzz
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy("https://nostr.buzz/zap/npub1...xyz?amount=5000&method=cashu&comment=Support+from+Buzz", "example")}
                  >
                    {copied["example"] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supported Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 px-3 text-left">Parameter</th>
                        <th className="py-2 px-3 text-left">Type</th>
                        <th className="py-2 px-3 text-left">Required</th>
                        <th className="py-2 px-3 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-2 px-3 font-mono text-sm">pubkey</td>
                        <td className="py-2 px-3 text-sm">string</td>
                        <td className="py-2 px-3 text-sm">✅</td>
                        <td className="py-2 px-3 text-sm">Nostr public key to zap</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 px-3 font-mono text-sm">amount</td>
                        <td className="py-2 px-3 text-sm">number</td>
                        <td className="py-2 px-3 text-sm">✅</td>
                        <td className="py-2 px-3 text-sm">Amount in millisatoshis</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 px-3 font-mono text-sm">method</td>
                        <td className="py-2 px-3 text-sm">string</td>
                        <td className="py-2 px-3 text-sm">❌</td>
                        <td className="py-2 px-3 text-sm">One of: <code>lightning</code>, <code>cashu</code>, <code>ark</code></td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 px-3 font-mono text-sm">event_id</td>
                        <td className="py-2 px-3 text-sm">string</td>
                        <td className="py-2 px-3 text-sm">❌</td>
                        <td className="py-2 px-3 text-sm">If zapping a specific event</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 px-3 font-mono text-sm">comment</td>
                        <td className="py-2 px-3 text-sm">string</td>
                        <td className="py-2 px-3 text-sm">❌</td>
                        <td className="py-2 px-3 text-sm">Comment sent with zap</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-sm">relay</td>
                        <td className="py-2 px-3 text-sm">string</td>
                        <td className="py-2 px-3 text-sm">❌</td>
                        <td className="py-2 px-3 text-sm">Nostr relay used to publish zap receipt</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  If <code>method</code> is not specified, Buzz will determine based on user preferences or default to Lightning.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="integration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 list-decimal list-inside">
                  <li>Client redirects or issues a fetch to Buzz's zap endpoint</li>
                  <li>Buzz resolves recipient's zap endpoint preferences via NIP-57 or fallback</li>
                  <li>
                    Buzz executes the payment via selected method:
                    <ul className="ml-6 mt-2 space-y-1 list-disc">
                      <li><strong>Lightning:</strong> LND/Alby/Node</li>
                      <li><strong>Cashu:</strong> Token spend to recipient mint or wallet</li>
                      <li><strong>Ark:</strong> (future) Ark send transaction via coordinator</li>
                    </ul>
                  </li>
                  <li>Buzz emits a <code>zap</code> event (NIP-57) back to relays if relay param is passed</li>
                </ol>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SDK / Integration Helper</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3">You can use this simple fetch or redirect logic in your client:</p>
                
                <div className="relative mb-4">
                  <div className="p-3 bg-muted rounded-md font-mono text-sm overflow-auto whitespace-pre">
{`const zapUser = async (pubkey, amount, method = 'lightning') => {
  const url = \`https://nostr.buzz/zap/\${pubkey}?amount=\${amount}&method=\${method}\`;
  window.location.href = url;
};`}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(`const zapUser = async (pubkey, amount, method = 'lightning') => {
  const url = \`https://nostr.buzz/zap/\${pubkey}?amount=\${amount}&method=\${method}\`;
  window.location.href = url;
};`, "code1")}
                  >
                    {copied["code1"] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <p className="mb-3">Or fetch for custom UI:</p>
                
                <div className="relative">
                  <div className="p-3 bg-muted rounded-md font-mono text-sm overflow-auto whitespace-pre">
{`const response = await fetch("https://nostr.buzz/zap/npub1...xyz?amount=1000&method=cashu");
const json = await response.json();`}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(`const response = await fetch("https://nostr.buzz/zap/npub1...xyz?amount=1000&method=cashu");
const json = await response.json();`, "code2")}
                  >
                    {copied["code2"] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="response" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Format (for API use)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="p-3 bg-muted rounded-md font-mono text-sm overflow-auto whitespace-pre">
{`{
  "status": "ok",
  "payment": {
    "method": "cashu",
    "token": "cashuAeyJwI...",
    "expires": 60
  },
  "zap_event": {
    "id": "event_id",
    "kind": 9734,
    "content": "..."
  }
}`}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(`{
  "status": "ok",
  "payment": {
    "method": "cashu",
    "token": "cashuAeyJwI...",
    "expires": 60
  },
  "zap_event": {
    "id": "event_id",
    "kind": 9734,
    "content": "..."
  }
}`, "response-format")}
                  >
                    {copied["response-format"] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hosting & Customization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3">You can self-host Buzz Zap Gateway and configure:</p>
                
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="text-green-500 h-4 w-4 mr-2" />
                    <span>Supported payment methods</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 h-4 w-4 mr-2" />
                    <span>Preferred mints (Cashu)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 h-4 w-4 mr-2" />
                    <span>Relay broadcasting logic</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 h-4 w-4 mr-2" />
                    <span>Logging, webhook callbacks</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="mr-2 mt-0.5">□</div>
                <span>Web UI for managing zap preferences</span>
              </li>
              <li className="flex items-start">
                <div className="mr-2 mt-0.5">□</div>
                <span>Ark v0 integration via coordinator SDK</span>
              </li>
              <li className="flex items-start">
                <div className="mr-2 mt-0.5">□</div>
                <span>Direct LNURLp fallback</span>
              </li>
              <li className="flex items-start">
                <div className="mr-2 mt-0.5">□</div>
                <span>NIP-96 tokenized zap support</span>
              </li>
              <li className="flex items-start">
                <div className="mr-2 mt-0.5">□</div>
                <span>WalletConnect integration</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Contact & Contribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center">
              <span className="w-24 font-semibold">GitHub:</span>
              <span>[coming soon]</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 font-semibold">Contact:</span>
              <a href="mailto:team@nostr.buzz" className="text-primary hover:underline flex items-center">
                team@nostr.buzz
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            <div className="flex items-center">
              <span className="w-24 font-semibold">License:</span>
              <span>MIT</span>
            </div>
          </CardContent>
        </Card>

        <div className="p-6 border border-muted rounded-lg bg-muted/30">
          <blockquote className="border-l-4 border-primary pl-4 italic">
            <p className="text-lg">
              Buzz is <strong>not a wallet</strong> — it's a router. It speaks every payment method so you don't have to. Empower your users with freedom of choice and get zapped across all Bitcoin L2s.
            </p>
          </blockquote>
        </div>

        {/* New Demo Zap Buttons Section - Redesigned for minimal, professional look */}
        <Card className="bg-card border-muted shadow-sm">
          <CardHeader className="border-b border-muted/20">
            <CardTitle className="text-xl flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              Try Buzz Zap Gateway
            </CardTitle>
            <CardDescription>
              Experience the zap flow with these demo options
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {zapDemos.map((demo, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center"
                >
                  <Button 
                    variant="outline"
                    onClick={() => handleZapDemo(demo)}
                    className="h-auto w-full py-4 flex flex-col items-center justify-center gap-2 relative border hover:shadow-md transition-all"
                  >
                    <div className={`w-12 h-12 rounded-full ${demo.color} text-white flex items-center justify-center text-2xl mb-1`}>
                      {demo.icon}
                    </div>
                    <h3 className="font-medium">{demo.title}</h3>
                    <p className="text-xs text-muted-foreground">{demo.description}</p>
                    <div className="mt-1 font-mono text-sm">
                      {formatSatsAmount(demo.amount)} <span className="text-xs opacity-70">sats</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {demo.method === "lightning" ? (
                        <>
                          <Bolt className="h-3 w-3" /> Lightning
                        </>
                      ) : demo.method === "cashu" ? (
                        <>
                          <Coins className="h-3 w-3" /> Cashu
                        </>
                      ) : (
                        <>
                          <span>🌀</span> Ark
                        </>
                      )}
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-primary/10 rounded-md transition-opacity">
                      <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Zap Now
                      </span>
                    </div>
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-muted/20">
              <h3 className="text-sm font-medium mb-4">Quick Amounts</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {[21, 69, 100, 1000, 10000].map((amount) => (
                  <Button 
                    key={amount}
                    variant={amount === 1000 ? "default" : "outline"}
                    size="sm"
                    className={amount === 1000 ? "px-4" : ""}
                    onClick={() => handleZapDemo({
                      title: `${amount} sats`,
                      description: "Custom amount",
                      amount,
                      method: "lightning",
                      comment: `${amount} sats zap from Buzz`,
                      icon: "⚡",
                      color: ""
                    })}
                  >
                    <span className="font-mono">{formatSatsAmount(amount)}</span>
                    <span className="ml-1 text-xs opacity-70">sats</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Looking to Integrate?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Button className="flex-1" onClick={() => navigate("/join-nostr")}>
                  Join Nostr
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => navigate("/ecosystem")}>
                  Explore Ecosystem
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
