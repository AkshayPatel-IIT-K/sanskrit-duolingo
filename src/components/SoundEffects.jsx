import React from 'react'
export default function SoundEffects({ refs }) {
  return (
    <div style={{display:'none'}}>
      <audio ref={refs.click} id="clickAudio" src="/assets/click.mp3" preload="auto" />
      <audio ref={refs.correct} id="correctAudio" src="/assets/correct.mp3" preload="auto" />
      <audio ref={refs.wrong} id="wrongAudio" src="/assets/wrong.mp3" preload="auto" />
      <audio ref={refs.complete} id="completeAudio" src="/assets/complete.mp3" preload="auto" />
    </div>
  )
}
