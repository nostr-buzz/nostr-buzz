import { nip19, SimplePool } from 'nostr-tools';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'; 
 
export const generateKeyPair = () => {
  const sk = generateSecretKey(); 
  const pk = getPublicKey(sk);
  
  const privateKeyHex = bytesToHex(sk);
  
  const nsec = nip19.nsecEncode(sk);
  const npub = nip19.npubEncode(pk);
  
  return {
    privateKeyHex,
    publicKey: pk,
    nsec,
    npub
  };
};


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
    let privateKeyBytes: Uint8Array;
    
    if (privateKey.startsWith('nsec')) {
      privateKeyBytes = nip19.decode(privateKey).data as Uint8Array;
    } else {
      privateKeyBytes = hexToBytes(privateKey);
    }
    
    const publicKey = getPublicKey(privateKeyBytes);
    
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
      id: '', 
      sig: '' 
    };

    const signedEvent = finalizeEvent(event, privateKeyBytes);
    
    const pubs = pool.publish(relays, signedEvent);
    
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Relay publish timeout')), 5000);
    });
    
    try {
      await Promise.race([
        new Promise<void>(resolve => {
          if (pubs && pubs.length > 0) {
            pubs[0].then(() => resolve());
          } else {
            resolve(); 
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
    const privateKeyBytes = privateKey.startsWith('nsec') 
      ? nip19.decode(privateKey).data as Uint8Array 
      : hexToBytes(privateKey);
    
    const publicKey = getPublicKey(privateKeyBytes);
    
    const tags = Object.entries(relays).map(([url, { read, write }]) => {
      return ["r", url, read ? "read" : "", write ? "write" : ""];
    });
    
    const event = {
      kind: 10002,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: tags,
      content: '',
      id: '',
      sig: ''
    };
    
    const signedEvent = finalizeEvent(event, privateKeyBytes);
    
    const pubs = pool.publish(publishToRelays, signedEvent);
    
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Relay publish timeout')), 5000);
    });
    
    try {
      await Promise.race([
        new Promise<void>(resolve => {
          if (pubs && pubs.length > 0) {
            pubs[0].then(() => resolve());
          } else {
            resolve();
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

 