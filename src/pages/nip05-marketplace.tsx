import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Search, Tag, Zap, CheckCircle, XCircle, LinkIcon, BadgeCheck, BoltIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppContext } from "@/App"; 


const initialIdentifiers = [
  { id: "1", name: "alice", domain: "nostr.buzz", priceSatoshis: 1000, available: true },
  { id: "2", name: "bob", domain: "nostr.buzz", priceSatoshis: 1500, available: true },
  { id: "3", name: "carol", domain: "nostr.buzz", priceSatoshis: 0, available: false, owner: "npub1carol..." },
  { id: "4", name: "dave", domain: "nostr.buzz", priceSatoshis: 500, available: true },
  { id: "5", name: "erin", domain: "nostr.buzz", priceSatoshis: 2000, available: true },
  { id: "6", name: "frank", domain: "nostr.buzz", priceSatoshis: 0, available: false, owner: "npub1frank..." },
  { id: "7", name: "grace", domain: "nostr.buzz", priceSatoshis: 1200, available: true },
  { id: "8", name: "heidi", domain: "nostr.buzz", priceSatoshis: 800, available: true },
];

export function Nip05MarketplacePage() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredIdentifiers, setFilteredIdentifiers] = useState(initialIdentifiers);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); 
    return () => clearTimeout(timer);
  }, [setIsLoading]);

  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim().toLowerCase());
    }, 300); 

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    setFilteredIdentifiers(
      initialIdentifiers.filter(id => id.name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
    );
  }, [searchTerm]);

  const handleBuyClick = (identifierName: string) => {
    
    alert(`Attempting to buy ${identifierName}@nostr.buzz`);
    
  };

  const isValidForSuggestion = (term: string) => {
    
    return term.length > 0 && /^[a-z0-9_]+$/.test(term);
  };

  const currentSuggestedName = isValidForSuggestion(debouncedSearchTerm) ? debouncedSearchTerm : null;

  
  const handleBackToHome = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      navigate('/');
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 bg-background text-foreground flex flex-col">
      {/* Back Button Container */}
      <div className="mb-4 md:mb-6 self-start">
        <Button
          variant="outline"
          size="default"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleBackToHome}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </Button>
      </div>

      <Card className="mb-6 bg-card">
        <CardHeader>
          <CardTitle>Find Your Perfect Nostr Identity</CardTitle>
          <CardDescription>Search for available <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">name@nostr.buzz</code> identifiers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for names (e.g., alice)"
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Suggestions Card - similar to Primal */}
      {currentSuggestedName && (
        <Card className="mb-6 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">
              Identity for: <span className="text-primary">{currentSuggestedName}</span>@nostr.buzz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div className="flex items-center">
                <BadgeCheck className="h-5 w-5 mr-3 text-blue-500" />
                <span className="text-sm text-muted-foreground">Verified nostr address</span>
              </div>
              <span className="text-sm font-medium">{currentSuggestedName}@nostr.buzz</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div className="flex items-center">
                <BoltIcon className="h-5 w-5 mr-3 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Bitcoin lightning address</span>
              </div>
              <span className="text-sm font-medium">{currentSuggestedName}@nostr.buzz</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div className="flex items-center">
                <LinkIcon className="h-5 w-5 mr-3 text-green-500" />
                <span className="text-sm text-muted-foreground">Profile on nostr.buzz</span>
              </div>
              <a 
                href={`https://nostr.buzz/${currentSuggestedName}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                nostr.buzz/{currentSuggestedName}
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Identifiers Grid */}
      {filteredIdentifiers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredIdentifiers.map((id) => (
            <Card key={id.id} className={`bg-card flex flex-col justify-between ${!id.available ? 'opacity-70' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Tag className="h-5 w-5 mr-2 text-primary" />
                  {id.name}
                  <span className="text-muted-foreground text-lg">@</span>
                  <span className="text-muted-foreground text-lg">{id.domain}</span>
                </CardTitle>
                {id.available ? (
                  <CardDescription className="flex items-center text-green-500">
                    <CheckCircle className="h-4 w-4 mr-1" /> Available
                  </CardDescription>
                ) : (
                  <CardDescription className="flex items-center text-red-500">
                    <XCircle className="h-4 w-4 mr-1" /> Claimed
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {!id.available && id.owner && (
                  <p className="text-xs text-muted-foreground break-all">Owner: {id.owner}</p>
                )}
              </CardContent>
              <CardFooter>
                {id.available ? (
                  <Button className="w-full" onClick={() => handleBuyClick(id.name)}>
                    <Zap className="h-4 w-4 mr-2" />
                    Buy for {id.priceSatoshis.toLocaleString()} sats
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full" disabled>
                    Unavailable
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No identifiers found matching your search. Try a different name!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
