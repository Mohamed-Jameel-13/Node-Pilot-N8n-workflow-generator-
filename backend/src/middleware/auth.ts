import { supabaseAdmin } from '../utils/supabase.js';

export async function authorizeWorkspace(workspaceId: string, userId: string): Promise<boolean> {
  // Allow local mock workspace for development sandbox
  if (workspaceId === 'workspace-1' || workspaceId === 'default') {
    return true;
  }

  try {
    // 1. Check direct workspace ownership
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select('id, owner_id, user_id')
      .eq('id', workspaceId)
      .single();

    if (!wsError && workspace) {
      if (workspace.owner_id === userId || workspace.user_id === userId) {
        return true;
      }
    }

    // 2. Check workspace membership
    const { data: member, error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (!memberError && member) {
      return ['owner', 'admin', 'editor', 'member'].includes(member.role);
    }

    return false;
  } catch (err) {
    console.error('[authorizeWorkspace] Error checking membership:', err);
    return false;
  }
}
