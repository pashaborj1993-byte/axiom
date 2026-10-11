export const ORG_ROLES = ["owner", "admin", "learner"] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

export type WorkspaceView = {
  name: string;
  role: OrgRole;
  inviteCode: string | null;
  memberCount: number;
};

export type RosterPerson = {
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  track: string;
  lessonsCleared: number;
  lessonsTotal: number;
  xp: number;
  streak: number;
  lastPractice: string | null;
};

export type WorkspaceReport = {
  people: number;
  owners: number;
  admins: number;
  learners: number;
  tracks: { beginner: number; intermediate: number; advanced: number; unplaced: number };
  averageCleared: number;
  activeWeek: number;
};

export type AuditRow = {
  id: string;
  action: string;
  detail: string;
  actor: string;
  at: string;
};
