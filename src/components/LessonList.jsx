import React from 'react'
function iconFor(title=''){ const t=(title||'').toLowerCase(); if(t.includes('greet')) return '🙏'; if(t.includes('family')) return '👨‍👩‍👧'; if(t.includes('food')) return '🍎'; return '📘' }
export default function LessonList({lessons,onSelect,currentId,completed}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {lessons.map(l=>{
        const active = currentId===l.lesson_id
        const done = completed.includes(l.lesson_id)
        return (
          <div key={l.lesson_id} onClick={()=>onSelect(l)} style={{display:'flex',alignItems:'center',gap:10,padding:10,borderRadius:10,background: active? '#fffaf0':'#fdf9f1',border:'1px solid #e8d9bd',cursor:'pointer'}}>
            <div style={{width:48,height:48,borderRadius:8,background:'#fffef9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{iconFor(l.title)}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800}}>{l.title}</div>
              <div className="small">{l.level||'Beginner'}</div>
            </div>
            <div style={{fontWeight:700}}>{done? '✓' : `L${l.lesson_id.replace(/\D/g,'')}`}</div>
          </div>
        )
      })}
    </div>
  )
}
