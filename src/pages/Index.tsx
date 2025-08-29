import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shuffle, Target, Trophy } from "lucide-react";
import heroImage from "@/assets/cs-hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cs-dark/90 via-cs-dark/60 to-transparent" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            CS Team Balancer
          </h1>
          <p className="text-xl md:text-2xl text-foreground/90 mb-8 max-w-2xl mx-auto">
            Create perfectly balanced Counter-Strike teams with advanced algorithms that consider player skills, roles, and preferences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
              <Link to="/players">
                <Users className="h-5 w-5 mr-2" />
                Manage Players
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-cs-blue text-cs-blue hover:bg-cs-blue/10">
              <Link to="/teams">
                <Shuffle className="h-5 w-5 mr-2" />
                Generate Teams
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Advanced Team Balancing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our intelligent algorithm considers multiple factors to create the most balanced and competitive teams possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card border-border hover:border-cs-blue/50 transition-all duration-300 hover:shadow-glow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-cs-blue/20 rounded-full w-fit">
                  <Target className="h-8 w-8 text-cs-blue" />
                </div>
                <CardTitle className="text-foreground">Role-Based Balancing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Considers player roles like AWPer, IGL, Entry Fragger, Support, and Lurker to ensure each team has optimal composition.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-cs-orange/50 transition-all duration-300 hover:shadow-glow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-cs-orange/20 rounded-full w-fit">
                  <Users className="h-8 w-8 text-cs-orange" />
                </div>
                <CardTitle className="text-foreground">Skill Level Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Analyzes individual player skill levels (1-20) and role-specific abilities to create evenly matched teams.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-cs-blue/50 transition-all duration-300 hover:shadow-glow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-gradient-primary rounded-full w-fit">
                  <Trophy className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-foreground">Preference Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Takes into account player favorite roles and applies weighted calculations for the most satisfying team experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-cs-surface">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Create Balanced Teams?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start by adding your players and their skill information, then let our algorithm do the work.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
            <Link to="/players">
              <Users className="h-5 w-5 mr-2" />
              Get Started
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
