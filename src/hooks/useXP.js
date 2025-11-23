import { useState, useEffect } from 'react'
const LS_XP = 'sd_xp'
export default function useXP() {
  const [xp, setXp] = useState(()=> parseInt(localStorage.getItem(LS_XP)||'0',10))
  useEffect(()=>{ localStorage.setItem(LS_XP, String(xp)) }, [xp])
  function addXP(n){ setXp(s=>s+n) }
  function level(){ return Math.floor(xp/100)+1 }
  return { xp, addXP, level: level() }
}
