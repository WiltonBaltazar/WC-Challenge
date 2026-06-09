export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'LWB' | 'RWB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST' | 'CF';
export type Decade = '1930s' | '1940s' | '1950s' | '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s';
export type Club = string;

export interface Player {
  id: string;
  name: string;
  club: Club;
  decade: Decade;
  positions: Position[]; // Changed from single position to array
  rating: number;
  image?: string;
}

export type FormationType = '4-3-3' | '4-3-3 (False 9)' | '4-4-2' | '4-4-2 (Diamond)' | '3-5-2' | '4-2-3-1' | '4-1-2-1-2' | '3-4-3' | '4-5-1' | '4-1-4-1' | '3-4-2-1' | '5-3-2';

export interface Formation {
  name: FormationType;
  positions: {
    id: number;
    type: Position;
    top: string; // Percentage for CSS positioning
    left: string; // Percentage for CSS positioning
    label: string;
  }[];
}

export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeScorers?: string[];
  awayScorers?: string[];
  isPlayerWin: boolean;
  stage: string;
  opponentFormation?: string;
  penaltyOutcome?: { playerWin: boolean; homePenalties: number; awayPenalties: number };
  wentToExtraTime?: boolean;
}

export type WorldCupStage = 
  | 'GROUP_STAGE' 
  | 'ROUND_OF_32' 
  | 'ROUND_OF_16' 
  | 'QUARTER_FINAL' 
  | 'SEMI_FINAL' 
  | 'THIRD_PLACE_PLAYOFF' 
  | 'FINAL';

export interface LeagueTableEntry {
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GameState {
  status: 'START' | 'FORMATION_SELECT' | 'DRAFT' | 'SIMULATION' | 'RESULTS';
  mode: 'CLASSIC' | 'BALL_KNOWLEDGE';
  formation: Formation | null;
  squad: (Player | null)[];
  results: MatchResult[];
  leagueTable: LeagueTableEntry[];
  leagueOpponents?: { name: string; rating: number }[];
  currentStage: 'LEAGUE' | 'PLAYOFF' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';
  eliminatedBy?: string;
  tournamentWinner?: string;
}
