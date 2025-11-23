import React from 'react'
import ProgressCircle from './ProgressCircle'
export default function ProfileModal({open,onClose,xp,level,streak,completed}) {
  if(!open) return null
  return (
    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.32)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
      <div style={{width:720,maxWidth:'94%',borderRadius:12,background:'#fffefa',padding:18,border:'1px solid #e8d9bd'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontWeight:900,fontSize:18}}>Profile — अक्षय पटेल</div>
            <div className="small">oxakshaypatel@gmail.com</div>
          </div>
          <div><button onClick={onClose} style={{padding:8}}>Close</button></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
          <div style={{padding:12,borderRadius:8,background:'#fff9f0',border:'1px solid #e8d9bd'}}>
            <div className="small">Total XP</div>
            <div style={{fontWeight:900,fontSize:22}}>{xp}</div>
            <div style={{marginTop:8,color:'#6d5a43'}}>Level {level}</div>
          </div>
          <div style={{padding:12,borderRadius:8,background:'#fff9f0',border:'1px solid #e8d9bd'}}>
            <div className="small">Daily Streak</div>
            <div style={{fontWeight:900,fontSize:22}}>{streak} days</div>
            <div style={{marginTop:8,color:'#6d5a43'}}>Completed {completed.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
