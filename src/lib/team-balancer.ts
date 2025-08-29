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

// Helper function to shuffle players within similar skill groups
function shuffleSimilarSkillGroups(players: Array<PlayerWithRoles & { weightedLevel: number; favoriteRole?: CSRole }>): Array<PlayerWithRoles & { weightedLevel: number; favoriteRole?: CSRole }> {
  // Group players by similar skill levels (within 2 levels)
  const groups: Array<Array<PlayerWithRoles & { weightedLevel: number; favoriteRole?: CSRole }>> = [];
  
  for (const player of players) {
    let foundGroup = false;
    for (const group of groups) {
      if (group.length > 0 && Math.abs(group[0].weightedLevel - player.weightedLevel) <= 2) {
        group.push(player);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      groups.push([player]);
    }
  }
  
  // Shuffle within each group to add randomness while maintaining skill balance
  const shuffledGroups = groups.map(group => {
    const shuffled = [...group];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });
  
  // Flatten back to single array
  return shuffledGroups.flat();
}

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

  // Add randomization to the sorting to ensure different results each time
  // Sort by weighted level but add small random variance to break ties
  playersWithWeights.sort((a, b) => {
    const levelDiff = b.weightedLevel - a.weightedLevel;
    // If levels are very close (within 0.5), add randomization
    if (Math.abs(levelDiff) < 0.5) {
      return Math.random() - 0.5;
    }
    return levelDiff;
  });

  // Shuffle players with similar skill levels to add variety
  const shuffledPlayers = shuffleSimilarSkillGroups(playersWithWeights);

  // Draft teams using randomized snake draft
  const team1: typeof shuffledPlayers = [];
  const team2: typeof shuffledPlayers = [];
  
  // Randomize the starting team and draft pattern
  let pickingTeam1 = Math.random() < 0.5;
  const maxPlayersPerTeam = options.teamSize;
  
  // Randomize the pick frequency (every 1-3 picks instead of fixed 2)
  const pickFrequencies = [1, 2, 2, 3]; // Weighted towards 2, but with variety
  let currentPickFreq = pickFrequencies[Math.floor(Math.random() * pickFrequencies.length)];
  let pickCount = 0;

  for (let i = 0; i < shuffledPlayers.length; i++) {
    const player = shuffledPlayers[i];
    
    // Assign player to the team with fewer players, or use the picking order if teams are equal
    if (team1.length < maxPlayersPerTeam && team2.length < maxPlayersPerTeam) {
      // Both teams have space, use the picking order
      if (pickingTeam1) {
        team1.push(player);
      } else {
        team2.push(player);
      }
      
      pickCount++;
      // Switch teams based on randomized frequency
      if (pickCount >= currentPickFreq) {
        pickingTeam1 = !pickingTeam1;
        pickCount = 0;
        // Pick new random frequency for next round
        currentPickFreq = pickFrequencies[Math.floor(Math.random() * pickFrequencies.length)];
      }
    } else if (team1.length < maxPlayersPerTeam) {
      // Only team1 has space
      team1.push(player);
    } else if (team2.length < maxPlayersPerTeam) {
      // Only team2 has space
      team2.push(player);
    }
    // If both teams are full, stop processing
    if (team1.length >= maxPlayersPerTeam && team2.length >= maxPlayersPerTeam) {
      break;
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

  // Generate team names based on first player in each team
  const team1Name = team1.length > 0 ? `${team1[0].name} Team` : "Team Counter-Terrorists";
  const team2Name = team2.length > 0 ? `${team2[0].name} Team` : "Team Terrorists";

  const teamData = [
    {
      name: team1Name,
      total_level: team1Total,
      session_id: sessionId,
    },
    {
      name: team2Name, 
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
  
  // Shuffle the essential roles to randomize which gets priority
  const shuffledRoles = [...essentialRoles].sort(() => Math.random() - 0.5);
  
  // Ensure each team has essential roles
  for (const role of shuffledRoles) {
    const team1HasRole = team1.some(p => p.favoriteRole === role);
    const team2HasRole = team2.some(p => p.favoriteRole === role);
    
    if (!team1HasRole && !team2HasRole) continue;
    
    if (!team1HasRole) {
      // Try to swap a player with this role from team2 to team1
      const playersWithRole = team2.filter(p => p.favoriteRole === role);
      if (playersWithRole.length > 0) {
        // Randomize which player with the role to consider
        const playerWithRole = playersWithRole[Math.floor(Math.random() * playersWithRole.length)];
        const team2Index = team2.indexOf(playerWithRole);
        
        // Find potential swap candidates
        const swapCandidates = team1.filter(p => 
          Math.abs(p.weightedLevel - playerWithRole.weightedLevel) < 3
        );
        
        if (swapCandidates.length > 0) {
          // Randomize which swap candidate to use
          const swapCandidate = swapCandidates[Math.floor(Math.random() * swapCandidates.length)];
          const team1Index = team1.indexOf(swapCandidate);
          team1[team1Index] = playerWithRole;
          team2[team2Index] = swapCandidate;
        }
      }
    } else if (!team2HasRole) {
      // Try to swap a player with this role from team1 to team2
      const playersWithRole = team1.filter(p => p.favoriteRole === role);
      if (playersWithRole.length > 0) {
        // Randomize which player with the role to consider
        const playerWithRole = playersWithRole[Math.floor(Math.random() * playersWithRole.length)];
        const team1Index = team1.indexOf(playerWithRole);
        
        // Find potential swap candidates
        const swapCandidates = team2.filter(p => 
          Math.abs(p.weightedLevel - playerWithRole.weightedLevel) < 3
        );
        
        if (swapCandidates.length > 0) {
          // Randomize which swap candidate to use
          const swapCandidate = swapCandidates[Math.floor(Math.random() * swapCandidates.length)];
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