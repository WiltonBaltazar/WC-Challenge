import { SimulationEngine } from './src/engine.ts';
import { Player } from './src/types.ts';

const mockSquad: Player[] = [
  { id: '1', name: 'Zinedine Zidane', club: 'Real Madrid', decade: '2000s', positions: ['CAM'], rating: 96 },
  { id: '2', name: 'Cristiano Ronaldo', club: 'Real Madrid', decade: '2010s', positions: ['ST'], rating: 98 },
  { id: '3', name: 'Lionel Messi', club: 'FC Barcelona', decade: '2010s', positions: ['RW'], rating: 98 },
  { id: '4', name: 'Xavi', club: 'FC Barcelona', decade: '2010s', positions: ['CM'], rating: 94 },
  { id: '5', name: 'Andres Iniesta', club: 'FC Barcelona', decade: '2010s', positions: ['CM'], rating: 94 },
  { id: '6', name: 'Roberto Carlos', club: 'Real Madrid', decade: '2000s', positions: ['LB'], rating: 92 },
  { id: '7', name: 'Sergio Ramos', club: 'Real Madrid', decade: '2010s', positions: ['CB'], rating: 92 },
  { id: '8', name: 'Carles Puyol', club: 'FC Barcelona', decade: '2000s', positions: ['CB'], rating: 92 },
  { id: '9', name: 'Dani Alves', club: 'FC Barcelona', decade: '2010s', positions: ['RB'], rating: 90 },
  { id: '10', name: 'Ronaldinho', club: 'FC Barcelona', decade: '2000s', positions: ['LW'], rating: 95 },
  { id: '11', name: 'Iker Casillas', club: 'Real Madrid', decade: '2000s', positions: ['GK'], rating: 92 }
];

async function runTest() {
    console.log('--- STARTING BALANCED SIMULATION TEST ---');
    const chemistry = SimulationEngine.calculateChemistry(mockSquad);
    const avgRating = mockSquad.reduce((acc, p) => acc + p.rating, 0) / 11;
    console.log('Squad Rating:', avgRating.toFixed(2));
    console.log('Chemistry Bonus:', chemistry);

    const leagueOpponents = SimulationEngine.getUniqueOpponents(8);
    let results = [];
    let points = 0;

    console.log('\n--- LEAGUE PHASE ---');
    leagueOpponents.forEach((opp, i) => {
        const res = SimulationEngine.simulateMatch(mockSquad, opp.name, opp.rating, 'League', true);
        results.push(res);
        const pScore = res.homeScore;
        const oScore = res.awayScore;
        let matchPoints = 0;
        if (pScore > oScore) matchPoints = 3;
        else if (pScore === oScore) matchPoints = 1;
        points += matchPoints;
        console.log(`Match ${i+1}: vs ${opp.name} (${opp.rating}) -> ${pScore}-${oScore} (${matchPoints} pts)`);
    });

    console.log('\nTotal Points:', points);
    if (points >= 16) console.log('RESULT: Direct Qualification to R16');
    else if (points >= 8) console.log('RESULT: Playoff Qualification');
    else console.log('RESULT: ELIMINATED in League Phase');

    console.log('\n--- KNOCKOUT TEST (Semi-Final vs Man City 91) ---');
    const tie = SimulationEngine.simulateTwoLeggedTie(mockSquad, 'Manchester City', 91, true, 'SF');
    console.log(`Leg 1: ${tie.results[0].homeScore}-${tie.results[0].awayScore}`);
    console.log(`Leg 2: ${tie.results[1].homeScore}-${tie.results[1].awayScore}`);
    if (tie.results[1].penaltyOutcome) {
        console.log(`Penalties: ${tie.results[1].penaltyOutcome.homePenalties}-${tie.results[1].penaltyOutcome.awayPenalties}`);
    }
    console.log('Outcome:', tie.isPlayerWin ? 'WON TIE' : 'LOST TIE');
}

runTest();
