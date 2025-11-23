import React from 'react'
export default function SoundEffects({refs}) {
  return (
    <div style={{display:'none'}}>
      <audio ref={refs.click} src="/assets/click.mp3" preload="auto" />
      <audio ref={refs.correct} src="/assets/correct.mp3" preload="auto" />
      <audio ref={refs.wrong} src="/assets/wrong.mp3" preload="auto" />
      <audio ref={refs.complete} src="/assets/complete.mp3" preload="auto" />
    </div>
  )
}
