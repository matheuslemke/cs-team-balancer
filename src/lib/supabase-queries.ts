import { supabase } from "@/integrations/supabase/client";
import type { Player, PlayerRole, PlayerWithRoles, Team, CSRole } from "@/types/cs-types";

export const playersApi = {
  // Get all players with their roles
  async getAll(): Promise<PlayerWithRoles[]> {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        player_roles (*)
      `)
      .order('name');
      
    if (error) throw error;
    return data || [];
  },

  // Create a new player
  async create(player: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .insert(player)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Update a player
  async update(id: string, updates: Partial<Omit<Player, 'id' | 'created_at' | 'updated_at'>>): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Delete a player
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },
};

export const playerRolesApi = {
  // Add or update a player role
  async upsert(playerRole: Omit<PlayerRole, 'id' | 'created_at' | 'updated_at'>): Promise<PlayerRole> {
    const { data, error } = await supabase
      .from('player_roles')
      .upsert(playerRole, { onConflict: 'player_id,role' })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Delete a player role
  async delete(playerId: string, role: CSRole): Promise<void> {
    const { error } = await supabase
      .from('player_roles')
      .delete()
      .eq('player_id', playerId)
      .eq('role', role);
      
    if (error) throw error;
  },
};

export const teamsApi = {
  // Create teams for a session
  async createTeams(teams: Omit<Team, 'id' | 'created_at' | 'players'>[]): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .insert(teams);
      
    if (error) throw error;
  },

  // Create team players
  async createTeamPlayers(teamPlayers: Array<{
    team_id: string;
    player_id: string;
    assigned_role?: CSRole;
  }>): Promise<void> {
    const { error } = await supabase
      .from('team_players')
      .insert(teamPlayers);
      
    if (error) throw error;
  },

  // Get teams by session
  async getBySession(sessionId: string): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_players (
          *,
          player:players (*)
        )
      `)
      .eq('session_id', sessionId)
      .order('name');
      
    if (error) throw error;
    return data?.map(team => ({
      ...team,
      players: team.team_players || []
    })) || [];
  },

  // Delete teams by session
  async deleteBySession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('session_id', sessionId);
      
    if (error) throw error;
  },
};