import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Globe, Zap, Menu, PlusCircle, Circle, Users, MessageSquare, ShoppingCart, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppContext } from "@/App";

const nostrClients = [
  { name: "Primal", description: "Web/iOS/Android client", icon: <Menu className="h-6 w-6 text-primary" />, preferred: true },
  { name: "Nostria", description: "Web/Desktop/iOS/Android client", icon: <Users className="h-6 w-6 text-purple-500" /> },
  { name: "Damus", description: "iOS/MacOS client", icon: <PlusCircle className="h-6 w-6 text-blue-500" /> },
  { name: "Snort", description: "Web client", icon: <Circle className="h-6 w-6 text-indigo-500 fill-current" /> },
  { name: "Nostree", description: "Web client", icon: <PlusCircle className="h-6 w-6 text-green-500" /> },
  { name: "Coracle", description: "Web client", icon: <ShoppingCart className="h-6 w-6 text-orange-500" /> },
  { name: "Iris", description: "Web client", icon: <Circle className="h-6 w-6 text-pink-500 fill-current" /> },
  { name: "Nostter", description: "Web client", icon: <MessageSquare className="h-6 w-6 text-teal-500" /> },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();
  const preferredClient = nostrClients.find(c => c.preferred);
  const otherClients = nostrClients.filter(c => !c.preferred);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [setIsLoading]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 bg-background text-foreground flex flex-col">
      {/* Back Button Container */}
      <div className="mb-4 md:mb-6 self-start">
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
      </div>

      {/* Main content and sidebar row */}
      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* Main Profile Content */}
        <div className="flex-grow md:w-2/3 space-y-6">
          <Card className="overflow-hidden bg-card text-card-foreground py-0">
            {/* Banner Image */}
            <div className="h-48 md:h-64 bg-primary/20 w-full">
              {/* Placeholder for actual banner image - using a muted color */}
              {/* <img src="/path-to-banner.jpg" alt="Banner" className="w-full h-full object-cover" /> */}
            </div>

            <CardContent className="relative p-6">
              {/* Profile Picture */}
              <Avatar className="absolute -top-16 left-6 md:left-8 h-24 w-24 md:h-32 md:w-32 border-4 border-background bg-muted">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>

              {/* Spacer for profile picture */}
              <div className="pt-12 md:pt-16">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm">Edit Profile</Button>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold mt-2">sondreb</h1>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                  <span>_@sondreb.com</span>
                </div>
                <p className="mt-3 text-muted-foreground">
                  Founder and CEO of Nostria. Voluntaryism. Decentralize everything.
                </p>

                <div className="mt-6">
                  <h3 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Public Key (NPUB)</h3>
                  <div className="mt-1 p-3 bg-muted/50 rounded-md text-sm font-mono break-all text-muted-foreground">
                    npub1z13g38a6qypp6py2z07shggg45cu8qex992xpss7d8zr128mu52s4cjajh
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </Button>
                  <Button variant="outline" size="sm">
                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                    sondreb@npub.cash
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Additional cards for posts, relays, etc. can go here */}
        </div>

        {/* Right Sidebar for Nostr Clients */}
        <aside className="w-full md:w-1/3 lg:w-2/5 space-y-6">
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Open in Nostr client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-2">Preferred client</h4>
                {preferredClient && (
                  <Button variant="outline" className="w-full justify-start text-left h-auto p-3 bg-primary/10 border-primary hover:bg-primary/20">
                    <span className="mr-3 shrink-0">{preferredClient.icon}</span>
                    <div>
                      <div className="font-semibold">{preferredClient.name}</div>
                      <div className="text-xs text-muted-foreground">{preferredClient.description}</div>
                    </div>
                  </Button>
                )}
              </div>

              <div>
                <h4 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-2">Other clients</h4>
                <div className="space-y-2">
                  {otherClients.map((client) => (
                    <Button
                      key={client.name}
                      variant="outline"
                      className="w-full justify-start text-left h-auto p-3 hover:bg-muted/50 dark:hover:bg-muted/20 border-border"
                    >
                      <span className="mr-3 shrink-0">{client.icon}</span>
                      <div>
                        <div className="font-semibold">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
