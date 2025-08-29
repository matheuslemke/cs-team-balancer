import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayerWithRoles } from "@/types/cs-types";
import { CS_ROLES } from "@/types/cs-types";
import { Edit, Trash2, Star } from "lucide-react";

interface PlayerCardProps {
  player: PlayerWithRoles;
  onEdit: (player: PlayerWithRoles) => void;
  onDelete: (playerId: string) => void;
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const favoriteRole = player.player_roles.find(role => role.is_favorite);
  const roleLabels = CS_ROLES.reduce((acc, role) => ({ ...acc, [role.value]: role.label }), {});

  return (
    <Card className="bg-card border-border hover:border-cs-blue/50 transition-all duration-300 hover:shadow-glow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-foreground">
          <span className="text-lg">{player.name}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(player)}
              className="h-8 w-8 p-0 hover:bg-cs-blue/20 hover:text-cs-blue"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(player.id)}
              className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Overall Level</span>
          <Badge variant="secondary" className="text-primary-foreground font-semibold">
            {player.overall_level}/20
          </Badge>
        </div>
        
        {favoriteRole && (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-cs-orange fill-current" />
            <span className="text-sm text-muted-foreground">Favorite Role:</span>
            <Badge variant="outline" className="border-cs-orange text-cs-orange">
              {roleLabels[favoriteRole.role as keyof typeof roleLabels]}
            </Badge>
          </div>
        )}
        
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Roles:</span>
          <div className="flex flex-wrap gap-1">
            {player.player_roles.length > 0 ? (
              player.player_roles.map((role) => (
                <Badge
                  key={role.role}
                  variant="outline"
                  className={`text-xs ${
                    role.is_favorite
                      ? 'border-cs-orange text-cs-orange bg-cs-orange/10'
                      : 'border-muted text-muted-foreground'
                  }`}
                >
                  {roleLabels[role.role as keyof typeof roleLabels]} ({role.level})
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">No roles assigned</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}