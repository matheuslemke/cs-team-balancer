import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Users, Trophy } from "lucide-react";

export function Header() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              CS Team Balancer
            </span>
          </Link>
        </div>
        <nav className="flex items-center space-x-1 text-sm font-medium">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
          </Button>
          <Button
            variant={isActive("/players") ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/players" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Players</span>
            </Link>
          </Button>
          <Button
            variant={isActive("/teams") ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/teams" className="flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span>Teams</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}