import { nip19, SimplePool, type Event } from 'nostr-tools';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'; // already an installed dependency
 
export const generateKeyPair = () => {
  // Generate a random private key using nostr-tools/pure
  const sk = generateSecretKey(); // returns Uint8Array
  const pk = getPublicKey(sk); // returns hex string
  
  // Convert to hex format for storage
  const privateKeyHex = bytesToHex(sk);
  
  // Convert to bech32 format
  const nsec = nip19.nsecEncode(sk);
  const npub = nip19.npubEncode(pk);
  
  return {
    privateKeyHex,
    publicKey: pk,
    nsec,
    npub
  };
};

/**
 * Create a new Nostr profile
 */
export const createNostrProfile = async (
  privateKey: string, 
  profile: { 
    name?: string; 
    displayName?: string; 
    about?: string; 
    picture?: string; 
    nip05?: string;
  },
  relays: string[] = [
    'wss://relay.damus.io',
    'wss://relay.primal.net',
    'wss://purplepag.es',
    'wss://relay.nostr.band'
  ]
) => {
  try {
    const pool = new SimplePool();
    // Convert hex or nsec privateKey to Uint8Array 
    let privateKeyBytes: Uint8Array;
    
    if (privateKey.startsWith('nsec')) {
      privateKeyBytes = nip19.decode(privateKey).data as Uint8Array;
    } else {
      // Convert hex format to Uint8Array using noble/hashes utility
      privateKeyBytes = hexToBytes(privateKey);
    }
    
    const publicKey = getPublicKey(privateKeyBytes);
    
    // Create profile event (kind 0)
    const event = {
      kind: 0,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify({
        name: profile.name || '',
        display_name: profile.displayName || '',
        about: profile.about || '',
        picture: profile.picture || '',
        nip05: profile.nip05 || ''
      }),
      id: '',  // Will be filled by finalizeEvent
      sig: ''  // Will be filled by finalizeEvent
    };

    // Finalize the event with proper ID and signature
    const signedEvent = finalizeEvent(event, privateKeyBytes);
    
    // Publish to relays
    const pubs = pool.publish(relays, signedEvent);
    
    // Set up a timeout for relay publishing
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Relay publish timeout')), 5000);
    });
    
    // Wait for any relay to confirm receipt or timeout
    try {
      await Promise.race([
        new Promise<void>(resolve => {
          // Check if any relay confirmed
          if (pubs && pubs.length > 0) {
            // Resolve when first relay confirms
            pubs[0].then(() => resolve());
          } else {
            resolve(); // No relays to wait for
          }
        }),
        timeout
      ]);
    } catch (e) {
      console.warn('Publication timeout, but event may still be published');
    }
    
    return { success: true, publicKey };
  } catch (error) {
    console.error('Error creating Nostr profile:', error);
    return { success: false, error };
  }
};

/**
 * Publish relay list according to NIP-65
 * @param privateKey The user's private key in hex format
 * @param relays An object mapping relay URLs to read/write preferences
 * @returns Result object indicating success or failure
 */
export const publishRelayList = async (
  privateKey: string,
  relays: Record<string, { read: boolean; write: boolean }>,
  publishToRelays: string[] = [
    'wss://relay.damus.io',
    'wss://relay.primal.net',
    'wss://nos.lol',
    'wss://relay.snort.social',
    'wss://purplepag.es',
    'wss://relay.nostr.band'
  ]
) => {
  try {
    const pool = new SimplePool();
    // Convert hex privateKey to Uint8Array if needed
    const privateKeyBytes = privateKey.startsWith('nsec') 
      ? nip19.decode(privateKey).data as Uint8Array 
      : hexToBytes(privateKey);
    
    const publicKey = getPublicKey(privateKeyBytes);
    
    // Create tags for each relay
    const tags = Object.entries(relays).map(([url, { read, write }]) => {
      // Format: ["r", <url>, <read permission>, <write permission>]
      return ["r", url, read ? "read" : "", write ? "write" : ""];
    });
    
    // Create relay list event (kind 10002 per NIP-65)
    const event = {
      kind: 10002,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: tags,
      content: '',
      id: '',
      sig: ''
    };
    
    // Finalize the event with proper ID and signature
    const signedEvent = finalizeEvent(event, privateKeyBytes);
    
    // Publish to relays
    const pubs = pool.publish(publishToRelays, signedEvent);
    
    // Set up a timeout for relay publishing
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Relay publish timeout')), 5000);
    });
    
    // Wait for any relay to confirm receipt or timeout
    try {
      await Promise.race([
        new Promise<void>(resolve => {
          // Check if any relay confirmed
          if (pubs && pubs.length > 0) {
            // Resolve when first relay confirms
            pubs[0].then(() => resolve());
          } else {
            resolve(); // No relays to wait for
          }
        }),
        timeout
      ]);
    } catch (error) {
      console.warn('Could not confirm relay publication, but event may still be published.', error);
    }
    
    return { success: true, event: signedEvent };
  } catch (error) {
    console.error('Error publishing relay list:', error);
    return { success: false, error };
  }
};
