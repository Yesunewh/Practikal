import React, { createContext, useContext, useState, useEffect } from 'react';
import { Challenge } from '../types';
import { challenges as initialChallenges } from '../data/mockData';

interface ChallengeContextType {
  challenges: Challenge[];
  addChallenge: (challenge: Challenge) => void;
  updateChallenge: (id: string, challenge: Challenge) => void;
  deleteChallenge: (id: string) => void;
}

const ChallengeContext = createContext<ChallengeContextType>({
  challenges: [],
  addChallenge: () => {},
  updateChallenge: () => {},
  deleteChallenge: () => {},
});

export const useChallenges = () => useContext(ChallengeContext);

export const ChallengeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    // Load challenges from localStorage or use initial data
    const savedChallenges =
      localStorage.getItem('practikal-challenges') || localStorage.getItem('guardey-challenges');
    if (savedChallenges) {
      setChallenges(JSON.parse(savedChallenges));
    } else {
      setChallenges(initialChallenges);
    }
  }, []);

  useEffect(() => {
    // Save challenges to localStorage whenever they change
    if (challenges.length > 0) {
      localStorage.setItem('practikal-challenges', JSON.stringify(challenges));
    }
  }, [challenges]);

  const addChallenge = (challenge: Challenge) => {
    setChallenges([...challenges, challenge]);
  };

  const updateChallenge = (id: string, updatedChallenge: Challenge) => {
    setChallenges(challenges.map(c => c.id === id ? updatedChallenge : c));
  };

  const deleteChallenge = (id: string) => {
    setChallenges(challenges.filter(c => c.id !== id));
  };

  return (
    <ChallengeContext.Provider value={{ challenges, addChallenge, updateChallenge, deleteChallenge }}>
      {children}
    </ChallengeContext.Provider>
  );
};
