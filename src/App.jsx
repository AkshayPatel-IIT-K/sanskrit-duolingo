// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import lessonsFromFiles from "./lessons";

/* ---------------- Utilities ---------------- */
function getNumberFromId(id) {
  if (!id) return 9999;
  const n = parseInt(String(id).replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : 9999;
}
function normalize(s) {
  if (!s) return "";
  return String(s).trim().replace(/\s+/g, " ").normalize("NFD").toLowerCase();
}
function shuffle(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}

/* ---------------- Lessons loader & sort ---------------- */
const lessonsList = Object.values(lessonsFromFiles)
  .map((m) => m.default ?? m)
  .sort((a, b) => getNumberFromId(a.lesson_id) - getNumberFromId(b.lesson_id));

/* ---------------- Sample Reference Data (vibhakti & shabdarupa) ----------------
   These are embedded to keep this file self-contained. You can later move them to
   src/data/*.json and import instead.
*/
const vibhaktiData = [
  {
    title: "A-stem (राम) — masculine",
    rows: [
      { case: "प्रथमा (Nominative)", singular: "रामः", dual: "रौ / रामौ", plural: "रामाः" },
      { case: "द्वितीया (Accusative)", singular: "रामम्", dual: "रामौ", plural: "रामान्" },
      { case: "तृतीया (Instrumental)", singular: "रामेण", dual: "रामाभ्याम्", plural: "रामैः" },
      { case: "चतुर्थी (Dative)", singular: "रामाय", dual: "रामाभ्याम्", plural: "रमभ्यः" },
      { case: "पञ्चमी (Ablative)", singular: "रामात्", dual: "रामाभ्याम्", plural: "रामेभ्यः" },
      { case: "षष्ठी (Genitive)", singular: "रामस्य", dual: "रामयोः", plural: "रामाणाम्" },
      { case: "सप्तमी (Locative)", singular: "रामे", dual: "रामयोः", plural: "रामेषु" },
      { case: "संबोधन (Vocative)", singular: "हे राम! / राम", dual: "हे रौ!", plural: "हे रामाः!" }
    ]
  }
];

const shabdarupaSamples = {
  masculine: [
    { stem: "राम", type: "a-stem", forms: { nom_sg: "रामः", acc_sg: "रामम्" } },
    { stem: "हरि", type: "i-stem", forms: { nom_sg: "हरि", acc_sg: "हरिम्" } }
  ],
  feminine: [
    { stem: "सीता", type: "ā-stem", forms: { nom_sg: "सीता", acc_sg: "सीताम्" } }
  ],
  neuter: [
    { stem: "फल", type: "a-stem", forms: { nom_sg: "फलम्", acc_sg: "फलम्" } }
  ]
};

/* ----------------- Main App ----------------- */
export default function App() {
  // App view: "lessons" | "practice" | "reference"
  const [view, setView] = useState("lessons");

  // lesson states
  const [currentLesson, setCurrentLesson] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
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

  // practice state
  const [practiceMode, setPracticeMode] = useState("vibhakti"); // vibhakti|shabdarupa|dhatu|mixed
  const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [practiceStats, setPracticeStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("practice_stats") || '{}');
    } catch { return {}; }
  });

  // persistances
  useEffect(() => { localStorage.setItem("sd_completed", JSON.stringify(completed)); }, [completed]);
  useEffect(() => { localStorage.setItem("sd_xp", String(xp)); }, [xp]);
  useEffect(() => { localStorage.setItem("practice_stats", JSON.stringify(practiceStats)); }, [practiceStats]);

  /* ---------- helper: confetti ---------- */
  function runConfetti(count = 60) {
    try {
      import("./utils/confetti").then((m) => m.runConfetti(confettiRef.current, count));
    } catch (e) {
      // ignore if not present
    }
  }

  /* ---------- Lesson flows (no TTS, immediate eval) ---------- */
  const question = currentLesson ? currentLesson.questions?.[qIndex] ?? null : null;

  function openLesson(l) {
    setCurrentLesson(l);
    setQIndex(0);
    setSelectedOption(null);
    setAnswered(false);
    setFeedback("");
    setView("lessons");
  }

  function evaluateOption(opt) {
    if (!question || answered) return;
    setSelectedOption(opt);
    const correct = question.correct ?? question.answer;
    if (normalize(opt) === normalize(correct)) {
      setFeedback("✔ सही उत्तर");
      setXp((s) => s + 10);
      setAnswered(true);
      runConfetti(80);
    } else {
      setFeedback("❌ पुनः प्रयास करें");
      setAnswered(true);
      try { if (navigator && navigator.vibrate) navigator.vibrate(120); } catch {}
    }
  }

  function onNext() {
    setSelectedOption(null);
    setFeedback("");
    setAnswered(false);
    if (!currentLesson) return;
    if (qIndex + 1 < currentLesson.questions.length) {
      setQIndex((i) => i + 1);
    } else {
      if (!completed.includes(currentLesson.lesson_id)) {
        setCompleted((s) => [...s, currentLesson.lesson_id]);
      }
      setCurrentLesson(null);
      setQIndex(0);
    }
  }

  /* ---------- Practice question generators (simple) ---------- */

  // vibhakti generator: uses vibhaktiData rows to ask "Which is the X form?" or vice versa
  function generateVibhaktiQuestion() {
    // pick random table and random row and a random column to ask
    const tbl = vibhaktiData[Math.floor(Math.random() * vibhaktiData.length)];
    const row = tbl.rows[Math.floor(Math.random() * tbl.rows.length)];
    // ask: "What is singular of <case> for stem 'राम'?" (we use example from row)
    // We'll ask to pick the cell value (singular/dual/plural)
    const cols = ["singular", "dual", "plural"];
    const col = cols[Math.floor(Math.random() * cols.length)];
    const correct = row[col];
    // create 3 distractors by picking other rows' same column or shuffling words
    const wrongs = shuffle(
      vibhaktiData.flatMap((t) => t.rows.map((r) => r[col])).filter((x) => x && x !== correct)
    ).slice(0, 3);
    const options = shuffle([correct, ...wrongs]);
    return {
      prompt: `${tbl.title} — ${row.case}. Pick the ${col} form:`,
      options,
      correct
    };
  }

  function generateShabdarupaQuestion() {
    // pick a random sample from shabdarupaSamples
    const groupNames = Object.keys(shabdarupaSamples);
    const g = groupNames[Math.floor(Math.random() * groupNames.length)];
    const sample = shabdarupaSamples[g][Math.floor(Math.random() * shabdarupaSamples[g].length)];
    const correct = sample.forms.nom_sg || Object.values(sample.forms)[0];
    // wrongs: other forms from other samples
    const wrongs = shuffle(
      Object.values(shabdarupaSamples).flatMap((arr) => arr.map((s) => Object.values(s.forms)[0])).filter((x) => x && x !== correct)
    ).slice(0, 3);
    const options = shuffle([correct, ...wrongs]);
    return {
      prompt: `What is the nominative singular of '${sample.stem}' (${sample.type})?`,
      options,
      correct
    };
  }

  function generateMixedQuestion() {
    // use lessonsList vocab: pick a random lesson row question if exists
    const lesson = lessonsList[Math.floor(Math.random() * lessonsList.length)];
    const qs = lesson.questions || [];
    if (qs.length === 0) {
      return { prompt: "No data", options: ["—"], correct: "—" };
    }
    const q = qs[Math.floor(Math.random() * qs.length)];
    // if q has options, return it; if it's prompt-based, craft simple MCQ
    if (q.options && q.options.length >= 2) {
      // pick existing question but randomize options
      return { prompt: q.prompt, options: shuffle(q.options.slice()), correct: q.correct ?? q.answer ?? q.options[0] };
    } else {
      // fallback: ask meaning of Sanskrit word in prompt string
      const word = (q.prompt.match(/'([^']+)'/) || [null, q.prompt])[1];
      const correct = q.correct ?? q.answer ?? q.options?.[0] ?? "—";
      // generate wrongs using other lessons
      const pool = lessonsList.flatMap((l) => l.questions || []).map((x) => x.correct ?? x.answer).filter(Boolean);
      const wrongs = shuffle(pool.filter((p) => p !== correct)).slice(0, 3);
      return { prompt: `What is the meaning of '${word}'?`, options: shuffle([correct, ...wrongs]), correct };
    }
  }

  function generatePracticeQuestion() {
    if (practiceMode === "vibhakti") return generateVibhaktiQuestion();
    if (practiceMode === "shabdarupa") return generateShabdarupaQuestion();
    if (practiceMode === "mixed") return generateMixedQuestion();
    // dhatu generator - fallback to mixed for now
    return generateMixedQuestion();
  }

  function startPractice() {
    const q = generatePracticeQuestion();
    setPracticeQuestion(q);
  }

  function evaluatePracticeOption(opt) {
    if (!practiceQuestion) return;
    const correct = practiceQuestion.correct;
    const isCorrect = normalize(opt) === normalize(correct);
    const prev = practiceStats[practiceMode] || { correct: 0, total: 0 };
    const updated = { ...practiceStats, [practiceMode]: { correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 } };
    setPracticeStats(updated);
    // small feedback
    if (isCorrect) {
      runConfetti(40);
      setPracticeQuestion((pq) => ({ ...pq, lastFeedback: "✔" }));
    } else {
      setPracticeQuestion((pq) => ({ ...pq, lastFeedback: "❌", lastCorrect: correct }));
    }
    // after short delay, generate next
    setTimeout(() => {
      setPracticeQuestion(null);
      startPractice();
    }, 700);
  }

  /* ---------- Top nav handlers ---------- */
  function gotoLessons() { setView("lessons"); }
  function gotoPractice() { setView("practice"); }
  function gotoReference() { setView("reference"); }

  /* ---------- UI render helpers ---------- */
  function LessonList() {
    return (
      <div>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Lessons</div>
        <div className="lesson-list" style={{ maxHeight: 520, overflow: "auto" }}>
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
      </div>
    );
  }

  /* ---------- Reference component (simple) ---------- */
  function ReferencePage() {
    return (
      <div className="q-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Reference</div>
            <div className="text-muted">Vibhakti charts, Śabdarūpa tables and quick grammar notes.</div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <h3>Vibhakti chart (sample)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            {vibhaktiData.map((tbl, i) => (
              <div key={i} className="q-card">
                <div style={{ fontWeight: 900 }}>{tbl.title}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 6 }}>Case</th>
                      <th style={{ textAlign: "left", padding: 6 }}>Singular</th>
                      <th style={{ textAlign: "left", padding: 6 }}>Dual</th>
                      <th style={{ textAlign: "left", padding: 6 }}>Plural</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tbl.rows.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: 8, borderBottom: "1px solid #f0e8d8" }}>{r.case}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f0e8d8" }}>{r.singular}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f0e8d8" }}>{r.dual}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f0e8d8" }}>{r.plural}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <h3>Śabdarūpa samples</h3>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="q-card" style={{ flex: 1 }}>
              <div style={{ fontWeight: 900 }}>Masculine</div>
              <div style={{ marginTop: 8 }}>
                {shabdarupaSamples.masculine.map((s, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 800 }}>{s.stem} — {s.type}</div>
                    <div className="text-muted">nom: {s.forms.nom_sg}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="q-card" style={{ flex: 1 }}>
              <div style={{ fontWeight: 900 }}>Feminine / Neuter</div>
              <div style={{ marginTop: 8 }}>
                {shabdarupaSamples.feminine.map((s, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 800 }}>{s.stem} — {s.type}</div>
                    <div className="text-muted">nom: {s.forms.nom_sg}</div>
                  </div>
                ))}
                {shabdarupaSamples.neuter.map((s, i) => (
                  <div key={`n${i}`} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 800 }}>{s.stem} — {s.type}</div>
                    <div className="text-muted">nom: {s.forms.nom_sg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  /* ---------- Practice hub component ---------- */
  function PracticePage() {
    return (
      <div className="q-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Practice Hub</div>
            <div className="text-muted">Choose a trainer and practice infinitely. Mistakes are tracked locally.</div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className={`btn-ghost ${practiceMode === "vibhakti" ? "active":""}`} onClick={() => { setPracticeMode("vibhakti"); startPractice(); }}>Vibhakti Trainer</button>
          <button className={`btn-ghost ${practiceMode === "shabdarupa" ? "active":""}`} onClick={() => { setPracticeMode("shabdarupa"); startPractice(); }}>Śabdarūpa Trainer</button>
          <button className={`btn-ghost ${practiceMode === "dhatu" ? "active":""}`} onClick={() => { setPracticeMode("dhatu"); startPractice(); }}>Dhātu Trainer</button>
          <button className={`btn-ghost ${practiceMode === "mixed" ? "active":""}`} onClick={() => { setPracticeMode("mixed"); startPractice(); }}>Mixed Drill</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <div className="text-muted">Session: {practiceStats[practiceMode] ? `${practiceStats[practiceMode].correct}/${practiceStats[practiceMode].total}` : "0/0"}</div>
            <button className="btn-ghost" onClick={() => { setPracticeStats({}); alert("Practice stats cleared") }}>Reset Stats</button>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          {practiceQuestion ? (
            <div className="q-card">
              <div style={{ fontWeight: 900 }}>{practiceQuestion.prompt}</div>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {practiceQuestion.options.map((opt, i) => (
                  <button key={i} className="opt" onClick={() => evaluatePracticeOption(opt)}>{opt}</button>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>{practiceQuestion.lastFeedback ? <span style={{fontWeight:900}}>{practiceQuestion.lastFeedback} {practiceQuestion.lastCorrect ? `Answer: ${practiceQuestion.lastCorrect}`: ""}</span> : null}</div>
            </div>
          ) : (
            <div className="center text-muted">Press a trainer above to start practice.</div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- Render main UI (keeps your layout) ---------------- */
  return (
    <div className="app-root">
      <div className="container">

        {/* top header unchanged */}
        <header className="header">
          <div className="brand">
            <div className="brand-badge">स</div>
            <div>
              <div className="brand-name">Saṃskṛtam Gamified</div>
              <div className="brand-sub">Modern Sanskrit · Temple motif</div>
            </div>
          </div>

          <div className="header-actions">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className={`btn-ghost ${view==="lessons"?"active":""}`} onClick={gotoLessons}>Lessons</button>
              <button className={`btn-ghost ${view==="practice"?"active":""}`} onClick={gotoPractice}>Practice</button>
              <button className={`btn-ghost ${view==="reference"?"active":""}`} onClick={gotoReference}>Reference</button>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="stat-card">
                <div className="small">XP</div>
                <div style={{ fontWeight: 800 }}>{xp}</div>
              </div>
              <div className="stat-card">
                <div className="small">Completed</div>
                <div style={{ fontWeight: 800 }}>{completed.length}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid">
          <aside className="sidebar">
            {/* keep lesson list but optionally show practice quick links */}
            {view === "lessons" && <LessonList />}

            {view === "practice" && (
              <div>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Practice Quick Links</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="btn-ghost" onClick={() => { setPracticeMode("vibhakti"); setView("practice"); startPractice(); }}>Vibhakti Trainer</button>
                  <button className="btn-ghost" onClick={() => { setPracticeMode("shabdarupa"); setView("practice"); startPractice(); }}>Śabdarūpa Trainer</button>
                  <button className="btn-ghost" onClick={() => { setPracticeMode("mixed"); setView("practice"); startPractice(); }}>Mixed Drill</button>
                </div>
              </div>
            )}

            {view === "reference" && (
              <div>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Reference</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="btn-ghost" onClick={() => window.scrollTo(0,0)}>Vibhakti Charts</button>
                  <button className="btn-ghost" onClick={() => alert("Open Śabdarūpa — data below")}>Śabdarūpa</button>
                </div>
              </div>
            )}

          </aside>

          <main className="content">
            {view === "lessons" && (
              <>
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
                        <div className="q-sub">Question {qIndex + 1} / {currentLesson.questions.length}</div>
                      </div>
                    </div>

                    <div className="prompt">{question.prompt_display ?? question.prompt}</div>

                    {question.options ? (
                      <div className="options" role="list">
                        {question.options.map((opt, idx) => {
                          const isSelected = selectedOption === opt;
                          const isCorrect = answered && normalize(opt) === normalize(question.correct ?? question.answer);
                          const isWrong = answered && isSelected && !isCorrect;
                          return (
                            <button
                              key={idx}
                              className={`opt ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                              onClick={() => evaluateOption(opt)}
                              disabled={answered}
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
                              const val = e.target.value;
                              setSelectedOption(val);
                              const correct = question.correct ?? question.answer;
                              if (normalize(val) === normalize(correct)) {
                                setFeedback("✔ सही उत्तर");
                                setXp((s) => s + 10);
                                runConfetti(60);
                              } else {
                                setFeedback("❌ पुनः प्रयास करें");
                              }
                              setAnswered(true);
                            }
                          }}
                        />
                      </div>
                    )}

                    <div className="actions">
                      <div className="feedback">{feedback}</div>

                      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                        <button className="btn-primary" onClick={onNext} disabled={!answered}>
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
              </>
            )}

            {view === "practice" && <PracticePage />}

            {view === "reference" && <ReferencePage />}

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