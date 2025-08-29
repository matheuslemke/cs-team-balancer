import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Team, PlayerWithRoles } from "@/types/cs-types";
import { CS_ROLES } from "@/types/cs-types";
import { Users, Trophy, GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface TeamDisplayProps {
  teams: Team[];
  onTeamsChange?: (teams: Team[]) => void;
  isDraggable?: boolean;
  playersData?: PlayerWithRoles[]; // Original players with roles for reference
}

export function TeamDisplay({ teams, onTeamsChange, isDraggable = false, playersData = [] }: TeamDisplayProps) {
  const [activePlayer, setActivePlayer] = useState<{ player: PlayerWithRoles; teamId: string } | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const playerId = active.id as string;
    
    // Find the player being dragged from playersData
    const playerWithRoles = playersData.find(p => p.id === playerId);
    if (playerWithRoles) {
      const team = teams.find(t => t.players.some(p => p.player.id === playerId));
      if (team) {
        setActivePlayer({ player: playerWithRoles, teamId: team.id });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayer(null);
    
    if (!over || !onTeamsChange) return;
    
    const activePlayerId = active.id as string;
    const overPlayerId = over.id as string;
    
    // If dropping on the same player, do nothing
    if (activePlayerId === overPlayerId) return;
    
    // Find source and target teams
    let sourceTeamIndex = -1;
    let targetTeamIndex = -1;
    let sourcePlayerIndex = -1;
    let targetPlayerIndex = -1;
    
    // Find the source player
    teams.forEach((team, teamIndex) => {
      const playerIndex = team.players.findIndex(p => p.player.id === activePlayerId);
      if (playerIndex !== -1) {
        sourceTeamIndex = teamIndex;
        sourcePlayerIndex = playerIndex;
      }
    });
    
    // Find the target position
    teams.forEach((team, teamIndex) => {
      const playerIndex = team.players.findIndex(p => p.player.id === overPlayerId);
      if (playerIndex !== -1) {
        targetTeamIndex = teamIndex;
        targetPlayerIndex = playerIndex;
      }
    });
    
    if (sourceTeamIndex === -1 || targetTeamIndex === -1) return;
    
    const newTeams = [...teams];
    const sourcePlayer = newTeams[sourceTeamIndex].players[sourcePlayerIndex];
    const targetPlayer = newTeams[targetTeamIndex].players[targetPlayerIndex];
    
    // Swap players between teams or reorder within team
    if (sourceTeamIndex === targetTeamIndex) {
      // Reorder within the same team
      newTeams[sourceTeamIndex].players.splice(sourcePlayerIndex, 1);
      newTeams[targetTeamIndex].players.splice(targetPlayerIndex, 0, sourcePlayer);
    } else {
      // Swap players between different teams
      newTeams[sourceTeamIndex].players[sourcePlayerIndex] = {
        ...targetPlayer,
        team_id: newTeams[sourceTeamIndex].id
      };
      newTeams[targetTeamIndex].players[targetPlayerIndex] = {
        ...sourcePlayer,
        team_id: newTeams[targetTeamIndex].id
      };
      
      // Recalculate team totals
      newTeams[sourceTeamIndex].total_level = newTeams[sourceTeamIndex].players.reduce(
        (sum, p) => sum + p.player.overall_level, 0
      );
      newTeams[targetTeamIndex].total_level = newTeams[targetTeamIndex].players.reduce(
        (sum, p) => sum + p.player.overall_level, 0
      );
    }
    
    onTeamsChange(newTeams);
  };
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

  const content = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {teams.map((team, index) => (
        <TeamCard 
          key={team.id} 
          team={team} 
          index={index} 
          isDraggable={isDraggable}
          playersData={playersData}
        />
      ))}
    </div>
  );

  if (isDraggable) {
    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {content}
        <DragOverlay>
          {activePlayer ? (
            <DraggablePlayerCard
              player={activePlayer.player}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return content;
}

interface TeamCardProps {
  team: Team;
  index: number;
  isDraggable: boolean;
  playersData: PlayerWithRoles[];
}

function TeamCard({ team, index, isDraggable, playersData }: TeamCardProps) {
  const getRoleLabel = (role: string) => CS_ROLES.find(r => r.value === role)?.label || role;
  
  const playerIds = team.players.map(p => p.player.id);

  return (
    <Card className="bg-card border-border hover:border-cs-blue/50 transition-all duration-300">
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
        {isDraggable ? (
          <SortableContext items={playerIds} strategy={verticalListSortingStrategy}>
            {team.players.map((teamPlayer) => {
              const playerWithRoles = playersData.find(p => p.id === teamPlayer.player.id);
              return playerWithRoles ? (
                <DraggablePlayerCard
                  key={teamPlayer.player.id}
                  player={playerWithRoles}
                  assignedRole={teamPlayer.assigned_role}
                  getRoleLabel={getRoleLabel}
                />
              ) : null;
            })}
          </SortableContext>
        ) : (
          team.players.map((teamPlayer) => (
            <div
              key={teamPlayer.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground">
                  {teamPlayer.player.name}
                </span>
                <Badge variant="outline" className="border-foreground text-foreground">
                  Level {teamPlayer.player.overall_level}
                </Badge>
              </div>
              {teamPlayer.assigned_role && (
                <Badge
                  variant="outline"
                  className="border-foreground text-foreground bg-muted/50"
                >
                  {getRoleLabel(teamPlayer.assigned_role)}
                </Badge>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface DraggablePlayerCardProps {
  player: PlayerWithRoles;
  assignedRole?: string;
  getRoleLabel?: (role: string) => string;
  isDragging?: boolean;
}

function DraggablePlayerCard({ player, assignedRole, getRoleLabel, isDragging = false }: DraggablePlayerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const dragIndicatorProps = isDragging ? {} : { ...listeners, ...attributes };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer transition-all ${
        isSortableDragging ? 'shadow-lg scale-105' : 'hover:bg-muted/80'
      } ${isDragging ? 'shadow-2xl border-2 border-primary bg-background' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div 
          {...dragIndicatorProps}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted-foreground/10 rounded transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="font-medium text-foreground">
          {player.name}
        </span>
        <Badge variant="outline" className="border-foreground text-foreground">
          Level {player.overall_level}
        </Badge>
      </div>
      {assignedRole && getRoleLabel && (
        <Badge
          variant="outline"
          className="border-foreground text-foreground bg-muted/50"
        >
          {getRoleLabel(assignedRole)}
        </Badge>
      )}
    </div>
  );
}