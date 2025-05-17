import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Globe, Zap, Menu, PlusCircle, Circle, Users, MessageSquare, ShoppingCart, ArrowLeft, Loader2, Trophy } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAppContext } from "@/App";
import { useNostr } from "@/context/NostrContext";
import { getInitials } from "@/lib/utils";
import { ZapDialog } from "@/components/zap-dialog";

const nostrClients = [
  { 
    name: "Primal", 
    description: "Web/iOS/Android client", 
    icon: <Menu className="h-6 w-6 text-primary" />, 
    url: "https://primal.net/p/{npub}"
  },
  { 
    name: "Nostria", 
    description: "Web/Desktop/iOS/Android client", 
    icon: <Users className="h-6 w-6 text-purple-500" />,
    url: "https://nostria.app/profile/{npub}"
  },
  { 
    name: "Damus", 
    description: "iOS/MacOS client", 
    icon: <PlusCircle className="h-6 w-6 text-blue-500" />,
    url: "https://damus.io/{npub}"
  },
  { 
    name: "Snort", 
    description: "Web client", 
    icon: <Circle className="h-6 w-6 text-indigo-500 fill-current" />,
    url: "https://snort.social/p/{npub}"
  },
  { 
    name: "Nostree", 
    description: "Web client", 
    icon: <PlusCircle className="h-6 w-6 text-green-500" />,
    url: "https://nostree.me/{npub}"
  },
  { 
    name: "Coracle", 
    description: "Web client", 
    icon: <ShoppingCart className="h-6 w-6 text-orange-500" />,
    url: "https://coracle.social/{npub}"
  },
  { 
    name: "Iris", 
    description: "Web client", 
    icon: <Circle className="h-6 w-6 text-pink-500 fill-current" />,
    url: "https://iris.to/{npub}"
  },
  { 
    name: "Nostter", 
    description: "Web client", 
    icon: <MessageSquare className="h-6 w-6 text-teal-500" />,
    url: "https://nostter.com/{npub}"
  },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { identifier } = useParams();
  const { setIsLoading } = useAppContext();
  const { userProfile, userBadges, loading, error, lookupUser } = useNostr();
  const [preferredClient, setPreferredClient] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const lookupCompleted = useRef(false);

  useEffect(() => {
    if (userProfile) {
      console.log("Loaded user profile:", userProfile);
      console.log("Lightning address (lud16):", userProfile.lud16);
      console.log("Lightning address (lud06):", userProfile.lud06);
    }
  }, [userProfile]);

  useEffect(() => {
    const savedClient = localStorage.getItem('preferredNostrClient');
    if (savedClient) {
      setPreferredClient(savedClient);
    } else {
      setPreferredClient('Primal');
    }
  }, []);

  const updatePreferredClient = (clientName: string) => {
    setPreferredClient(clientName);
    localStorage.setItem('preferredNostrClient', clientName);
  };

  useEffect(() => {
    console.log("ProfilePage: identifier param =", identifier);
    
    
    lookupCompleted.current = false;
    
    const fetchProfile = async () => {
      
      if (!identifier) {
        console.log("No identifier provided, redirecting to home");
        setIsLoading(true);
        navigate('/');
        return;
      }
      
      
      if (lookupCompleted.current) {
        console.log("Lookup already completed for this identifier, skipping");
        return;
      }
      
      try {
        setLocalLoading(true);
        setIsLoading(true);

        console.log("Looking up profile for:", identifier);
        await lookupUser(identifier);
        
        
        lookupCompleted.current = true;
      } catch (err) {
        console.error("Error in fetchProfile:", err);
      } finally {
        setLocalLoading(false);
        setIsLoading(false);
      }
    };

    fetchProfile();
    
    
    return () => {
      setIsLoading(false);
    };
  }, [identifier, lookupUser, setIsLoading, navigate]);

  
  const getImageUrl = (url: string | undefined, type: 'avatar' | 'banner' = 'avatar') => {
    if (!url) return type === 'avatar' ? '/default-avatar.png' : '/default-banner.svg';
    
    
    try {
      new URL(url);
      return url;
    } catch (e) {
      return type === 'avatar' ? '/default-avatar.png' : '/default-banner.svg';
    }
  };

  
  const getClientUrl = (client: typeof nostrClients[0]): string => {
    if (!userProfile?.npub) return '#';
    return client.url.replace('{npub}', userProfile.npub);
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
        {userProfile && !loading && !localLoading && !error && (
          <h1 className="text-2xl md:text-3xl font-bold text-center flex items-center justify-center mt-4 mb-2">
            <Users className="h-7 w-7 md:h-8 md:w-8 mr-2 md:mr-3 text-primary flex-shrink-0" />
            <span>Profile</span>
          </h1>
        )}
      </header>
      {/* Loading state */}
      {(loading || localLoading) && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground text-lg">Loading profile information...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && !localLoading && (
        <Card className="w-full p-6 text-center ">
          <CardContent className="pt-6">
            <div className="text-xl font-semibold mb-2">Error</div>
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </CardContent>
        </Card>
      )}

      {/* Profile content - only show if profile is loaded and no errors */}
      {!loading && !localLoading && !error && userProfile && (
        <div className="flex flex-col md:flex-row gap-6 w-full">
          {/* Main Profile Content */}
          <div className="flex-grow md:w-2/3">
            <Card className="overflow-hidden bg-card text-card-foreground py-0">
              {/* Banner Image */}
              <div 
                className="h-48 md:h-64 bg-primary/20 w-full bg-cover bg-center"
                style={{ 
                  backgroundImage: userProfile.banner ? 
                    `url(${getImageUrl(userProfile.banner, 'banner')})` : 
                    'none' 
                }}
              />

              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background bg-muted -mt-16 sm:-mt-24">
                      <AvatarImage src={getImageUrl(userProfile.picture)} alt={userProfile.name || userProfile.npub} />
                      <AvatarFallback>{getInitials(userProfile.name || userProfile.npub)}</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* Profile Details */}
                  <div className="flex-grow space-y-3">
                    <h1 className="text-2xl md:text-3xl font-bold">{userProfile.name || 'Anonymous'}</h1>
                    
                    {userProfile.display_name && userProfile.display_name !== userProfile.name && (
                      <h2 className="text-xl text-muted-foreground">{userProfile.display_name}</h2>
                    )}
                    
                    {userProfile.nip05 && (
                      <div className="flex items-center text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                        <span>{userProfile.nip05}</span>
                      </div>
                    )}
                    
                    {userProfile.about && (
                      <p className="text-muted-foreground mt-2">{userProfile.about}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-2">Public Key (NPUB)</h3>
                  <div className="p-3 bg-muted/50 rounded-md text-sm font-mono break-all text-muted-foreground">
                    {userProfile.npub}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {userProfile.website && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(userProfile.website, '_blank')}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </Button>                  )}                 
                   {userProfile.lud16 && (
                    <ZapDialog
                      recipientPubkey={userProfile.pubkey}
                      recipientNpub={userProfile.npub}
                      lud16={userProfile.lud16}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                          Zap {userProfile.name || "User"}
                        </Button>
                      }
                    />
                  )}
                </div>

                {/* Badges */}
                {userBadges && userBadges.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-2">Badges</h3>
                    <div className="flex flex-wrap gap-2">
                      {userBadges.map((badge, i) => (
                        <div 
                          key={i} 
                          className="p-2 bg-muted rounded-md hover:bg-muted/80 cursor-pointer"
                          title={badge.content}
                        >
                          <Trophy className="h-6 w-6 text-amber-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Client Links Sidebar */}
          <aside className="w-full md:w-1/3 lg:w-2/5">
            <Card className="bg-card py-0">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Open in Nostr client</h3>
                
                {/* Preferred client section */}
                <div className="mb-6">
                  <h4 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-2">Preferred Client</h4>
                  {preferredClient && (
                    <div className="space-y-2">
                      {nostrClients
                        .filter(client => client.name === preferredClient)
                        .map(client => (
                          <Button 
                            key={client.name}
                            variant="outline" 
                            className="w-full justify-start text-left h-auto p-3 bg-primary/10 border-primary hover:bg-primary/20"
                            onClick={() => window.open(getClientUrl(client), '_blank')}
                          >
                            <span className="mr-3 shrink-0">{client.icon}</span>
                            <div>
                              <div className="font-semibold">{client.name}</div>
                              <div className="text-xs text-muted-foreground">{client.description}</div>
                            </div>
                          </Button>
                        ))
                      }
                    </div>
                  )}
                </div>
                
                {/* Other clients section */}
                <div>
                  <h4 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-2">Other clients</h4>
                  <div className="space-y-2">
                    {nostrClients
                      .filter(client => client.name !== preferredClient)
                      .map(client => (
                        <Button
                          key={client.name}
                          variant="outline"
                          className="w-full justify-start text-left h-auto p-3 hover:bg-muted/50 dark:hover:bg-muted/20 border-border"
                          onClick={() => {
                            updatePreferredClient(client.name);
                            window.open(getClientUrl(client), '_blank');
                          }}
                        >
                          <span className="mr-3 shrink-0">{client.icon}</span>
                          <div>
                            <div className="font-semibold">{client.name}</div>
                            <div className="text-xs text-muted-foreground">{client.description}</div>
                          </div>
                        </Button>
                      ))
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
