
export interface LeaderboardEntry {
  id: string;
  name: string;
  organization: string;
  department: string;
  rank: string;
  /** % progress within current XP tier */
  progress: number;
  /** Reputation points (not currency) */
  earnings: number;
  xp: number;
  challenges: number;
  streak: number;
  position: number;
}

// Sample team leaderboard data
export const teamLeaderboard: LeaderboardEntry[] = [
  {
    id: '1', // The current user
    name: 'John Doe',
    organization: 'Paperless Technology',
    department: 'Engineering',
    rank: 'beginner',
    progress: 35,
    earnings: 350,
    xp: 3500,
    challenges: 8,
    streak: 3,
    position: 1
  },
  {
    id: '2',
    name: 'Jane Smith',
    organization: 'Paperless Technology',
    department: 'Engineering',
    rank: 'beginner',
    progress: 28,
    earnings: 285,
    xp: 2800,
    challenges: 6,
    streak: 5,
    position: 2
  },
  {
    id: '3',
    name: 'Robert Johnson',
    organization: 'Paperless Technology',
    department: 'IT',
    rank: 'beginner',
    progress: 22,
    earnings: 220,
    xp: 2200,
    challenges: 5,
    streak: 2,
    position: 3
  },
  {
    id: '4',
    name: 'Emily Williams',
    organization: 'Paperless Technology',
    department: 'HR',
    rank: 'beginner',
    progress: 18,
    earnings: 175,
    xp: 1800,
    challenges: 4,
    streak: 1,
    position: 4
  },
  {
    id: '5',
    name: 'Michael Brown',
    organization: 'Paperless Technology',
    department: 'Sales',
    rank: 'beginner',
    progress: 15,
    earnings: 150,
    xp: 1500,
    challenges: 3,
    streak: 0,
    position: 5
  }
];

// Sample company leaderboard data
export const companyLeaderboard: LeaderboardEntry[] = [
  {
    id: '6',
    name: 'Sarah Miller',
    organization: 'Paperless Technology',
    department: 'IT',
    rank: 'medior',
    progress: 65,
    earnings: 750,
    xp: 12000,
    challenges: 25,
    streak: 12,
    position: 1
  },
  {
    id: '7',
    name: 'David Wilson',
    organization: 'Paperless Technology',
    department: 'Engineering',
    rank: 'medior',
    progress: 58,
    earnings: 680,
    xp: 10500,
    challenges: 22,
    streak: 8,
    position: 2
  },
  {
    id: '1', // The current user
    name: 'John Doe',
    organization: 'Paperless Technology',
    department: 'Engineering',
    rank: 'beginner',
    progress: 35,
    earnings: 350,
    xp: 3500,
    challenges: 8,
    streak: 3,
    position: 12
  }
];

// Sample worldwide leaderboard data
export const worldwideLeaderboard: LeaderboardEntry[] = [
  {
    id: '8',
    name: 'Alex Chen',
    organization: 'SecureTech',
    department: 'Security',
    rank: 'legend',
    progress: 98,
    earnings: 2500,
    xp: 52000,
    challenges: 150,
    streak: 90,
    position: 1
  },
  {
    id: '9',
    name: 'Taylor Rodriguez',
    organization: 'CyberDefense Inc.',
    department: 'Operations',
    rank: 'master',
    progress: 92,
    earnings: 2250,
    xp: 48000,
    challenges: 130,
    streak: 75,
    position: 2
  },
  {
    id: '10',
    name: 'Jordan Lee',
    organization: 'DataGuard Solutions',
    department: 'Engineering',
    rank: 'master',
    progress: 88,
    earnings: 2100,
    xp: 45000,
    challenges: 125,
    streak: 60,
    position: 3
  },
  {
    id: '1', // The current user
    name: 'John Doe',
    organization: 'Paperless Technology',
    department: 'Engineering',
    rank: 'beginner',
    progress: 35,
    earnings: 350,
    xp: 3500,
    challenges: 8,
    streak: 3,
    position: 245
  }
];
