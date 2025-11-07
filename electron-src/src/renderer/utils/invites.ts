// Lightweight invites utility - temporary stubs to satisfy imports and provide a simple client-side API.
// These functions intentionally return empty results when no backend is available.

export interface Invite {
  id: string;
  workspaceId: string;
  email: string;
  inviterId?: string;
  createdAt?: string;
  accepted?: boolean;
}

export async function getInvitesForEmail(email: string): Promise<Invite[]> {
  console.warn('[invites] getInvitesForEmail: no backend endpoint configured; returning empty list for', email);
  return [];
}

export async function getInvitesForWorkspace(workspaceId: string): Promise<Invite[]> {
  console.warn('[invites] getInvitesForWorkspace: no backend endpoint configured; returning empty list for', workspaceId);
  return [];
}

export async function addInvite(workspaceId: string, email: string): Promise<{ success: boolean; invite?: Invite; message?: string }>{
  console.warn('[invites] addInvite: no backend endpoint configured; not creating invite', workspaceId, email);
  return { success: false, message: 'No backend invite endpoint configured' };
}
