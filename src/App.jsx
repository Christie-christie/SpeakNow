import { useState, useEffect, useRef, useCallback } from 'react'
import { isSpeechSupported, startRecognition } from './lib/speech.js'
import { analyzeBasic } from './lib/feedback.js'
import { saveSession, getSessions, deleteSession, getStreak } from './lib/storage.js'

function fmt(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function App() {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [history, setHistory] = useState([])
  const [streak, setStreak] = useState(0)
  const [error, setError] = useState('')

  const stopRecRef = useRef(null)
  const timerRef = useRef(null)
  const supported = isSpeechSupported()

  const refreshHistory = useCallback(async () => {
    setHistory(await getSessions())
    setStreak(await getStreak())
  }, [])

  useEffect(() => { refreshHistory() }, [refreshHistory])

  function start() {
    setError('')
    setTranscript('')
    setAnalysis(null)
    setSeconds(0)
    setRecording(true)

    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)

    stopRecRef.current = startRecognition({
      onResult: (text) => setTranscript(text),
      onError: (e) => setError(e.message || 'Speech error'),
    })
  }

  async function stop() {
    setRecording(false)
    clearInterval(timerRef.current)
    if (stopRecRef.current) stopRecRef.current()

    // Give the recognizer a beat to flush the last words.
    await new Promise((r) => setTimeout(r, 400))

    setTranscript((finalText) => {
      const result = analyzeBasic(finalText, seconds)
      setAnalysis(result)
      // Save the session.
      saveSession({
        durationSeconds: seconds,
        transcript: finalText,
        wordCount: result.wordCount,
        wpm: result.wpm,
        fillerTotal: result.fillerTotal,
      }).then(refreshHistory)
      return finalText
    })
  }

  async function remove(id) {
    await deleteSession(id)
    refreshHistory()
  }

  return (
    <div className="wrap">
      <header className="app">
        <h1>SpeakFlow</h1>
        <p>Practice speaking every day. Get instant feedback on your fluency.</p>
        <div className="streak">🔥 Practice streak: <b>{streak}</b> day{streak === 1 ? '' : 's'}</div>
      </header>

      {!supported && (
        <div className="notice">
          Your browser doesn't support built-in speech recognition. For the free version,
          please use Chrome or Edge on desktop or Android.
        </div>
      )}
      {error && <div className="notice">{error}</div>}

      <div className="card timer">
        <div className="clock">{fmt(seconds)}</div>
        <div className={'state' + (recording ? ' rec' : '')}>
          {recording ? '● Recording — speak now' : 'Ready when you are'}
        </div>
        <div className="controls">
          {!recording ? (
            <button className="primary" onClick={start} disabled={!supported}>
              ▶ Start speaking
            </button>
          ) : (
            <button className="danger" onClick={stop}>■ Stop &amp; get feedback</button>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="section">What you said</h2>
        <div className={'transcript' + (transcript ? '' : ' empty')}>
          {transcript || 'Your live transcript will appear here as you speak…'}
        </div>
      </div>

      {analysis && (
        <div className="card">
          <h2 className="section">Your feedback</h2>
          <div className="stats">
            <div className="stat"><div className="num">{analysis.wordCount}</div><div className="lbl">Words</div></div>
            <div className="stat"><div className="num">{analysis.wpm || '—'}</div><div className="lbl">Words / min</div></div>
            <div className="stat"><div className="num">{analysis.fillerTotal}</div><div className="lbl">Filler words</div></div>
            <div className="stat"><div className="num">{analysis.sentences}</div><div className="lbl">Sentences</div></div>
          </div>
          <ul className="tips">
            {analysis.tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <div className="card">
          <h2 className="section">Practice history</h2>
          {history.map((h) => (
            <div className="history-item" key={h.id}>
              <div>
                <div className="date">{new Date(h.createdAt).toLocaleDateString()} · {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="meta">{fmt(h.durationSeconds)} · {h.wordCount} words · {h.fillerTotal} fillers</div>
              </div>
              <button onClick={() => remove(h.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      <div className="footnote">
        Runs free in your browser. Your practice history is saved on this device.
      </div>
    </div>
  )
}
