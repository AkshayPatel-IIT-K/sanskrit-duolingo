import React from 'react'
import ProgressCircle from '../components/ProgressCircle'
export default function Dashboard({ lessons, completed }) {
  const pct = Math.round((completed.length / (lessons.length||1)) * 100)
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:22,fontWeight:900}}>Dashboard</div>
          <div className="small">Continue your learning</div>
        </div>
        <div style={{width:120}}><ProgressCircle progress={pct} /></div>
      </div>
      <div style={{marginTop:18}} className="card">
        <div style={{fontWeight:800}}>Quick Actions</div>
        <div style={{marginTop:8,display:'flex',gap:8}}>
          <button style={{padding:10,borderRadius:8,background:'#c49a39',color:'#fff'}}>Continue</button>
          <button style={{padding:10,borderRadius:8}}>Review</button>
        </div>
      </div>
    </div>
  )
}
