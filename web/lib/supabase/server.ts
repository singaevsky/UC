import { cookies } from 'next/headers';
import { createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs';

export const getServerClient = () => createServerComponentClient({ cookies });
export const getServerActionClient = () => createServerActionClient({ cookies });
