import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Assignment, Campaign } from '../types';

const STORAGE_CAMPAIGNS = 'practikal-campaigns';
const STORAGE_ASSIGNMENTS = 'practikal-assignments';

interface CampaignContextType {
  campaigns: Campaign[];
  assignments: Assignment[];
  addCampaign: (c: Omit<Campaign, 'id' | 'createdAt'>) => Campaign;
  addAssignment: (a: Omit<Assignment, 'id'>) => Assignment;
  deleteAssignment: (id: string) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

const seedCampaigns: Campaign[] = [
  {
    id: 'seed-c1',
    title: 'Q1 Security awareness',
    description: 'Mandatory completion for all staff.',
    createdAt: new Date().toISOString(),
  },
];

const seedAssignments: Assignment[] = [
  {
    id: 'seed-a1',
    campaignId: 'seed-c1',
    userId: 'all',
    challengeId: '1',
    title: 'Password Security Basics',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  },
  {
    id: 'seed-a2',
    campaignId: 'seed-c1',
    userId: 'all',
    challengeId: '5',
    title: 'Inbox phishing drill',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  },
];

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const c = localStorage.getItem(STORAGE_CAMPAIGNS);
    const a = localStorage.getItem(STORAGE_ASSIGNMENTS);
    if (c) setCampaigns(JSON.parse(c));
    else {
      setCampaigns(seedCampaigns);
      localStorage.setItem(STORAGE_CAMPAIGNS, JSON.stringify(seedCampaigns));
    }
    if (a) setAssignments(JSON.parse(a));
    else {
      setAssignments(seedAssignments);
      localStorage.setItem(STORAGE_ASSIGNMENTS, JSON.stringify(seedAssignments));
    }
  }, []);

  useEffect(() => {
    if (campaigns.length > 0) localStorage.setItem(STORAGE_CAMPAIGNS, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    if (assignments.length > 0) localStorage.setItem(STORAGE_ASSIGNMENTS, JSON.stringify(assignments));
  }, [assignments]);

  const addCampaign = (input: Omit<Campaign, 'id' | 'createdAt'>) => {
    const campaign: Campaign = {
      ...input,
      id: `camp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCampaigns((prev) => [...prev, campaign]);
    return campaign;
  };

  const addAssignment = (input: Omit<Assignment, 'id'>) => {
    const row: Assignment = { ...input, id: `asg_${Date.now()}` };
    setAssignments((prev) => [...prev, row]);
    return row;
  };

  const deleteAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <CampaignContext.Provider
      value={{ campaigns, assignments, addCampaign, addAssignment, deleteAssignment }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaigns() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaigns must be used within CampaignProvider');
  return ctx;
}

export function assignmentsForUser(assignments: Assignment[], userId: string): Assignment[] {
  return assignments.filter((x) => x.userId === userId || x.userId === 'all');
}
