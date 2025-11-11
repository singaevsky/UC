// file: lib/draftHistory.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ← держать только в .env (не в .env.local)
);

export async function recordDraftHistory({
  draftId,
  userId,
  config,
}: {
  draftId: string;
  userId: string;
  config: any;
}) {
  const { error } = await supabase.from('draft_cakes_history').insert({
    draft_id: draftId,
    author_user_id: userId,
    config,
  });
  if (error) {
    console.error('Failed to record draft history:', error);
    // При желании можно бросать ошибку наружу
    // throw new Error(error.message);
  }
}
