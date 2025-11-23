import { useEffect, useState } from "react";
import lessons from "./lessons";

// Sort lessons by their lesson_id (L1, L2, L3...)
const lessonList = Object.values(lessons).sort((a, b) => {
  const n1 = parseInt(a.lesson_id.replace(/\D+/g, ""));
  const n2 = parseInt(b.lesson_id.replace(/\D+/g, ""));
  return n1 - n2;
});

/**
 * Utility: normalize answer string for comparison
 */
function normalize(s) {
  if (!s) return "";
  return String(s)
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD") // normalize diacritics just in case
    .toLowerCase();
}

function App() {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState("");
  const [lessonXP, setLessonXP] = useState(0);
  const [totalXP, setTotalXP] = useState(() => parseInt(localStorage.getItem("totalXP") || "0", 10));
  const [typedAnswer, setTypedAnswer] = useState("");

  useEffect(() => {
    localStorage.setItem("totalXP", String(totalXP));
  }, [totalXP]);

  useEffect(() => {
    // reset when switching lessons
    setQIndex(0);
    setSelected("");
    setFeedback("");
    setLessonXP(0);
    setTypedAnswer("");
  }, [currentLesson]);

  const currentQ = currentLesson?.questions?.[qIndex] ?? null;
  const progressPercent = currentLesson ? ((qIndex + 1) / currentLesson.questions.length) * 100 : 0;

  function handleMCQ(option) {
    if (!currentQ) return;
    setSelected(option);
    const correct = currentQ.correct ?? currentQ.answer;
    if (normalize(option) === normalize(correct)) {
      setFeedback("✅ Correct!");
      setLessonXP((s) => s + 10);
      setTotalXP((t) => t + 10);
    } else {
      setFeedback("❌ Try again");
    }
  }

  function handleTypingSubmit() {
    if (!currentQ) return;
    const correctText = currentQ.answer ?? currentQ.correct;
    if (normalize(typedAnswer) === normalize(correctText)) {
      setFeedback("✅ Correct!");
      setLessonXP((s) => s + 10);
      setTotalXP((t) => t + 10);
    } else {
      setFeedback("❌ Not quite. Try again");
    }
    setTypedAnswer("");
  }

  function nextQ() {
    setSelected("");
    setFeedback("");
    setTypedAnswer("");
    if (qIndex + 1 < currentLesson.questions.length) {
      setQIndex(qIndex + 1);
    } else {
      // lesson finished
      alert(`🎉 Lesson complete! Lesson XP: ${lessonXP} | Total XP: ${totalXP}`);
      setCurrentLesson(null);
    }
  }

  function goBack() {
    setCurrentLesson(null);
  }

  return (
    <div style={{ minHeight: "100vh", padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1 style={{ color: "#2f855a", fontSize: 34, margin: "10px 0" }}>📘 Sanskrit Duolingo</h1>

      <div style={{ marginBottom: 16, fontWeight: 600, color: "#2f855a" }}>Total XP: {totalXP}</div>

      {!currentLesson ? (
        <>
          <h2 style={{ marginBottom: 12, color: "#276749" }}>Select a Lesson</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, width: "100%", maxWidth: 900 }}>
            {lessonList.map((lesson) => (
              <button
                key={lesson.lesson_id}
                onClick={() => setCurrentLesson(lesson)}
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  border: "none",
                  backgroundColor: "#38a169",
                  color: "#fff",
                  boxShadow: "0 6px 10px rgba(0,0,0,0.12)",
                  cursor: "pointer",
                  fontSize: 16,
                  textAlign: "left"
                }}
              >
                <div style={{ fontWeight: 700 }}>{lesson.title}</div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>{lesson.level ?? "Beginner"}</div>
              </button>
            ))}
          </div>
        </>
      ) : currentQ ? (
        <div style={{ width: "100%", maxWidth: 760, marginTop: 12 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 8px 18px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, color: "#2f855a" }}>{currentLesson.title}</h2>
                <div style={{ color: "#4a5568", fontSize: 14, marginTop: 6 }}>
                  Question {qIndex + 1} / {currentLesson.questions.length}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#718096" }}>Lesson XP</div>
                <div style={{ fontWeight: 700, color: "#2d3748" }}>{lessonXP}</div>
              </div>
            </div>

            {/* progress bar */}
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 12, background: "#e6edf2", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ width: `${progressPercent}%`, height: "100%", background: "#48bb78", transition: "width 300ms" }} />
              </div>
            </div>

            <div style={{ marginTop: 18, fontSize: 20 }}>{currentQ.prompt}</div>

            {/* MCQ options */}
            {currentQ.options ? (
              <div style={{ marginTop: 14 }}>
                {currentQ.options.map((opt) => {
                  const isSelected = selected === opt;
                  const correct = currentQ.correct ?? currentQ.answer;
                  const bg = isSelected ? (normalize(opt) === normalize(correct) ? "#48bb78" : "#f56565") : "#f0fff6";
                  return (
                    <button
                      key={opt}
                      onClick={() => handleMCQ(opt)}
                      disabled={!!selected}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 14px",
                        marginTop: 10,
                        borderRadius: 10,
                        border: "1px solid #cfe8d8",
                        background: bg,
                        cursor: "pointer",
                        fontSize: 16
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              // typing/fill-in
              <div style={{ marginTop: 14 }}>
                <input
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  placeholder="Type your answer in Sanskrit"
                  style={{ width: "100%", padding: 12, fontSize: 16, borderRadius: 8, border: "1px solid #cbd5e1" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={handleTypingSubmit} style={{ padding: "10px 14px", borderRadius: 8, background: "#38a169", color: "#fff", border: "none", cursor: "pointer" }}>
                    Submit
                  </button>
                  <button onClick={() => setTypedAnswer("")} style={{ padding: "10px 14px", borderRadius: 8, background: "#e2e8f0", border: "none", cursor: "pointer" }}>
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 16, fontWeight: 600, color: feedback.includes("Correct") ? "#276749" : "#c53030" }}>{feedback}</div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              { (selected || feedback.includes("Correct")) && (
                <button onClick={nextQ} style={{ padding: "10px 16px", borderRadius: 8, background: "#3182ce", color: "#fff", border: "none", cursor: "pointer" }}>
                  Next ➡️
                </button>
              )}
              <button onClick={goBack} style={{ padding: "10px 16px", borderRadius: 8, background: "#edf2f7", color: "#1a202c", border: "none", cursor: "pointer" }}>
                🔙 Back to Lessons
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
