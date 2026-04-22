import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Assignment, Campaign } from '../../types';
import { useGamificationApi } from '../../config/gamification';

const STORAGE_CAMPAIGNS = 'practikal-campaigns';
const STORAGE_ASSIGNMENTS = 'practikal-assignments';

interface CampaignsState {
  campaigns: Campaign[];
  assignments: Assignment[];
}

const initialState: CampaignsState = {
  campaigns: [],
  assignments: [],
};

const loadCampaignsFromStorage = (): Campaign[] => {
  const c = localStorage.getItem(STORAGE_CAMPAIGNS);
  if (!c) return [];
  try {
    const parsed = JSON.parse(c) as Campaign[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const loadAssignmentsFromStorage = (): Assignment[] => {
  const a = localStorage.getItem(STORAGE_ASSIGNMENTS);
  if (!a) return [];
  try {
    const parsed = JSON.parse(a) as Assignment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setCampaigns: (state, action: PayloadAction<Campaign[]>) => {
      state.campaigns = action.payload;
    },
    setAssignments: (state, action: PayloadAction<Assignment[]>) => {
      state.assignments = action.payload;
    },
    addCampaign: (state, action: PayloadAction<Omit<Campaign, 'id' | 'createdAt'>>) => {
      const campaign: Campaign = {
        ...action.payload,
        id: `camp_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      state.campaigns.push(campaign);
      localStorage.setItem(STORAGE_CAMPAIGNS, JSON.stringify(state.campaigns));
    },
    addAssignment: (state, action: PayloadAction<Omit<Assignment, 'id'>>) => {
      const assignment: Assignment = { ...action.payload, id: `asg_${Date.now()}` };
      state.assignments.push(assignment);
      if (!useGamificationApi) {
        localStorage.setItem(STORAGE_ASSIGNMENTS, JSON.stringify(state.assignments));
      }
    },
    deleteAssignment: (state, action: PayloadAction<string>) => {
      state.assignments = state.assignments.filter((x) => x.id !== action.payload);
      if (!useGamificationApi) {
        localStorage.setItem(STORAGE_ASSIGNMENTS, JSON.stringify(state.assignments));
      }
    },
    initializeCampaigns: (state) => {
      state.campaigns = loadCampaignsFromStorage();
      state.assignments = useGamificationApi ? [] : loadAssignmentsFromStorage();
    },
  },
});

export const { setCampaigns, setAssignments, addCampaign, addAssignment, deleteAssignment, initializeCampaigns } = campaignsSlice.actions;
export default campaignsSlice.reducer;

// Helper function (can be moved to utils if needed)
export function assignmentsForUser(assignments: Assignment[], userId: string): Assignment[] {
  return assignments.filter((x) => x.userId === userId || x.userId === 'all');
}
