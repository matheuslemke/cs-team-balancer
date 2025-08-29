import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamDisplay } from "@/components/TeamDisplay";
import { PlayerWithRoles, Team } from "@/types/cs-types";
import { playersApi, teamsApi } from "@/lib/supabase-queries";
import { generateBalancedTeams, getTeamBalance, defaultBalancingOptions } from "@/lib/team-balancer";
import { useToast } from "@/hooks/use-toast";
import { Shuffle, Save, Users, TrendingUp } from "lucide-react";

export function TeamsPage() {
  const [players, setPlayers] = useState<PlayerWithRoles[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
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
    if (players.length < 10) {
      toast({
        variant: "destructive",
        title: "Not enough players",
        description: "You need at least 10 players to generate balanced teams"
      });
      return;
    }

    setGenerating(true);
    try {
      const result = generateBalancedTeams(players, defaultBalancingOptions);
      
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
                      {players.length} players available
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
                  <Button
                    onClick={handleGenerateTeams}
                    disabled={generating || players.length < 10}
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

          <TeamDisplay teams={teams} />
        </div>
      </div>
    </div>
  );
}