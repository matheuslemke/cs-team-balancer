import { PlayerWithRoles, CSRole, Team } from "@/types/cs-types";

export interface BalancingOptions {
  teamSize: number;
  prioritizeRoles: boolean;
  roleWeights: Record<CSRole, number>;
}

export const defaultBalancingOptions: BalancingOptions = {
  teamSize: 5,
  prioritizeRoles: true,
  roleWeights: {
    awp: 1.2,
    igl: 1.3,
    entry_fragger: 1.1,
    support: 1.0,
    lurker: 1.0,
  },
};

export function generateBalancedTeams(
  players: PlayerWithRoles[],
  options: BalancingOptions = defaultBalancingOptions
): { team1: PlayerWithRoles[]; team2: PlayerWithRoles[]; teamData: Pick<Team, 'name' | 'total_level' | 'session_id'>[] } {
  if (players.length < options.teamSize * 2) {
    throw new Error(`Need at least ${options.teamSize * 2} players to create teams`);
  }

  // Calculate weighted levels for each player based on their favorite role
  const playersWithWeights = players.map(player => {
    const favoriteRole = player.player_roles.find(role => role.is_favorite);
    const weight = favoriteRole ? options.roleWeights[favoriteRole.role] : 1.0;
    const weightedLevel = player.overall_level * weight;
    
    return {
      ...player,
      weightedLevel,
      favoriteRole: favoriteRole?.role
    };
  });

  // Sort players by weighted level (descending)
  playersWithWeights.sort((a, b) => b.weightedLevel - a.weightedLevel);

  // Draft teams alternating picks (snake draft)
  const team1: typeof playersWithWeights = [];
  const team2: typeof playersWithWeights = [];
  
  let pickingTeam1 = true;
  const maxPlayersPerTeam = options.teamSize;

  for (let i = 0; i < players.length && team1.length < maxPlayersPerTeam && team2.length < maxPlayersPerTeam; i++) {
    const player = playersWithWeights[i];
    
    if (pickingTeam1 && team1.length < maxPlayersPerTeam) {
      team1.push(player);
    } else if (!pickingTeam1 && team2.length < maxPlayersPerTeam) {
      team2.push(player);
    }
    
    // Switch teams every 2 picks for better balance
    if ((i + 1) % 2 === 0) {
      pickingTeam1 = !pickingTeam1;
    }
  }

  // If prioritizing roles, try to optimize role distribution
  if (options.prioritizeRoles) {
    optimizeRoleDistribution(team1, team2);
  }

  // Calculate team totals
  const team1Total = team1.reduce((sum, p) => sum + p.overall_level, 0);
  const team2Total = team2.reduce((sum, p) => sum + p.overall_level, 0);

  // Generate session ID
  const sessionId = crypto.randomUUID();

  const teamData = [
    {
      name: "Team Counter-Terrorists",
      total_level: team1Total,
      session_id: sessionId,
    },
    {
      name: "Team Terrorists", 
      total_level: team2Total,
      session_id: sessionId,
    }
  ];

  return {
    team1: team1.map(({ weightedLevel, favoriteRole, ...player }) => player),
    team2: team2.map(({ weightedLevel, favoriteRole, ...player }) => player),
    teamData
  };
}

function optimizeRoleDistribution(
  team1: Array<PlayerWithRoles & { weightedLevel: number; favoriteRole?: CSRole }>,
  team2: Array<PlayerWithRoles & { weightedLevel: number; favoriteRole?: CSRole }>
) {
  const essentialRoles: CSRole[] = ['awp', 'igl'];
  
  // Ensure each team has essential roles
  for (const role of essentialRoles) {
    const team1HasRole = team1.some(p => p.favoriteRole === role);
    const team2HasRole = team2.some(p => p.favoriteRole === role);
    
    if (!team1HasRole && !team2HasRole) continue;
    
    if (!team1HasRole) {
      // Try to swap a player with this role from team2 to team1
      const playerWithRole = team2.find(p => p.favoriteRole === role);
      if (playerWithRole) {
        const team2Index = team2.indexOf(playerWithRole);
        const swapCandidate = team1.find(p => 
          Math.abs(p.weightedLevel - playerWithRole.weightedLevel) < 2
        );
        
        if (swapCandidate) {
          const team1Index = team1.indexOf(swapCandidate);
          team1[team1Index] = playerWithRole;
          team2[team2Index] = swapCandidate;
        }
      }
    } else if (!team2HasRole) {
      // Try to swap a player with this role from team1 to team2
      const playerWithRole = team1.find(p => p.favoriteRole === role);
      if (playerWithRole) {
        const team1Index = team1.indexOf(playerWithRole);
        const swapCandidate = team2.find(p => 
          Math.abs(p.weightedLevel - playerWithRole.weightedLevel) < 2
        );
        
        if (swapCandidate) {
          const team2Index = team2.indexOf(swapCandidate);
          team2[team2Index] = playerWithRole;
          team1[team1Index] = swapCandidate;
        }
      }
    }
  }
}

export function getTeamBalance(team1Total: number, team2Total: number): {
  difference: number;
  isBalanced: boolean;
  balancePercentage: number;
} {
  const difference = Math.abs(team1Total - team2Total);
  const average = (team1Total + team2Total) / 2;
  const balancePercentage = Math.max(0, 100 - (difference / average) * 100);
  const isBalanced = difference <= 5; // Teams are balanced if within 5 levels

  return {
    difference,
    isBalanced,
    balancePercentage: Math.round(balancePercentage)
  };
}