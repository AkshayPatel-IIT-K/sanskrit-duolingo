// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import lessonsFromFiles from "./lessons";
import useTTS from "./hooks/useTTS";

/* utils */
function getNumberFromId(id) {
  if (!id) return 9999;
  const n = parseInt(String(id).replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : 9999;
}
function normalize(s) {
  if (!s) return "";
  return String(s).trim().replace(/\s+/g, " ").normalize("NFD").toLowerCase();
}

/* lessons loader & sort */
const lessonsList = Object.values(lessonsFromFiles)
  .map((m) => m.default ?? m)
  .sort((a, b) => getNumberFromId(a.lesson_id) - getNumberFromId(b.lesson_id));

export default function App() {
  const tts = useTTS();
  const [currentLesson, setCurrentLesson] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null); // tentative
  const [answered, setAnswered] = useState(false); // whether user confirmed
  const [feedback, setFeedback] = useState("");
  const [completed, setCompleted] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sd_completed") || "[]");
    } catch {
      return [];
    }
  });
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem("sd_xp") || "0", 10));
  const confettiRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("sd_completed", JSON.stringify(completed));
  }, [completed]);
  useEffect(() => {
    localStorage.setItem("sd_xp", String(xp));
  }, [xp]);

  const question = currentLesson ? currentLesson.questions?.[qIndex] ?? null : null;

  function openLesson(l) {
    setCurrentLesson(l);
    setQIndex(0);
    setSelectedOption(null);
    setAnswered(false);
    setFeedback("");
  }

  // clicking an option: speak option and set tentative selection
  function onOptionClick(opt) {
    if (!question || answered) return;
    tts.speakOption(opt); // speak immediately
    setSelectedOption(opt);
    setFeedback(""); // clear previous feedback
  }

  // confirm selection (check & give feedback)
  function onConfirm() {
    if (!question || !selectedOption) return;
    const correct = question.correct ?? question.answer;
    if (normalize(selectedOption) === normalize(correct)) {
      setFeedback("✔ सही उत्तर");
      setXp((s) => s + 10);
      // speak correct slow (speak correct phrase from question prompt or the answer)
      tts.speakPromptSlow({ prompt_display: question.prompt_display ?? question.prompt });
      // confetti
      try {
        import("./utils/confetti").then((m) => m.runConfetti(confettiRef.current, 80));
      } catch {}
    } else {
      setFeedback("❌ पुनः प्रयास करें");
      try {
        if (navigator && navigator.vibrate) navigator.vibrate(120);
      } catch {}
    }
    setAnswered(true);
  }

  function onNext() {
    setSelectedOption(null);
    setFeedback("");
    setAnswered(false);
    if (!currentLesson) return;
    if (qIndex + 1 < currentLesson.questions.length) {
      setQIndex((i) => i + 1);
    } else {
      // lesson complete
      if (!completed.includes(currentLesson.lesson_id)) {
        setCompleted((s) => [...s, currentLesson.lesson_id]);
      }
      setCurrentLesson(null);
      setQIndex(0);
    }
  }

  return (
    <div className="app-root">
      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="brand-badge">स</div>
            <div>
              <div className="brand-name">Saṃskṛtam Gamified</div>
              <div className="brand-sub">Modern Sanskrit · Temple motif</div>
            </div>
          </div>

          <div className="header-actions">
            <div className="stat-card">
              <div className="small">XP</div>
              <div style={{ fontWeight: 800 }}>{xp}</div>
            </div>
            <div className="stat-card">
              <div className="small">Completed</div>
              <div style={{ fontWeight: 800 }}>{completed.length}</div>
            </div>
          </div>
        </header>

        <div className="grid">
          <aside className="sidebar">
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Lessons</div>
            <div className="lesson-list">
              {lessonsList.map((l) => {
                const done = completed.includes(l.lesson_id);
                return (
                  <div key={l.lesson_id} className={`lesson-card ${done ? "done" : ""}`} onClick={() => openLesson(l)}>
                    <div className="lesson-icon">📘</div>
                    <div style={{ flex: 1 }}>
                      <div className="lesson-title">{l.title}</div>
                      <div className="lesson-meta">{l.level || "Beginner"}</div>
                    </div>
                    <div style={{ fontWeight: 800 }}>{done ? "✓" : `L${getNumberFromId(l.lesson_id)}`}</div>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="content">
            {!currentLesson ? (
              <div className="q-card center">
                <div style={{ fontSize: 22, fontWeight: 900 }}>Select a lesson to begin</div>
                <div className="mt12 text-muted">Your lessons are sorted in ascending order.</div>
              </div>
            ) : question ? (
              <div className="q-card">
                <div className="q-header">
                  <div>
                    <div className="q-title">{currentLesson.title}</div>
                    <div className="q-sub">
                      Question {qIndex + 1} / {currentLesson.questions.length}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-ghost" onClick={() => tts.speakPrompt(question)}>
                      🔊
                    </button>
                    <button className="btn-ghost" onClick={() => tts.speakPromptSlow(question)}>
                      🐢
                    </button>
                  </div>
                </div>

                <div className="prompt">{question.prompt_display ?? question.prompt}</div>

                {question.options ? (
                  <div className="options" role="list">
                    {question.options.map((opt, idx) => {
                      const isSelected = selectedOption === opt;
                      const isDisabled = answered; // lock selection after confirm
                      return (
                        <button
                          key={idx}
                          className={`opt ${isSelected ? "selected" : ""}`}
                          onClick={() => onOptionClick(opt)}
                          disabled={isDisabled}
                          aria-pressed={isSelected}
                          role="listitem"
                        >
                          <div style={{ fontWeight: 800 }}>{String.fromCharCode(65 + idx)}. {opt}</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <input
                      placeholder="Type your answer"
                      className="opt"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          tts.speakOption(e.target.value);
                          setSelectedOption(e.target.value);
                        }
                      }}
                    />
                  </div>
                )}

                <div className="actions">
                  <div className="feedback">{feedback}</div>

                  <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                    {/* Confirm button appears when an option is selected and not yet confirmed */}
                    {selectedOption && !answered && (
                      <button className="btn-ghost" onClick={onConfirm}>
                        Confirm
                      </button>
                    )}

                    {/* Next button enabled only after answered */}
                    <button className="btn-primary" onClick={onNext} disabled={!answered && !feedback.includes("✔")}>
                      Next →
                    </button>

                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setCurrentLesson(null);
                        setQIndex(0);
                        setSelectedOption(null);
                        setAnswered(false);
                        setFeedback("");
                      }}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="q-card center">No question available</div>
            )}
          </main>
        </div>
      </div>

      <div className="footer-sign">
        <div style={{ fontWeight: 900 }}>अक्षय पटेल</div>
        <div className="small">oxakshaypatel@gmail.com</div>
        <div className="small">development in progress</div>
      </div>

      <canvas ref={confettiRef} style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 9999 }} />
    </div>
  );
}