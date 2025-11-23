import React, { useEffect, useMemo, useRef, useState } from "react";
import lessonsFromFiles from "./lessons";

/**
 * Full-featured App.jsx
 * - Temple theme (kept)
 * - Voice: option-click pronouncing + prompt speak + slow speak
 * - Confetti on lesson completion
 * - Daily streak + localStorage persistence
 * - XP + Leveling
 * - Lesson lock/unlock progression (sequential)
 * - Profile panel
 * - Keyboard shortcuts
 * - Offline caching (simple localStorage-based)
 *
 * Replace your existing src/App.jsx with this file.
 */

/* ----------------------------- Utilities ------------------------------ */
function normalize(s) {
  if (!s) return "";
  return String(s).trim().replace(/\s+/g, " ").normalize("NFD").toLowerCase();
}

function getNumberFromId(id) {
  if (!id) return 9999;
  const n = parseInt(String(id).replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : 9999;
}

/* --------------------------- Lessons loader --------------------------- */
/* lessonsFromFiles is the auto-loader (import.meta.glob) you already have */
const lessonsList = Object.values(lessonsFromFiles).sort(
  (a, b) => getNumberFromId(a.lesson_id) - getNumberFromId(b.lesson_id)
);

/* ------------------------------- Theme ------------------------------- */
const THEME = {
  bg: "#f5e6c8",
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

/* ---------------------------- Confetti util --------------------------- */
/* lightweight confetti implementation using canvas */
function runConfetti(canvas, count = 80) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = (canvas.width = window.innerWidth);
  const h = (canvas.height = window.innerHeight);
  const colors = ["#f7d08a", "#ffd87d", "#f0b23b", "#c49a39", "#9c772c"];
  const pieces = [];
  for (let i = 0; i < count; i++) {
    pieces.push({
      x: Math.random() * w,
      y: Math.random() * -h * 0.5,
      r: Math.random() * 6 + 4,
      dx: (Math.random() - 0.5) * 6,
      dy: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      drot: (Math.random() - 0.5) * 6,
    });
  }
  let raf;
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const p of pieces) {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.12; // gravity
      p.rot += p.drot;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
      ctx.restore();
    }
    // stop when pieces are off-screen
    if (pieces.every((p) => p.y > h + 50)) {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
      canvas.width = 0;
      canvas.height = 0;
    } else {
      raf = requestAnimationFrame(draw);
    }
  };
  draw();
}

/* --------------------------- XP & Leveling --------------------------- */
function getLevelFromXP(xp) {
  // e.g., 0-99 level 1, 100-199 level2, etc. Customize as needed.
  return Math.floor(xp / 100) + 1;
}

/* --------------------------- Local Storage Keys ---------------------- */
const LS = {
  TOTAL_XP: "sd_total_xp",
  LAST_PRACTICE: "sd_last_practice",
  STREAK: "sd_streak",
  COMPLETED_LESSONS: "sd_completed_lessons",
  OFFLINE_LESSONS: "sd_offline_lessons", // cached jsons
};

/* ---------------------------- Main Component ------------------------- */
export default function App() {
  // app state
  const [currentLesson, setCurrentLesson] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState("");
  const [lessonXP, setLessonXP] = useState(0);
  const [totalXP, setTotalXP] = useState(() => parseInt(localStorage.getItem(LS.TOTAL_XP) || "0", 10));
  const [typedAnswer, setTypedAnswer] = useState("");
  const [animState, setAnimState] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS.COMPLETED_LESSONS) || "[]");
    } catch {
      return [];
    }
  });
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem(LS.STREAK) || "0", 10));
  const [lastPractice, setLastPractice] = useState(() => localStorage.getItem(LS.LAST_PRACTICE) || null);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [offlineLessonsCache, setOfflineLessonsCache] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS.OFFLINE_LESSONS) || "{}");
    } catch {
      return {};
    }
  });

  // confetti canvas ref
  const confettiRef = useRef(null);
  // speech utterance ref
  const utterRef = useRef(null);

  // derived
  const currentQ = currentLesson ? (currentLesson.questions?.[qIndex] ?? null) : null;
  const progressPercent = currentLesson ? Math.round(((qIndex + 1) / (currentLesson?.questions?.length || 1)) * 100) : 0;
  const level = getLevelFromXP(totalXP);

  /* -------------------- effects: online/offline -------------------- */
  useEffect(() => {
    function onOnline() {
      setIsOffline(false);
    }
    function onOffline() {
      setIsOffline(true);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  /* -------------------- persist totalXP -------------------- */
  useEffect(() => {
    localStorage.setItem(LS.TOTAL_XP, String(totalXP));
  }, [totalXP]);

  /* -------------------- persist completed lessons -------------------- */
  useEffect(() => {
    localStorage.setItem(LS.COMPLETED_LESSONS, JSON.stringify(completedLessons));
  }, [completedLessons]);

  /* -------------------- persist streak and last practice -------------------- */
  useEffect(() => {
    localStorage.setItem(LS.STREAK, String(streak));
    if (lastPractice) localStorage.setItem(LS.LAST_PRACTICE, lastPractice);
  }, [streak, lastPractice]);

  /* -------------------- keyboard shortcuts -------------------- */
  useEffect(() => {
    function onKey(e) {
      const key = e.key.toLowerCase();
      if (key === "p") {
        setShowProfile((s) => !s);
      } else if (key === "l") {
        // toggle lesson focus - open first lesson as a convenience
        if (!currentLesson) setCurrentLesson(lessonsList[0]);
        else setCurrentLesson(null);
      } else if (key === " " || key === "spacebar") {
        // space -> play prompt
        e.preventDefault();
        if (currentQ) speak(currentQ.prompt, false);
      } else if (key === "n" || key === "arrowright") {
        // next
        if ((selected || feedback.includes("✔")) && currentLesson) nextQuestion();
      } else if (["1", "2", "3", "4"].includes(key)) {
        // choose option index
        const idx = parseInt(key, 10) - 1;
        if (currentQ?.options && currentQ.options[idx]) {
          handleMCQ(currentQ.options[idx]);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentLesson, currentQ, selected, feedback]);

  /* -------------------- voice helpers -------------------- */
  function stopSpeaking() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    utterRef.current = null;
  }

  function speak(text, slow = false) {
    stopSpeaking();
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "sa-IN"; // try Sanskrit; browsers may fallback
    utter.rate = slow ? 0.7 : 1.0;
    utter.pitch = 1;
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }

  /* -------------------- lesson lock/unlock logic -------------------- */
  function isLessonUnlocked(lessonId) {
    // first lesson always unlocked
    const sorted = lessonsList.sort((a, b) => getNumberFromId(a.lesson_id) - getNumberFromId(b.lesson_id));
    const idx = sorted.findIndex((l) => l.lesson_id === lessonId);
    if (idx <= 0) return true;
    // unlocked if previous lesson in order completed
    const prevId = sorted[idx - 1]?.lesson_id;
    return completedLessons.includes(prevId);
  }

  /* -------------------- offline caching -------------------- */
  function cacheLessonsForOffline() {
    // saves lessons JSON into localStorage
    const out = {};
    for (const l of lessonsList) {
      out[l.lesson_id] = l;
    }
    localStorage.setItem(LS.OFFLINE_LESSONS, JSON.stringify(out));
    setOfflineLessonsCache(out);
    alert("Lessons cached for offline use (localStorage).");
  }

  /* -------------------- answer handling -------------------- */
  function handleMCQ(option) {
    if (!currentQ || selected) return;
    // speak the option immediately
    speak(option, false);
    setSelected(option);
    const correct = currentQ.correct ?? currentQ.answer;
    if (normalize(option) === normalize(correct)) {
      onCorrect(correct);
    } else {
      onWrong();
    }
  }

  function handleTypingSubmit() {
    if (!currentQ) return;
    // speak typed answer
    speak(typedAnswer, false);
    const correct = currentQ.answer ?? currentQ.correct;
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

    // update streak (daily)
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (lastPractice === today) {
      // already practiced today — do nothing
    } else {
      // if lastPractice is yesterday -> streak +1 else set to 1
      if (lastPractice) {
        const last = new Date(lastPractice);
        const oneDay = 24 * 60 * 60 * 1000;
        const diff = new Date(today) - new Date(lastPractice);
        if (diff <= 2 * oneDay && diff >= oneDay - 1000) {
          // approx yesterday
          setStreak((s) => s + 1);
        } else {
          setStreak(1);
        }
      } else {
        setStreak(1);
      }
      setLastPractice(today);
    }

    // speak the correct answer slow
    speak(correctText, true);

    // small animation then allow next
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
    if (!currentLesson) return;
    if (qIndex + 1 < currentLesson.questions.length) {
      setQIndex((i) => i + 1);
    } else {
      // lesson complete
      // mark lesson done
      if (!completedLessons.includes(currentLesson.lesson_id)) {
        const newCompleted = [...completedLessons, currentLesson.lesson_id];
        setCompletedLessons(newCompleted);
      }
      // run confetti
      runConfetti(confettiRef.current, 100);
      // small modal
      setTimeout(() => {
        alert(`🎉 आप ने पाठ पूरा किया! Lesson XP: ${lessonXP} | Total XP: ${totalXP}`);
        // reset lesson state
        setCurrentLesson(null);
      }, 400);
    }
  }

  /* -------------------- profile export/reset -------------------- */
  function exportProfile() {
    const p = {
      totalXP,
      streak,
      lastPractice,
      completedLessons,
      cachedLessons: Object.keys(offlineLessonsCache || {}),
    };
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sanskrit_profile.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetProgress() {
    if (!confirm("Reset progress? This will clear XP, streak and completed lessons.")) return;
    setTotalXP(0);
    setStreak(0);
    setLastPractice(null);
    setCompletedLessons([]);
    localStorage.removeItem(LS.TOTAL_XP);
    localStorage.removeItem(LS.STREAK);
    localStorage.removeItem(LS.LAST_PRACTICE);
    localStorage.removeItem(LS.COMPLETED_LESSONS);
    alert("Progress reset.");
  }

  /* -------------------- rendered UI -------------------- */
  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: "Poppins, sans-serif", color: THEME.textDark, padding: 18 }}>
      {/* header */}
      <div style={{ maxWidth: 1100, margin: "0 auto 18px auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: THEME.gold, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22 }}>
            स
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Sanskrit Studio — Temple Theme</div>
            <div style={{ fontSize: 13, color: THEME.textSoft }}>Calm, classical learning</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ textAlign: "right", padding: "8px 12px", background: THEME.panel, borderRadius: 10, border: `1px solid ${THEME.border}` }}>
            <div style={{ fontSize: 12, color: THEME.textSoft }}>Level</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{level}</div>
          </div>

          <div style={{ padding: "8px 12px", background: THEME.panel, borderRadius: 10, border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, color: THEME.textSoft }}>XP</div>
            <div style={{ fontWeight: 800 }}>{totalXP}</div>
          </div>

          <button onClick={() => setShowProfile(true)} style={{ background: THEME.gold, color: "#fff", border: "none", padding: "8px 10px", borderRadius: 10, cursor: "pointer" }}>Profile (P)</button>
        </div>
      </div>

      {/* offline indicator */}
      {isOffline && (
        <div style={{ maxWidth: 1100, margin: "0 auto 12px auto", background: "#fff7e6", padding: 10, borderRadius: 8, border: `1px solid ${THEME.border}`, color: THEME.textSoft }}>
          You are offline. Use "Download lessons for offline" to cache lessons locally.
        </div>
      )}

      {/* main grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: window.innerWidth < 800 ? "1fr" : "320px 1fr", gap: 18 }}>
        {/* left: lessons */}
        <div style={{ background: THEME.panel, padding: 14, borderRadius: 12, border: `1px solid ${THEME.border}`, boxShadow: "0 6px 20px rgba(95,73,41,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: THEME.goldDeep }}>Lessons</div>
            <div style={{ fontSize: 12, color: THEME.textSoft }}>Unlocked sequentially</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflow: "auto", paddingRight: 6 }}>
            {lessonsList.map((lesson) => {
              const unlocked = isLessonUnlocked(lesson.lesson_id);
              const active = currentLesson?.lesson_id === lesson.lesson_id;
              return (
                <div
                  key={lesson.lesson_id}
                  onClick={() => unlocked && setCurrentLesson(lesson)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 10,
                    borderRadius: 10,
                    background: active ? THEME.card : THEME.panel,
                    border: `1px solid ${THEME.border}`,
                    cursor: unlocked ? "pointer" : "not-allowed",
                    opacity: unlocked ? 1 : 0.5,
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: THEME.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{lesson.title?.slice(0, 1) ?? "प"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{lesson.title}</div>
                    <div style={{ fontSize: 12, color: THEME.textSoft }}>{lesson.level ?? "Beginner"}</div>
                  </div>
                  <div style={{ fontSize: 12, color: THEME.textSoft }}>{unlocked ? `L${getNumberFromId(lesson.lesson_id)}` : "Locked"}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={cacheLessonsForOffline} style={{ padding: "8px 10px", borderRadius: 8, border: "none", background: THEME.goldDeep, color: "#fff", cursor: "pointer" }}>Download lessons for offline</button>
            <button onClick={() => { alert("Keyboard shortcuts: 1-4 select options, Space play prompt, N next, P profile"); }} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${THEME.border}`, background: THEME.panel, cursor: "pointer" }}>Shortcuts</button>
          </div>
        </div>

        {/* right: question area */}
        <div style={{ background: THEME.panel, padding: 18, borderRadius: 12, border: `1px solid ${THEME.border}`, minHeight: 420 }}>
          {!currentLesson ? (
            <div style={{ textAlign: "center", color: THEME.textSoft }}>Select a lesson to begin practicing.</div>
          ) : currentQ ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, color: THEME.goldDeep, fontWeight: 800 }}>{currentLesson.title}</div>
                  <div style={{ fontSize: 12, color: THEME.textSoft }}>Question {qIndex+1} / {currentLesson.questions.length}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: THEME.textSoft }}>Lesson XP</div>
                  <div style={{ fontWeight: 800 }}>{lessonXP}</div>
                </div>
              </div>

              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{currentQ.prompt}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => speak(currentQ.prompt, false)} style={{ padding: "8px 10px", borderRadius: 8, border: "none", background: "#fff4dd", cursor: "pointer" }}>🔊</button>
                  <button onClick={() => speak(currentQ.prompt, true)} style={{ padding: "8px 10px", borderRadius: 8, border: "none", background: "#fff7e6", cursor: "pointer" }}>🐢</button>
                </div>
              </div>

              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: window.innerWidth < 800 ? "1fr" : "1fr 1fr", gap: 12 }}>
                {currentQ.options ? currentQ.options.map((opt, idx) => {
                  const selectedStyle = selected ? (normalize(opt) === normalize(currentQ.correct ?? currentQ.answer) ? { background: "#f6fce7", borderColor: "#c9e29c" } : (opt === selected ? { background: "#fde7e7", borderColor: "#e0b0b0" } : {})) : {};
                  return (
                    <button
                      key={opt}
                      onClick={() => handleMCQ(opt)}
                      disabled={!!selected}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: `1px solid ${THEME.border}`,
                        background: THEME.panel,
                        cursor: selected ? "default" : "pointer",
                        fontSize: 16,
                        textAlign: "left",
                        ...selectedStyle,
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{String.fromCharCode(65 + idx)}. {opt}</div>
                    </button>
                  );
                }) : (
                  <div>
                    <input value={typedAnswer} onChange={(e) => setTypedAnswer(e.target.value)} placeholder="Type your answer in Sanskrit" style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${THEME.border}` }} />
                    <div style={{ marginTop: 8 }}>
                      <button onClick={handleTypingSubmit} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: THEME.goldDeep, color: "#fff" }}>Submit</button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, display: "flex", alignItems: "center" }}>
                <div style={{ fontWeight: 700, color: feedback.includes("✔") ? THEME.green : THEME.red }}>{feedback}</div>

                {(selected || feedback.includes("✔")) && (
                  <button onClick={nextQuestion} style={{ marginLeft: "auto", padding: "10px 14px", borderRadius: 8, background: THEME.goldDeep, color: "#fff", border: "none" }}>Next →</button>
                )}

                <button onClick={() => { setCurrentLesson(null); setQIndex(0); setSelected(""); setFeedback(""); }} style={{ marginLeft: 8, padding: "8px 10px", borderRadius: 8, border: `1px solid ${THEME.border}`, background: THEME.panel }}>Back</button>
              </div>
            </>
          ) : <div>No question</div>}
        </div>
      </div>

      {/* confetti canvas - absolute */}
      <canvas ref={confettiRef} style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", zIndex: 9999 }} />

      {/* footer masthead bottom right */}
      <div style={{ position: "fixed", right: 18, bottom: 18, background: "#fffefa", padding: 12, borderRadius: 8, border: `1px solid ${THEME.border}`, boxShadow: "0 6px 18px rgba(95,73,41,0.12)", textAlign: "right" }}>
        <div style={{ fontWeight: 800 }}>अक्षय पटेल</div>
        <div style={{ fontSize: 13, color: THEME.textSoft }}>oxakshaypatel@gmail.com</div>
        <div style={{ fontSize: 12, color: THEME.textSoft }}>development in progress</div>
      </div>

      {/* profile modal */}
      {showProfile && (
        <div style={{ position: "fixed", left: 0, top: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.28)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ width: 640, maxWidth: "92%", background: "#fffefa", borderRadius: 12, padding: 18, border: `1px solid ${THEME.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Profile — अक्षय पटेल</div>
                <div style={{ fontSize: 13, color: THEME.textSoft }}>oxakshaypatel@gmail.com</div>
              </div>
              <div>
                <button onClick={() => setShowProfile(false)} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: THEME.gold }}>Close</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
              <div style={{ padding: 12, borderRadius: 10, background: THEME.panel, border: `1px solid ${THEME.border}` }}>
                <div style={{ fontSize: 13, color: THEME.textSoft }}>Total XP</div>
                <div style={{ fontWeight: 800, fontSize: 22 }}>{totalXP}</div>
                <div style={{ marginTop: 8, fontSize: 13, color: THEME.textSoft }}>Level {level}</div>
              </div>

              <div style={{ padding: 12, borderRadius: 10, background: THEME.panel, border: `1px solid ${THEME.border}` }}>
                <div style={{ fontSize: 13, color: THEME.textSoft }}>Daily Streak</div>
                <div style={{ fontWeight: 800, fontSize: 22 }}>{streak} days</div>
                <div style={{ marginTop: 8, fontSize: 13, color: THEME.textSoft }}>Last practice: {lastPractice || "—"}</div>
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={exportProfile} style={{ padding: "10px 12px", borderRadius: 8, border: "none", background: THEME.goldDeep, color: "#fff" }}>Export Profile</button>
                <button onClick={resetProgress} style={{ padding: "10px 12px", borderRadius: 8, border: "none", background: "#fde7e7", color: THEME.red }}>Reset Progress</button>
                <button onClick={() => { localStorage.removeItem(LS.OFFLINE_LESSONS); setOfflineLessonsCache({}); alert("Offline lesson cache cleared"); }} style={{ padding: "10px 12px", borderRadius: 8, border: "none", background: THEME.panel }}>Clear Offline Cache</button>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: THEME.textSoft }}>
              Completed lessons: {completedLessons.length} — {completedLessons.join(", ") || "None"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}