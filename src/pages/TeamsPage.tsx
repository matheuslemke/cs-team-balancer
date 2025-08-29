import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { TeamDisplay } from "@/components/TeamDisplay";
import { PlayerWithRoles, Team } from "@/types/cs-types";
import { playersApi, teamsApi } from "@/lib/supabase-queries";
import { generateBalancedTeams, getTeamBalance, defaultBalancingOptions } from "@/lib/team-balancer";
import { useToast } from "@/hooks/use-toast";
import { Shuffle, Save, Users, TrendingUp, Search, CheckCircle2, Circle } from "lucide-react";

export function TeamsPage() {
  const [players, setPlayers] = useState<PlayerWithRoles[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const playersData = await playersApi.getAll();
      setPlayers(playersData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "Failed to load players from database"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTeams = async () => {
    if (selectedPlayerIds.size !== 10) {
      toast({
        variant: "destructive",
        title: "Invalid selection",
        description: "You must select exactly 10 players to generate balanced teams"
      });
      return;
    }

    const selectedPlayers = players.filter(player => selectedPlayerIds.has(player.id));
    
    setGenerating(true);
    try {
      const result = generateBalancedTeams(selectedPlayers, defaultBalancingOptions);
      
      // Clear previous session if exists
      if (currentSessionId) {
        await teamsApi.deleteBySession(currentSessionId);
      }

      // Create new teams in database
      await teamsApi.createTeams(result.teamData);
      
      // Create team players
      const team1Players = result.team1.map(player => ({
        team_id: '', // Will be filled after getting team IDs
        player_id: player.id,
      }));
      
      const team2Players = result.team2.map(player => ({
        team_id: '', // Will be filled after getting team IDs
        player_id: player.id,
      }));

      // Get the created teams to get their IDs
      const sessionId = result.teamData[0].session_id;
      const createdTeams = await teamsApi.getBySession(sessionId);
      
      if (createdTeams.length >= 2) {
        // Update team IDs and create team players
        const allTeamPlayers = [
          ...team1Players.map(tp => ({ ...tp, team_id: createdTeams[0].id })),
          ...team2Players.map(tp => ({ ...tp, team_id: createdTeams[1].id }))
        ];
        
        await teamsApi.createTeamPlayers(allTeamPlayers);
        
        // Load the complete teams with players
        const finalTeams = await teamsApi.getBySession(sessionId);
        setTeams(finalTeams);
        setCurrentSessionId(sessionId);
        
        const balance = getTeamBalance(
          result.teamData[0].total_level,
          result.teamData[1].total_level
        );
        
        toast({
          title: "Teams generated successfully!",
          description: `Balance: ${balance.balancePercentage}% (${balance.isBalanced ? 'Balanced' : 'Needs adjustment'})`
        });
        
        setShowPlayerSelection(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error generating teams",
        description: "Failed to generate balanced teams"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePlayerToggle = (playerId: string) => {
    const newSelection = new Set(selectedPlayerIds);
    if (newSelection.has(playerId)) {
      newSelection.delete(playerId);
    } else if (newSelection.size < 10) {
      newSelection.add(playerId);
    } else {
      toast({
        variant: "destructive",
        title: "Maximum players selected",
        description: "You can only select up to 10 players"
      });
      return;
    }
    setSelectedPlayerIds(newSelection);
  };

  const handleSelectAll = () => {
    if (filteredPlayers.length <= 10) {
      setSelectedPlayerIds(new Set(filteredPlayers.map(p => p.id)));
    } else {
      toast({
        variant: "destructive",
        title: "Too many players",
        description: "Cannot select all - limit is 10 players. Please filter or select manually."
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedPlayerIds(new Set());
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBalanceInfo = () => {
    if (teams.length < 2) return null;
    
    const team1Total = teams[0].total_level;
    const team2Total = teams[1].total_level;
    return getTeamBalance(team1Total, team2Total);
  };

  const balanceInfo = getBalanceInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Team Generator</h1>
              <p className="text-muted-foreground">Generate balanced Counter-Strike teams</p>
            </div>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Team Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {selectedPlayerIds.size}/10 players selected
                    </span>
                  </div>
                  {balanceInfo && (
                    <Badge 
                      variant={balanceInfo.isBalanced ? "default" : "destructive"}
                      className={balanceInfo.isBalanced ? "bg-green-600" : ""}
                    >
                      {balanceInfo.balancePercentage}% balanced
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {!showPlayerSelection && (
                    <Button
                      onClick={() => setShowPlayerSelection(true)}
                      disabled={players.length < 10}
                      variant="outline"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Select Players
                    </Button>
                  )}
                  <Button
                    onClick={handleGenerateTeams}
                    disabled={generating || selectedPlayerIds.size !== 10}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Shuffle className="h-4 w-4 mr-2" />
                        Generate Teams
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {players.length < 10 && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    You need at least 10 players to generate balanced teams. 
                    Currently you have {players.length} players.
                  </p>
                </div>
              )}

              {selectedPlayerIds.size !== 10 && players.length >= 10 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Please select exactly 10 players to generate teams. 
                    Currently selected: {selectedPlayerIds.size} players.
                  </p>
                </div>
              )}

              {balanceInfo && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Team 1 Total</div>
                    <div className="text-lg font-semibold text-cs-blue">
                      {teams[0]?.total_level || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Difference</div>
                    <div className="text-lg font-semibold text-foreground">
                      {balanceInfo.difference}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Team 2 Total</div>
                    <div className="text-lg font-semibold text-cs-orange">
                      {teams[1]?.total_level || 0}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {showPlayerSelection && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Player Selection ({selectedPlayerIds.size}/10)
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearSelection}
                      disabled={selectedPlayerIds.size === 0}
                    >
                      Clear All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSelectAll}
                      disabled={filteredPlayers.length > 10 || filteredPlayers.length === 0}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowPlayerSelection(false)}
                    >
                      Close
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border-border"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {filteredPlayers.map((player) => {
                    const isSelected = selectedPlayerIds.has(player.id);
                    const favoriteRole = player.player_roles.find(role => role.is_favorite);
                    
                    return (
                      <div
                        key={player.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-card border-border hover:bg-muted/50'
                        }`}
                        onClick={() => handlePlayerToggle(player.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-foreground truncate">
                                {player.name}
                              </h4>
                              <Badge variant="outline" className="ml-2">
                                {player.overall_level}
                              </Badge>
                            </div>
                            {favoriteRole && (
                              <p className="text-sm text-muted-foreground">
                                {favoriteRole.role.toUpperCase()} • Level {favoriteRole.level}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {filteredPlayers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No players found matching your search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <TeamDisplay teams={teams} />
        </div>
      </div>
    </div>
  );
}