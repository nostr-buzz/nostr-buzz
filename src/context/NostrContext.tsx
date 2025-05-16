import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SimplePool, type Event, nip19 } from 'nostr-tools';

type NostrContextType = {
  userProfile: any | null;
  userEvents: Event[];
  userBadges: Event[];
  loading: boolean;
  error: string | null;
  lookupUser: (identifier: string) => Promise<void>;
  closeConnections: () => void;
};

const NostrContext = createContext<NostrContextType | undefined>(undefined);

// Define default relays for fallback - using only the most reliable ones
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.primal.net',
  'wss://purplepag.es',
  'wss://nostr-pub.wellorder.net',
  'wss://relay.nostr.band'
];

// Timeout values in milliseconds
const FETCH_TIMEOUT = 4000;

export function NostrProvider({ children }: { children: React.ReactNode }) {
  const [userRelays, setUserRelays] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [userBadges, setUserBadges] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [pool] = useState(() => new SimplePool());
  const lookupInProgress = useRef<Record<string, boolean>>({});
  const activeRelaysRef = useRef<Set<string>>(new Set());
  const discoverRelay = 'wss://purplepag.es';

  useEffect(() => {
    if (userRelays.length > 0) {
      console.log('User relays updated:', userRelays);
    }
  }, [userRelays]);

  const reset = useCallback(() => {
    setUserProfile(null);
    setUserEvents([]);
    setUserBadges([]);
    setError(null);
  }, []);

  const safeGetFromRelay = useCallback(async (relays: string[], filter: any, timeoutMs = FETCH_TIMEOUT) => {
    try {
      const safeRelays = relays.slice(0, 3);
      console.log(`Attempting to fetch from relays:`, safeRelays);
      return await Promise.race([
        pool.get(safeRelays, filter),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
      ]);
    } catch (e) {
      console.warn('Error in safeGetFromRelay:', e);
      return null;
    }
  }, [pool]);

  const fetchUserRelays = useCallback(async (pubkey: string) => {
    try {
      console.log('Fetching relays for pubkey:', pubkey);
      activeRelaysRef.current.clear();

      try {
        const relayListEvents = await safeGetFromRelay([discoverRelay], {
          kinds: [10002],
          authors: [pubkey],
          limit: 1
        });

        if (relayListEvents) {
          const relayUrls = relayListEvents.tags
            .filter((tag: any) => tag[0] === 'r')
            .map((tag: any) => tag[1])
            .map(url => url.replace(/\/$/, ''))
            .filter((url, index, self) => self.indexOf(url) === index);

          if (relayUrls.length > 0) {
            console.log(`Found ${relayUrls.length} relays from ${discoverRelay}`);
            const uniqueRelays = [...new Set([...DEFAULT_RELAYS, ...relayUrls])];
            const validRelays = uniqueRelays.filter(url => url.startsWith('wss://'));
            setUserRelays(validRelays);
            validRelays.forEach(relay => activeRelaysRef.current.add(relay));
            return;
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch relays from ${discoverRelay}:`, e);
      }

      console.log('Using default relays');
      setUserRelays(DEFAULT_RELAYS);
      DEFAULT_RELAYS.forEach(relay => activeRelaysRef.current.add(relay));
    } catch (e) {
      console.error('Error in fetchUserRelays:', e);
      setUserRelays(DEFAULT_RELAYS);
      DEFAULT_RELAYS.forEach(relay => activeRelaysRef.current.add(relay));
    }
  }, [safeGetFromRelay, discoverRelay]);

  const fetchUserProfile = useCallback(async (pubkey: string) => {
    const currentRelays = userRelays.length > 0 ? userRelays : DEFAULT_RELAYS;

    try {
      console.log('Fetching profile for pubkey:', pubkey, 'from relays:', currentRelays);

      let userMetadata = null;

      const reliableRelays = ['wss://purplepag.es', 'wss://relay.primal.net'];
      userMetadata = await safeGetFromRelay(reliableRelays, {
        kinds: [0],
        authors: [pubkey],
        limit: 1
      });

      if (!userMetadata) {
        const subsetRelays = currentRelays.slice(0, 2);
        userMetadata = await safeGetFromRelay(subsetRelays, {
          kinds: [0],
          authors: [pubkey],
          limit: 1
        });
      }

      if (!userMetadata) {
        for (const relay of ['wss://relay.damus.io', 'wss://nostr-pub.wellorder.net']) {
          userMetadata = await safeGetFromRelay([relay], {
            kinds: [0],
            authors: [pubkey],
            limit: 1
          });

          if (userMetadata) {
            console.log(`Found profile on ${relay}`);
            break;
          }
        }
      }

      if (userMetadata) {
        try {
          const profileData = JSON.parse(userMetadata.content);
          const profile = {
            pubkey,
            npub: nip19.npubEncode(pubkey),
            ...profileData
          };
          console.log('Profile loaded:', profile);
          setUserProfile(profile);
          return true;
        } catch (e) {
          console.error('Error parsing profile data:', e);
          setError('Could not parse profile data');
          setUserProfile({
            pubkey,
            npub: nip19.npubEncode(pubkey),
            name: 'Unknown user'
          });
          return false;
        }
      } else {
        console.log('No profile found after all attempts, creating minimal profile');
        setUserProfile({
          pubkey,
          npub: nip19.npubEncode(pubkey),
          name: 'Unknown user'
        });
        return false;
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
      setUserProfile({
        pubkey,
        npub: nip19.npubEncode(pubkey),
        name: 'Unknown user'
      });
      return false;
    }
  }, [safeGetFromRelay, userRelays]);

  const fetchUserBadges = useCallback(async (pubkey: string) => {
    try {
      const currentRelays = userRelays.length > 0 ? userRelays : DEFAULT_RELAYS;

      const badgeEvents = await safeGetFromRelay(currentRelays, {
        kinds: [30009],
        authors: [pubkey],
        limit: 50
      });

      if (badgeEvents) {
        const badges = Array.isArray(badgeEvents) ? badgeEvents : [badgeEvents];
        console.log(`Found ${badges.length} badges`);
        setUserBadges(badges);
      }
    } catch (e) {
      console.error('Error fetching user badges:', e);
    }
  }, [safeGetFromRelay, userRelays]);

  const lookupUser = useCallback(async (identifier: string) => {
    if (lookupInProgress.current[identifier]) {
      console.log(`Lookup for ${identifier} already in progress, skipping duplicate request`);
      return;
    }

    lookupInProgress.current[identifier] = true;

    reset();
    setLoading(true);
    console.log('Looking up user:', identifier);

    try {
      let pubkey: string;

      if (identifier.startsWith('npub')) {
        try {
          const result = nip19.decode(identifier);
          pubkey = result.data as string;
          console.log('Decoded npub to pubkey:', pubkey);
        } catch (e) {
          console.error('Failed to decode npub:', e);
          throw new Error('Invalid npub format');
        }
      } else if (/^[0-9a-f]{64}$/.test(identifier)) {
        pubkey = identifier;
        console.log('Using hex pubkey:', pubkey);
      } else {
        console.error('Invalid identifier format:', identifier);
        throw new Error('Invalid identifier. Please use npub or hex format');
      }

      await fetchUserRelays(pubkey);

      const success = await fetchUserProfile(pubkey);

      if (success) {
        fetchUserBadges(pubkey).catch(e => {
          console.error('Badge fetch error (non-critical):', e);
        });
      }
    } catch (e) {
      console.error('Error in lookupUser:', e);
      setError((e as Error).message);
    } finally {
      delete lookupInProgress.current[identifier];
      setLoading(false);
    }
  }, [reset, fetchUserRelays, fetchUserProfile, fetchUserBadges]);

  const closeConnections = useCallback(() => {
    try {
      const relaysToClose = Array.from(activeRelaysRef.current);
      if (relaysToClose.length > 0) {
        console.log('Closing connections to relays:', relaysToClose);
        pool.close(relaysToClose);
        activeRelaysRef.current.clear();
      }
    } catch (e) {
      console.error('Error closing connections:', e);
    }
  }, [pool]);

  useEffect(() => {
    return () => {
      closeConnections();
    };
  }, [closeConnections]);

  return (
    <NostrContext.Provider
      value={{
        userProfile,
        userEvents,
        userBadges,
        loading,
        error,
        lookupUser,
        closeConnections
      }}
    >
      {children}
    </NostrContext.Provider>
  );
}

export function useNostr() {
  const context = useContext(NostrContext);
  if (context === undefined) {
    throw new Error('useNostr must be used within a NostrProvider');
  }
  return context;
}
