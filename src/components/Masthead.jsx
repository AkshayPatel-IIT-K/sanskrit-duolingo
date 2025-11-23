import React from 'react'
export default function Masthead({ level, xp, onToggleTheme, darkMode }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <div style={{width:56,height:56,borderRadius:12,background:'#c49a39',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:22}}>स</div>
        <div>
          <div style={{fontSize:18,fontWeight:800}}>Saṃskṛtam Gamified</div>
          <div style={{fontSize:13,color:'#6d5a43'}}>Temple theme — premium</div>
        </div>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <div style={{padding:'8px 12px',background:'#fff9f0',borderRadius:10,border:'1px solid #e8d9bd',textAlign:'right'}}>
          <div style={{fontSize:11,color:'#6d5a43'}}>Level</div>
          <div style={{fontWeight:800}}>{level}</div>
        </div>
        <div style={{padding:'8px 12px',background:'#fff9f0',borderRadius:10,border:'1px solid #e8d9bd',textAlign:'right'}}>
          <div style={{fontSize:11,color:'#6d5a43'}}>XP</div>
          <div style={{fontWeight:800}}>{xp}</div>
        </div>
        <button onClick={onToggleTheme} style={{padding:'8px 10px',borderRadius:8}}> {darkMode ? 'Light' : 'Dark'} </button>
      </div>
    </div>
  )
}
