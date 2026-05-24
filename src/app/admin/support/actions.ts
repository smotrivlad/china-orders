'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'

export async function markAnswered(id: string, answered: boolean) {
  await adminClient
    .from('support_messages')
    .update({ answered })
    .eq('id', id)

  revalidatePath('/admin/support')
}
