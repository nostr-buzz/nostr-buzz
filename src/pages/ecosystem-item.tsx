import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Tag, Layers, Globe } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useAppContext } from "@/App";
import { getEcosystemItem, getEcosystemCategory } from "@/lib/ecosystem-data";

export function EcosystemItemPage() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();
  const { categorySlug, itemSlug } = useParams<{ categorySlug: string; itemSlug: string }>();

  const item = categorySlug && itemSlug ? getEcosystemItem(categorySlug, itemSlug) : undefined;
  const category = categorySlug ? getEcosystemCategory(categorySlug) : undefined;

  useEffect(() => {
    if (!item) {
      
      
      console.error("Ecosystem item not found:", categorySlug, itemSlug);
      setIsLoading(false);
      
      
    } else {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [item, categorySlug, itemSlug, setIsLoading, navigate]);

  if (!item || !category) {
    
    return (
        <div className="w-full max-w-3xl mx-auto p-4 md:p-6 text-center">
            <p className="text-muted-foreground">Item not found or loading...</p>
             <Button variant="outline" onClick={() => navigate("/ecosystem")} className="mt-4">
                Go to Ecosystem Directory
            </Button>
        </div>
    );
  }
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 bg-background text-foreground flex flex-col">
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
                navigate('/ecosystem');
              }}
            >
              Directory
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground ml-2"
              onClick={() => {
                setIsLoading(true);
                navigate('/');
              }}
            >
              Home
            </Button>
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-center flex items-center justify-center mt-4 mb-2">
          <Layers className="h-7 w-7 md:h-8 md:w-8 mr-2 md:mr-3 text-primary flex-shrink-0" />
          <span>{item.name}</span>
        </h1>
      </header>

      <Card className="bg-card">
        <CardHeader className="flex flex-col md:flex-row md:items-start gap-6">
          <div className={`w-full md:w-48 h-48 rounded-lg flex items-center justify-center text-white text-5xl font-bold flex-shrink-0 ${item.imageUrl ? '' : item.imagePlaceholderColor || 'bg-muted'}`}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-2 rounded-lg" />
            ) : (
              item.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-grow">
            <CardTitle className="text-3xl md:text-4xl font-bold">{item.name}</CardTitle>
            <CardDescription className="text-lg mt-1">{item.shortDescription}</CardDescription>
            {item.websiteUrl && (
              <Button variant="outline" size="sm" asChild className="mt-4">
                <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  Visit Website
                  <ExternalLink className="h-3 w-3 ml-1.5 opacity-70" />
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="mt-4 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center">
              <Layers className="h-5 w-5 mr-2 text-primary" />
              Supported Platforms
            </h3>
            <div className="flex flex-wrap gap-2">
              {item.platforms.map(platform => (
                <Badge key={platform} variant="secondary" className="text-sm">{platform}</Badge>
              ))}
            </div>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-primary" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-xl font-semibold mb-2">About {item.name}</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {item.longDescription}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
