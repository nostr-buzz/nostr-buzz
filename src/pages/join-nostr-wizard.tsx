import { useState } from 'react';
import { ArrowLeft, CheckCircle, Copy, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/App';
import { generateKeyPair, createNostrProfile } from '@/lib/nostr-utils';
import { useToast } from '@/hooks/use-toast';

export function JoinNostrWizardPage() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();
  const { toast } = useToast();
  const [step, setStep] = useState<'profile' | 'keys' | 'complete'>('profile');
  const [profile, setProfile] = useState({ name: '', displayName: '' });
  const [generatedKeys, setGeneratedKeys] = useState<{nsec: string, npub: string, privateKeyHex: string} | null>(null);
  const [creating, setCreating] = useState(false);

  const handleProfileSubmit = async () => {
    if (!profile.name.trim() || !profile.displayName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and display name.",
      });
      return;
    }

    setCreating(true);
    
    try {
      // Generate keys first
      await new Promise(resolve => setTimeout(resolve, 500));
      const keys = generateKeyPair();
      setGeneratedKeys(keys);

      // Create profile on Nostr network
      const result = await createNostrProfile(keys.privateKeyHex, {
        name: profile.name,
        displayName: profile.displayName,
      });

      if (result.success) {
        setStep('keys');
        toast({
          title: "Account Created!",
          description: `Welcome to Nostr, ${profile.displayName}! Your profile has been published.`,
        });
      } else {
        throw new Error("Failed to create profile");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  const handleFinish = () => {
    setIsLoading(true);
    toast({
      title: "Welcome to Nostr!",
      description: "You're all set! Use your keys with any Nostr client.",
    });
    setTimeout(() => {
      navigate('/');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 bg-background text-foreground flex flex-col min-h-screen">
      <header className="mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            setIsLoading(true);
            navigate('/');
          }}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </header>

      <Card className="border shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">Join Nostr</CardTitle>
          <p className="text-muted-foreground">
            Create your decentralized identity in seconds
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 'profile' && (
            <div className="space-y-6">
              <div className="bg-muted p-6 rounded-lg text-center">
                <User className="h-16 w-16 mb-4 text-primary mx-auto" />
                <h3 className="text-xl font-semibold mb-2">Choose Your Identity</h3>
                <p className="text-muted-foreground">
                  Pick a username and display name for your Nostr profile.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Username</label>
                  <Input
                    id="name"
                    placeholder="username"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    disabled={creating}
                  />
                  <p className="text-xs text-muted-foreground">
                    A unique identifier (letters, numbers, underscore only)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
                  <Input
                    id="displayName"
                    placeholder="Your Name"
                    value={profile.displayName}
                    onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                    disabled={creating}
                  />
                  <p className="text-xs text-muted-foreground">
                    How others will see your name
                  </p>
                </div>
              </div>

              <Button
                onClick={handleProfileSubmit}
                className="w-full"
                size="lg"
                disabled={creating || !profile.name.trim() || !profile.displayName.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create My Nostr Account'
                )}
              </Button>
            </div>
          )}

          {step === 'keys' && generatedKeys && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Account Created!</h3>
                <p className="text-muted-foreground">
                  Your profile @{profile.name} is now live on Nostr. Save your keys below.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Your Public Key (share this)</h4>
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
                  <h4 className="font-medium">Your Private Key (keep secret!)</h4>
                  <div className="relative">
                    <Input
                      value={generatedKeys.nsec}
                      readOnly
                      className="pr-12 font-mono text-sm"
                      type="password"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1"
                      onClick={() => handleCopyToClipboard(generatedKeys.nsec)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-red-500 font-medium">
                    ⚠️ Anyone with this key controls your account. Save it safely!
                  </p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-3">What's Next?</h4>
                <div className="space-y-2 text-sm">
                  <p>1. Save your private key in a password manager</p>
                  <p>2. Try a Nostr client like <Button variant="link" className="p-0 h-auto text-sm" onClick={() => window.open('https://primal.net', '_blank')}>Primal</Button> or <Button variant="link" className="p-0 h-auto text-sm" onClick={() => window.open('https://damus.io', '_blank')}>Damus</Button></p>
                  <p>3. Use your private key to log in</p>
                  <p>4. Start connecting with others!</p>
                </div>
              </div>

              <Button onClick={handleFinish} className="w-full" size="lg">
                I've Saved My Keys - Let's Go!
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default JoinNostrWizardPage;