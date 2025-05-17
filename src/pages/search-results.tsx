import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNostr } from '@/context/NostrContext';
import { useAppContext } from '@/App';
import { type Event, SimplePool } from 'nostr-tools';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, FileText, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { nip19 } from 'nostr-tools';

const pageVariants = {
  initial: {
    opacity: 0,
    x: "-5vw",
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: "5vw",
  },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};

// Helper function to format dates
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Helper function to parse Nostr profile content
const parseProfileContent = (event: Event) => {
  try {
    return JSON.parse(event.content);
  } catch (e) {
    console.error('Failed to parse profile content', e);
    return {
      name: 'Unknown User',
      about: 'Could not parse profile data',
      picture: ''
    };
  }
};

// Profile Card Component
const ProfileCard = ({ event }: { event: Event, relayUrl: string }) => {
  const profile = parseProfileContent(event);
  const navigate = useNavigate();
  
  const handleProfileClick = () => {
    navigate(`/profile/${event.pubkey}`);
  };
  
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleProfileClick}>
      <CardContent className="pt-4 pb-2">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 border">
            <img 
              src={profile.picture || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
              alt={profile.name || 'Unknown'} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
              }}
            />
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{profile.name || 'Unknown User'}</h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
              {profile.about ? truncateText(profile.about, 50) : 'No description'}
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              <Badge variant="outline" className="mr-2">
                {nip19.npubEncode(event.pubkey).slice(0, 10)}...
              </Badge>
              <span className="text-xs">{formatDate(event.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Note Card Component
const NoteCard = ({ event, relayUrl }: { event: Event, relayUrl: string }) => {
  const [author, setAuthor] = useState<any>(null);
  const [pool] = useState(() => new SimplePool());
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const authorEvent = await pool.get(
          [relayUrl, 'wss://relay.nostr.band', 'wss://relay.damus.io'],
          {
            kinds: [0],
            authors: [event.pubkey],
            limit: 1
          }
        );
        
        if (authorEvent) {
          setAuthor(parseProfileContent(authorEvent));
        }
      } catch (error) {
        console.error('Error fetching author:', error);
      }
    };
    
    fetchAuthor();
    
    return () => {
      // Clean up connections
      pool.close([relayUrl, 'wss://relay.nostr.band', 'wss://relay.damus.io']);
    };
  }, [event.pubkey, relayUrl, pool]);
  
  const handleNoteClick = () => {
    // Navigate to event detail view with the full event data in state
    navigate(`/event/${nip19.noteEncode(event.id)}`, {
      state: { event, relayUrl }
    });
  };
  
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleNoteClick}>
      <CardContent className="pt-4">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-8 w-8 border">
            <img 
              src={author?.picture || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
              alt={author?.name || 'Unknown'} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
              }}
            />
          </Avatar>
          <div>
            <h4 className="font-medium">{author?.name || 'Unknown User'}</h4>
            <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
          </div>
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>
            {event.content}
          </ReactMarkdown>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <span>via {new URL(relayUrl).hostname}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Other Event Card Component
const OtherEventCard = ({ event, relayUrl }: { event: Event, relayUrl: string }) => {
  const navigate = useNavigate();
  
  const getEventTypeLabel = (kind: number) => {
    switch (kind) {
      case 3: return 'Contact List';
      case 4: return 'Direct Message';
      case 5: return 'Delete';
      case 6: return 'Repost';
      case 7: return 'Reaction';
      case 8: return 'Badge Award';
      case 9: return 'Channel Creation';
      case 30023: return 'Article';
      default: return `Event Type ${kind}`;
    }
  };
  
  const eventTypeLabel = getEventTypeLabel(event.kind);
  
  const handleEventClick = () => {
    // Navigate to event detail view with the full event data in state
    navigate(`/event/${nip19.noteEncode(event.id)}`, {
      state: { event, relayUrl }
    });
  };
  
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleEventClick}>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium">
          {eventTypeLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>ID: {event.id.slice(0, 10)}...</span>
          <span>{formatDate(event.created_at)}</span>
        </div>
        <div className="mt-2">
          {event.content ? (
            <p className="text-sm line-clamp-3">{truncateText(event.content, 200)}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No content to display</p>
          )}
        </div>
      </CardContent>      <CardFooter className="py-2">
        <div className="flex space-x-1 text-xs">
          {event.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="outline" className="mr-1">
              {tag[0]}: {tag[1]?.slice(0, 8)}
            </Badge>
          ))}
          {event.tags.length > 3 && (
            <Badge variant="outline">+{event.tags.length - 3} more</Badge>
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground ml-auto">
          <span>via {new URL(relayUrl).hostname}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export function SearchResultsPage() {
  const { query } = useParams<{ query: string }>();
  const { searchResults, loading, error, searchNostr } = useNostr();
  const { setIsLoading } = useAppContext();
  const navigate = useNavigate();
  
  // Count results by type
  const profileCount = searchResults.filter(r => r.type === 'profile').length;
  const noteCount = searchResults.filter(r => r.type === 'note').length;
  const otherCount = searchResults.filter(r => r.type === 'other').length;
  
  useEffect(() => {
    if (query) {
      setIsLoading(true);
      searchNostr(query).finally(() => {
        setIsLoading(false);
      });
    }
  }, [query, searchNostr, setIsLoading]);
  
  const goBack = () => {
    navigate(-1);
  };
  
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="flex flex-col w-full max-w-3xl mx-auto px-4 pb-20"
    >
      <div className="sticky top-0 z-10 bg-background pt-4 pb-2">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold flex-1">
            Search Results for "{query}"
          </h1>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">
              All ({searchResults.length})
            </TabsTrigger>
            <TabsTrigger value="profiles">
              <User className="h-4 w-4 mr-2" />
              Profiles ({profileCount})
            </TabsTrigger>
            <TabsTrigger value="notes">
              <FileText className="h-4 w-4 mr-2" />
              Notes ({noteCount})
            </TabsTrigger>
            <TabsTrigger value="other">
              <Globe className="h-4 w-4 mr-2" />
              Other ({otherCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Searching Nostr relays...</p>
            ) : error ? (
              <p className="text-center py-8 text-red-500">{error}</p>
            ) : searchResults.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No results found</p>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <React.Fragment key={result.event.id || index}>
                    {result.type === 'profile' ? (
                      <ProfileCard event={result.event} relayUrl={result.relayUrl} />
                    ) : result.type === 'note' ? (
                      <NoteCard event={result.event} relayUrl={result.relayUrl} />
                    ) : (
                      <OtherEventCard event={result.event} relayUrl={result.relayUrl} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="profiles" className="mt-4">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Searching for profiles...</p>
            ) : profileCount === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No profiles found</p>
            ) : (
              <div className="space-y-4">
                {searchResults
                  .filter(result => result.type === 'profile')
                  .map((result, index) => (
                    <ProfileCard key={result.event.id || index} event={result.event} relayUrl={result.relayUrl} />
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="notes" className="mt-4">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Searching for notes...</p>
            ) : noteCount === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No notes found</p>
            ) : (
              <div className="space-y-4">
                {searchResults
                  .filter(result => result.type === 'note')
                  .map((result, index) => (
                    <NoteCard key={result.event.id || index} event={result.event} relayUrl={result.relayUrl} />
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="other" className="mt-4">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Searching for other events...</p>
            ) : otherCount === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No other events found</p>
            ) : (
              <div className="space-y-4">
                {searchResults
                  .filter(result => result.type === 'other')
                  .map((result, index) => (
                    <OtherEventCard key={result.event.id || index} event={result.event} relayUrl={result.relayUrl} />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
