import React, { useState } from 'react'
export default function ReviewPage({ lessons }) {
  const cards = lessons.flatMap(l => l.questions.map(q => ({ lesson: l.title, prompt: q.prompt_display ?? q.prompt, answer: q.correct ?? q.answer })))
  const [i, setI] = useState(0)
  if (!cards.length) return <div>No review cards</div>
  const card = cards[i]
  return (
    <div>
      <div style={{fontSize:20,fontWeight:900}}>{card.prompt}</div>
      <div style={{marginTop:12,fontSize:18}}>{card.answer}</div>
      <div style={{marginTop:12,display:'flex',gap:8}}>
        <button onClick={()=>setI((i+1)%cards.length)}>Next</button>
        <button onClick={()=>setI(Math.max(0,i-1))}>Prev</button>
      </div>
    </div>
  )
}
