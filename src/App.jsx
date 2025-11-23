import React, { useEffect, useMemo, useState, useRef } from "react";
import lessons from "./lessons";

/**
 * App.jsx
 * - Auto-lesson loading (lessons folder)
 * - Voice (Web Speech API) with normal & slow playback
 * - Aesthetic Duolingo-inspired UI (light green theme)
 * - XP, progress, animations, mobile responsive
 */

/* ---------- Small utilities ---------- */
function normalize(s) {
  if (!s) return "";
  return String(s).trim().replace(/\s+/g, " ").normalize("NFD").toLowerCase();
}

function getNumberFromId(id) {
  if (!id) return 9999;
  const n = parseInt(String(id).replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : 9999;
}

/* ---------- Lesson list (sorted) ---------- */
const lessonList = Object.values(lessons).sort((a, b) => {
  return getNumberFromId(a.lesson_id) - getNumberFromId(b.lesson_id);
});

/* ---------- Simple emoji icon mapping by keywords ---------- */
function guessIcon(title = "") {
  const t = title.toLowerCase();
  if (t.includes("greet") || t.includes("hello") || t.includes("greetings")) return "👋";
  if (t.includes("number") || t.includes("number") || t.includes("count")) return "🔢";
  if (t.includes("color")) return "🎨";
  if (t.includes("family")) return "👪";
  if (t.includes("animal")) return "🐾";
  if (t.includes("food")) return "🍎";
  if (t.includes("nature")) return "🌳";
  if (t.includes("verb")) return "⚡";
  if (t.includes("body")) return "🧍";
  if (t.includes("day") || t.includes("time") || t.includes("month")) return "🗓️";
  if (t.includes("house") || t.includes("household")) return "🏠";
  if (t.includes("transport")) return "🚗";
  if (t.includes("weather")) return "☀️";
  if (t.includes("adject")) return "✨";
  return "📘";
}

/* ---------- CSS-in-JS styles (kept inline for single-file replacement) ---------- */
const styles = {
  page: {
    minHeight: "100vh",
    padding: 20,
    boxSizing: "border-box",
    background: "linear-gradient(180deg,#e6faf0 0%, #ffffff 60%)",
    fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    color: "#1a202c",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    width: "100%",
    maxWidth: 1100,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    padding: "8px 12px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: "linear-gradient(135deg,#2f855a,#38a169)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 22,
    boxShadow: "0 6px 18px rgba(45, 73, 37, 0.12)",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#22543d",
    lineHeight: 1,
  },
  xpBadge: {
    background: "#ffffff",
    padding: "8px 12px",
    borderRadius: 12,
    boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 700,
  },
  container: {
    width: "100%",
    maxWidth: 1100,
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 20,
    alignItems: "start",
  },
  // Left: lesson list
  lessonsPanel: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
    height: "fit-content",
  },
  lessonCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px",
    borderRadius: 12,
    cursor: "pointer",
    transition: "transform 160ms ease, box-shadow 160ms ease",
    border: "1px solid rgba(41,128,77,0.06)",
  },
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: "#f0fff6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
  },
  // Right: question card
  questionWrapper: {
    background: "#fff",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 12px 28px rgba(14,30,15,0.06)",
  },
  promptRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  promptText: {
    fontSize: 22,
    fontWeight: 700,
    color: "#234e3a",
  },
  playBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#edfdf6",
    fontSize: 16,
  },
  optionsGrid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
  },
  optionBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e6f3ec",
    background: "#f6fff7",
    cursor: "pointer",
    fontSize: 16,
    boxShadow: "0 6px 16px rgba(43,160,73,0.04)",
    transition: "transform 140ms ease, box-shadow 140ms ease",
  },
  controlRow: {
    marginTop: 16,
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  smallBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#eef6ff",
  },
  footerNote: {
    marginTop: 20,
    fontSize: 13,
    color: "#4a5568",
  },
  // responsive
  '@mediaMobile': {
    container: {
      gridTemplateColumns: "1fr",
    },
    optionsGrid: {
      gridTemplateColumns: "1fr",
    }
  }
};

/* ---------- App Component ---------- */
export default function App() {
  // state
  const [currentLesson, setCurrentLesson] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState("");
  const [lessonXP, setLessonXP] = useState(0);
  const [totalXP, setTotalXP] = useState(() =>
    parseInt(localStorage.getItem("totalXP") || "0", 10)
  );
  const [typedAnswer, setTypedAnswer] = useState("");
  const [animState, setAnimState] = useState(""); // "correct" or "wrong" for animations

  const utterRef = useRef(null);
  const slowModeRef = useRef(false);

  useEffect(() => {
    localStorage.setItem("totalXP", String(totalXP));
  }, [totalXP]);

  // reset when switching lesson
  useEffect(() => {
    setQIndex(0);
    setSelected("");
    setFeedback("");
    setLessonXP(0);
    setTypedAnswer("");
    setAnimState("");
  }, [currentLesson]);

  // current question
  const currentQ = useMemo(
    () => (currentLesson ? currentLesson.questions[qIndex] : null),
    [currentLesson, qIndex]
  );

  const progressPercent = currentLesson
    ? Math.round(((qIndex + 1) / currentLesson.questions.length) * 100)
    : 0;

  /* --- VOICE FUNCTIONS (Web Speech API) --- */
  function stopSpeaking() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    utterRef.current = null;
  }

  function speak(text, { slow = false } = {}) {
    try {
      stopSpeaking();
      if (!window.speechSynthesis) {
        // fallback alert
        // (most modern browsers support it)
        alert("Speech synthesis not supported in this browser.");
        return;
      }
      const utter = new SpeechSynthesisUtterance(text);
      // language for Sanskrit - 'sa-IN' is common; browsers may fallback
      utter.lang = "sa-IN";
      utter.rate = slow ? 0.7 : 0.95;
      utter.pitch = 1;
      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("TTS error", e);
    }
  }

  /* --- ANSWER HANDLING --- */
  function handleMCQ(option) {
    if (!currentQ) return;
    // block repeated clicks
    if (selected) return;
    setSelected(option);
    const correct = currentQ.correct ?? currentQ.answer;
    if (normalize(option) === normalize(correct)) {
      onCorrect();
    } else {
      onWrong();
    }
  }

  function handleTypingSubmit() {
    if (!currentQ) return;
    const correct = currentQ.answer ?? currentQ.correct;
    if (normalize(typedAnswer) === normalize(correct)) {
      onCorrect();
    } else {
      onWrong();
    }
    setTypedAnswer("");
  }

  function onCorrect() {
    setFeedback("✅ Correct!");
    setAnimState("correct");
    setLessonXP((s) => s + 10);
    setTotalXP((t) => t + 10);
    // play answer voice
    if (currentQ?.answer) speak(currentQ.answer, { slow: false });
    // small timeout before enabling Next
    setTimeout(() => {
      setAnimState("");
    }, 700);
  }

  function onWrong() {
    setFeedback("❌ Try again");
    setAnimState("wrong");
    // small shake then clear
    setTimeout(() => {
      setAnimState("");
    }, 600);
  }

  function nextQuestion() {
    setSelected("");
    setFeedback("");
    setTypedAnswer("");
    setAnimState("");
    if (!currentLesson) return;
    if (qIndex + 1 < currentLesson.questions.length) {
      setQIndex((i) => i + 1);
    } else {
      // finished lesson
      // small XP animation (alert replacement)
      alert(`🎉 Lesson complete! +${lessonXP} XP | Total: ${totalXP} XP`);
      setCurrentLesson(null);
    }
  }

  function goBackToLessons() {
    setCurrentLesson(null);
  }

  /* ---------- small UI helpers ---------- */
  function lessonCardStyle(isActive) {
    return {
      ...styles.lessonCard,
      transform: isActive ? "translateY(-4px)" : "none",
      boxShadow: isActive
        ? "0 10px 30px rgba(45,73,37,0.12)"
        : "0 6px 18px rgba(0,0,0,0.06)",
      background: isActive ? "linear-gradient(180deg,#f0fff6,#ffffff)" : "#fff",
    };
  }

  function optionStyle(opt) {
    const base = { ...styles.optionBtn };
    if (!selected && !feedback) return base;
    if (selected) {
      const correct = currentQ.correct ?? currentQ.answer;
      if (normalize(opt) === normalize(correct)) {
        // correct highlight
        return {
          ...base,
          background: "#e6ffef",
          border: "1px solid #b7f0c9",
          boxShadow: "0 10px 20px rgba(72,187,120,0.08)",
          transform: "scale(1.02)",
        };
      }
      if (opt === selected) {
        // wrong selection
        return {
          ...base,
          background: "#fff5f5",
          border: "1px solid #f5c2c2",
          boxShadow: "0 8px 18px rgba(245,99,99,0.06)",
          transform: "translateX(-4px)",
        };
      }
    }
    // default neutral
    return base;
  }

  /* ---------- Render ---------- */
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoCircle}>स</div>
          <div>
            <div style={styles.title}>Sanskrit Studio</div>
            <div style={{ fontSize: 12, color: "#4a5568", marginTop: 2 }}>
              Learn Sanskrit — small daily wins
            </div>
          </div>
        </div>

        <div style={styles.xpBadge}>
          <div style={{ fontSize: 14, color: "#276749" }}>Total XP</div>
          <div style={{ fontWeight: 800, color: "#134e4a", fontSize: 16 }}>{totalXP}</div>
        </div>
      </div>

      {/* Main layout */}
      <div
        style={{
          ...styles.container,
          gap: 20,
          // responsive tweak
          gridTemplateColumns: window.innerWidth < 800 ? "1fr" : styles.container.gridTemplateColumns,
        }}
      >
        {/* Lessons list */}
        <div style={styles.lessonsPanel}>
          <h3 style={{ margin: "4px 0 12px 0", color: "#22543d" }}>Lessons</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lessonList.map((lesson) => {
              const active = currentLesson && currentLesson.lesson_id === lesson.lesson_id;
              return (
                <div
                  key={lesson.lesson_id}
                  onClick={() => {
                    setCurrentLesson(lesson);
                    setQIndex(0);
                  }}
                  style={lessonCardStyle(active)}
                >
                  <div style={styles.lessonIcon}>{guessIcon(lesson.title)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#1f5d3a" }}>{lesson.title}</div>
                    <div style={{ fontSize: 12, color: "#718096", marginTop: 4 }}>{lesson.level ?? "Beginner"}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#718096", fontWeight: 700 }}>L{getNumberFromId(lesson.lesson_id)}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 14, fontSize: 13, color: "#4a5568" }}>
            Tip: Add a new <code>src/lessons/L21_*.json</code> file — it will appear automatically.
          </div>
        </div>

        {/* Question / Playground */}
        <div>
          {!currentLesson ? (
            <div style={{ ...styles.questionWrapper, minHeight: 320, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#234e3a" }}>Select a lesson to start</div>
              <div style={{ marginTop: 12, color: "#4a5568" }}>Practice a few minutes every day — small steps add up!</div>
            </div>
          ) : currentQ ? (
            <div style={{ ...styles.questionWrapper }}>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, color: "#48bb78", fontWeight: 700 }}>{currentLesson.title}</div>
                  <div style={{ fontSize: 13, color: "#718096", marginTop: 4 }}>
                    Question {qIndex + 1} / {currentLesson.questions.length}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "#718096" }}>Lesson XP</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{lessonXP}</div>
                </div>
              </div>

              {/* progress bar */}
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 12, background: "#eef6f0", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ width: `${progressPercent}%`, height: "100%", background: "linear-gradient(90deg,#34d399,#16a34a)", transition: "width 350ms ease" }} />
                </div>
              </div>

              {/* prompt + voice */}
              <div style={{ marginTop: 18, ...styles.promptRow }}>
                <div style={styles.promptText}>{currentQ.prompt}</div>

                {/* play buttons */}
                <div style={{ display: "flex", gap: 8, marginLeft: 8 }}>
                  <button
                    title="Play"
                    onClick={() => speak(currentQ.prompt, { slow: false })}
                    style={styles.playBtn}
                  >
                    🔊
                  </button>
                  <button
                    title="Play slow"
                    onClick={() => speak(currentQ.prompt, { slow: true })}
                    style={{ ...styles.playBtn, background: "#fff6ee" }}
                  >
                    🐢
                  </button>
                </div>
              </div>

              {/* Options OR typing */}
              {currentQ.options ? (
                <div style={{ ...styles.optionsGrid, marginTop: 14 }}>
                  {currentQ.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleMCQ(opt)}
                      disabled={!!selected}
                      style={{
                        ...optionStyle(opt),
                        // animations for correct/wrong
                        animation:
                          animState === "correct" && selected && normalize(opt) === normalize(currentQ.correct ?? currentQ.answer)
                            ? "popIn 360ms ease"
                            : animState === "wrong" && opt === selected
                            ? "shakeX 450ms ease"
                            : "none",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: 16 }}>
                  <input
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder="Type your answer in Sanskrit"
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: 16,
                      borderRadius: 10,
                      border: "1px solid #e6eef0",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={handleTypingSubmit} style={{ ...styles.smallBtn, background: "#e6fff7" }}>
                      Submit
                    </button>
                    <button onClick={() => setTypedAnswer("")} style={{ ...styles.smallBtn }}>
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* feedback + controls */}
              <div style={styles.controlRow}>
                <div style={{ fontWeight: 700, color: feedback.includes("Correct") ? "#16a34a" : "#c53030" }}>{feedback}</div>

                {(selected || feedback.includes("Correct")) && (
                  <button onClick={nextQuestion} style={{ marginLeft: "auto", padding: "10px 14px", borderRadius: 10, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
                    Next ➡️
                  </button>
                )}

                <button onClick={goBackToLessons} style={{ padding: "10px 12px", borderRadius: 10, background: "#f1f5f9", border: "none", cursor: "pointer" }}>
                  🔙 Lessons
                </button>
              </div>
            </div>
          ) : (
            <div style={{ ...styles.questionWrapper }}>No question found</div>
          )}
        </div>
      </div>

      <div style={styles.footerNote}>
        Built with ❤️ — Add lessons by dropping JSON files in <code>src/lessons/</code>.
      </div>

      {/* Inline CSS animations */}
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.92); opacity: 0.0; }
          60% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shakeX {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        /* small hover effects */
        button:active { transform: translateY(1px); }
        /* responsive tweaks */
        @media (max-width: 800px) {
          .containerGrid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}