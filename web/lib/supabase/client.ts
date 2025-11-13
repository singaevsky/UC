import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

export const getClient = () => createClientComponentClient<Database>();

// Compatibility alias used in older code
export const createClient = getClient;
