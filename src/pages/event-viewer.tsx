import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom'; // Add useLocation
import { useAppContext } from '@/App';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { nip19, type Event, SimplePool } from 'nostr-tools';
import { useNostr } from '@/context/NostrContext'; // Import NostrContext to use existing pool

// Page animation variants
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

// Define a comprehensive list of relays for better event discovery
const NOSTR_RELAYS = [
  'wss://relay.nostr.band',
  'wss://relay.damus.io',
  'wss://purplepag.es',
  'wss://relay.primal.net',
  'wss://nos.lol',
  'wss://nostr.wine',
  'wss://relay.snort.social',
  'wss://relay.current.fyi',
  'wss://relay.nostr.bg',
  'wss://eden.nostr.land'
];

// Define and export the component
export default function EventViewer() {
  const { identifier } = useParams<{ identifier: string }>();
  const { setIsLoading } = useAppContext();
  const location = useLocation(); // Get location to access state
  const [event, setEvent] = useState<Event | null>(null);
  const [author, setAuthor] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { closeConnections } = useNostr();
  
  // Check if event was passed via navigation state
  const passedEvent = location.state?.event as Event | undefined;
  const passedRelayUrl = location.state?.relayUrl as string | undefined;
  
  // Create a pool for Nostr relay connections
  const [pool] = useState(() => new SimplePool());
  
  useEffect(() => {
    // Function to fetch author data
    const fetchAuthorProfile = async (pubkey: string, knownRelays: string[] = []) => {
      console.log('Fetching author profile for pubkey:', pubkey);
      
      try {
        const relaysToTry = [...new Set([...(knownRelays || []), ...NOSTR_RELAYS])];
        console.log('Looking for author profile on relays:', relaysToTry);
        
        // Try to find author profile with multiple attempts
        let attempts = 0;
        let authorEvent = null;
        
        while (!authorEvent && attempts < 3) {
          attempts++;
          console.log(`Attempt ${attempts}/3 to fetch author profile`);
          
          try {
            const events = await pool.querySync(
              relaysToTry,
              { kinds: [0], authors: [pubkey], limit: 1 },
              { maxWait: 3000 + (attempts * 1000) }
            );
            
            if (events && events.length > 0) {
              authorEvent = events[0];
              break;
            }
            
            // Try each relay individually as fallback
            for (const relay of relaysToTry) {
              try {
                const singleRelayEvent = await pool.get(
                  [relay],
                  { kinds: [0], authors: [pubkey] }
                );
                
                if (singleRelayEvent) {
                  authorEvent = singleRelayEvent;
                  break;
                }
              } catch (err) {
                // Continue to next relay
              }
            }
            
            if (!authorEvent && attempts < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (attemptErr) {
            console.warn(`Error in author profile fetch attempt ${attempts}:`, attemptErr);
          }
        }
        
        if (authorEvent) {
          try {
            const profileData = JSON.parse(authorEvent.content);
            setAuthor({
              pubkey,
              npub: nip19.npubEncode(pubkey),
              ...profileData
            });
            console.log('Found author profile:', profileData);
            return;
          } catch (e) {
            console.error('Failed to parse profile data', e);
          }
        }
        
        // If no profile found or error parsing, set default author info
        setAuthor({
          pubkey,
          npub: nip19.npubEncode(pubkey),
          name: 'Unknown User'
        });
      } catch (e) {
        console.error('Error fetching author profile:', e);
        setAuthor({
          pubkey,
          npub: nip19.npubEncode(pubkey),
          name: 'Unknown User'
        });
      }
    };
    
    // Main function to fetch event
    async function fetchEvent() {
      if (!identifier) return;
      
      setLoading(true);
      setIsLoading(true);
      setError(null);
      
      // If we already have the event from navigation state, use it
      if (passedEvent) {
        console.log('Using event passed from previous page:', passedEvent);
        setEvent(passedEvent);
        fetchAuthorProfile(passedEvent.pubkey, passedRelayUrl ? [passedRelayUrl] : undefined);
        setLoading(false);
        setIsLoading(false);
        return;
      }
      
      try {
        let eventId: string;
        let eventRelays: string[] = [];
        
        console.log('Attempting to fetch event with identifier:', identifier);
        
        // Handle different identifier formats
        if (identifier.startsWith('note1')) {
          try {
            const decoded = nip19.decode(identifier);
            if (decoded.type === 'note') {
              eventId = decoded.data as string;
              console.log('Decoded note1 to hex:', eventId);
            } else {
              throw new Error('Invalid note identifier');
            }
          } catch (e) {
            console.error('Failed to decode note1:', e);
            throw new Error('Invalid note identifier format');
          }
        } else if (identifier.startsWith('nevent1')) {
          try {
            const decoded = nip19.decode(identifier);
            if (decoded.type === 'nevent') {
              const data = decoded.data as { id: string, relays?: string[] };
              eventId = data.id;
              console.log('Decoded nevent1 to hex:', eventId);
              if (data.relays && data.relays.length > 0) {
                eventRelays = data.relays;
                console.log('Using relays from nevent1:', eventRelays);
              }
            } else {
              throw new Error('Invalid nevent identifier');
            }
          } catch (e) {
            console.error('Failed to decode nevent1:', e);
            throw new Error('Invalid nevent identifier format');
          }
        } else if (/^[0-9a-f]{64}$/.test(identifier)) {
          // Direct hex event ID
          eventId = identifier;
          console.log('Using hex event ID directly:', eventId);
        } else {
          throw new Error('Unsupported event identifier format');
        }
        
        // Combine specified relays with our defaults
        const relaysToUse = [...new Set([...eventRelays, ...NOSTR_RELAYS])];
        console.log(`Looking for event ID: ${eventId} on ${relaysToUse.length} relays`);
        
        // Strategy 1: Try to fetch directly from specific relays first
        const specificRelays = [
          'wss://relay.nostr.band',
          'wss://relay.damus.io',
          'wss://nos.lol',
          'wss://nostr.wine'
        ];
        
        // Try specific relays first with increasing timeouts
        for (let attempt = 0; attempt < 3; attempt++) {
          const timeout = 3000 + (attempt * 2000);
          console.log(`Attempt ${attempt+1}/3 with timeout ${timeout}ms`);
          
          try {
            // Try querySync with a subset of relays
            const events = await pool.querySync(
              specificRelays,
              { ids: [eventId] },
              { maxWait: timeout }
            );
            
            if (events && events.length > 0) {
              console.log('Found event on specific relays:', events[0]);
              setEvent(events[0]);
              fetchAuthorProfile(events[0].pubkey, specificRelays);
              return;
            }
          } catch (err) {
            console.warn('Error querying specific relays:', err);
          }
          
          // Try individual relays as fallback
          for (const relay of relaysToUse) {
            try {
              console.log(`Checking relay: ${relay}`);
              const event = await pool.get(
                [relay],
                { ids: [eventId] }
              );
              
              if (event) {
                console.log(`Found event on relay: ${relay}`, event);
                setEvent(event);
                fetchAuthorProfile(event.pubkey, [relay]);
                return;
              }
            } catch (relayError) {
              console.warn(`Error with relay ${relay}:`, relayError);
              // Continue to next relay
            }
          }
          
          if (attempt < 2) {
            console.log(`Waiting before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // If we reach here, we couldn't find the event
        console.error('Event not found after all attempts');
        throw new Error('Event not found. It might have been deleted or is not available on connected relays.');
        
      } catch (e) {
        console.error('Error fetching event:', e);
        setError((e as Error).message);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    }
    
    fetchEvent();
    
    return () => {
      // Clean up connections when component unmounts
      pool.close(NOSTR_RELAYS);
    };
  }, [identifier, pool, setIsLoading, passedEvent, passedRelayUrl]);
  
  const goBack = () => {
    navigate(-1);
  };
  
  const handleProfileClick = () => {
    if (author?.pubkey) {
      navigate(`/profile/${author.npub}`);
    }
  };
  
  const handleCopyEventId = async () => {
    if (!event) return;
    
    try {
      const eventId = nip19.noteEncode(event.id);
      await navigator.clipboard.writeText(eventId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy event ID', e);
    }
  };
  
  const getEventTitle = () => {
    if (!event) return 'Nostr Event';
    
    switch (event.kind) {
      case 0: return 'Profile Metadata';
      case 1: return 'Note';
      case 3: return 'Contact List';
      case 4: return 'Direct Message';
      case 5: return 'Delete';
      case 6: return 'Repost';
      case 7: return 'Reaction';
      case 8: return 'Badge Award';
      case 9: return 'Channel Creation';
      case 30023: return 'Article';
      default: return `Event Kind ${event.kind}`;
    }
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
            {getEventTitle()}
          </h1>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      ) : error ? (
        <Card className="mb-4">
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-red-500 mb-2">Error: {error}</p>
              <Button variant="outline" onClick={goBack}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : event ? (
        <div className="space-y-4">
          {/* Author Info */}
          {author && (
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div 
                  className="flex items-center space-x-4 cursor-pointer" 
                  onClick={handleProfileClick}
                >
                  <Avatar className="h-12 w-12 border">
                    <img 
                      src={author?.picture || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
                      alt={author?.name || 'Unknown'} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
                      }}
                    />
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {author?.name || author?.display_name || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {author?.npub?.slice(0, 8)}...{author?.npub?.slice(-8)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Event Content */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{formatDate(event.created_at)}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={handleCopyEventId}
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-xs">
                    {copied ? 'Copied!' : 'Copy ID'}
                  </span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event.kind === 1 ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {event.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <pre className="bg-muted p-2 rounded-md overflow-auto text-xs">
                  {event.content}
                </pre>
              )}
            </CardContent>
            <CardFooter className="pt-1 pb-3 flex flex-wrap gap-2">
              {event.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="mr-1">
                  {tag[0]}: {tag[1]?.slice(0, 10)}{tag[1]?.length > 10 ? '...' : ''}
                </Badge>
              ))}
            </CardFooter>
          </Card>
        </div>
      ) : null}
    </motion.div>
  );
}
