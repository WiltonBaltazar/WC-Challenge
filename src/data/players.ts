import type { Player } from '../types';
import squads from './squads.json';

const SQUADS: Record<string, Record<string, { names: string[], positions: string[][], ratings: number[] }>> = squads;

const flattenSquads = (): Player[] => {
  return Object.entries(SQUADS).flatMap(([decade, nations]) => 
    Object.entries(nations).flatMap(([nation, squadData]) => 
      squadData.names.map((name, i) => ({
        id: `${decade}-${nation}-${i}`,
        name: name,
        club: nation, // Nation is now used as club to maintain schema compatibility
        decade: decade as any,
        positions: squadData.positions[i] as any,
        rating: squadData.ratings[i]
      }))
    )
  );
};

export const PLAYERS: Player[] = flattenSquads();
export const CLUBS = Array.from(new Set(PLAYERS.map(p => p.club))); // These are now Nations
export const DECADES: string[] = ['1930s', '1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
