import { useState, useEffect } from 'react'
const LS_STREAK='sd_streak'; const LS_LAST='sd_last'
export default function useStreak(){
  const [streak, setStreak] = useState(()=> parseInt(localStorage.getItem(LS_STREAK)||'0',10))
  const [last, setLast] = useState(()=> localStorage.getItem(LS_LAST)||null)
  useEffect(()=>{ localStorage.setItem(LS_STREAK, String(streak)); if (last) localStorage.setItem(LS_LAST, last) }, [streak, last])
  function touchToday(){
    const today = new Date().toISOString().slice(0,10)
    if (last === today) return
    if (last) {
      const prev = new Date(last)
      const diff = (new Date(today)-prev)/(24*60*60*1000)
      if (Math.abs(diff-1) < 0.2) setStreak(s=>s+1)
      else setStreak(1)
    } else setStreak(1)
    setLast(today)
  }
  return { streak, touchToday }
}
