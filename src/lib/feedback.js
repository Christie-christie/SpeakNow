// ============================================================================
//  FEEDBACK ENGINE  —  the one file to change when you add AI grammar review
// ============================================================================
//
//  RIGHT NOW: basic, free, in-app checks. No API, no cost. It counts filler
//  words, flags very long run-on sentences, and gives simple fluency stats.
//
//  LATER (real grammar correction + rephrasing): call an AI API from
//  getAiFeedback() below. Since you already use Claude, the Anthropic API is
//  the natural fit — it corrects grammar AND explains how to say it better.
//  You'd add a tiny serverless function to hold the API key (never put an API
//  key in frontend code), then call it here. Sketch included at the bottom.
// ============================================================================

const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'sort of', 'kind of',
  'basically', 'actually', 'literally', 'i mean', 'so', 'well', 'right',
]

export function analyzeBasic(transcript, durationSeconds) {
  const text = (transcript || '').trim()
  const words = text ? text.split(/\s+/) : []
  const wordCount = words.length
  const lower = ' ' + text.toLowerCase() + ' '

  // Count filler words.
  const fillers = []
  let fillerTotal = 0
  for (const f of FILLER_WORDS) {
    const matches = lower.match(new RegExp(`\\b${f.replace(' ', '\\s+')}\\b`, 'g'))
    if (matches && matches.length) {
      fillers.push({ word: f, count: matches.length })
      fillerTotal += matches.length
    }
  }
  fillers.sort((a, b) => b.count - a.count)

  // Speaking pace (words per minute). 120–160 is a comfortable range.
  const minutes = durationSeconds > 0 ? durationSeconds / 60 : 0
  const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0

  // Very rough run-on detection: sentences longer than 40 words.
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean)
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 40).length

  // Build human-readable tips.
  const tips = []
  if (fillerTotal > 0) {
    const top = fillers.slice(0, 3).map((f) => `"${f.word}" (${f.count}×)`).join(', ')
    tips.push(`You used ${fillerTotal} filler word${fillerTotal > 1 ? 's' : ''}. Most common: ${top}. Try pausing silently instead.`)
  } else if (wordCount > 0) {
    tips.push('Nice — no obvious filler words detected. That reads as confident, clear speech.')
  }
  if (wpm && wpm > 180) tips.push(`Your pace was fast (~${wpm} wpm). Slowing down a little makes you easier to follow.`)
  else if (wpm && wpm < 100 && wordCount > 20) tips.push(`Your pace was slow (~${wpm} wpm). A touch more energy will sound more fluent.`)
  else if (wpm) tips.push(`Good speaking pace (~${wpm} wpm).`)
  if (longSentences > 0) tips.push(`${longSentences} very long sentence${longSentences > 1 ? 's' : ''} detected. Breaking long thoughts into shorter sentences improves clarity.`)
  if (wordCount === 0) tips.push('No speech was captured. Check your microphone and that you allowed mic access.')

  return { wordCount, wpm, fillerTotal, fillers, longSentences, sentences: sentences.length, tips }
}

// --------------------------------------------------------------------------
//  AI feedback — STUBBED for now. Wire this up later with the Claude API.
// --------------------------------------------------------------------------
export async function getAiFeedback(/* transcript */) {
  return {
    available: false,
    message: 'AI grammar review is not turned on yet. Basic feedback is shown above. See feedback.js to enable Claude-powered corrections.',
  }

  // ---- LATER: uncomment and point at your own serverless endpoint ----------
  // The endpoint keeps your API key secret. Never call Anthropic directly
  // from the browser with your key in the code.
  //
  // const res = await fetch('/api/review', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ transcript }),
  // })
  // const data = await res.json()
  // return { available: true, corrected: data.corrected, notes: data.notes }
}
