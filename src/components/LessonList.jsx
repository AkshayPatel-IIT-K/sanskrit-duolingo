import React from 'react'
import ProgressCircle from './ProgressCircle'
function lessonIcon(title='') { const t=(title||'').toLowerCase(); if (t.includes('greet')) return '🙏'; if (t.includes('food')) return '🍎'; if (t.includes('family')) return '👨‍👩‍👧'; return '📘' }
export default function LessonList({ lessons, onSelect, currentLessonId, completed }) {
  return (
    <div>
      {lessons.map(l => {
        const active = currentLessonId === l.lesson_id
        const done = completed.includes(l.lesson_id)
        return (
          <div key={l.lesson_id} onClick={()=>onSelect(l)} style={{display:'flex',alignItems:'center',gap:10,padding:10,borderRadius:10,background: active ? '#fffaf0' : '#fdf9f1', border:'1px solid #e8d9bd', cursor:'pointer', marginBottom:8}}>
            <div style={{width:50,height:50,borderRadius:10,background:'#fffaf0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{lessonIcon(l.title)}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800}}>{l.title}</div>
              <div style={{fontSize:12,color:'#6d5a43'}}>{l.level ?? 'Beginner'}</div>
            </div>
            <div style={{fontSize:12,color:'#6d5a43',fontWeight:700}}>{done ? '✓' : `L${l.lesson_id.replace(/\D/g,'')}`}</div>
          </div>
        )
      })}
    </div>
  )
}
