import React from 'react'
import useTTS from '../hooks/useTTS'
function normalize(s) { if (!s) return ''; return String(s).trim().replace(/\s+/g,' ').normalize('NFD').toLowerCase() }
export default function QuestionCard({ lesson, qIndex, selected, setSelected, feedback, setFeedback, onCorrect, onWrong, nextQuestion, playClick=()=>{}, playCorrect=()=>{}, playWrong=()=>{} }) {
  const tts = useTTS()
  const q = lesson?.questions?.[qIndex] ?? null
  if (!q) return <div>No question</div>
  const handlePlayPrompt = (slow=false) => { if (slow) tts.speakPromptSlow(q); else tts.speakPrompt(q) }
  const handleMCQ = (opt) => {
    if (!q || selected) return
    tts.speakOption(opt)
    playClick()
    setSelected(opt)
    const correct = q.correct ?? q.answer
    if (normalize(opt) === normalize(correct)) { playCorrect(); setFeedback('✔ सही उत्तर'); if (onCorrect) onCorrect(correct) }
    else { playWrong(); setFeedback('❌ पुनः प्रयास करें'); if (onWrong) onWrong() }
  }
  return (
    <div style={{padding:14, borderRadius:12, background:'#fffaf0', border:'1px solid #e8d9bd'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <div style={{fontSize:20, fontWeight:800}}>{lesson.title}</div>
          <div style={{fontSize:12, color:'#6d5a43'}}>Question {qIndex+1} / {lesson.questions.length}</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button onClick={()=>handlePlayPrompt(false)} style={{padding:8}}>🔊</button>
          <button onClick={()=>handlePlayPrompt(true)} style={{padding:8}}>🐢</button>
          <button onClick={()=>handlePlayPrompt(false)} style={{padding:8}}>🔁</button>
        </div>
      </div>
      <div style={{marginTop:12, fontSize:22, fontWeight:900, color:'#4e3d28'}}>
        {q.prompt_display ?? q.prompt ?? q.question}
      </div>
      {q.options ? (
        <div style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          {q.options.map((opt, idx)=> {
            const correct = q.correct ?? q.answer
            const isSelected = selected && opt === selected
            const isCorrect = selected && normalize(opt) === normalize(correct)
            return (
              <button key={idx} onClick={()=>handleMCQ(opt)} disabled={!!selected}
                style={{padding:12, borderRadius:10, textAlign:'left', background: isCorrect ? '#f6fce7' : isSelected ? '#fde7e7' : '#fffef9', border:'1px solid #e8d9bd'}}>
                <div style={{fontWeight:800}}>{String.fromCharCode(65+idx)}. {opt}</div>
              </button>
            )
          })}
        </div>
      ) : (
        <div style={{marginTop:12}}>
          <input placeholder="Type your answer" onKeyDown={(e)=>{ if (e.key==='Enter') { tts.speakOption(e.target.value); playClick() } }} style={{width:'100%', padding:10, borderRadius:8, border:'1px solid #e8d9bd'}} />
        </div>
      )}
      <div style={{marginTop:12}}>
        <div style={{fontWeight:800}}>{feedback}</div>
        {(selected || (feedback || '').includes('✔')) && <button onClick={nextQuestion} style={{marginLeft:10, padding:'8px 12px'}}>Next →</button>}
      </div>
    </div>
  )
}
