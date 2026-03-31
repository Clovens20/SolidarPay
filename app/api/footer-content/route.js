import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { withSupabaseRetry } from '@/lib/supabase-query-retry'
import { getDefaultFooterContentMap } from '@/lib/fallback-footer-content'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = createSupabaseAdmin() || supabase

  const { data, error } = await withSupabaseRetry(
    () =>
      db
        .from('footer_content')
        .select('*')
        .eq('enabled', true)
        .order('display_order'),
    { maxAttempts: 4, baseDelayMs: 400 }
  )

  if (error || !data?.length) {
    if (error) {
      console.warn('[api/footer-content]', error.code || error.message)
    }
    return NextResponse.json({
      sections: getDefaultFooterContentMap(),
      fallback: true,
    })
  }

  const contentMap = {}
  data.forEach((section) => {
    const content =
      typeof section.content === 'string'
        ? JSON.parse(section.content || '{}')
        : section.content || {}
    contentMap[section.section_name] = {
      ...section,
      content,
    }
  })

  return NextResponse.json({ sections: contentMap, fallback: false })
}
