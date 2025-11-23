// Replace your existing src/App.jsx with the code below.
// Also replace src/styles.css with the CSS provided in the second block inside this file.
// This App.jsx implements:
// - Layout Type L1 (centered layout: sidebar left, content right)
// - Big sandalwood paisley CSS-only background (medium visibility)
// - Lessons sorted ascending by lesson_id
// - Uses your existing src/hooks/useTTS.js for browser TTS
// - When a user clicks an option: the option is voiced immediately and a Confirm/Cancel overlay appears
// - On Confirm: answer is checked; correct/incorrect feedback is shown; Speak slow on correct
// - No external services required


import React, { useEffect, useMemo, useRef, useState } from 'react'
import lessonsFromFiles from './lessons'
import useTTS from './hooks/useTTS'

/* ----------------- Utilities ------------------ */
function getNumberFromId(id){ if(!id) return 9999; const n = parseInt(String(id).replace(/\D+/g,''),10); return Number.isFinite(n)?n:9999 }
function normalize(s){ if(!s) return ''; return String(s).trim().replace(/\s+/g,' ').normalize('NFD').toLowerCase() }

/* ----------------- Lessons loader & sort ---------------- */
const lessonsList = Object.values(lessonsFromFiles)
  .map(m => m.default ?? m)
  .sort((a,b) => getNumberFromId(a.lesson_id) - getNumberFromId(b.lesson_id))

/* ----------------- Main App ------------------ */
export default function App(){
  const tts = useTTS()
  const [currentLesson, setCurrentLesson] = useState(null)
  const [qIndex, setQIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [completed, setCompleted] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('sd_completed')||'[]') }catch{return []} })
  const [xp, setXp] = useState(()=>parseInt(localStorage.getItem('sd_xp')||'0',10))
  const confettiRef = useRef(null)

  useEffect(()=>{ localStorage.setItem('sd_completed', JSON.stringify(completed)) },[completed])
  useEffect(()=>{ localStorage.setItem('sd_xp', String(xp)) },[xp])

  // derived
  const question = currentLesson ? (currentLesson.questions?.[qIndex] ?? null) : null

  function openLesson(l){ setCurrentLesson(l); setQIndex(0); setSelectedOption(null); setFeedback('') }

  // when user clicks an option: speak it and open confirm overlay
  function onOptionClick(opt){
    if(!question) return
    // speak the option text
    tts.speakOption(opt)
    // set tentative selection and open confirm
    setSelectedOption(opt)
    setConfirmOpen(true)
  }

  // when user confirms selection
  function onConfirm(){
    setConfirmOpen(false)
    if(!question) return
    const correct = question.correct ?? question.answer
    if(normalize(selectedOption) === normalize(correct)){
      setFeedback('✔ सही उत्तर')
      setXp(x=>x+10)
      // speak correct slow
      tts.speakPromptSlow({ prompt_display: question.prompt_display ?? question.prompt })
      // mark lesson completed if last question
      // small confetti trigger
      try{ import('./utils/confetti').then(m=>m.runConfetti(confettiRef.current, 80)) }catch(e){}
    } else {
      setFeedback('❌ पुनः प्रयास करें')
      // small vibration (if available)
      try{ if(window.navigator.vibrate) window.navigator.vibrate(120) }catch(e){}
    }
  }

  function onCancel(){ setConfirmOpen(false); setSelectedOption(null) }

  function nextQuestion(){
    setSelectedOption(null)
    setFeedback('')
    if(!currentLesson) return
    if(qIndex+1 < currentLesson.questions.length) setQIndex(i=>i+1)
    else {
      // lesson finished
      if(!completed.includes(currentLesson.lesson_id)) setCompleted(s=>[...s, currentLesson.lesson_id])
      // small reset
      setCurrentLesson(null)
      setQIndex(0)
      setSelectedOption(null)
      setFeedback('')
    }
  }

  return (
    <div className="app-root">
      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="brand-badge">स</div>
            <div>
              <div className="brand-name">Saṃskṛtam Gamified</div>
              <div className="brand-sub">Modern Sanskrit · Temple motif</div>
            </div>
          </div>
          <div className="header-actions">
            <div className="stat-card">
              <div className="small">XP</div>
              <div style={{fontWeight:800}}>{xp}</div>
            </div>
            <div className="stat-card">
              <div className="small">Completed</div>
              <div style={{fontWeight:800}}>{completed.length}</div>
            </div>
          </div>
        </header>

        <div className="grid">
          <aside className="sidebar">
            <div style={{fontWeight:800, marginBottom:10}}>Lessons</div>
            <div className="lesson-list">
              {lessonsList.map(l=>{
                const done = completed.includes(l.lesson_id)
                return (
                  <div key={l.lesson_id} className={`lesson-card ${done? 'done':''}`} onClick={()=>openLesson(l)}>
                    <div className="lesson-icon">📘</div>
                    <div style={{flex:1}}>
                      <div className="lesson-title">{l.title}</div>
                      <div className="lesson-meta">{l.level || 'Beginner'}</div>
                    </div>
                    <div style={{fontWeight:800}}>{done? '✓': `L${getNumberFromId(l.lesson_id)}`}</div>
                  </div>
                )
              })}
            </div>
          </aside>

          <main className="content">
            {!currentLesson ? (
              <div className="q-card center">
                <div style={{fontSize:20,fontWeight:900}}>Select a lesson to begin</div>
                <div className="mt12 text-muted">Your lessons are sorted in ascending order.</div>
              </div>
            ) : question ? (
              <div>
                <div className="q-card">
                  <div className="q-header">
                    <div>
                      <div className="q-title">{currentLesson.title}</div>
                      <div className="q-sub">Question {qIndex+1} / {currentLesson.questions.length}</div>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn-ghost" onClick={()=>tts.speakPrompt(question)}>🔊</button>
                      <button className="btn-ghost" onClick={()=>tts.speakPromptSlow(question)}>🐢</button>
                    </div>
                  </div>

                  <div className="prompt">{question.prompt_display ?? question.prompt}</div>

                  {question.options ? (
                    <div className="options">
                      {question.options.map((opt, idx)=>{
                        const isSelected = selectedOption === opt
                        return (
                          <button key={idx} className={`opt ${isSelected? 'selected':''}`} onClick={()=>onOptionClick(opt)}>
                            <div style={{fontWeight:800}}>{String.fromCharCode(65+idx)}. {opt}</div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{marginTop:12}}>
                      <input placeholder="Type your answer" className="opt" onKeyDown={(e)=>{ if(e.key==='Enter'){ tts.speakOption(e.target.value); setSelectedOption(e.target.value); setConfirmOpen(true) } }} />
                    </div>
                  )}

                  <div className="actions">
                    <div className="feedback">{feedback}</div>
                    <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                      {(selectedOption || feedback.includes('✔')) && <button className="btn-primary" onClick={nextQuestion}>Next →</button>}
                      <button className="btn-ghost" onClick={()=>{ setCurrentLesson(null); setQIndex(0); setSelectedOption(null); setFeedback('') }}>Back</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="q-card center">No question available</div>
            )}
          </main>
        </div>
      </div>

      {/* confirm overlay */}
      {confirmOpen && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div style={{fontWeight:900, fontSize:18}}>Confirm your answer</div>
            <div style={{marginTop:12, fontSize:16}}>{selectedOption}</div>
            <div style={{marginTop:14, display:'flex', gap:10}}>
              <button className="btn-primary" onClick={onConfirm}>Confirm</button>
              <button className="btn-ghost" onClick={onCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="footer-sign">
        <div style={{fontWeight:900}}>अक्षय पटेल</div>
        <div className="small">oxakshaypatel@gmail.com</div>
        <div className="small">development in progress</div>
      </div>

      <canvas ref={confettiRef} style={{position:'fixed',left:0,top:0,width:0,height:0,pointerEvents:'none'}} />
    </div>
  )
}
