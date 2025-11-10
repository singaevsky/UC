import { cookies } from 'next/headers';
import { createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

export const getServerClient = () => createServerComponentClient<Database>({ cookies });
export const getServerActionClient = () => createServerActionClient<Database>({ cookies });
