// ============================================================================
//  DATA LAYER  —  the one file to change when you add a real database
// ============================================================================
//
//  RIGHT NOW: saves practice sessions to the browser (localStorage). Free.
//  Data lives on the user's own device. Perfect for launching.
//
//  LATER (accounts + saving across devices): replace the bodies of these four
//  functions with Supabase calls. The rest of the app calls saveSession(),
//  getSessions(), deleteSession(), getStreak() and does NOT care where the data
//  lives — so this is the only file you touch.
//
//  Example Supabase swap (after `npm install @supabase/supabase-js`):
//
//    import { createClient } from '@supabase/supabase-js'
//    const supabase = createClient(import.meta.env.VITE_SUPABASE_URL,
//                                  import.meta.env.VITE_SUPABASE_ANON_KEY)
//    export async function saveSession(s) {
//      await supabase.from('sessions').insert(s)
//    }
//    export async function getSessions() {
//      const { data } = await supabase.from('sessions')
//        .select('*').order('createdAt', { ascending: false })
//      return data || []
//    }
//  ...and so on. Note these would become `async` — the app already awaits them.
// ============================================================================

const KEY = 'speakflow.sessions.v1'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Could not save sessions', e)
  }
}

export async function saveSession(session) {
  const list = readAll()
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...session,
  }
  list.unshift(record)
  writeAll(list)
  return record
}

export async function getSessions() {
  return readAll()
}

export async function deleteSession(id) {
  writeAll(readAll().filter((s) => s.id !== id))
}

// How many days in a row the user has practiced (for the habit streak).
export async function getStreak() {
  const days = new Set(
    readAll().map((s) => new Date(s.createdAt).toDateString())
  )
  let streak = 0
  const d = new Date()
  // Count today (or, if none today, yesterday) backwards.
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1)
  while (days.has(d.toDateString())) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
