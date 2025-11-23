import { useRef } from 'react'
function extractQuotedText(prompt) {
  if (!prompt) return null
  const m = prompt.match(/'([^']+)'/)
  if (m) return m[1]
  const m2 = prompt.match(/"([^"]+)"/)
  if (m2) return m2[1]
  return null
}
export default function useTTS() {
  const utterRef = useRef(null)
  function stop() {
    try { if (window.speechSynthesis) window.speechSynthesis.cancel() } catch {}
    utterRef.current = null
  }
  function speakText(text, { slow=false, lang='en-US' } = {}) {
    stop()
    if (!text) return
    if (!('speechSynthesis' in window)) return
    try {
      const u = new SpeechSynthesisUtterance(String(text))
      u.lang = lang
      u.rate = slow ? 0.75 : 1.0
      u.pitch = 1
      utterRef.current = u
      window.speechSynthesis.speak(u)
    } catch(e) {
      console.warn('TTS error', e)
    }
  }
  function phraseForQuestion(q={}) {
    if (q.prompt_to_speak) return q.prompt_to_speak
    if (q.prompt_display && typeof q.prompt_display === 'string') return q.prompt_display
    if (q.prompt && typeof q.prompt === 'string') {
      const p = q.prompt.trim()
      if (!p.includes('?') && p.split(' ').length <= 4) return p
      const extracted = extractQuotedText(p)
      if (extracted) return extracted
    }
    if (q.question && typeof q.question === 'string') {
      const extracted = extractQuotedText(q.question)
      if (extracted) return extracted
      return q.question
    }
    return ''
  }
  return {
    speakPrompt(q) {
      const phrase = phraseForQuestion(q)
      if (!phrase) return
      speakText(phrase, { slow:false, lang:'en-US' })
    },
    speakPromptSlow(q) {
      const phrase = phraseForQuestion(q)
      if (!phrase) return
      speakText(phrase, { slow:true, lang:'en-US' })
    },
    speakOption(text) {
      if (!text) return
      speakText(text, { slow:false, lang:'en-US' })
    },
    speakSlow(text) {
      if (!text) return
      speakText(text, { slow:true, lang:'en-US' })
    },
    stop
  }
}
