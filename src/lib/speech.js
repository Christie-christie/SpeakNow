// ============================================================================
//  SPEECH ENGINE  —  the one file to change when you upgrade transcription
// ============================================================================
//
//  RIGHT NOW: uses the browser's built-in Web Speech API. Free. No API key.
//  Works in Chrome, Edge, and most Chromium browsers. Safari support is partial.
//
//  LATER (better accuracy): replace `startRecognition` with a call to a paid
//  speech-to-text API (e.g. OpenAI Whisper). You only change THIS file — the
//  rest of the app keeps working. See createRecorder() below, which already
//  captures the raw audio Blob you'd send to such an API.
// ============================================================================

export function isSpeechSupported() {
  return typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
}

// Live, on-device transcription via the browser.
// onResult(fullText) fires as the user speaks. Returns a stop() function.
export function startRecognition({ onResult, onError, lang = 'en-US' } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) {
    onError && onError(new Error('Speech recognition not supported in this browser.'))
    return () => {}
  }

  const recognition = new SR()
  recognition.lang = lang
  recognition.continuous = true
  recognition.interimResults = true

  let finalText = ''
  let stopped = false

  recognition.onresult = (event) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0].transcript
      if (event.results[i].isFinal) finalText += chunk + ' '
      else interim += chunk
    }
    onResult && onResult((finalText + interim).trim())
  }

  recognition.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') return
    onError && onError(new Error(event.error))
  }

  // Browsers stop recognition on silence; restart it until we manually stop.
  recognition.onend = () => {
    if (!stopped) {
      try { recognition.start() } catch (e) { /* already starting */ }
    }
  }

  try { recognition.start() } catch (e) { onError && onError(e) }

  return () => {
    stopped = true
    try { recognition.stop() } catch (e) { /* ignore */ }
  }
}

// Records the raw microphone audio as a Blob.
// You don't need this for the free browser transcription, but it's here so
// that when you upgrade to a paid speech API you already have the audio to send.
export async function createRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const chunks = []
  const recorder = new MediaRecorder(stream)
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
  recorder.start()

  return {
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          resolve(new Blob(chunks, { type: 'audio/webm' }))
        }
        recorder.stop()
      }),
  }
}
