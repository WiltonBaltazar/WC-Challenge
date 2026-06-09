import type { Player, MatchResult, LeagueTableEntry } from './types';
import { PLAYERS } from './data/players';
import { FORMATIONS } from './data/formations';

export class WorldCupSimulationEngine {
  static calculateStandings(results: MatchResult[]): Record<string, LeagueTableEntry[]> {
    const groupStandings: Record<string, LeagueTableEntry[]> = {};
    const groupMatches: Record<string, MatchResult[]> = {};

    // Group results by stage (which we assume contains the group name like "Group A")
    results.forEach(match => {
      if (match.stage.startsWith('Group')) {
        const groupName = match.stage;
        if (!groupMatches[groupName]) groupMatches[groupName] = [];
        groupMatches[groupName].push(match);
      }
    });

    for (const groupName in groupMatches) {
      const matches = groupMatches[groupName];
      const table: Record<string, LeagueTableEntry> = {};

      matches.forEach((match) => {
        [match.homeTeam, match.awayTeam].forEach((team) => {
          if (!table[team]) {
            table[team] = {
              teamName: team,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
            };
          }
        });

        const home = table[match.homeTeam];
        const away = table[match.awayTeam];

        home.played++;
        away.played++;
        home.goalsFor += match.homeScore;
        home.goalsAgainst += match.awayScore;
        away.goalsFor += match.awayScore;
        away.goalsAgainst += match.homeScore;
        home.goalDifference = home.goalsFor - home.goalsAgainst;
        away.goalDifference = away.goalsFor - away.goalsAgainst;

        if (match.homeScore > match.awayScore) {
          home.won++;
          home.points += 3;
          away.lost++;
        } else if (match.homeScore < match.awayScore) {
          away.won++;
          away.points += 3;
          home.lost++;
        } else {
          home.drawn++;
          home.points += 1;
          away.drawn++;
          away.points += 1;
        }
      });

      const entries = Object.values(table);

      // FIFA Tiebreakers logic
      groupStandings[groupName] = entries.sort((a, b) => {
        // 1. Points
        if (b.points !== a.points) return b.points - a.points;

        // Find all teams tied on points
        const tiedTeams = entries.filter(e => e.points === a.points);
        if (tiedTeams.length > 1) {
          const h2hMatches = matches.filter(m => 
            tiedTeams.some(t => t.teamName === m.homeTeam) && 
            tiedTeams.some(t => t.teamName === m.awayTeam)
          );

          // 2. Head-to-head points
          const h2hA = this.getTeamH2HStats(a.teamName, h2hMatches);
          const h2hB = this.getTeamH2HStats(b.teamName, h2hMatches);
          if (h2hB.points !== h2hA.points) return h2hB.points - h2hA.points;

          // 3. Head-to-head goal difference
          if (h2hB.gd !== h2hA.gd) return h2hB.gd - h2hA.gd;

          // 4. Head-to-head goals scored
          if (h2hB.gs !== h2hA.gs) return h2hB.gs - h2hA.gs;
        }

        // 5. Overall goal difference
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;

        // 6. Overall goals scored
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

        // 7. Random fallback
        return Math.random() - 0.5;
      });
    }

    return groupStandings;
  }

  private static getTeamH2HStats(teamName: string, h2hMatches: MatchResult[]) {
    let points = 0, gs = 0, ga = 0;
    h2hMatches.forEach(m => {
      if (m.homeTeam === teamName) {
        gs += m.homeScore;
        ga += m.awayScore;
        if (m.homeScore > m.awayScore) points += 3;
        else if (m.homeScore === m.awayScore) points += 1;
      } else if (m.awayTeam === teamName) {
        gs += m.awayScore;
        ga += m.homeScore;
        if (m.awayScore > m.homeScore) points += 3;
        else if (m.awayScore === m.homeScore) points += 1;
      }
    });
    return { points, gs, gd: gs - ga };
  }

  static getAdvancedTeams(allGroupStandings: Record<string, LeagueTableEntry[]>): string[] {
    const topTwo: string[] = [];
    const thirdPlaced: LeagueTableEntry[] = [];

    Object.values(allGroupStandings).forEach(standings => {
      if (standings.length >= 1) topTwo.push(standings[0].teamName);
      if (standings.length >= 2) topTwo.push(standings[1].teamName);
      if (standings.length >= 3) thirdPlaced.push(standings[2]);
    });

    // Rank 3rd placed teams
    const bestThird = thirdPlaced.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return Math.random() - 0.5;
    }).slice(0, 8).map(t => t.teamName);

    return [...topTwo, ...bestThird];
  }

  static simulateMatch(
    playerSquad: Player[], 
    opponentName: string, 
    opponentRating: number, 
    stage: string, 
    isPlayerHome: boolean,
    isKnockout: boolean = false
  ): MatchResult {
    const playerAvgRating = (playerSquad.reduce((acc, p) => acc + (p?.rating || 0), 0) / 11) + (this.calculateChemistry(playerSquad) / 10);
    const winProb = this.calculateWinProbability(playerAvgRating, opponentRating);
    const opponentFormation = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)].name;
    
    let homeScore = 0, awayScore = 0;
    let wentToExtraTime = false;
    let penaltyOutcome: MatchResult['penaltyOutcome'] | undefined;

    // Regular 90 minutes
    const result90 = this.rollMatch(winProb, isPlayerHome);
    homeScore = result90.homeScore;
    awayScore = result90.awayScore;

    if (isKnockout && homeScore === awayScore) {
      wentToExtraTime = true;
      // Extra time: 30 minutes (represented by a secondary minor roll)
      // Reducing standard goal chances for ET
      const etResult = this.rollMatch(winProb, isPlayerHome, 0.3); 
      homeScore += etResult.homeScore;
      awayScore += etResult.awayScore;

      if (homeScore === awayScore) {
        // Penalties
        const playerWinsPenalties = Math.random() < winProb; // Use winProb as a base for penalty luck
        const winnerPens = 5 + Math.floor(Math.random() * 3);
        const loserPens = winnerPens - (Math.floor(Math.random() * 2) + 1);
        
        // const playerIsHome = (isPlayerHome && 'Your Team' === 'Your Team'); // Simplification
        
        penaltyOutcome = {
          playerWin: playerWinsPenalties,
          homePenalties: isPlayerHome ? (playerWinsPenalties ? winnerPens : loserPens) : (playerWinsPenalties ? loserPens : winnerPens),
          awayPenalties: isPlayerHome ? (playerWinsPenalties ? loserPens : winnerPens) : (playerWinsPenalties ? winnerPens : loserPens)
        };
      }
    }

    const playerActualScore = isPlayerHome ? homeScore : awayScore;
    const opponentActualScore = isPlayerHome ? awayScore : homeScore;
    
    let isPlayerWin: boolean;
    if (penaltyOutcome) {
      isPlayerWin = penaltyOutcome.playerWin;
    } else {
      isPlayerWin = playerActualScore > opponentActualScore;
    }

    const homeScorers = isPlayerHome 
        ? this.pickScorers(playerSquad, homeScore)
        : this.pickOpponentScorers(opponentName, homeScore);
    
    const awayScorers = isPlayerHome
        ? this.pickOpponentScorers(opponentName, awayScore)
        : this.pickScorers(playerSquad, awayScore);

    return {
      homeTeam: isPlayerHome ? 'Your Team' : opponentName,
      awayTeam: isPlayerHome ? opponentName : 'Your Team',
      homeScore,
      awayScore,
      homeScorers,
      awayScorers,
      isPlayerWin,
      stage,
      opponentFormation,
      wentToExtraTime,
      penaltyOutcome
    };
  }

  private static rollMatch(winProb: number, isPlayerHome: boolean, factor: number = 1.0): { homeScore: number, awayScore: number } {
    const random = Math.random();
    let pScore = 0, oScore = 0;

    if (random < winProb) {
        pScore = Math.floor(Math.random() * (3 * factor + 1));
        oScore = Math.max(0, pScore - (Math.floor(Math.random() * 2)));
    } else {
        oScore = Math.floor(Math.random() * (3 * factor + 1));
        pScore = Math.max(0, oScore - (Math.floor(Math.random() * 2)));
    }

    return {
      homeScore: isPlayerHome ? pScore : oScore,
      awayScore: isPlayerHome ? oScore : pScore
    };
  }

  static pickScorers(squad: Player[], goalCount: number): string[] {
    const scorers: string[] = [];
    const attackers = squad.filter(p => p && p.positions.some(pos => ['ST', 'CF', 'LW', 'RW', 'CAM', 'LM', 'RM'].includes(pos)));
    const others = squad.filter(p => p && !attackers.includes(p));

    for (let i = 0; i < goalCount; i++) {
        const rand = Math.random();
        if (rand < 0.8 && attackers.length > 0) {
            scorers.push(attackers[Math.floor(Math.random() * attackers.length)].name);
        } else if (others.length > 0) {
            const nonGK = others.filter(p => !p.positions.includes('GK'));
            if (nonGK.length > 0 && Math.random() < 0.98) {
                scorers.push(nonGK[Math.floor(Math.random() * nonGK.length)].name);
            } else {
                scorers.push(others[Math.floor(Math.random() * others.length)].name);
            }
        } else if (attackers.length > 0) {
             scorers.push(attackers[Math.floor(Math.random() * attackers.length)].name);
        }
    }
    return scorers;
  }

  static pickOpponentScorers(nationName: string, goalCount: number): string[] {
      // Assuming data imports exist for nations similar to CLUBS
      // We'll reuse PLAYERS data but filter by nation (if we had a nation field, 
      // otherwise we use club as a proxy or assume nationName is a club for now)
      // The prompt says "assume data imports exist for nations similar to CLUBS"
      const nationPlayers = PLAYERS.filter(p => p.club === nationName);
      if (nationPlayers.length === 0) return Array(goalCount).fill(`${nationName} Player`);
      return this.pickScorers(nationPlayers, goalCount);
  }

  static calculateWinProbability(playerRating: number, opponentRating: number): number {
    const diff = playerRating - opponentRating;
    const biasedDiff = diff + 5.0;
    return 1 / (1 + Math.pow(10, -biasedDiff / 25));
  }

  static calculateChemistry(squad: Player[]): number {
    let chemistry = 0;
    for (let i = 0; i < squad.length; i++) {
      for (let j = i + 1; j < squad.length; j++) {
        if (squad[i] && squad[j]) {
          // In a World Cup context, "club" might be used for Nation if the data was adapted.
          // But prompt says "based on Nation/Decade pairings". 
          // Assuming the Player type has a 'club' field which we use for Nation.
          if (squad[i].club === squad[j].club) chemistry += 2; 
          if (squad[i].decade === squad[j].decade) chemistry += 1;
        }
      }
    }
    return Math.min(chemistry, 50);
  }

  static getUniqueOpponents(count: number, excludedNames: string[] = []): { name: string; rating: number }[] {
    const nations = Array.from(new Set(PLAYERS.map(p => p.club))); // Proxy nations from player data
    
    // Filter out already played opponents
    const availableNations = nations.filter(n => !excludedNames.includes(n));
    
    const allPotential = availableNations.map(name => ({ name, rating: 82 })); // Simplified rating logic
    
    // Shuffle and pick
    return allPotential.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  // Bracket Helpers
  static getBracketStage(teams: string[]): { home: string, away: string }[] {
    const matches: { home: string, away: string }[] = [];
    for (let i = 0; i < teams.length; i += 2) {
      matches.push({ home: teams[i], away: teams[i+1] });
    }
    return matches;
  }
}
