import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, Download, Copy, Key, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/App';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { generateKeyPair, createNostrProfile, publishRelayList } from '@/lib/nostr-utils';
import { useToast } from '@/hooks/use-toast';

// Define the animation variants for page transitions
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Nostr',
    description: 'Nostr is a simple, open protocol that enables a truly censorship-resistant and global social network',
  },
  {
    id: 'keys',
    title: 'Generate Your Keys',
    description: 'Nostr uses public-key cryptography for identity and secure messaging',
  },
  {
    id: 'profile',
    title: 'Create Your Profile',
    description: 'Customize how others see you on the Nostr network',
  },
  {
    id: 'finish',
    title: "You're Ready!",
    description: 'Your Nostr identity is set up and ready to use',
  },
];

export function JoinNostrWizardPage() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedKeys, setGeneratedKeys] = useState<{nsec: string, npub: string, privateKeyHex: string} | null>(null);
  const [keyGenerating, setKeyGenerating] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    displayName: '',
    about: '',
    picture: '',
    nip05: '',
  });

  const generateNostrKeys = async () => {
    setKeyGenerating(true);
    
    try {
      // Add a slight delay to show the loading state (for UI purposes)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate Nostr keys using our utility
      const keys = generateKeyPair();
      setGeneratedKeys(keys);
      
      toast({
        title: "Keys Generated Successfully",
        description: "Your Nostr keys have been created. Make sure to save your private key!",
        type: "success",
        duration: 5000
      });
    } catch (error) {
      console.error("Error generating keys:", error);
      toast({
        title: "Error Generating Keys",
        description: "There was a problem generating your Nostr keys. Please try again.",
        type: "error",
        duration: 5000
      });
    } finally {
      setKeyGenerating(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "The text has been copied to your clipboard.",
      type: "default",
      duration: 3000
    });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };  const handleCreateProfile = async () => {
    if (!generatedKeys?.privateKeyHex) {
      toast({
        title: "Error Creating Profile",
        description: "No private key available. Please go back and generate keys first.",
        type: "error",
        duration: 5000
      });
      return;
    }
    
    setProfileSubmitting(true);
    
    try {
      // Use the real implementation to create a profile on the Nostr network
      const result = await createNostrProfile(generatedKeys.privateKeyHex, {
        name: profile.name,
        displayName: profile.displayName,
        about: profile.about,
        picture: profile.picture,
        nip05: profile.nip05
      });
      
      if (!result.success) {
        throw new Error("Failed to create profile");
      }
      
      // Define standard relays for the user with read/write permissions
      const standardRelays = {
        'wss://relay.damus.io': { read: true, write: true },
        'wss://relay.primal.net': { read: true, write: true },
        'wss://nos.lol': { read: true, write: true },
        'wss://relay.snort.social': { read: true, write: true },
        'wss://purplepag.es': { read: true, write: true },
        'wss://relay.nostr.band': { read: true, write: true }
      };
      
      // Publish the relay list according to NIP-65
      const relayListResult = await publishRelayList(generatedKeys.privateKeyHex, standardRelays);
      
      if (!relayListResult.success) {
        console.warn("Relay list publication failed, but profile was created:", relayListResult.error);
      }
      
      setProfileCreated(true);
      toast({
        title: "Profile Created!",
        description: "Your Nostr profile has been successfully created and published to the network.",
        type: "success",
        duration: 5000
      });
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error Creating Profile",
        description: "There was a problem creating your Nostr profile. Please try again.",
        type: "error",
        duration: 5000
      });
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !generatedKeys) {
      generateNostrKeys();
      return;
    }
    
    if (currentStep === 2 && !profileCreated) {
      handleCreateProfile();
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit and navigate back to home
      setIsLoading(true);
      setTimeout(() => {
        navigate('/');
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  const handleFinish = () => {
    setIsLoading(true);
    toast({
      title: "Welcome to Nostr!",
      description: "You're all set up and ready to explore the Nostr network.",
      type: "success",
      duration: 5000
    });
    setTimeout(() => {
      navigate('/');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 bg-background text-foreground flex flex-col">
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
 
      </header>

      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex flex-col items-center ${
              index <= currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                index < currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index === currentStep
                  ? 'border-2 border-primary'
                  : 'border-2 border-muted'
              }`}
            >
              {index < currentStep ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className="text-xs font-medium hidden sm:block">{step.title}</span>
          </div>
        ))}
      </div>

      <motion.div
        key={currentStep}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="bg-muted p-5 rounded-lg flex flex-col items-center text-center">
                  <Key className="h-12 w-12 mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Decentralized Identity</h3>
                  <p>
                    With Nostr, you own your data. Your identity is secured by cryptographic keys that only you control.
                  </p>
                </div>

                <div className="bg-muted p-5 rounded-lg flex flex-col items-center text-center">
                  <Globe className="h-12 w-12 mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Global Network</h3>
                  <p>
                    Connect to a network of relays around the world, ensuring your content is available everywhere.
                  </p>
                </div>

                <Alert>
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    In the next steps, you will generate encryption keys. Be sure to save your private key securely - it cannot be recovered if lost!
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  {!generatedKeys ? (
                    <Button
                      onClick={generateNostrKeys}
                      className="w-full max-w-sm mb-4"
                      size="lg"
                      disabled={keyGenerating}
                    >
                      {keyGenerating ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Generating Keys...
                        </>
                      ) : (
                        'Generate New Keys'
                      )}
                    </Button>
                  ) : (
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  )}
                </div>

                {generatedKeys && (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium text-lg">Your Public Key (npub)</h3>
                        <p className="text-sm text-muted-foreground">
                          This is your identity on Nostr. You can share this with anyone.
                        </p>
                        <div className="relative">
                          <Input
                            value={generatedKeys.npub}
                            readOnly
                            className="pr-12 font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-1 top-1"
                            onClick={() => handleCopyToClipboard(generatedKeys.npub)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium text-lg">Your Private Key (nsec)</h3>
                        <p className="text-sm font-bold text-red-500">
                          IMPORTANT: Keep this secret! Anyone with this key can control your account.
                        </p>
                        <div className="relative">
                          <Input
                            value={generatedKeys.nsec}
                            readOnly
                            className="pr-24 font-mono text-sm"
                            type="password"
                          />
                          <div className="absolute right-1 top-1 flex">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mr-1"
                              onClick={() => {
                                const element = document.createElement('a');
                                const file = new Blob([generatedKeys.nsec], {type: 'text/plain'});
                                element.href = URL.createObjectURL(file);
                                element.download = 'nostr-private-key.txt';
                                document.body.appendChild(element);
                                element.click();
                                document.body.removeChild(element);
                                toast({
                                  title: "Private Key Downloaded",
                                  description: "Store this file in a secure location.",
                                  type: "success"
                                });
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyToClipboard(generatedKeys.nsec)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>                    <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                      <AlertTitle className="text-amber-700 dark:text-amber-400">Save Your Keys Now!</AlertTitle>
                      <AlertDescription className="text-amber-700 dark:text-amber-400">
                        There is no "forgot password" in Nostr. If you lose your private key, you will permanently lose access to your account.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="bg-muted p-4 rounded-lg mt-4">
                      <h3 className="font-medium mb-2">Backup Options</h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full text-left justify-start"
                          onClick={() => {
                            if (!generatedKeys) return;
                            // Create a JSON file with key info
                            const keyData = {
                              privateKey: generatedKeys.nsec,
                              publicKey: generatedKeys.npub,
                              created: new Date().toISOString(),
                              note: "KEEP THIS FILE SECURE! Anyone with access to your private key can control your Nostr account."
                            };
                            const element = document.createElement('a');
                            const file = new Blob([JSON.stringify(keyData, null, 2)], {type: 'application/json'});
                            element.href = URL.createObjectURL(file);
                            element.download = 'nostr-keys.json';
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                            toast({
                              title: "Backup File Created",
                              description: "Store this file in a secure location!",
                              type: "success"
                            });
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Key Backup File (JSON)
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="w-full text-left justify-start"
                          onClick={() => {
                            if (!generatedKeys) return;
                            // Create a text file with instructions
                            const content = `
# Your Nostr Keys - KEEP SECURE!
Generated on: ${new Date().toLocaleString()}

## Public Key (npub) - Safe to share
${generatedKeys.npub}

## Private Key (nsec) - NEVER SHARE THIS!
${generatedKeys.nsec}

# Instructions:
1. Keep your private key SECURE - anyone with this key can control your account
2. Do not share your private key with anyone or any website
3. Store this file in multiple secure locations (password manager recommended)
4. When using Nostr clients, you'll need to log in with your private key (nsec)

# For more information about Nostr:
https://nostr.how/
`;
                            const element = document.createElement('a');
                            const file = new Blob([content], {type: 'text/plain'});
                            element.href = URL.createObjectURL(file);
                            element.download = 'nostr-keys.txt';
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                            toast({
                              title: "Text Backup Created",
                              description: "Store this file in a secure location!",
                              type: "success"
                            });
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Keys as Text File
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Username
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="yourname"
                        value={profile.name}
                        onChange={handleProfileChange}
                        disabled={profileSubmitting || profileCreated}
                      />
                      <p className="text-xs text-muted-foreground">
                        A short unique identifier (no spaces)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="displayName" className="text-sm font-medium">
                        Display Name
                      </label>
                      <Input
                        id="displayName"
                        name="displayName"
                        placeholder="Your Name"
                        value={profile.displayName}
                        onChange={handleProfileChange}
                        disabled={profileSubmitting || profileCreated}
                      />
                      <p className="text-xs text-muted-foreground">
                        How your name appears to others
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="about" className="text-sm font-medium">
                      About Me
                    </label>
                    <Textarea
                      id="about"
                      name="about"
                      placeholder="Tell others about yourself..."
                      value={profile.about}
                      onChange={handleProfileChange}
                      rows={3}
                      disabled={profileSubmitting || profileCreated}
                    />
                  </div>                <div className="space-y-2">
                    <label htmlFor="picture" className="text-sm font-medium">
                      Profile Picture URL
                    </label>
                    <Input
                      id="picture"
                      name="picture"
                      placeholder="https://example.com/your-image.jpg"
                      value={profile.picture}
                      onChange={handleProfileChange}
                      disabled={profileSubmitting || profileCreated}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use a direct link to an image (JPG, PNG or GIF)
                    </p>
                    <div className="text-xs text-blue-500 mt-1">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-xs" 
                        onClick={() => window.open("https://imgur.com/upload", "_blank")}
                      >
                        Upload an image on Imgur
                      </Button>
                      {" or "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-xs"
                        onClick={() => window.open("https://postimages.org/", "_blank")}
                      >
                        PostImages
                      </Button>
                      {" and paste the direct image link here"}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="nip05" className="text-sm font-medium">
                      NIP-05 Identifier (Optional)
                    </label>
                    <Input
                      id="nip05"
                      name="nip05"
                      placeholder="yourname@example.com"
                      value={profile.nip05}
                      onChange={handleProfileChange}
                      disabled={profileSubmitting || profileCreated}
                    />
                    <p className="text-xs text-muted-foreground">
                      A verified identifier similar to an email address
                    </p>
                    <div className="text-xs">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-xs" 
                        onClick={() => navigate("/nip05-marketplace")}
                      >
                        Find a NIP-05 provider
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Preview</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {profile.picture ? (
                        <img src={profile.picture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-semibold">
                          {profile.displayName ? profile.displayName[0].toUpperCase() : '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {profile.displayName || 'Your Name'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{profile.name || 'username'}
                      </div>
                      {profileCreated && (
                        <div className="text-xs text-green-500 flex items-center mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" /> Profile created successfully
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 text-center">
                <div className="py-6">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Your Nostr Identity is Ready!
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You can now connect to the Nostr network using any compatible client
                  </p>
                </div>

                <div className="bg-muted p-5 rounded-lg">
                  <h3 className="font-medium mb-2">Next Steps</h3>
                  <ul className="text-left space-y-2 mx-auto">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>Save your keys securely (password manager recommended)</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>Connect to Nostr clients with your private key</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>Find and follow other Nostr users</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>Post your first note to the network</span>
                    </li>
                  </ul>
                </div>                <div className="pt-4">
                  <h3 className="font-medium mb-3">Popular Nostr Clients</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { name: 'Damus', url: 'https://damus.io/' },
                      { name: 'Snort', url: 'https://snort.social/' },
                      { name: 'Iris', url: 'https://iris.to/' },
                      { name: 'Primal', url: 'https://primal.net/' },
                      { name: 'Nostria', url: 'https://nostria.app/' },
                      { name: 'Coracle', url: 'https://coracle.social/' }
                    ].map((client) => (
                      <Button
                        key={client.name}
                        variant="outline"
                        className="h-auto py-2"
                        onClick={() => window.open(client.url, '_blank')}
                      >
                        {client.name}
                      </Button>
                    ))}
                  </div>
                  
                  <h3 className="font-medium mb-3 mt-6">Resources</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-2 justify-start"
                      onClick={() => window.open('https://nostr.how/', '_blank')}
                    >
                      Nostr.how - Complete Beginners Guide
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-2 justify-start"
                      onClick={() => window.open('https://www.nostr.guru/', '_blank')}
                    >
                      Nostr.guru - Learning Platform
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-2 justify-start"
                      onClick={() => window.open('https://usenostr.org/', '_blank')}
                    >
                      UseNostr.org - Resources & Tools
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-2 justify-start"
                      onClick={() => window.open('https://github.com/aljazceru/awesome-nostr', '_blank')}
                    >
                      Awesome Nostr - GitHub Collection
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button 
              onClick={currentStep < steps.length - 1 ? handleNext : handleFinish}
              disabled={(currentStep === 1 && keyGenerating) || (currentStep === 2 && profileSubmitting)}
            >
              {currentStep === 1 && !generatedKeys ? (
                'Generate Keys'
              ) : currentStep === 2 && !profileCreated ? (
                profileSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  'Create Profile'
                )
              ) : currentStep < steps.length - 1 ? (
                <>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Finish'
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

export default JoinNostrWizardPage;
