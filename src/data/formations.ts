import type { Formation } from '../types';

export const FORMATIONS: Formation[] = [
  {
    name: '4-3-3',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'LB', top: '65%', left: '20%', label: 'LB' },
      { id: 2, type: 'CB', top: '70%', left: '40%', label: 'CB' },
      { id: 3, type: 'CB', top: '70%', left: '60%', label: 'CB' },
      { id: 4, type: 'RB', top: '65%', left: '80%', label: 'RB' },
      { id: 5, type: 'CM', top: '45%', left: '30%', label: 'CM' },
      { id: 6, type: 'CDM', top: '50%', left: '50%', label: 'CDM' },
      { id: 7, type: 'CM', top: '45%', left: '70%', label: 'CM' },
      { id: 8, type: 'LW', top: '20%', left: '20%', label: 'LW' },
      { id: 9, type: 'ST', top: '15%', left: '50%', label: 'ST' },
      { id: 10, type: 'RW', top: '20%', left: '80%', label: 'RW' },
    ]
  },
  {
    name: '4-3-3 (False 9)',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'LB', top: '65%', left: '20%', label: 'LB' },
      { id: 2, type: 'CB', top: '70%', left: '40%', label: 'CB' },
      { id: 3, type: 'CB', top: '70%', left: '60%', label: 'CB' },
      { id: 4, type: 'RB', top: '65%', left: '80%', label: 'RB' },
      { id: 5, type: 'CM', top: '45%', left: '30%', label: 'CM' },
      { id: 6, type: 'CM', top: '45%', left: '50%', label: 'CM' },
      { id: 7, type: 'CM', top: '45%', left: '70%', label: 'CM' },
      { id: 8, type: 'LW', top: '20%', left: '20%', label: 'LW' },
      { id: 9, type: 'CF', top: '30%', left: '50%', label: 'CF' },
      { id: 10, type: 'RW', top: '20%', left: '80%', label: 'RW' },
    ]
  },
  {
    name: '4-4-2',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'LB', top: '65%', left: '15%', label: 'LB' },
      { id: 2, type: 'CB', top: '70%', left: '38%', label: 'CB' },
      { id: 3, type: 'CB', top: '70%', left: '62%', label: 'CB' },
      { id: 4, type: 'RB', top: '65%', left: '85%', label: 'RB' },
      { id: 5, type: 'LM', top: '40%', left: '15%', label: 'LM' },
      { id: 6, type: 'CM', top: '45%', left: '38%', label: 'CM' },
      { id: 7, type: 'CM', top: '45%', left: '62%', label: 'CM' },
      { id: 8, type: 'RM', top: '40%', left: '85%', label: 'RM' },
      { id: 9, type: 'ST', top: '15%', left: '35%', label: 'ST' },
      { id: 10, type: 'ST', top: '15%', left: '65%', label: 'ST' },
    ]
  },
  {
    name: '4-4-2 (Diamond)',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'LB', top: '65%', left: '15%', label: 'LB' },
      { id: 2, type: 'CB', top: '70%', left: '38%', label: 'CB' },
      { id: 3, type: 'CB', top: '70%', left: '62%', label: 'CB' },
      { id: 4, type: 'RB', top: '65%', left: '85%', label: 'RB' },
      { id: 5, type: 'CDM', top: '55%', left: '50%', label: 'CDM' },
      { id: 6, type: 'CM', top: '45%', left: '30%', label: 'CM' },
      { id: 7, type: 'CM', top: '45%', left: '70%', label: 'CM' },
      { id: 8, type: 'CAM', top: '30%', left: '50%', label: 'CAM' },
      { id: 9, type: 'ST', top: '15%', left: '35%', label: 'ST' },
      { id: 10, type: 'ST', top: '15%', left: '65%', label: 'ST' },
    ]
  },
  {
    name: '4-2-3-1',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'LB', top: '65%', left: '20%', label: 'LB' },
      { id: 2, type: 'CB', top: '70%', left: '40%', label: 'CB' },
      { id: 3, type: 'CB', top: '70%', left: '60%', label: 'CB' },
      { id: 4, type: 'RB', top: '65%', left: '80%', label: 'RB' },
      { id: 5, type: 'CDM', top: '55%', left: '40%', label: 'CDM' },
      { id: 6, type: 'CDM', top: '55%', left: '60%', label: 'CDM' },
      { id: 7, type: 'LM', top: '35%', left: '20%', label: 'LM' },
      { id: 8, type: 'CAM', top: '30%', left: '50%', label: 'CAM' },
      { id: 9, type: 'RM', top: '35%', left: '80%', label: 'RM' },
      { id: 10, type: 'ST', top: '15%', left: '50%', label: 'ST' },
    ]
  },
  {
    name: '4-1-4-1',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'LB', top: '65%', left: '20%', label: 'LB' },
      { id: 2, type: 'CB', top: '70%', left: '40%', label: 'CB' },
      { id: 3, type: 'CB', top: '70%', left: '60%', label: 'CB' },
      { id: 4, type: 'RB', top: '65%', left: '80%', label: 'RB' },
      { id: 5, type: 'CDM', top: '55%', left: '50%', label: 'CDM' },
      { id: 6, type: 'LM', top: '40%', left: '15%', label: 'LM' },
      { id: 7, type: 'CM', top: '45%', left: '38%', label: 'CM' },
      { id: 8, type: 'CM', top: '45%', left: '62%', label: 'CM' },
      { id: 9, type: 'RM', top: '40%', left: '85%', label: 'RM' },
      { id: 10, type: 'ST', top: '15%', left: '50%', label: 'ST' },
    ]
  },
  {
    name: '3-5-2',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'CB', top: '70%', left: '25%', label: 'CB' },
      { id: 2, type: 'CB', top: '75%', left: '50%', label: 'CB' },
      { id: 3, type: 'CB', top: '70%', left: '75%', label: 'CB' },
      { id: 4, type: 'LM', top: '45%', left: '10%', label: 'LM' },
      { id: 5, type: 'CM', top: '50%', left: '30%', label: 'CM' },
      { id: 6, type: 'CDM', top: '55%', left: '50%', label: 'CDM' },
      { id: 7, type: 'CM', top: '50%', left: '70%', label: 'CM' },
      { id: 8, type: 'RM', top: '45%', left: '90%', label: 'RM' },
      { id: 9, type: 'ST', top: '15%', left: '35%', label: 'ST' },
      { id: 10, type: 'ST', top: '15%', left: '65%', label: 'ST' },
    ]
  },
  {
    name: '3-4-2-1',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'CB', top: '70%', left: '25%', label: 'CB' },
      { id: 2, type: 'CB', top: '75%', left: '50%', label: 'CB' },
      { id: 3, type: 'CB', top: '70%', left: '75%', label: 'CB' },
      { id: 4, type: 'LM', top: '45%', left: '15%', label: 'LM' },
      { id: 5, type: 'CM', top: '50%', left: '40%', label: 'CM' },
      { id: 6, type: 'CM', top: '50%', left: '60%', label: 'CM' },
      { id: 7, type: 'RM', top: '45%', left: '85%', label: 'RM' },
      { id: 8, type: 'CAM', top: '30%', left: '40%', label: 'CAM' },
      { id: 9, type: 'CAM', top: '30%', left: '60%', label: 'CAM' },
      { id: 10, type: 'ST', top: '15%', left: '50%', label: 'ST' },
    ]
  },
  {
    name: '5-3-2',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'LB', top: '65%', left: '15%', label: 'LB' },
      { id: 2, type: 'CB', top: '70%', left: '33%', label: 'CB' },
      { id: 3, type: 'CB', top: '75%', left: '50%', label: 'CB' },
      { id: 4, type: 'CB', top: '70%', left: '67%', label: 'CB' },
      { id: 5, type: 'RB', top: '65%', left: '85%', label: 'RB' },
      { id: 6, type: 'CM', top: '45%', left: '30%', label: 'CM' },
      { id: 7, type: 'CDM', top: '50%', left: '50%', label: 'CDM' },
      { id: 8, type: 'CM', top: '45%', left: '70%', label: 'CM' },
      { id: 9, type: 'ST', top: '15%', left: '35%', label: 'ST' },
      { id: 10, type: 'ST', top: '15%', left: '65%', label: 'ST' },
    ]
  },
  {
    name: '4-1-2-1-2',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'LB', top: '65%', left: '15%', label: 'LB' },
      { id: 2, type: 'CB', top: '70%', left: '38%', label: 'CB' },
      { id: 3, type: 'CB', top: '70%', left: '62%', label: 'CB' },
      { id: 4, type: 'RB', top: '65%', left: '85%', label: 'RB' },
      { id: 5, type: 'CDM', top: '55%', left: '50%', label: 'CDM' },
      { id: 6, type: 'CM', top: '45%', left: '30%', label: 'CM' },
      { id: 7, type: 'CM', top: '45%', left: '70%', label: 'CM' },
      { id: 8, type: 'CAM', top: '35%', left: '50%', label: 'CAM' },
      { id: 9, type: 'ST', top: '15%', left: '35%', label: 'ST' },
      { id: 10, type: 'ST', top: '15%', left: '65%', label: 'ST' },
    ]
  },
  {
    name: '3-4-3',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'CB', top: '70%', left: '25%', label: 'CB' },
      { id: 2, type: 'CB', top: '75%', left: '50%', label: 'CB' },
      { id: 3, type: 'CB', top: '70%', left: '75%', label: 'CB' },
      { id: 4, type: 'LM', top: '45%', left: '10%', label: 'LM' },
      { id: 5, type: 'CM', top: '50%', left: '35%', label: 'CM' },
      { id: 6, type: 'CM', top: '50%', left: '65%', label: 'CM' },
      { id: 7, type: 'RM', top: '45%', left: '90%', label: 'RM' },
      { id: 8, type: 'LW', top: '20%', left: '20%', label: 'LW' },
      { id: 9, type: 'ST', top: '15%', left: '50%', label: 'ST' },
      { id: 10, type: 'RW', top: '20%', left: '80%', label: 'RW' },
    ]
  },
  {
    name: '4-5-1',
    positions: [
      { id: 0, type: 'GK', top: '85%', left: '50%', label: 'GK' },
      { id: 1, type: 'LB', top: '65%', left: '15%', label: 'LB' },
      { id: 2, type: 'CB', top: '70%', left: '38%', label: 'CB' },
      { id: 3, type: 'CB', top: '70%', left: '62%', label: 'CB' },
      { id: 4, type: 'RB', top: '65%', left: '85%', label: 'RB' },
      { id: 5, type: 'LM', top: '40%', left: '10%', label: 'LM' },
      { id: 6, type: 'CM', top: '45%', left: '30%', label: 'CM' },
      { id: 7, type: 'CAM', top: '40%', left: '50%', label: 'CAM' },
      { id: 8, type: 'CM', top: '45%', left: '70%', label: 'CM' },
      { id: 9, type: 'RM', top: '40%', left: '90%', label: 'RM' },
      { id: 10, type: 'ST', top: '15%', left: '50%', label: 'ST' },
    ]
  }
];
