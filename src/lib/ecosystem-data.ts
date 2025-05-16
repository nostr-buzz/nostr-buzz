export interface EcosystemItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  imageUrl?: string; 
  imagePlaceholderColor?: string; 
  platforms: string[];
  websiteUrl?: string;
  tags?: string[];
}

export interface EcosystemCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: React.ReactNode; 
  items: EcosystemItem[];
}


export const ecosystemCategories: EcosystemCategory[] = [
  {
    id: "clients",
    slug: "clients",
    name: "Clients",
    description: "Applications to interact with the Nostr network.",
    icon: "Users", 
    items: [
      {
        id: "damus",
        slug: "damus",
        name: "Damus",
        shortDescription: "A decentralized social network built on Nostr for iOS and macOS.",
        longDescription: "Damus is one of the most popular Nostr clients, known for its clean interface and focus on censorship resistance. It provides a Twitter-like experience on a decentralized protocol.",
        imagePlaceholderColor: "bg-purple-500",
        platforms: ["iOS", "macOS"],
        websiteUrl: "https://damus.io/",
        tags: ["social", "mobile", "desktop"],
      },
      {
        id: "amethyst",
        slug: "amethyst",
        name: "Amethyst",
        shortDescription: "A feature-rich Nostr client for Android.",
        longDescription: "Amethyst offers a comprehensive set of features for Android users, including multiple account support, advanced filtering, and a customizable interface. It's a community-driven project.",
        imagePlaceholderColor: "bg-pink-500",
        platforms: ["Android"],
        websiteUrl: "https://github.com/vitorpamplona/amethyst",
        tags: ["social", "mobile"],
      },
      {
        id: "snort",
        slug: "snort",
        name: "Snort.social",
        shortDescription: "A popular web-based Nostr client with a focus on performance.",
        longDescription: "Snort.social is a fast and reliable web client for Nostr. It provides a clean user experience and supports various NIPs for enhanced functionality. Great for quick access from any browser.",
        imagePlaceholderColor: "bg-sky-500",
        platforms: ["Web"],
        websiteUrl: "https://snort.social/",
        tags: ["social", "web"],
      },
    ],
  },
  {
    id: "tools",
    slug: "tools",
    name: "Tools & Libraries",
    description: "Developer tools, libraries, and utilities for building on Nostr.",
    icon: "Wrench",
    items: [
      {
        id: "nostr-tools",
        slug: "nostr-tools",
        name: "nostr-tools",
        shortDescription: "A JavaScript/TypeScript library for Nostr.",
        longDescription: "The `nostr-tools` library by fiatjaf is a foundational package for JavaScript and TypeScript developers working with Nostr. It provides essential functions for event creation, signing, verification, and relay communication.",
        imagePlaceholderColor: "bg-yellow-500",
        platforms: ["Library"],
        websiteUrl: "https://github.com/nostr-protocol/nostr-tools",
        tags: ["development", "library", "javascript", "typescript"],
      },
      {
        id: "ndk",
        slug: "ndk",
        name: "NDK (Nostr Development Kit)",
        shortDescription: "A more advanced TypeScript library for building Nostr apps.",
        longDescription: "NDK (Nostr Development Kit) aims to simplify Nostr app development by providing higher-level abstractions, caching, and subscription management. It's built on top of nostr-tools.",
        imagePlaceholderColor: "bg-orange-500",
        platforms: ["Library"],
        websiteUrl: "https://github.com/nostr-dev-kit/ndk",
        tags: ["development", "library", "typescript"],
      },
    ],
  },
  
];


export const getEcosystemItem = (categorySlug: string, itemSlug: string): EcosystemItem | undefined => {
  const category = ecosystemCategories.find(cat => cat.slug === categorySlug);
  return category?.items.find(item => item.slug === itemSlug);
};

export const getEcosystemCategory = (categorySlug: string): EcosystemCategory | undefined => {
  return ecosystemCategories.find(cat => cat.slug === categorySlug);
};
