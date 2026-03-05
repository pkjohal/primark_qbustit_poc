import { supabase } from '@/lib/supabase';

export function useAudit() {
  const logEvent = async (
    entityType: 'session' | 'user' | 'store',
    entityId: string,
    action: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> => {
    const { error } = await supabase.from('audit_log').insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      user_id: userId,
      metadata: metadata ?? null,
    });
    if (error) {
      console.error('Audit log error:', error);
    }
  };

  return { logEvent };
}
