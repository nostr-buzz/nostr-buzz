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

// Define default relays for fallback
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://relay.current.fyi'
];

export function NostrProvider({ children }: { children: React.ReactNode }) {
  const [userRelays, setUserRelays] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [userBadges, setUserBadges] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [pool] = useState(() => new SimplePool());
  const lookupInProgress = useRef<Record<string, boolean>>({});
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

  const fetchUserRelays = useCallback(async (pubkey: string) => {
    try {
      console.log('Fetching relays for pubkey:', pubkey);

      try {
        const relayListEvents = await pool.get([discoverRelay], {
          kinds: [10002],
          authors: [pubkey],
          limit: 1
        });

        if (relayListEvents) {
          const relayUrls = relayListEvents.tags
            .filter((tag: any) => tag[0] === 'r')
            .map((tag: any) => tag[1])
            .map(url => url.replace(/\/$/, ''));

          if (relayUrls.length > 0) {
            console.log(`Found ${relayUrls.length} relays from ${discoverRelay}`);
            const uniqueRelays = [...new Set([...DEFAULT_RELAYS, ...relayUrls])];
            setUserRelays(uniqueRelays);
            return;
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch relays from ${discoverRelay}:`, e);
      }

      console.log('Using default relays');
      setUserRelays(DEFAULT_RELAYS);
    } catch (e) {
      console.error('Error in fetchUserRelays:', e);
      setUserRelays(DEFAULT_RELAYS);
    }
  }, [pool, discoverRelay]);

  const fetchUserProfile = useCallback(async (pubkey: string) => {
    const currentRelays = userRelays.length > 0 ? userRelays : DEFAULT_RELAYS;

    try {
      console.log('Fetching profile for pubkey:', pubkey, 'from relays:', currentRelays);

      let userMetadata = null;

      try {
        userMetadata = await Promise.race([
          pool.get(DEFAULT_RELAYS.slice(0, 3), {
            kinds: [0],
            authors: [pubkey],
            limit: 1
          }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);
      } catch (e) {
        console.warn('Error fetching from default relays:', e);
      }

      if (!userMetadata) {
        try {
          userMetadata = await Promise.race([
            pool.get(currentRelays, {
              kinds: [0],
              authors: [pubkey],
              limit: 1
            }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
          ]);
        } catch (e) {
          console.warn('Error fetching from user relays:', e);
        }
      }

      if (!userMetadata) {
        for (const relay of ['wss://relay.damus.io', 'wss://nos.lol']) {
          try {
            userMetadata = await Promise.race([
              pool.get([relay], {
                kinds: [0],
                authors: [pubkey],
                limit: 1
              }),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
            ]);

            if (userMetadata) {
              console.log(`Found profile on ${relay}`);
              break;
            }
          } catch (e) {
            console.warn(`Error fetching from ${relay}:`, e);
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
  }, [pool, userRelays]);

  const fetchUserBadges = useCallback(async (pubkey: string) => {
    try {
      const currentRelays = userRelays.length > 0 ? userRelays : DEFAULT_RELAYS;

      const badgeEvents = await pool.get(currentRelays, {
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
  }, [pool, userRelays]);

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
    if (userRelays.length > 0) {
      pool.close(userRelays);
    } else {
      pool.close(DEFAULT_RELAYS);
    }
  }, [pool, userRelays]);

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
