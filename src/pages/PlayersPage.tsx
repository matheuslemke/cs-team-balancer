import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlayerCard } from "@/components/PlayerCard";
import { PlayerForm, PlayerFormData } from "@/components/PlayerForm";
import { PlayerWithRoles } from "@/types/cs-types";
import { playersApi, playerRolesApi } from "@/lib/supabase-queries";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users } from "lucide-react";

export function PlayersPage() {
  const [players, setPlayers] = useState<PlayerWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerWithRoles | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const data = await playersApi.getAll();
      setPlayers(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading players",
        description: "Failed to load players from database"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPlayer = async (data: PlayerFormData) => {
    setIsSubmitting(true);
    try {
      let player: PlayerWithRoles;
      
      if (editingPlayer) {
        // Update existing player
        const updatedPlayer = await playersApi.update(editingPlayer.id, {
          name: data.name,
          overall_level: data.overall_level
        });
        
        // Delete existing roles and add new ones
        for (const existingRole of editingPlayer.player_roles) {
          await playerRolesApi.delete(editingPlayer.id, existingRole.role);
        }
        
        const newRoles = [];
        for (const role of data.roles) {
          const newRole = await playerRolesApi.upsert({
            player_id: editingPlayer.id,
            role: role.role,
            level: role.level,
            is_favorite: role.is_favorite
          });
          newRoles.push(newRole);
        }
        
        player = { ...updatedPlayer, player_roles: newRoles };
        
        toast({
          title: "Player updated",
          description: `${data.name} has been updated successfully`
        });
      } else {
        // Create new player
        const newPlayer = await playersApi.create({
          name: data.name,
          overall_level: data.overall_level
        });
        
        const roles = [];
        for (const role of data.roles) {
          const newRole = await playerRolesApi.upsert({
            player_id: newPlayer.id,
            role: role.role,
            level: role.level,
            is_favorite: role.is_favorite
          });
          roles.push(newRole);
        }
        
        player = { ...newPlayer, player_roles: roles };
        
        toast({
          title: "Player created",
          description: `${data.name} has been added to the team`
        });
      }
      
      // Refresh the players list
      await loadPlayers();
      setIsFormOpen(false);
      setEditingPlayer(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving player",
        description: "Failed to save player to database"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPlayer = (player: PlayerWithRoles) => {
    setEditingPlayer(player);
    setIsFormOpen(true);
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await playersApi.delete(playerId);
      await loadPlayers();
      toast({
        title: "Player deleted",
        description: "Player has been removed from the team"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting player",
        description: "Failed to delete player from database"
      });
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Players Management</h1>
              <p className="text-muted-foreground">Manage your Counter-Strike team roster</p>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setEditingPlayer(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-popover">
                <DialogHeader>
                  <DialogTitle className="text-popover-foreground">
                    {editingPlayer ? 'Edit Player' : 'Add New Player'}
                  </DialogTitle>
                </DialogHeader>
                <PlayerForm
                  player={editingPlayer}
                  onSubmit={handleSubmitPlayer}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setEditingPlayer(null);
                  }}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{filteredPlayers.length} players</span>
            </div>
          </div>

          {filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onEdit={handleEditPlayer}
                  onDelete={handleDeletePlayer}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No players found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No players match your search criteria' : 'Get started by adding your first player'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Player
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
  );
}