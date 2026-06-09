import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Zap, RefreshCw, BarChart3, ChevronRight, Share2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { BackButton } from './components/BackButton';
import * as htmlToImage from 'html-to-image';
import type { GameState, Player, Formation, MatchResult, Position, WorldCupStage } from './types';
import { FORMATIONS } from './data/formations';
import { PLAYERS } from './data/players';
import { WorldCupSimulationEngine } from './engine';
import confetti from 'canvas-confetti';

const checkPositionCompatibility = (player: Player, slot: Position) => {
  if (player.positions.includes(slot)) return true;
  const flexiblePairs = [
      ['LM', 'LW'],
      ['RM', 'RW'],
      ['CDM', 'CM'],
      ['LB', 'LWB'],
      ['RB', 'RWB'],
      ['CAM', 'CF'],
      ['ST', 'CF'],
      ['LW', 'RW'], 
      ['LW', 'RM'],
      ['RW', 'LM'],
  ];
  for (const pos of player.positions) {
      for (const pair of flexiblePairs) {
          if (pair.includes(pos) && pair.includes(slot)) return true;
      }
  }
  return false;
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    mode: 'CLASSIC',
    formation: null,
    squad: Array(11).fill(null),
    results: [],
    leagueTable: [],
    currentStage: 'LEAGUE'
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [spinResult, setSpinResult] = useState<{ club: string; decade: string } | null>(null);
  const [activeRoster, setActiveRoster] = useState<Player[]>([]);
  const [selectedPlayerToAssign, setSelectedPlayerToAssign] = useState<Player | null>(null);
  const [rerolls, setRerolls] = useState({ club: 1, decade: 1 });

  const playSound = (type: 'spin' | 'lock' | 'click' | 'fahhhhh' | 'victory') => {
    if (!audioEnabled) {
        console.log('Sound disabled');
        return;
    }
    const path = `/sounds/${type}.mp3`;
    console.log(`Attempting to play sound: ${path}`);
    const audio = new Audio(path);
    audio.volume = 0.5;
    audio.play()
      .then(() => console.log('Sound played successfully'))
      .catch((e) => console.error('Sound play failed:', e));
  };

  const startDraft = (mode: 'CLASSIC' | 'BALL_KNOWLEDGE') => {
    playSound('click');
    setGameState(prev => ({ ...prev, status: 'FORMATION_SELECT', mode }));
  };

  const selectFormation = (formation: Formation) => {
    playSound('click');
    const widenedFormation = {
      ...formation,
      positions: formation.positions.map(p => ({
        ...p,
        top: `${parseInt(p.top) + (Math.random() * 4 - 2)}%`,
        left: `${parseInt(p.left) + (Math.random() * 4 - 2)}%`,
      }))
    };
    setGameState(prev => ({ 
      ...prev, 
      status: 'DRAFT', 
      formation: widenedFormation,
      squad: Array(11).fill(null)
    }));
  };

  const spinSlots = () => {
    if (isSpinning || gameState.squad.every(p => p !== null)) return;
    setIsSpinning(true);
    setSelectedPlayerToAssign(null);
    playSound('spin');

    setTimeout(() => {
      const draftedIds = gameState.squad.filter(p => p !== null).map(p => p!.id);
      const draftedNames = gameState.squad.filter(p => p !== null).map(p => p!.name);
      
      // Get ALL valid combinations that have players remaining
      const availableCombos = PLAYERS.filter(p => !draftedIds.includes(p.id) && !draftedNames.includes(p.name)).reduce((acc: {club: string, decade: string}[], p) => {
        if (!acc.find(a => a.club === p.club && a.decade === p.decade)) {
          acc.push({ club: p.club, decade: p.decade });
        }
        return acc;
      }, []);

      if (availableCombos.length === 0) {
        setIsSpinning(false);
        return;
      }

      // Truly random selection from all valid combinations
      const randomIndex = Math.floor(Math.random() * availableCombos.length);
      const { club, decade } = availableCombos[randomIndex];
      
      setSpinResult({ club, decade });
      playSound('lock');

      const players = PLAYERS.filter(p => 
        p.club === club && 
        p.decade === decade && 
        !draftedIds.includes(p.id) &&
        !draftedNames.includes(p.name)
      );
      
      console.log(`Found ${players.length} players for ${club} (${decade})`);
      setActiveRoster(players);
      setIsSpinning(false);
    }, 1500);
  };

  const assignPlayerToSlot = (slotIndex: number) => {
    if (!selectedPlayerToAssign) return;
    
    // Prevent overwriting locked positions
    if (gameState.squad[slotIndex] !== null) return;
    
    const slotType = gameState.formation?.positions[slotIndex].type;
    
    if (!checkPositionCompatibility(selectedPlayerToAssign, slotType!)) return;

    const newSquad = [...gameState.squad];
    newSquad[slotIndex] = selectedPlayerToAssign;
    
    setGameState(prev => ({ ...prev, squad: newSquad }));
    playSound('click');
    
    // Reset selection state to enforce "One player per spin"
    setActiveRoster([]);
    setSpinResult(null);
    setSelectedPlayerToAssign(null);
  };

  const [results, setResults] = useState<MatchResult[]>([]);

  const resetGame = () => {
    setGameState({
      status: 'START',
      mode: 'CLASSIC',
      formation: null,
      squad: Array(11).fill(null),
      results: [],
      leagueTable: [],
      currentStage: 'LEAGUE'
    });
    setResults([]);
    setSpinResult(null);
    setActiveRoster([]);
    setSelectedPlayerToAssign(null);
    setRerolls({ club: 1, decade: 1 });
  };

  const rerollClub = () => {
    if (rerolls.club > 0 && isSpinning === false && spinResult) {
      setRerolls(prev => ({ ...prev, club: prev.club - 1 }));
      setIsSpinning(true);
      setSelectedPlayerToAssign(null);
      playSound('spin');

      const currentDecade = spinResult.decade;
      const currentNation = spinResult.club;

      setTimeout(() => {
        const draftedIds = gameState.squad.filter(p => p !== null).map(p => p!.id);
        
        // Find all nations that have players available in the current decade
        const availableNations = Array.from(new Set(
            PLAYERS.filter(p => p.decade === currentDecade && !draftedIds.includes(p.id)).map(p => p.club)
        )).filter(nation => nation !== currentNation);

        if (availableNations.length === 0) {
          setIsSpinning(false);
          return;
        }

        const newNation = availableNations[Math.floor(Math.random() * availableNations.length)];
        setSpinResult({ club: newNation, decade: currentDecade });
        playSound('lock');

        const players = PLAYERS.filter(p => p.club === newNation && p.decade === currentDecade && !draftedIds.includes(p.id));
        setActiveRoster(players);
        setIsSpinning(false);
      }, 1000);
    }
  };

  const rerollDecade = () => {
    if (rerolls.decade > 0 && isSpinning === false && spinResult) {
      setRerolls(prev => ({ ...prev, decade: prev.decade - 1 }));
      setIsSpinning(true);
      setSelectedPlayerToAssign(null);
      playSound('spin');

      const currentNation = spinResult.club;
      const currentDecade = spinResult.decade;

      setTimeout(() => {
        const draftedIds = gameState.squad.filter(p => p !== null).map(p => p!.id);
        
        // Find all decades where this nation has players
        const allDecadesForNation = Array.from(new Set(PLAYERS.filter(p => p.club === currentNation).map(p => p.decade)));
        
        // Available decades must not be the current one, and must have players not already drafted
        const availableDecades = allDecadesForNation.filter(d => {
            // Strictly exclude the current decade
            if (d === currentDecade) return false;
            const playersInDecade = PLAYERS.filter(p => p.club === currentNation && p.decade === d && !draftedIds.includes(p.id));
            return playersInDecade.length > 0;
        });

        if (availableDecades.length === 0) {
          setIsSpinning(false);
          return;
        }

        const newDecade = availableDecades[Math.floor(Math.random() * availableDecades.length)];
        setSpinResult({ club: currentNation, decade: newDecade });
        playSound('lock');

        const players = PLAYERS.filter(p => p.club === currentNation && p.decade === newDecade && !draftedIds.includes(p.id));
        setActiveRoster(players);
        setIsSpinning(false);
      }, 1000);
    }
  };

  const startSimulation = () => {
    setGameState(prev => ({ ...prev, status: 'SIMULATION' }));
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col items-center p-2 sm:p-4 bg-ucl-dark text-white transition-colors duration-300">
      <AnimatePresence mode="wait">
        {gameState.status === 'START' && (
          <StartScreen 
            onStart={startDraft} 
            audioEnabled={audioEnabled} 
            setAudioEnabled={setAudioEnabled}
          />
        )}
        {gameState.status === 'FORMATION_SELECT' && (
          <FormationSelect 
            onSelect={selectFormation} 
            onBack={() => setGameState(prev => ({ ...prev, status: 'START' }))}
          />
        )}
        {gameState.status === 'DRAFT' && (
          <DraftScreen
            gameState={gameState}
            isSpinning={isSpinning}
            spinResult={spinResult}
            activeRoster={activeRoster}
            selectedPlayer={selectedPlayerToAssign}
            rerolls={rerolls}
            onSpin={spinSlots}
            onPlayerClick={(p) => setSelectedPlayerToAssign(p === selectedPlayerToAssign ? null : p)}
            onSlotClick={assignPlayerToSlot}
            onRerollClub={rerollClub}
            onRerollDecade={rerollDecade}
            onBack={() => setGameState(prev => ({ ...prev, status: 'FORMATION_SELECT' }))}
            onStartSimulation={startSimulation}
          />

        )}
        {gameState.status === 'SIMULATION' && (
          <SimulationScreen 
            squad={gameState.squad as Player[]} 
            onComplete={(elimBy, winner, finalStage) => setGameState(prev => ({ ...prev, status: 'RESULTS', eliminatedBy: elimBy, tournamentWinner: winner, currentStage: finalStage || prev.currentStage }))}
            results={results}
            setResults={setResults}
          />
        )}
        {gameState.status === 'RESULTS' && (
          <ResultsScreen 
            gameState={gameState} 
            results={results} 
            onReset={resetGame}
            playSound={playSound}
          />
        )}

      </AnimatePresence>
      <Analytics />
    </div>
  );
}
function StartScreen({ onStart, audioEnabled, setAudioEnabled }: { onStart: (mode: 'CLASSIC' | 'BALL_KNOWLEDGE') => void, audioEnabled: boolean, setAudioEnabled: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="max-w-2xl w-full text-center flex flex-col items-center justify-center min-h-[80vh] px-4"
    >
      <div className="flex justify-center mb-8">
        <div className="relative">
          <Trophy className="size-20 sm:size-[100px] text-ucl-gold animate-pulse relative z-10" />
          <div className="absolute inset-0 bg-ucl-gold/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        </div>
      </div>
      <h1 className="text-5xl sm:text-8xl font-black mb-6 tracking-tighter italic text-glow leading-none uppercase">Legends World Cup</h1>
      <p className="text-lg sm:text-2xl text-slate-400 mb-12 max-w-xl leading-relaxed font-medium">
        The ultimate era-mixing draft. Use our <span className="text-ucl-neon font-bold">Era Spinner</span> to pull icons from the 1960s to today. Build a legendary XI, master your chemistry, and simulate a full World Cup run.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-2xl">
        <button
          onClick={() => { setAudioEnabled(!audioEnabled); }}
          className={`w-full py-3 rounded-full font-bold transition-all border ${audioEnabled ? 'bg-ucl-neon text-ucl-dark border-ucl-neon' : 'bg-slate-800 text-white border-slate-700'}`}
        >
          {audioEnabled ? '🔊 Sound Enabled' : '🔇 Enable Sound'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-2xl mt-6">
        <div className="flex-1 flex flex-col gap-3">
          <button 
            onClick={() => onStart('CLASSIC')}
            className="btn-primary w-full flex items-center justify-center gap-3 py-4"
          >
            <Zap size={20} /> Classic Mode
          </button>
          <p className="text-[10px] sm:text-[11px] text-slate-500 px-4">Draft for total dominance. High-rating squad building with the most powerful legends at their peak.</p>
        </div>
        <div className="flex-1 flex flex-col gap-3">
          <button 
            onClick={() => onStart('BALL_KNOWLEDGE')}
            className="w-full px-8 py-4 bg-slate-900/50 border-2 border-slate-700 rounded-full font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
          >
            <BarChart3 size={20} /> Ball Knowledge
          </button>
          <p className="text-[10px] sm:text-[11px] text-slate-500 px-4">For the true football hipsters. Draft based on heritage, cult status, and era-defining iconic moments.</p>
        </div>
      </div>
    </motion.div>
  );
}

function FormationSelect({ onSelect, onBack }: { onSelect: (f: Formation) => void, onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl w-full mt-4 sm:mt-10 relative px-4"
    >
      <div className="flex items-center justify-center mb-12 relative">
        <div className="absolute left-0">
          <BackButton onClick={onBack} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-center">Select Formation</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {FORMATIONS.map(f => (
          <div 
            key={f.name}
            onClick={() => onSelect(f)}
            className="neon-card cursor-pointer group"
          >
            <div className="h-40 bg-slate-800 rounded mb-4 relative overflow-hidden pitch-container">
              {f.positions.map((p: any) => (
                <div 
                  key={p.id}
                  className="absolute w-2 h-2 bg-ucl-neon rounded-full"
                  style={{ top: p.top, left: p.left, transform: 'translate(-50%, -50%)' }}
                />
              ))}
            </div>
            <h3 className="text-xl font-bold group-hover:text-ucl-neon transition-colors">{f.name}</h3>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DraftScreen({ 
  gameState, 
  isSpinning, 
  spinResult, 
  activeRoster, 
  selectedPlayer,
  rerolls,
  onSpin, 
  onPlayerClick,
  onSlotClick,
  onRerollClub,
  onRerollDecade,
  onBack,
  onStartSimulation
}: { 
  gameState: GameState;
  isSpinning: boolean;
  spinResult: { club: string; decade: string } | null;
  activeRoster: Player[];
  selectedPlayer: Player | null;
  rerolls: { club: number; decade: number };
  onSpin: () => void;
  onPlayerClick: (p: Player) => void;
  onSlotClick: (idx: number) => void;
  onRerollClub: () => void;
  onRerollDecade: () => void;
  onBack: () => void;
  onStartSimulation: () => void;
}) {
  const isSquadFull = gameState.squad.every(p => p !== null);
  const draftedCount = gameState.squad.filter(player => player !== null).length;
  const chemistry = WorldCupSimulationEngine.calculateChemistry(gameState.squad.filter(p => p !== null) as Player[]);

  return (
    <div className="w-full max-w-7xl mt-2 sm:mt-4 space-y-4 sm:space-y-6 px-2 sm:px-4">
      <div className="relative overflow-hidden rounded-[20px] sm:rounded-[28px] border border-slate-800/70 bg-slate-950/55 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-500/15 to-transparent" />
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-800/70">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent text-orange-300 flex items-center justify-center font-black text-xs sm:text-sm shadow-[0_0_28px_rgba(249,115,22,0.18)] shrink-0">
              WC
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                <h2 className="text-base sm:text-2xl font-black tracking-tight text-white truncate">Legendary Draft</h2>
                <div className="flex gap-1.5">
                  <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[9px] sm:text-xs font-black uppercase tracking-widest text-slate-400">
                    {draftedCount}/11
                  </span>
                  <span className="rounded-full border border-ucl-neon/30 bg-ucl-neon/10 px-2 py-0.5 text-[9px] sm:text-xs font-black uppercase tracking-widest text-ucl-neon">
                    {chemistry}
                  </span>
                </div>
              </div>
              <p className="text-[8px] sm:text-xs uppercase tracking-[0.2em] text-slate-500 mt-0.5 truncate">
                {gameState.formation?.name ?? 'Formation'} · {gameState.mode.replace('_', ' ')}
              </p>
            </div>
          </div>


          <div className="shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-900/70 px-3 sm:px-4 py-2 sm:py-2.5 text-slate-300 hover:text-ucl-neon hover:border-ucl-neon/40 transition-colors font-black uppercase tracking-widest text-[9px] sm:text-xs shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
              aria-label="Go back"
            >
              <LogOut className="size-3.5 sm:size-4" />
              <span className="hidden xs:inline">Go Back</span>
              <span className="xs:hidden">Back</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800/70">
          <div className="flex items-center gap-4 sm:gap-12 font-black text-xs sm:text-[17px] uppercase tracking-[0.1em] sm:tracking-[0.18em]">
            <button
              type="button"
              onClick={onRerollClub}
              disabled={!spinResult || isSpinning || rerolls.club === 0}
              className="group flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <RefreshCw strokeWidth={2.35} className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 transition-transform group-hover:rotate-90" />
              <span>Team</span>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 text-[9px] tracking-normal text-amber-300">
                {rerolls.club}
              </span>
            </button>
            <button
              type="button"
              onClick={onRerollDecade}
              disabled={!spinResult || isSpinning || rerolls.decade === 0}
              className="group flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <RefreshCw strokeWidth={2.35} className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 transition-transform group-hover:-rotate-90" />
              <span>Era</span>
              <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-1.5 py-0.5 text-[9px] tracking-normal text-violet-300">
                {rerolls.decade}
              </span>
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
            <span>{draftedCount}/11 drafted</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start h-full relative">
        <div className="flex flex-col gap-4 w-full lg:w-[380px] shrink-0">
          <div className="rounded-[26px] border border-slate-800/80 bg-slate-950/45 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <span className="text-ucl-neon font-black tracking-widest uppercase text-xs">Squad Building</span>
              <span className="text-slate-500 font-bold text-xs">{draftedCount} / 11</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex flex-col gap-1.5">
                <div className="era-spinner-col flex items-center justify-center p-2 text-center h-28">
                  <AnimatePresence mode="wait">
                    {isSpinning ? (
                      <motion.div 
                        key="spinning"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.2 }}
                        className="text-sm font-bold text-slate-500"
                      >
                        ROLLING...
                      </motion.div>
                    ) : spinResult ? (
                      <motion.div 
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-base font-black text-ucl-neon text-glow uppercase leading-tight"
                      >
                        {spinResult.club}
                      </motion.div>
                    ) : (
                      <div className="text-slate-600 font-bold tracking-widest text-[8px] uppercase opacity-50 italic">???</div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="era-spinner-col flex items-center justify-center p-2 text-center h-28">
                  <AnimatePresence mode="wait">
                    {isSpinning ? (
                      <motion.div 
                        key="spinning-dec"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.2, delay: 0.1 }}
                        className="text-sm font-bold text-slate-500"
                      >
                        ROLLING...
                      </motion.div>
                    ) : spinResult ? (
                      <motion.div 
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-xl font-black text-ucl-gold text-glow"
                      >
                        {spinResult.decade}
                      </motion.div>
                    ) : (
                      <div className="text-slate-600 font-bold tracking-widest text-[8px] uppercase opacity-50 italic">???</div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <button 
              onClick={onSpin} 
              disabled={isSpinning || activeRoster.length > 0}
              className={`btn-primary w-full py-3 text-xs mb-4 ${isSpinning || activeRoster.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSpinning ? 'Simulating Era...' : 'Spin for Legends'}
            </button>

            <div className="space-y-2">
              <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Available Pool</h4>
              <div className="grid grid-cols-1 gap-1.5 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {activeRoster.length > 0 ? (
                    activeRoster.map(player => (
                      <motion.div 
                        key={player.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => onPlayerClick(player)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex justify-between items-center transition-all duration-200 ${selectedPlayer?.id === player.id ? 'bg-ucl-neon text-ucl-dark border-white shadow-[0_0_18px_rgba(0,255,204,0.35)]' : 'bg-slate-900/90 border-slate-700/80 hover:border-ucl-neon/50 hover:bg-slate-800/95'}`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">{player.name}</div>
                          <div className={`text-[9px] font-bold uppercase tracking-tighter ${selectedPlayer?.id === player.id ? 'text-ucl-dark/70' : 'text-slate-500'}`}>{player.positions.join(' / ')}</div>
                        </div>
                        {gameState.mode === 'CLASSIC' && (
                          <div className={`font-black text-base shrink-0 ml-2 ${selectedPlayer?.id === player.id ? 'text-ucl-dark' : 'text-ucl-gold'}`}>{player.rating}</div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-xl text-slate-600 text-[10px] italic">
                      {isSpinning ? 'Fetching historical data...' : 'Spin to reveal legendary players'}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {isSquadFull && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-ucl-neon/10 border border-ucl-neon/30 p-4 rounded-2xl backdrop-blur-sm">
              <h4 className="text-ucl-neon font-black tracking-widest uppercase text-[10px] mb-3">Squad Ready</h4>
              <button 
                onClick={onStartSimulation}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
              >
                Begin World Cup Quest <ChevronRight size={20} />
              </button>
            </motion.div>
          )}
        </div>

        <div className="flex-1 relative aspect-[3/4] rounded-[30px] overflow-hidden border border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[0_22px_75px_rgba(0,0,0,0.35)] min-h-[450px] max-h-[75vh] w-full lg:max-w-md xl:max-w-lg mx-auto shrink-0 pitch-container">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 border-2 border-white rounded-full"></div>
          </div>
          
          {selectedPlayer && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-ucl-neon text-ucl-dark px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest z-30 shadow-2xl whitespace-nowrap"
            >
              Assign {selectedPlayer.name.split(' ').pop()} to {selectedPlayer.positions.join('/')}
            </motion.div>
          )}

          {gameState.formation?.positions.map((pos, idx) => {
            const player = gameState.squad[idx];
            const isValidForSelection = selectedPlayer ? checkPositionCompatibility(selectedPlayer, pos.type) : false;
            
            return (
              <motion.div 
                key={pos.id}
                onClick={() => onSlotClick(idx)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 ${selectedPlayer && !isValidForSelection ? 'opacity-30 pointer-events-none' : 'cursor-pointer'}`}
                style={{ top: pos.top, left: pos.left }}
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${player ? 'bg-ucl-neon border-white shadow-[0_0_15px_rgba(0,255,204,0.6)]' : isValidForSelection ? 'bg-white/20 border-ucl-neon border-dashed animate-pulse' : 'bg-slate-800 border-slate-600 hover:border-ucl-neon'}`}>
                  {player ? (
                    <div className="flex flex-col items-center">
                      <span className="text-ucl-dark font-black text-[8px] md:text-[10px] leading-none text-center px-1 truncate w-12 md:w-16">{player.name.split(' ').pop()}</span>
                      <span className="text-ucl-dark/70 font-bold text-[6px] md:text-[8px]">{player.rating}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className={`text-[10px] md:text-sm font-black ${isValidForSelection ? "text-ucl-neon" : "text-slate-500"}`}>{pos.label}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MatchScorers({ scorers, side }: { scorers?: string[], side: 'left' | 'right' }) {
  if (!scorers || scorers.length === 0) return <div className="hidden sm:block flex-1" />;
  
  const counts = scorers.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`text-[9px] sm:text-[10px] text-slate-400 mt-1 sm:mt-0.5 flex flex-col ${side === 'left' ? 'items-end pr-2 sm:pr-4 text-right' : 'items-start pl-2 sm:pl-4 text-left'} flex-1`}>
      {Object.entries(counts).map(([name, count]) => (
        <span key={name} className="leading-tight truncate max-w-[80px] sm:max-w-none">{name}{count > 1 ? ` (${count})` : ''}</span>
      ))}
    </div>
  );
}

function SimulationScreen({ squad, onComplete, results, setResults }: { squad: Player[], onComplete: (eliminatedBy?: string, winner?: string, finalStage?: any) => void, results: MatchResult[], setResults: React.Dispatch<React.SetStateAction<MatchResult[]>> }) {
  const [stage, setStage] = useState<WorldCupStage>('GROUP_STAGE');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [isSimulating, setIsSimulating] = useState(true);
  const [isEliminated, setIsEliminated] = useState(false);
  const simStageRef = useRef<string | null>(null);
  const groupOpponentsRef = useRef<{ name: string; rating: number }[] | null>(null);

  useEffect(() => {
    if (isEliminated || !isSimulating) return;

    const runSim = async () => {
      if (stage === 'GROUP_STAGE') {
        if (!groupOpponentsRef.current) {
            groupOpponentsRef.current = WorldCupSimulationEngine.getUniqueOpponents(3, ['Your Team']);
        }
        const opponents = groupOpponentsRef.current;
        
        if (currentMatch < 3) {
          if (results.length > currentMatch) {
              setCurrentMatch(prev => prev + 1);
              return;
          }

          await new Promise(r => setTimeout(r, 800));
          const opponent = opponents[currentMatch];
          const res = WorldCupSimulationEngine.simulateMatch(squad, opponent.name, opponent.rating, `Group A`, true);
          setResults(prev => [...prev, res]);
          setCurrentMatch(prev => prev + 1);
        } else {
          const standings = WorldCupSimulationEngine.calculateStandings(results);
          const playerGroup = standings['Group A'];
          const playerIndex = playerGroup.findIndex(e => e.teamName === 'Your Team');
          const playerEntry = playerGroup[playerIndex];
          
          if (playerIndex < 2 || (playerIndex === 2 && playerEntry!.points >= 4)) {
            setStage('ROUND_OF_32');
            setCurrentMatch(0);
          } else {
            setIsEliminated(true);
            setTimeout(() => onComplete('Group Stage', 'Brazil', 'GROUP_STAGE'), 2000);
          }
        }
      } else {
        if (simStageRef.current === stage) return;
        simStageRef.current = stage;
        await new Promise(r => setTimeout(r, 1000));
        
        const opponentSettings: Record<string, { name: string, rating: number, next: WorldCupStage }> = {
            'ROUND_OF_32': { name: 'USA', rating: 84, next: 'ROUND_OF_16' },
            'ROUND_OF_16': { name: 'Netherlands', rating: 88, next: 'QUARTER_FINAL' },
            'QUARTER_FINAL': { name: 'Argentina', rating: 92, next: 'SEMI_FINAL' },
            'SEMI_FINAL': { name: 'France', rating: 94, next: 'FINAL' },
            'FINAL': { name: 'Brazil', rating: 95, next: 'FINAL' }
        };

        const config = opponentSettings[stage as string];
        const res = WorldCupSimulationEngine.simulateMatch(squad, config.name, config.rating, stage, true, true);
        setResults(prev => [...prev, res]);

        if (res.isPlayerWin) {
          if (stage === 'FINAL') {
            setIsSimulating(false);
            setTimeout(() => onComplete(undefined, 'Your Team', 'FINAL'), 3000);
          } else {
            setStage(config.next);
          }
        } else {
          setIsEliminated(true);
          setTimeout(() => onComplete(config.name, 'Brazil', stage as any), 2000);
        }
      }
    };

    runSim();
  }, [currentMatch, stage, isEliminated, isSimulating, results]);

  return (
    <div className="max-w-2xl w-full mt-10">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black tracking-widest uppercase text-ucl-neon">{stage.replace('_', ' ')}</h2>
        {isEliminated && <p className="text-red-500 font-bold mt-2">KNOCKED OUT!</p>}
      </div>
      
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {results.map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-3 sm:p-4 rounded-lg border flex flex-col gap-1 text-sm ${m.isPlayerWin ? 'bg-green-900/20 border-green-800' : (m.homeScore === m.awayScore && !m.penaltyOutcome) ? 'bg-slate-800/50 border-slate-700' : 'bg-red-950/40 border-red-800'}`}
          >
            <div className="flex justify-between items-center gap-2">
              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold w-12 sm:w-16 shrink-0">{m.stage}</span>
              <span className="flex-1 text-right pr-2 sm:pr-4 font-bold truncate">{m.homeTeam}</span>
              <span className="bg-slate-900 px-2 sm:px-3 py-1 rounded font-black text-ucl-neon border border-slate-700 text-xs sm:text-sm shrink-0">{m.homeScore} - {m.awayScore}</span>
              <span className="flex-1 text-left pl-2 sm:pl-4 font-bold truncate">{m.awayTeam}</span>
            </div>
            {m.wentToExtraTime && (
              <div className="text-center text-[8px] uppercase font-bold text-amber-500 -mt-1">Match went to Extra Time</div>
            )}
            <div className="flex justify-between items-start">
              <div className="w-12 sm:w-16 shrink-0" />
              <MatchScorers scorers={m.homeScorers} side="left" />
              <div className="w-12 sm:w-16 shrink-0" />
              <MatchScorers scorers={m.awayScorers} side="right" />
            </div>
            {m.penaltyOutcome && (
              <div className="text-center text-[10px] uppercase font-bold text-slate-300 mt-1 border-t border-slate-700 pt-1">
                {m.penaltyOutcome.playerWin ? 'Won' : 'Lost'} on Penalties ({m.penaltyOutcome.homePenalties} - {m.penaltyOutcome.awayPenalties})
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {isSimulating && !isEliminated && (
        <div className="flex justify-center items-center gap-3 text-ucl-neon mt-10 animate-pulse">
          <RefreshCw className="animate-spin" />
          <span className="font-bold tracking-widest text-xs">SIMULATING WORLD CUP...</span>
        </div>
      )}
    </div>
  );
}

function ResultsScreen({ gameState, results, onReset, playSound }: { gameState: GameState, results: MatchResult[], onReset: () => void, playSound: (type: 'spin' | 'lock' | 'click' | 'fahhhhh' | 'victory') => void }) {
  const [showHistory, setShowHistory] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const wins = results.filter(r => r.isPlayerWin).length;
  const draws = results.filter(r => r.homeScore === r.awayScore && !r.penaltyOutcome).length;
  const losses = results.length - wins - draws;
  const isWinner = results.some(r => r.stage === 'FINAL' && r.isPlayerWin);
  const isUndefeated = results.every(r => r.isPlayerWin);
  const squadRating = Math.round(gameState.squad.reduce((acc, p) => acc + (p?.rating || 0), 0) / 11);
  const finalMatch = results.find(r => r.stage === 'FINAL');

  useEffect(() => {
    if (isWinner) {
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
        playSound('victory'); // Victory sound
    } else {
        playSound('fahhhhh'); // Defeat sound
    }
  }, [isWinner, playSound]);

  const shareScreenshot = async () => {
    if (shareCardRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(shareCardRef.current);
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'ucl-draft-result.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'UCL Draft',
            text: `Draft your legendary team and conquer the UCL! Can you win the UCL?\n\nCheck it out: ${window.location.origin}`,
          });
        } else {
          // Fallback to download
          const link = document.createElement('a');
          link.download = 'ucl-draft-result.png';
          link.href = dataUrl;
          link.click();
        }
      } catch (error) {
        console.error('Error sharing screenshot:', error);
      }
    }
  };

  useEffect(() => {
    if (isWinner) {
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
        playSound('spin'); // Victory sound
    } else {
        playSound('fahhhhh'); // Defeat sound
    }
  }, [isWinner]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-5xl w-full text-center mt-12 pb-24 p-4 sm:p-10 rounded-3xl"
    >
      <div className="flex gap-4 justify-center mb-12">
        <button 
           onClick={() => setShowHistory(!showHistory)}
           className="px-8 py-2.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-full font-bold text-sm hover:bg-slate-700 hover:border-ucl-neon/30 transition-all"
        >
          {showHistory ? 'Hide Match History' : 'View Full Match History'}
        </button>
      </div>

      {showHistory ? (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 sm:pr-4 custom-scrollbar mb-12">
          {results.map((m, i) => (
            <div key={i} className={`p-3 sm:p-4 rounded-xl border flex flex-col gap-2 text-sm transition-all hover:scale-[1.01] ${m.isPlayerWin ? 'bg-green-900/10 border-green-800/50 shadow-[0_0_20px_rgba(22,163,74,0.05)]' : (m.homeScore === m.awayScore && !m.penaltyOutcome) ? 'bg-slate-800/40 border-slate-700' : 'bg-red-950/20 border-red-800/50'}`}>
              <div className="flex justify-between items-center gap-2">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-black tracking-widest w-16 sm:w-20 shrink-0">{m.stage}</span>
                <span className="flex-1 text-right pr-2 sm:pr-6 font-bold text-slate-200 truncate">{m.homeTeam}</span>
                <span className="bg-slate-950/80 px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg font-black text-ucl-neon border border-slate-700/50 min-w-[60px] sm:min-w-[70px] shadow-inner text-xs sm:text-sm shrink-0">{m.homeScore} - {m.awayScore}</span>
                <span className="flex-1 text-left pl-2 sm:pl-6 font-bold text-slate-200 truncate">{m.awayTeam}</span>
              </div>
              <div className="flex justify-between items-start">
                <div className="w-16 sm:w-20 shrink-0" />
                <MatchScorers scorers={m.homeScorers} side="left" />
                <div className="w-16 sm:w-20 shrink-0" />
                <MatchScorers scorers={m.awayScorers} side="right" />
              </div>
              {m.opponentFormation && <p className="text-[9px] text-slate-500 mt-1 italic text-center uppercase tracking-tighter">Opponent: {m.opponentFormation}</p>}
              {m.penaltyOutcome && (
                <div className="text-center text-[10px] uppercase font-black text-ucl-gold mt-2 border-t border-slate-700/30 pt-2 tracking-widest">
                  {m.penaltyOutcome.playerWin ? 'Winner' : 'Defeat'} on Penalties ({m.penaltyOutcome.homePenalties} - {m.penaltyOutcome.awayPenalties})
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
            <div className="mb-12 sm:mb-16">
                {isWinner ? (
                <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                        <Trophy className="size-20 sm:size-[100px] text-ucl-gold relative z-10" />
                        <div className="absolute inset-0 bg-ucl-gold/30 blur-3xl rounded-full scale-150 animate-pulse"></div>
                    </div>
                    <h2 className="text-4xl sm:text-6xl font-black text-glow-gold mb-4 tracking-tighter italic px-4">WORLD CHAMPIONS</h2>
                    {isUndefeated && (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="bg-ucl-gold text-ucl-dark font-black text-[10px] sm:text-xs px-6 py-1.5 rounded-full uppercase tracking-[0.3em] mb-6 shadow-xl"
                    >
                        The Perfect Run
                    </motion.div>
                    )}
                    {finalMatch && (
                    <div className="bg-slate-900/60 backdrop-blur-md px-6 sm:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border border-ucl-neon/40 text-ucl-neon font-black text-xl sm:text-3xl mt-4 shadow-2xl flex items-center gap-4 sm:gap-6">
                        <span className="text-[10px] sm:text-sm uppercase tracking-widest text-slate-500">Final</span>
                        {finalMatch.homeScore} - {finalMatch.awayScore}
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate max-w-[100px] sm:max-w-none">vs {finalMatch.awayTeam === 'Your Team' ? finalMatch.homeTeam : finalMatch.awayTeam}</span>
                    </div>
                    )}
                </div>
                ) : (
                <div className="flex flex-col items-center">
                    <div className="p-6 sm:p-8 rounded-full bg-slate-900/40 border border-slate-800 mb-6 sm:mb-8 relative">
                        <Zap className="size-10 sm:size-[60px] text-slate-600" />
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black mb-4 sm:mb-6 uppercase tracking-tighter text-slate-300 italic">Journey Ended</h2>
                    <div className="bg-red-950/10 border border-red-900/30 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-3xl mb-6 backdrop-blur-sm shadow-xl">
                        <p className="text-red-400 font-bold text-xs sm:text-sm tracking-wide uppercase">Eliminated at <span className="text-white font-black">{gameState.currentStage.replace('_', ' ')}</span></p>
                        <p className="text-[9px] sm:text-[10px] text-red-500/60 uppercase font-black mt-1 tracking-[0.2em]">BY {gameState.eliminatedBy?.split(' (')[0]}</p>
                    </div>
                    <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-4 text-center">Tournament Winner: <span className="text-ucl-gold block sm:inline mt-1 sm:mt-0 ml-0 sm:ml-2">{gameState.tournamentWinner}</span></p>
                </div>
                )}
            </div>

            <div className="space-y-6 sm:space-y-10">
                {/* Tournament Summary Card - Full Width at Top */}
                <div className="neon-card text-left p-6 sm:p-8 bg-slate-950/30 border-slate-800/50">
                    <h3 className="text-ucl-neon font-black mb-6 sm:mb-10 uppercase text-[10px] sm:text-xs tracking-[0.25em] flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-ucl-neon animate-pulse"></div>
                        Tournament Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        <div className="flex justify-between items-center p-4 sm:p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                            <span className="text-slate-400 font-black uppercase text-[9px] sm:text-[10px] tracking-widest">Record</span>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-lg sm:text-xl font-black text-green-500">{wins}W</span>
                                <span className="text-lg sm:text-xl font-black text-slate-500">{draws}D</span>
                                <span className="text-lg sm:text-xl font-black text-red-500">{losses}L</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-4 sm:p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                            <span className="text-slate-400 font-black uppercase text-[9px] sm:text-[10px] tracking-widest">Squad Strength</span>
                            <div className="flex flex-col items-end">
                                <span className="text-2xl sm:text-3xl font-black text-ucl-gold">{squadRating}</span>
                                <span className="text-[7px] sm:text-[8px] text-slate-600 uppercase font-black tracking-tighter">Avg Rating</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-4 sm:p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                            <span className="text-slate-400 font-black uppercase text-[9px] sm:text-[10px] tracking-widest">Matches Played</span>
                            <span className="text-xl sm:text-2xl font-black text-white">{results.length}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-stretch">
                    {/* Player List with Eras Card */}
                    <div className="neon-card text-left p-6 sm:p-8 flex flex-col h-full bg-slate-950/30 border-slate-800/50">
                        <h3 className="text-ucl-neon font-black mb-6 sm:mb-8 uppercase text-[10px] sm:text-xs tracking-[0.25em] flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-ucl-neon animate-pulse"></div>
                            Legendary Squad
                        </h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {gameState.squad.map((player) => player && (
                                <div key={player.id} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-800/40 hover:border-ucl-neon/20 transition-colors">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-black text-white uppercase tracking-tight truncate">{player.name}</span>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{player.positions[0]} · {player.club}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[10px] font-black text-ucl-gold bg-ucl-gold/5 px-2 py-0.5 rounded border border-ucl-gold/10">{player.decade}</span>
                                        <span className="text-xs font-black text-white w-6 text-right">{player.rating}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tactical Setup Visualization */}
                    <div className="neon-card text-left p-6 sm:p-8 flex flex-col h-full bg-slate-950/30 border-slate-800/50">
                        <h3 className="text-ucl-neon font-black mb-6 sm:mb-8 uppercase text-[10px] sm:text-xs tracking-[0.25em] flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-ucl-neon animate-pulse"></div>
                            Tactical Setup: {gameState.formation?.name}
                        </h3>
                        <div className="relative aspect-[3/4] bg-slate-900/40 rounded-3xl overflow-hidden border border-slate-800/60 shadow-inner flex-1 pitch-container max-w-[300px] mx-auto w-full">
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <div className="absolute top-1/2 left-0 w-full h-px bg-white"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white rounded-full"></div>
                            </div>
                            {gameState.formation?.positions.map((pos, idx) => {
                                const player = gameState.squad[idx];
                                return (
                                    <div 
                                        key={pos.id}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                                        style={{ top: pos.top, left: pos.left }}
                                    >
                                        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border shadow-lg transition-all ${player ? 'bg-ucl-neon border-white text-ucl-dark' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                            {player ? (
                                                <span className="font-black text-[7px] sm:text-[9px] truncate w-7 sm:w-9 text-center uppercase tracking-tighter">{player.name.split(' ').pop()}</span>
                                            ) : (
                                                <span className="text-[6px] sm:text-[7px] font-black">{pos.label}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                    <button onClick={shareScreenshot} className="btn-primary flex-1 flex items-center justify-center gap-3 py-4 text-base font-black uppercase tracking-widest">
                        <Share2 className="size-5" /> Share Run
                    </button>
                    <button onClick={onReset} className="flex-1 px-8 py-4 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-700 hover:border-slate-600 transition-all text-sm">
                        Play Again
                    </button>
                </div>
            </div>
            
            {/* Hidden Share Card Template - keep in DOM for screenshotting */}
            <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none opacity-0">
                <div ref={shareCardRef} className="bg-[#020617] text-white p-10 w-[500px] rounded-[40px] font-sans border border-slate-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-ucl-neon/5 blur-[100px] rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-ucl-gold/5 blur-[100px] rounded-full"></div>
                    
                    <div className="text-center mb-10 relative z-10">
                        <div className="text-[10px] text-ucl-gold font-black uppercase tracking-[0.4em] mb-2">{isWinner ? '🏆 WORLD CHAMPION 🏆' : 'TOUR CAMPAIGN'}</div>
                        <div className="text-5xl font-black text-white italic tracking-tighter mb-4">{isWinner && isUndefeated ? 'PERFECT TOURNAMENT' : 'WORLD CUP RUN'}</div>
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-px w-12 bg-slate-800"></div>
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Final Record: {wins}W - {results.length - wins}L</div>
                            <div className="h-px w-12 bg-slate-800"></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
                        {gameState.squad.map((p, i) => (
                            <div key={i} className="bg-slate-900/80 border border-slate-800/50 p-3 rounded-2xl flex items-center gap-3">
                                <div className="bg-ucl-neon/20 text-ucl-neon border border-ucl-neon/30 px-2 py-0.5 rounded-lg text-[9px] font-black w-8 text-center">{p?.positions[0]}</div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-black text-white truncate text-left uppercase tracking-tight">{p?.name}</div>
                                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest text-left">{p?.decade}</div>
                                </div>
                                <div className="ml-auto text-ucl-gold font-black text-xs">{p?.rating}</div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-10 text-center border-t border-slate-800 pt-8 relative z-10">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Build Your Legendary XI</div>
                        <div className="text-ucl-neon font-black text-2xl tracking-tighter italic">WC-DRAFT.APP</div>
                    </div>
                </div>
            </div>
        </>
      )}
    </motion.div>
  );
}
