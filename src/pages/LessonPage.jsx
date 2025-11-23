import React from 'react'
import QuestionCard from '../components/QuestionCard'
export default function LessonPage({ lesson, qIndex, ...rest }) {
  if (!lesson) return <div>Select a lesson</div>
  return (
    <div>
      <QuestionCard lesson={lesson} qIndex={qIndex} {...rest} />
    </div>
  )
}
