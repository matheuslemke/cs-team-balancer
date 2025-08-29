export type CSRole = 'awp' | 'igl' | 'entry_fragger' | 'support' | 'lurker';

export interface Player {
  id: string;
  name: string;
  overall_level: number;
  created_at: string;
  updated_at: string;
}

export interface PlayerRole {
  id: string;
  player_id: string;
  role: CSRole;
  level: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlayerWithRoles extends Player {
  player_roles: PlayerRole[];
}

export interface Team {
  id: string;
  name: string;
  session_id: string;
  total_level: number;
  created_at: string;
  players: TeamPlayer[];
}

export interface TeamPlayer {
  id: string;
  team_id: string;
  player_id: string;
  assigned_role?: CSRole;
  created_at: string;
  player: Player;
}

export interface Battle {
  id: string;
  name: string;
  team1_id: string;
  team2_id: string;
  session_id: string;
  created_at: string;
  updated_at: string;
  team1?: Team;
  team2?: Team;
}

export const CS_ROLES: { value: CSRole; label: string; description: string }[] = [
  { value: 'awp', label: 'AWPer', description: 'Primary sniper, high-impact fragger' },
  { value: 'igl', label: 'IGL', description: 'In-Game Leader, caller and strategist' },
  { value: 'entry_fragger', label: 'Entry Fragger', description: 'First in, opens up rounds' },
  { value: 'support', label: 'Support', description: 'Utility player, helps teammates' },
  { value: 'lurker', label: 'Lurker', description: 'Flanker, information gatherer' },
];