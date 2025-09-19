import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Globe, Copy, Menu, PlusCircle, Circle, Users, MessageSquare, ShoppingCart, ArrowLeft, Loader2, Trophy, ExternalLink, Calendar, Hash, MapPin, Link as LinkIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAppContext } from "@/App";
import { useNostr } from "@/context/NostrContext";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [preferredClient, setPreferredClient] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [showFullNpub, setShowFullNpub] = useState(false);
  const lookupCompleted = useRef(false);

  useEffect(() => {
    if (userProfile) {
      console.log("Loaded user profile:", userProfile);
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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const truncateNpub = (npub: string, showFull: boolean = false) => {
    if (showFull || npub.length <= 20) return npub;
    return `${npub.substring(0, 12)}...${npub.substring(npub.length - 8)}`;
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
          <h1 className="text-2xl md:text-3xl font-bold text-left flex items-center mt-4 mb-2">
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
        <div className="flex flex-col xl:flex-row gap-8 w-full">
          {/* Main Profile Content */}
          <div className="flex-grow xl:w-2/3">
            <Card className="overflow-hidden bg-card text-card-foreground py-0">
              {/* Banner Image */}
              <div 
                className="h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/30 w-full bg-cover bg-center relative"
                style={{ 
                  backgroundImage: userProfile.banner ? 
                    `url(${getImageUrl(userProfile.banner, 'banner')})` : 
                    'none' 
                }}
              >
                <div className="absolute inset-0 bg-black/20"></div>
              </div>

              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background bg-muted -mt-20 sm:-mt-28 ring-2 ring-primary/20">
                      <AvatarImage 
                        src={getImageUrl(userProfile.picture)} 
                        alt={userProfile.name || userProfile.npub}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-2xl md:text-3xl">
                        {getInitials(userProfile.name || userProfile.npub)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* Profile Details */}
                  <div className="flex-grow space-y-4">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                        {userProfile.display_name || userProfile.name || 'Anonymous'}
                      </h1>
                      
                      {userProfile.name && (userProfile.display_name !== userProfile.name) && (
                        <h2 className="text-xl text-muted-foreground mt-1">@{userProfile.name}</h2>
                      )}
                    </div>
                    
                    {userProfile.nip05 && (
                      <div className="flex items-center text-sm bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg w-fit">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-700 dark:text-green-400 font-medium">{userProfile.nip05}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">Verified</Badge>
                      </div>
                    )}
                    
                    {userProfile.about && (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-muted-foreground leading-relaxed">{userProfile.about}</p>
                      </div>
                    )}

                    {/* Profile Stats */}
                    <div className="flex gap-6 pt-2">
                      {userProfile.created_at && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Joined {formatDate(userProfile.created_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Public Key Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Public Key (NPUB)
                  </h3>
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
                    <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <code className="flex-1 text-sm font-mono break-all text-foreground">
                      {truncateNpub(userProfile.npub, showFullNpub)}
                    </code>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullNpub(!showFullNpub)}
                        className="text-xs"
                      >
                        {showFullNpub ? 'Short' : 'Full'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(userProfile.npub, 'NPUB')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {userProfile.website && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(userProfile.website, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Visit Website
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(userProfile.npub, 'Profile NPUB')}
                    className="flex items-center gap-2"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Share Profile
                  </Button>

                  {userProfile.lud16 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`lightning:${userProfile.lud16}`, '_blank')}
                      className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 border-yellow-300 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:hover:bg-yellow-950/20"
                    >
                      ⚡ Lightning Address
                    </Button>
                  )}
                </div>

                {/* Badges */}
                {userBadges && userBadges.length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Achievements & Badges
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {userBadges.map((badge, i) => (
                          <Card 
                            key={i} 
                            className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer group"
                            title={badge.content}
                          >
                            <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-xs text-muted-foreground truncate">
                              {badge.content || 'Achievement'}
                            </p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Additional Profile Information */}
                {(userProfile.location || userProfile.lud06) && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-4">
                      {userProfile.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{userProfile.location}</span>
                        </div>
                      )}
                      {userProfile.lud06 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Lightning Address (LUD06)</p>
                          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                            <span className="text-yellow-500 flex-shrink-0">⚡</span>
                            <code className="font-mono text-xs text-foreground break-all flex-1">
                              {userProfile.lud06}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(userProfile.lud06, 'Lightning Address')}
                              className="flex-shrink-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Client Links Sidebar */}
          <aside className="w-full xl:w-1/3">
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start"
                    onClick={() => window.open(`nostr:${userProfile.npub}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Default Client
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => copyToClipboard(userProfile.npub, 'NPUB')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy NPUB
                  </Button>

                  <Button 
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => copyToClipboard(window.location.href, 'Profile URL')}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Share Profile Link
                  </Button>
                </CardContent>
              </Card>

              {/* Nostr Clients Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Open in Nostr Client</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Preferred client section */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Preferred Client
                    </h4>
                    {preferredClient && (
                      <div className="space-y-2">
                        {nostrClients
                          .filter(client => client.name === preferredClient)
                          .map(client => (
                            <Button 
                              key={client.name}
                              variant="default" 
                              className="w-full justify-start text-left h-auto p-4 bg-primary hover:bg-primary/90"
                              onClick={() => window.open(getClientUrl(client), '_blank')}
                            >
                              <span className="mr-3 shrink-0">{client.icon}</span>
                              <div className="text-left">
                                <div className="font-semibold text-primary-foreground">{client.name}</div>
                                <div className="text-xs text-primary-foreground/80">{client.description}</div>
                              </div>
                              <ExternalLink className="h-4 w-4 ml-auto text-primary-foreground/80" />
                            </Button>
                          ))
                        }
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* Other clients section */}
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Other Clients
                    </h4>
                    <div className="space-y-2">
                      {nostrClients
                        .filter(client => client.name !== preferredClient)
                        .map(client => (
                          <Button
                            key={client.name}
                            variant="outline"
                            className="w-full justify-start text-left h-auto p-3 hover:bg-muted/50 dark:hover:bg-muted/20 border-border group"
                            onClick={() => {
                              updatePreferredClient(client.name);
                              window.open(getClientUrl(client), '_blank');
                            }}
                          >
                            <span className="mr-3 shrink-0">{client.icon}</span>
                            <div className="text-left flex-1">
                              <div className="font-semibold group-hover:text-foreground">{client.name}</div>
                              <div className="text-xs text-muted-foreground">{client.description}</div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        ))
                      }
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Additional Info */}
                  <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <p className="mb-1">💡 <strong>Tip:</strong> Clicking any client will set it as your preferred choice.</p>
                    <p>These clients will open this profile directly for following, messaging, or interaction.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Profile Type</p>
                      <p className="font-medium">
                        {userProfile.nip05 ? 'Verified' : 'Standard'}
                      </p>
                    </div>
                    
                    {userProfile.created_at && (
                      <div>
                        <p className="text-muted-foreground">Member Since</p>
                        <p className="font-medium">{formatDate(userProfile.created_at)}</p>
                      </div>
                    )}
                  </div>

                  {userBadges && userBadges.length > 0 && (
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">Achievements</p>
                      <p className="font-medium">{userBadges.length} badge{userBadges.length !== 1 ? 's' : ''}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>This profile is fetched from the Nostr network in real-time.</p>
                    <p>Last updated: {new Date().toLocaleTimeString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
