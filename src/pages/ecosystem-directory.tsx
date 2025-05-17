import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Compass, Users, Server, Wrench, BookOpen } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAppContext } from "@/App";
import { ecosystemCategories } from "@/lib/ecosystem-data";
import type { EcosystemItem } from "@/lib/ecosystem-data";

const LucideIcons: { [key: string]: React.ElementType } = {
  Users, Server, Wrench, BookOpen, Compass
};

export function EcosystemDirectoryPage() {
  const navigate = useNavigate();
  const { setIsLoading } = useAppContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [setIsLoading]);
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 bg-background text-foreground flex flex-col">      <header className="mb-6 sm:mt-6 lg:mt-6">
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
        <h1 className="text-2xl md:text-3xl font-bold text-center flex items-center justify-center mt-4 mb-2">
          <Compass className="h-7 w-7 md:h-8 md:w-8 mr-2 md:mr-3 text-primary flex-shrink-0" />
          <span>Nostr Ecosystem</span>
        </h1>
      </header>

      <div className="space-y-6 md:space-y-8">
        {ecosystemCategories.map((category) => {
          const IconComponent = LucideIcons[category.icon as string] || Compass;
          return (
            <section key={category.id}>
              <Card className="bg-card border-none shadow-none">
                <CardHeader className="px-0 md:px-2 py-2">
                  <CardTitle className="flex items-center text-2xl font-semibold">
                    <IconComponent className="h-7 w-7 mr-3 text-primary" />
                    {category.name}
                  </CardTitle>
                  <CardDescription className="ml-10">{category.description}</CardDescription>
                </CardHeader>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
                {category.items.map((item: EcosystemItem) => (
                  <Card key={item.id} className="bg-card hover:shadow-lg transition-shadow duration-200 flex flex-col">
                    <Link to={`/ecosystem/${category.slug}/${item.slug}`} className="flex flex-col h-full">
                      <CardHeader className="flex-shrink-0">
                        <div className={`w-full h-32 rounded-md flex items-center justify-center text-white text-3xl font-bold ${item.imageUrl ? '' : item.imagePlaceholderColor || 'bg-muted'}`}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-2" />
                          ) : (
                            item.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <CardTitle className="mt-4 text-xl">{item.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-3">{item.shortDescription}</p>
                      </CardContent>
                      <CardFooter className="flex-shrink-0 pt-2">
                        <div className="flex flex-wrap gap-1">
                          {item.platforms.map(platform => (
                            <span key={platform} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{platform}</span>
                          ))}
                        </div>
                      </CardFooter>
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
