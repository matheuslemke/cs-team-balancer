import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Team } from "@/types/cs-types";
import { CS_ROLES } from "@/types/cs-types";
import { Users, Trophy } from "lucide-react";

interface TeamDisplayProps {
  teams: Team[];
}

export function TeamDisplay({ teams }: TeamDisplayProps) {
  if (teams.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No teams generated yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoleLabel = (role: string) => CS_ROLES.find(r => r.value === role)?.label || role;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {teams.map((team, index) => (
        <Card key={team.id} className="bg-card border-border hover:border-cs-blue/50 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className={`p-2 rounded-full ${index === 0 ? 'bg-cs-blue/20' : 'bg-cs-orange/20'}`}>
                <Trophy className={`h-5 w-5 ${index === 0 ? 'text-cs-blue' : 'text-cs-orange'}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold">{team.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default" className="text-primary-foreground">
                    Total Level: {team.total_level}
                  </Badge>
                  <Badge variant="outline" className="border-muted">
                    {team.players.length} players
                  </Badge>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.players.map((teamPlayer) => (
              <div
                key={teamPlayer.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">
                    {teamPlayer.player.name}
                  </span>
                  <Badge variant="outline" className="border-cs-blue text-cs-blue">
                    Level {teamPlayer.player.overall_level}
                  </Badge>
                </div>
                {teamPlayer.assigned_role && (
                  <Badge
                    variant="outline"
                    className="border-cs-orange text-cs-orange bg-cs-orange/10"
                  >
                    {getRoleLabel(teamPlayer.assigned_role)}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}