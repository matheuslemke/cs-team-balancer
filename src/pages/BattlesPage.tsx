import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Battle } from "@/types/cs-types";
import { battlesApi } from "@/lib/supabase-queries";
import { useToast } from "@/hooks/use-toast";
import { Search, Trophy, Users, Calendar, Trash2, ExternalLink } from "lucide-react";
import { TeamDisplay } from "@/components/TeamDisplay";

export function BattlesPage() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBattles();
  }, []);

  const loadBattles = async () => {
    try {
      const data = await battlesApi.getAll();
      setBattles(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading battles",
        description: "Failed to load battles from database"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBattle = async (battleId: string) => {
    try {
      await battlesApi.delete(battleId);
      await loadBattles();
      toast({
        title: "Battle deleted",
        description: "Battle has been removed from the database"
      });
      if (selectedBattle?.id === battleId) {
        setSelectedBattle(null);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting battle",
        description: "Failed to delete battle from database"
      });
    }
  };

  const copyBattleLink = (battleId: string) => {
    const url = `${window.location.origin}/battles/${battleId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Battle link has been copied to clipboard"
    });
  };

  const filteredBattles = battles.filter(battle =>
    battle.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading battles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Battle History</h1>
            <p className="text-muted-foreground">View and manage your Counter-Strike team battles</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search battles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span>{filteredBattles.length} battles</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Battles List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Battles</h2>
            {filteredBattles.length > 0 ? (
              <div className="space-y-3">
                {filteredBattles.map((battle) => (
                  <Card 
                    key={battle.id} 
                    className={`bg-card border-border cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                      selectedBattle?.id === battle.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedBattle(battle)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-primary" />
                          <span className="text-foreground text-sm font-medium truncate">
                            {battle.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyBattleLink(battle.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBattle(battle.id);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {battle.team1?.players.length || 0} vs {battle.team2?.players.length || 0} players
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {battle.team1?.total_level || 0}
                          </Badge>
                          <span className="text-xs text-muted-foreground">vs</span>
                          <Badge variant="outline" className="text-xs">
                            {battle.team2?.total_level || 0}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(battle.created_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No battles found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No battles match your search criteria' : 'Start by creating your first battle in the Team Generator'}
                </p>
              </div>
            )}
          </div>

          {/* Battle Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Battle Details</h2>
            {selectedBattle ? (
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      {selectedBattle.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Created on {formatDate(selectedBattle.created_at)}
                    </p>
                  </CardHeader>
                </Card>
                
                {selectedBattle.team1 && selectedBattle.team2 ? (
                  <TeamDisplay 
                    teams={[selectedBattle.team1, selectedBattle.team2]}
                    isDraggable={false}
                  />
                ) : (
                  <Card className="bg-card border-border">
                    <CardContent className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">Team data not available</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a battle to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}