import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '@/App';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { nip19, type Event, SimplePool } from 'nostr-tools';

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

// Define and export the component - using default export to avoid previous issues
export default function EventViewer() {
  const { identifier } = useParams<{ identifier: string }>();
  const { setIsLoading } = useAppContext();
  const [event, setEvent] = useState<Event | null>(null);
  const [author, setAuthor] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  
  // Since the NostrContext doesn't expose the pool, we'll create our own pool
  const [pool] = useState(() => new SimplePool());
  
  useEffect(() => {
    async function fetchEvent() {
      if (!identifier) return;
      
      setLoading(true);
      setIsLoading(true);
      setError(null);
      
      try {
        let eventId: string;
        let relays = [
          'wss://relay.nostr.band',
          'wss://relay.damus.io',
          'wss://purplepag.es',
          'wss://relay.primal.net',
          'wss://nostr-pub.wellorder.net',
          'wss://nos.lol'
        ];
        
        console.log('Attempting to fetch event:', identifier);
        
        // Decode note1/nevent1 if provided
        if (identifier.startsWith('note1') || identifier.startsWith('nevent1')) {
          const decoded = nip19.decode(identifier);
          
          if (decoded.type === 'note') {
            eventId = decoded.data as string;
          } else if (decoded.type === 'nevent') {
            const data = decoded.data as { id: string, relays?: string[] };
            eventId = data.id;
            if (data.relays && data.relays.length > 0) {
              relays = [...data.relays, ...relays];
            }
          } else {
            throw new Error('Invalid event identifier');
          }
        } else if (/^[0-9a-f]{64}$/.test(identifier)) {
          // If it's a hex event ID
          eventId = identifier;
        } else {
          throw new Error('Invalid event identifier format');
        }
        
        console.log(`Looking for event ID: ${eventId} on relays:`, relays);
        
        // Fetch the event using querySync which is more reliable
        const events = await pool.querySync(relays, { ids: [eventId] }, { maxWait: 5000 });
        
        if (!events || events.length === 0) {
          console.error('No events found for ID:', eventId);
          throw new Error('Event not found');
        }
        
        const eventData = events[0];
        console.log('Found event:', eventData);
        setEvent(eventData);
        
        // Fetch the author profile using querySync
        const authorEvents = await pool.querySync(relays, {
          kinds: [0],
          authors: [eventData.pubkey],
          limit: 1
        }, { maxWait: 3000 });
        
        if (authorEvents && authorEvents.length > 0) {
          const authorEvent = authorEvents[0];
          try {
            const profileData = JSON.parse(authorEvent.content);
            setAuthor({
              pubkey: eventData.pubkey,
              npub: nip19.npubEncode(eventData.pubkey),
              ...profileData
            });
          } catch (e) {
            console.error('Failed to parse profile data', e);
            setAuthor({
              pubkey: eventData.pubkey,
              npub: nip19.npubEncode(eventData.pubkey),
              name: 'Unknown User'
            });
          }
        } else {
          setAuthor({
            pubkey: eventData.pubkey,
            npub: nip19.npubEncode(eventData.pubkey),
            name: 'Unknown User'
          });
        }
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
      const relays = [
        'wss://relay.nostr.band',
        'wss://relay.damus.io',
        'wss://purplepag.es',
        'wss://relay.primal.net',
        'wss://nostr-pub.wellorder.net',
        'wss://nos.lol'
      ];
      pool.close(relays);
    };
  }, [identifier, pool, setIsLoading]);
  
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
