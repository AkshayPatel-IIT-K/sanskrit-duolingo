import { useState, useEffect } from "react";
import lessons from "./lessons";

const lessonList = Object.values(lessons);

function App() {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0); // XP for this lesson
  const [totalXP, setTotalXP] = useState(
    parseInt(localStorage.getItem("totalXP") || "0")
  );

  const currentQuestion =
    currentLesson?.questions[currentQuestionIndex] || null;

  useEffect(() => {
    localStorage.setItem("totalXP", totalXP);
  }, [totalXP]);

  function handleAnswer(option) {
    setSelectedAnswer(option);
    if (option === currentQuestion.correct || option === currentQuestion.answer) {
      setFeedback("✅ Correct!");
      setScore(score + 10); // +10 XP per correct answer
      setTotalXP(totalXP + 10);
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
      alert(
        `🎉 Lesson Complete! Lesson XP: ${score}, Total XP: ${totalXP}`
      );
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

  const progressPercent = currentLesson
    ? ((currentQuestionIndex + 1) / currentLesson.questions.length) * 100
    : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "'Poppins', Arial, sans-serif",
        background: "linear-gradient(to bottom, #d4f0e7, #ffffff)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 style={{ color: "#2f855a", fontSize: "2.5rem", marginBottom: "20px" }}>
        📘 Sanskrit Duolingo
      </h1>

      <div style={{ marginBottom: "15px", fontWeight: "600", color: "#2f855a" }}>
        Total XP: {totalXP}
      </div>

      {!currentLesson ? (
        <>
          <h2 style={{ marginBottom: "15px", color: "#276749" }}>Select a Lesson</h2>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {lessonList.map((lesson) => (
              <button
                key={lesson.lesson_id}
                onClick={() => setCurrentLesson(lesson)}
                style={{
                  margin: "8px",
                  padding: "15px 25px",
                  fontSize: "18px",
                  borderRadius: "12px",
                  backgroundColor: "#38a169",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                  transition: "0.2s",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#2f855a")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#38a169")}
              >
                {lesson.title}
              </button>
            ))}
          </div>
        </>
      ) : currentQuestion ? (
        <div
          style={{
            width: "90%",
            maxWidth: "600px",
            background: "#fff",
            padding: "25px",
            borderRadius: "16px",
            boxShadow: "0px 6px 10px rgba(0,0,0,0.15)",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#2f855a" }}>{currentLesson.title}</h2>
          <p style={{ margin: "10px 0", color: "#4a5568" }}>
            Question {currentQuestionIndex + 1} / {currentLesson.questions.length}
          </p>

          {/* Progress bar */}
          <div style={{ width: "100%", background: "#e2e8f0", borderRadius: "10px", marginBottom: "15px" }}>
            <div
              style={{
                width: `${progressPercent}%`,
                background: "#48bb78",
                height: "12px",
                borderRadius: "10px",
                transition: "width 0.3s",
              }}
            />
          </div>

          <p style={{ fontSize: "1.2rem", margin: "15px 0" }}>{currentQuestion.prompt}</p>

          {currentQuestion.options &&
            currentQuestion.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={selectedAnswer !== ""}
                style={{
                  display: "block",
                  width: "80%",
                  margin: "8px auto",
                  padding: "12px",
                  fontSize: "16px",
                  borderRadius: "10px",
                  border: "1px solid #38a169",
                  backgroundColor:
                    selectedAnswer === opt
                      ? opt === currentQuestion.correct
                        ? "#48bb78"
                        : "#f56565"
                      : "#edfdf5",
                  color: "#1a202c",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                {opt}
              </button>
            ))}

          <p
            style={{
              marginTop: "15px",
              fontWeight: "600",
              color: feedback.includes("Correct") ? "#48bb78" : "#f56565",
            }}
          >
            {feedback}
          </p>

          {selectedAnswer !== "" && (
            <button
              onClick={nextQuestion}
              style={{
                marginTop: "20px",
                padding: "12px 20px",
                borderRadius: "10px",
                backgroundColor: "#3182ce",
                color: "#fff",
                fontSize: "16px",
                cursor: "pointer",
                border: "none",
              }}
            >
              Next ➡️
            </button>
          )}

          <button
            onClick={resetLesson}
            style={{
              marginTop: "20px",
              display: "block",
              backgroundColor: "#e2e8f0",
              color: "#1a202c",
              borderRadius: "10px",
              padding: "10px 15px",
              cursor: "pointer",
              border: "none",
            }}
          >
            🔙 Back to Lessons
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default App;