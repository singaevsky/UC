import { cookies } from 'next/headers';
import { createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export const getServerClient = () => createServerComponentClient<Database>({ cookies });
export const getServerActionClient = () => createServerActionClient<Database>({ cookies });

// Compatibility aliases used across the codebase
export const createClient = getServerClient;

// Helper to create a Supabase client with the service role key for server-only operations
export const getServiceRoleClient = () =>
	createAnonClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
