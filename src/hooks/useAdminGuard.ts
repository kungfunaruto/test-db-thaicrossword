import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { checkIsAdmin } from '../services/adminService';
export type GuardState = 'loading' | 'anonymous' | 'forbidden' | 'admin';
export function useAdminGuard(): GuardState {
  const [state, setState] = useState<GuardState>('loading');
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return setState('anonymous');
      setState((await checkIsAdmin()) ? 'admin' : 'forbidden');
    };
    run();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { run(); });
    return () => sub.subscription.unsubscribe();
  }, []);
  return state;
}
