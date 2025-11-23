import React, { useEffect, useMemo, useState, useRef } from "react";
import lessons from "./lessons";

/**
 * Temple Theme Edition — Sanskrit Duolingo
 * - Sandstone + Gold aesthetic
 * - Auto lesson loading
 * - Voice: prompt + slow + option-click pronunciation
 * - Smooth animations
 * - XP + Progress
 * - Footer masthead (Akshay Patel, email, development in progress)
 *
 * Designed for easy full-file replacement.
 */

/* ---------- UTILS ---------- */
function normalize(s) {
  if (!s) return "";
  return String(s).trim().replace(/\s+/g, " ").normalize("NFD").toLowerCase();
}

function getNumberFromId(id) {
  if (!id) return 9999;
  const n = parseInt(String(id).replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : 9999;
}

/* ---------- Sort lesson list ---------- */
const lessonList = Object.values(lessons).sort((a, b) => {
  return getNumberFromId(a.lesson_id) - getNumberFromId(b.lesson_id);
});

/* ---------- Icon guesser ---------- */
function guessIcon(title = "") {
  const t = title.toLowerCase();
  if (t.includes("body")) return "🧍";
  if (t.includes("day") || t.includes("time") || t.includes("month")) return "🗓️";
  if (t.includes("house")) return "🏠";
  if (t.includes("weather")) return "☀️";
  if (t.includes("transport")) return "🚗";
  if (t.includes("adj")) return "✨";
  if (t.includes("food")) return "🍎";
  if (t.includes("family")) return "👪";
  if (t.includes("greet")) return "🙏";
  return "📘";
}

/* ---------- BASE THEME ---------- */

const THEME = {
  bg: "#f5e6c8", // sandstone
  panel: "#fdf9f1",
  card: "#fffaf0",
  border: "#e8d9bd",
  gold: "#c49a39",
  goldDeep: "#9c772c",
  textDark: "#4e3d28",
  textSoft: "#6d5a43",
  accent: "#b08537",
  green: "#3b7a57",
  red: "#b63d3d",
};

/* ---------- COMPONENT ---------- */

export default function App() {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState("");
  const [lessonXP, setLessonXP] = useState(0);
  const [totalXP, setTotalXP] = useState(() =>
    parseInt(localStorage.getItem("totalXP") || "0", 10)
  );
  const [typedAnswer, setTypedAnswer] = useState("");
  const [animState, setAnimState] = useState("");

  const utterRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("totalXP", String(totalXP));
  }, [totalXP]);

  useEffect(() => {
    setQIndex(0);
    setSelected("");
    setFeedback("");
    setLessonXP(0);
    setTypedAnswer("");
    setAnimState("");
  }, [currentLesson]);

  const currentQ = useMemo(
    () => (currentLesson ? currentLesson.questions[qIndex] : null),
    [currentLesson, qIndex]
  );

  const progressPercent = currentLesson
    ? Math.round(((qIndex + 1) / currentLesson.questions.length) * 100)
    : 0;

  /* ---------- VOICE ---------- */

  function stopSpeaking() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    utterRef.current = null;
  }

  function speak(text, slow = false) {
    stopSpeaking();
    if (!window.speechSynthesis) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "sa-IN"; // Sanskrit
    utter.rate = slow ? 0.7 : 1.0;
    utter.pitch = 1;
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }

  /* ---------- ANSWER HANDLING ---------- */

  function handleMCQ(option) {
    if (!currentQ || selected) return;

    // Speak option immediately
    speak(option);

    setSelected(option);

    const correct = currentQ.correct ?? currentQ.answer;

    if (normalize(option) === normalize(correct)) {
      onCorrect(correct);
    } else {
      onWrong();
    }
  }

  function handleTypingSubmit() {
    const correct = currentQ.answer ?? currentQ.correct;

    // Speak typed answer
    speak(typedAnswer);

    if (normalize(typedAnswer) === normalize(correct)) {
      onCorrect(correct);
    } else {
      onWrong();
    }
    setTypedAnswer("");
  }

  function onCorrect(correctText) {
    setFeedback("✔ सही उत्तर");
    setAnimState("correct");
    setLessonXP((s) => s + 10);
    setTotalXP((t) => t + 10);

    // Speak correct answer again in slow mode
    speak(correctText, true);

    setTimeout(() => setAnimState(""), 700);
  }

  function onWrong() {
    setFeedback("❌ पुनः प्रयास करें");
    setAnimState("wrong");
    setTimeout(() => setAnimState(""), 600);
  }

  function nextQuestion() {
    setSelected("");
    setFeedback("");
    setTypedAnswer("");
    setAnimState("");

    if (qIndex + 1 < currentLesson.questions.length) {
      setQIndex((i) => i + 1);
    } else {
      alert(`🎉 Lesson complete! XP +${lessonXP}`);
      setCurrentLesson(null);
    }
  }

  function lessonCardStyle(active) {
    return {
      padding: "12px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      borderRadius: 14,
      cursor: "pointer",
      background: active ? THEME.card : THEME.panel,
      border: `1px solid ${THEME.border}`,
      transition: "all 0.2s",
      boxShadow: active
        ? "0 4px 16px rgba(95,73,41,0.22)"
        : "0 2px 10px rgba(95,73,41,0.12)",
      transform: active ? "scale(1.03)" : "scale(1)",
    };
  }

  function optionStyle(opt) {
    const base = {
      padding: "14px",
      borderRadius: 14,
      border: `1px solid ${THEME.border}`,
      background: THEME.panel,
      cursor: "pointer",
      fontSize: 16,
      boxShadow: "0 4px 12px rgba(95,73,41,0.10)",
      transition: "all 0.2s",
    };

    if (!selected) return base;

    const correct = currentQ.correct ?? currentQ.answer;

    if (normalize(opt) === normalize(correct)) {
      return {
        ...base,
        background: "#f6fce7",
        border: "1px solid #c9e29c",
        transform: "scale(1.03)",
      };
    }

    if (opt === selected) {
      return {
        ...base,
        background: "#fde7e7",
        border: "1px solid #e0b0b0",
        transform: "translateX(-4px)",
      };
    }

    return base;
  }

  /* ---------- UI ---------- */

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 20,
        background: THEME.bg,
        fontFamily: "Poppins, sans-serif",
        color: THEME.textDark,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto 20px auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 14,
              background: THEME.gold,
              color: "white",
              fontWeight: 700,
              fontSize: 26,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 6px 18px rgba(140,110,50,0.28)",
            }}
          >
            स
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              Sanskrit Studio (Temple Theme)
            </div>
            <div style={{ fontSize: 13, color: THEME.textSoft }}>
              Learn Sanskrit in a serene temple aesthetic
            </div>
          </div>
        </div>

        <div
          style={{
            background: THEME.panel,
            padding: "8px 12px",
            borderRadius: 12,
            border: `1px solid ${THEME.border}`,
            boxShadow: "0 4px 12px rgba(95,73,41,0.10)",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {totalXP} XP
        </div>
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: window.innerWidth < 800 ? "1fr" : "330px 1fr",
          gap: 20,
        }}
      >
        {/* LEFT: Lesson cards */}
        <div
          style={{
            background: THEME.panel,
            padding: 16,
            borderRadius: 16,
            border: `1px solid ${THEME.border}`,
            boxShadow: "0 6px 20px rgba(95,73,41,0.12)",
          }}
        >
          <h3 style={{ margin: "4px 0 14px 0" }}>Lessons</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lessonList.map((lesson) => {
              const active =
                currentLesson && currentLesson.lesson_id === lesson.lesson_id;
              return (
                <div
                  key={lesson.lesson_id}
                  onClick={() => setCurrentLesson(lesson)}
                  style={lessonCardStyle(active)}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      background: THEME.card,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {guessIcon(lesson.title)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{lesson.title}</div>
                    <div style={{ fontSize: 12, color: THEME.textSoft }}>
                      {lesson.level ?? "Beginner"}
                    </div>
                  </div>

                  <div
                    style={{ fontSize: 13, color: THEME.textSoft, fontWeight: 700 }}
                  >
                    L{getNumberFromId(lesson.lesson_id)}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 14, fontSize: 13, color: THEME.textSoft }}>
            Add new lessons in <code>src/lessons/</code> — they appear
            automatically.
          </div>
        </div>

        {/* RIGHT: Question panel */}
        <div
          style={{
            background: THEME.panel,
            padding: 22,
            borderRadius: 16,
            border: `1px solid ${THEME.border}`,
            boxShadow: "0 10px 26px rgba(95,73,41,0.12)",
          }}
        >
          {!currentLesson ? (
            <div
              style={{
                textAlign: "center",
                padding: 30,
                color: THEME.textSoft,
              }}
            >
              Select a lesson to begin.
            </div>
          ) : currentQ ? (
            <>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      color: THEME.goldDeep,
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    {currentLesson.title}
                  </div>
                  <div style={{ fontSize: 13, color: THEME.textSoft }}>
                    Q {qIndex + 1} / {currentLesson.questions.length}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: THEME.textSoft }}>
                    Lesson XP
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {lessonXP}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 12,
                  background: "#e6dcc9",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    background: THEME.gold,
                    transition: "width 350ms ease",
                  }}
                ></div>
              </div>

              {/* PROMPT */}
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: THEME.textDark,
                  }}
                >
                  {currentQ.prompt}
                </div>

                <button
                  onClick={() => speak(currentQ.prompt, false)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "none",
                    background: "#fff4dd",
                    cursor: "pointer",
                  }}
                >
                  🔊
                </button>

                <button
                  onClick={() => speak(currentQ.prompt, true)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "none",
                    background: "#fff7e6",
                    cursor: "pointer",
                  }}
                >
                  🐢
                </button>
              </div>

              {/* OPTIONS */}
              {currentQ.options ? (
                <div
                  style={{
                    marginTop: 20,
                    display: "grid",
                    gridTemplateColumns:
                      window.innerWidth < 800 ? "1fr" : "1fr 1fr",
                    gap: 14,
                  }}
                >
                  {currentQ.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleMCQ(opt)}
                      style={{
                        ...optionStyle(opt),
                        animation:
                          animState === "correct" &&
                          normalize(opt) ===
                            normalize(currentQ.correct ?? currentQ.answer)
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
                <div style={{ marginTop: 20 }}>
                  <input
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder="Type in Sanskrit"
                    style={{
                      width: "100%",
                      padding: 12,
                      fontSize: 16,
                      borderRadius: 10,
                      border: `1px solid ${THEME.border}`,
                    }}
                  />
                  <button
                    onClick={handleTypingSubmit}
                    style={{
                      marginTop: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: THEME.gold,
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Submit
                  </button>
                </div>
              )}

              {/* FEEDBACK + CONTROLS */}
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: feedback.includes("✔") ? THEME.green : THEME.red,
                  }}
                >
                  {feedback}
                </div>

                {(selected || feedback.includes("✔")) && (
                  <button
                    onClick={nextQuestion}
                    style={{
                      marginLeft: "auto",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: THEME.goldDeep,
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Next →
                  </button>
                )}

                <button
                  onClick={() => setCurrentLesson(null)}
                  style={{
                    marginLeft: 10,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: "#f2e6d4",
                    cursor: "pointer",
                  }}
                >
                  🔙 Lessons
                </button>
              </div>
            </>
          ) : (
            <div>No question found.</div>
          )}
        </div>
      </div>

      {/* FOOTER MASTHEAD */}
      <div
        style={{
          marginTop: 40,
          textAlign: "right",
          color: THEME.textSoft,
          fontSize: 13,
          fontWeight: 500,
          maxWidth: 1100,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>अक्षय पटेल</div>
        <div>oxakshaypatel@gmail.com</div>
        <div>development in progress</div>
      </div>

      {/* Animations */}
      <style>
        {`
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0.6; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shakeX {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        `}
      </style>
    </div>
  );
}