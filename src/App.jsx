import React, { useEffect, useRef, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import lessons from './lessons'
import Masthead from './components/Masthead'
import LessonList from './components/LessonList'
import QuestionCard from './components/QuestionCard'
import ProfileModal from './components/ProfileModal'
import FooterSignature from './components/FooterSignature'
import SoundEffects from './components/SoundEffects'
import ProgressCircle from './components/ProgressCircle'

const LS = { XP: 'sd_xp', COMPLETED: 'sd_completed', STREAK: 'sd_streak', LAST: 'sd_last', OFFLINE:'sd_offline' }

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
        <Masthead level={Math.floor(totalXP/100)+1} xp={totalXP} onToggleTheme={()=>setDarkMode(s=>!s)} darkMode={darkMode} />
        <div style={{display:'grid', gridTemplateColumns: '320px 1fr', gap:18}}>
          <div style={{background: darkMode? '#121414':'#fdf9f1', padding:14, borderRadius:12}}>
            <LessonList lessons={lessons} onSelect={onSelectLesson} currentLessonId={currentLesson?.lesson_id} completed={completed} />
          </div>
          <div style={{background: darkMode? '#121414':'#fdf9f1', padding:18, borderRadius:12, minHeight:480}}>
            <Routes>
              <Route path="/" element={
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:22,fontWeight:900}}>Welcome back</div>
                      <div style={{fontSize:13,color:'#6d5a43'}}>Continue your learning</div>
                    </div>
                    <div style={{width:120}}><ProgressCircle progress={Math.min(100, (completed.length/ (lessons.length||1))*100)} /></div>
                  </div>
                  <div style={{marginTop:18}}>
                    <button onClick={()=>{ if (completed.length) alert('Resume not implemented in demo') }} style={{padding:12, borderRadius:8, background:'#c49a39', color:'#fff'}}>Continue Lesson</button>
                  </div>
                </div>
              } />
              <Route path="/lesson/:id" element={
                currentLesson ? <QuestionCard lesson={currentLesson} qIndex={qIndex} selected={selected} setSelected={setSelected} feedback={feedback} setFeedback={setFeedback} onCorrect={onCorrect} onWrong={onWrong} nextQuestion={nextQuestion} playClick={()=>play(clickRef)} playCorrect={()=>play(correctRef)} playWrong={()=>play(wrongRef)} /> : <div>Select a lesson</div>
              } />
              <Route path="/review" element={<div>Review Mode (flashcards) - coming soon</div>} />
              <Route path="/profile" element={<div>Profile Page</div>} />
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
