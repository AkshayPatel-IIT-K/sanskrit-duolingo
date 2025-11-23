import React, { useEffect, useRef, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import lessons from './lessons'
import Masthead from './components/Masthead'
import LessonList from './components/LessonList'
import ProfileModal from './components/ProfileModal'
import FooterSignature from './components/FooterSignature'
import SoundEffects from './components/SoundEffects'
import Dashboard from './pages/Dashboard'
import LessonPage from './pages/LessonPage'
import ReviewPage from './pages/ReviewPage'
import ProfilePage from './pages/ProfilePage'
import ProgressCircle from './components/ProgressCircle'

const LS = { XP: 'sd_xp', COMPLETED: 'sd_completed', STREAK: 'sd_streak', LAST: 'sd_last' }

export default function App(){
  const [darkMode, setDarkMode] = useState(false)
  const [currentLesson, setCurrentLesson] = useState(null)
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [feedback, setFeedback] = useState('')
  const [totalXP, setTotalXP] = useState(()=>parseInt(localStorage.getItem(LS.XP)||'0',10))
  const [completed, setCompleted] = useState(()=>{ try{return JSON.parse(localStorage.getItem(LS.COMPLETED)||'[]')}catch{return []} })
  const [streak, setStreak] = useState(()=>parseInt(localStorage.getItem(LS.STREAK)||'0',10))
  const [showProfile, setShowProfile] = useState(false)
  const navigate = useNavigate()

  const clickRef = useRef(null), correctRef=useRef(null), wrongRef=useRef(null), completeRef=useRef(null)
  const confettiRef = useRef(null)

  useEffect(()=>{ localStorage.setItem(LS.XP,String(totalXP)) },[totalXP])
  useEffect(()=>{ localStorage.setItem(LS.COMPLETED,JSON.stringify(completed)) },[completed])
  useEffect(()=>{ localStorage.setItem(LS.STREAK,String(streak)) },[streak])

  function play(ref){ try{ ref?.current && ref.current.play() }catch{} }
  function onSelectLesson(l){
    setCurrentLesson(l); setQIndex(0); setSelected(''); setFeedback('')
    navigate(`/lesson/${l.lesson_id.replace(/\D/g,'')}`)
  }

  function onCorrect(correct){
    setFeedback('✔ सही उत्तर'); setTotalXP(t=>t+10); play(correctRef)
    const today = new Date().toISOString().slice(0,10)
    const last = localStorage.getItem(LS.LAST)
    if (last !== today) {
      const prev = last ? new Date(last) : null
      if (prev) {
        const diff = (new Date(today)-prev)/(24*60*60*1000)
        if (Math.abs(diff-1) < 0.5) setStreak(s=>s+1)
        else setStreak(1)
      } else setStreak(1)
      localStorage.setItem(LS.LAST, today)
    }
  }
  function onWrong(){ setFeedback('❌ पुनः प्रयास करें'); play(wrongRef) }

  function nextQuestion(){
    setSelected(''); setFeedback('')
    if (!currentLesson) return
    if (qIndex+1 < currentLesson.questions.length) setQIndex(i=>i+1)
    else {
      if (!completed.includes(currentLesson.lesson_id)) setCompleted(s=>[...s,currentLesson.lesson_id])
      play(completeRef)
      try{ import('./utils/confetti').then(m=>m.runConfetti(confettiRef.current)) }catch{}
      navigate('/')
    }
  }

  return (
    <div style={{minHeight:'100vh', background: darkMode? '#0f1412':'#f5e6c8', color: darkMode? '#f5efe0':'#4e3d28', padding:18 }}>
      <div className="container">
        <Masthead level={Math.floor(totalXP/100)+1} xp={totalXP} onToggleTheme={()=>setDarkMode(s=>!s)} darkMode={darkMode} onOpenProfile={()=>setShowProfile(true)} />
        <div style={{display:'grid', gridTemplateColumns: '320px 1fr', gap:18}}>
          <div className="card" style={{padding:14}}>
            <LessonList lessons={lessons} onSelect={onSelectLesson} currentId={currentLesson?.lesson_id} completed={completed} />
          </div>
          <div className="card" style={{padding:18, minHeight:520}}>
            <Routes>
              <Route path="/" element={<Dashboard lessons={lessons} completed={completed} />} />
              <Route path="/lesson/:id" element={<LessonPage lesson={currentLesson} qIndex={qIndex} selected={selected} setSelected={setSelected} feedback={feedback} setFeedback={setFeedback} onCorrect={onCorrect} onWrong={onWrong} nextQuestion={nextQuestion} playClick={()=>play(clickRef)} playCorrect={()=>play(correctRef)} playWrong={()=>play(wrongRef)} />} />
              <Route path="/review" element={<ReviewPage lessons={lessons} />} />
              <Route path="/profile" element={<ProfilePage xp={totalXP} streak={streak} completed={completed} />} />
            </Routes>
          </div>
        </div>
      </div>

      <ProfileModal open={showProfile} onClose={()=>setShowProfile(false)} xp={totalXP} level={Math.floor(totalXP/100)+1} streak={streak} completed={completed} />
      <FooterSignature />
      <SoundEffects refs={{click:clickRef, correct:correctRef, wrong:wrongRef, complete:completeRef}} />
      <canvas ref={confettiRef} style={{position:'fixed', left:0, top:0, pointerEvents:'none', zIndex:9999}} />
    </div>
  )
}
