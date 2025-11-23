import React from 'react'
export default function ProfilePage({ xp, streak, completed }) {
  return (
    <div>
      <div style={{fontSize:22,fontWeight:900}}>Profile</div>
      <div style={{marginTop:12}}>XP: {xp}</div>
      <div>Streak: {streak}</div>
      <div>Completed: {completed.length}</div>
    </div>
  )
}
