import { createContext, useContext, ReactNode } from 'react';
import { useTeams } from '@/hooks/useTeams';
import type { Team, TeamMember, TeamRole } from '@/hooks/useTeams';

interface TeamContextType {
  teams: Team[];
  currentTeam: Team | null;
  setCurrentTeam: (team: Team | null) => void;
  teamMembers: TeamMember[];
  loading: boolean;
  membersLoading: boolean;
  createTeam: (name: string) => Promise<void>;
  joinTeam: (inviteCode: string) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;
  updateMemberRole: (teamId: string, targetUserId: string, newRole: TeamRole) => Promise<void>;
  removeMember: (teamId: string, targetUserId: string) => Promise<void>;
  refreshTeams: () => Promise<void>;
  refreshMembers: (teamId: string) => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const teamData = useTeams();

  return (
    <TeamContext.Provider value={teamData}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
}
