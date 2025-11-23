import React from 'react'
export default function ProgressCircle({ size=100, stroke=10, progress=50, color='#c49a39' }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  return (
    <svg width={size} height={size} style={{display:'block',margin:'0 auto'}}>
      <circle stroke="#e8d9bd" fill="transparent" strokeWidth={stroke} r={radius} cx={size/2} cy={size/2} />
      <circle stroke={color} fill="transparent" strokeWidth={stroke} r={radius} cx={size/2} cy={size/2}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{transition:'stroke-dashoffset 0.7s ease-out'}} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={size*0.22} fontWeight="700" fill="#5a442a">{Math.round(progress)}%</text>
    </svg>
  )
}
