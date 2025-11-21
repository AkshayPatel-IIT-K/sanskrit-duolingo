import { useState } from "react";
import lessons from "./lessons";

const lessonList = Object.values(lessons);

function App() {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);

  const currentQuestion =
    currentLesson?.questions[currentQuestionIndex] || null;

  function handleAnswer(option) {
    setSelectedAnswer(option);
    if (option === currentQuestion.correct || option === currentQuestion.answer) {
      setFeedback("✅ Correct!");
      setScore(score + 1);
    } else {
      setFeedback("❌ Try again");
    }
  }

  function nextQuestion() {
    setSelectedAnswer("");
    setFeedback("");
    if (currentQuestionIndex + 1 < currentLesson.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      alert(`🎉 Lesson Complete! Your score: ${score}`);
      resetLesson();
    }
  }

  function resetLesson() {
    setCurrentLesson(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setFeedback("");
    setScore(0);
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>📘 Sanskrit Duolingo</h1>

      {!currentLesson ? (
        <>
          <h2>Select a Lesson</h2>
          {lessonList.map((lesson) => (
            <button
              key={lesson.lesson_id}
              onClick={() => setCurrentLesson(lesson)}
              style={{
                margin: "8px",
                padding: "10px 15px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              {lesson.title}
            </button>
          ))}
        </>
      ) : currentQuestion ? (
        <>
          <h2>{currentLesson.title}</h2>
          <p>
            Question {currentQuestionIndex + 1} /{" "}
            {currentLesson.questions.length}
          </p>
          <p><strong>{currentQuestion.prompt}</strong></p>

          {currentQuestion.options ? (
            currentQuestion.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={selectedAnswer !== ""}
                style={{
                  margin: "5px",
                  padding: "10px",
                  cursor: "pointer",
                  background:
                    selectedAnswer === opt
                      ? opt === currentQuestion.correct
                        ? "lightgreen"
                        : "salmon"
                      : "",
                }}
              >
                {opt}
              </button>
            ))
          ) : (
            <p>🤔 Non-MCQ questions coming soon...</p>
          )}

          <p>{feedback}</p>

          {selectedAnswer !== "" && (
            <button
              onClick={nextQuestion}
              style={{ marginTop: "10px", padding: "10px" }}
            >
              Next ➡️
            </button>
          )}

          <button
            onClick={resetLesson}
            style={{ marginTop: "20px", display: "block" }}
          >
            🔙 Back to Lessons
          </button>
        </>
      ) : null}
    </div>
  );
}

export default App;
