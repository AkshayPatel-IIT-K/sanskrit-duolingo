// src/hooks/useTTS.js
import { useRef } from "react";

function extractQuotedText(prompt) {
  if (!prompt) return null;
  const m = prompt.match(/'([^']+)'/);
  if (m) return m[1];
  const m2 = prompt.match(/"([^"]+)"/);
  if (m2) return m2[1];
  return null;
}

export default function useTTS() {
  const utterRef = useRef(null);

  function stop() {
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch {}
    utterRef.current = null;
  }

  function speakText(text, { slow = false, lang = "hi-IN" } = {}) {
    stop();
    if (!text) return;
    if (!("speechSynthesis" in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(String(text));
      // prefer Sanskrit if available; browsers may fallback.
      u.lang = lang || "hi-IN";
      u.rate = slow ? 0.78 : 1.0;
      u.pitch = 1;
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("TTS error", e);
    }
  }

  function phraseForQuestion(q = {}) {
    if (q.prompt_to_speak) return q.prompt_to_speak;
    if (q.prompt_display && typeof q.prompt_display === "string")
      return q.prompt_display;
    if (q.prompt && typeof q.prompt === "string") {
      const p = q.prompt.trim();
      const extracted = extractQuotedText(p);
      if (extracted) return extracted;
      // fallback: if short prompt without punctuation, speak it
      if (!p.includes("?") && p.split(" ").length <= 5) return p;
    }
    if (q.question && typeof q.question === "string") {
      const extracted = extractQuotedText(q.question);
      if (extracted) return extracted;
      return q.question;
    }
    return "";
  }

  return {
    // speak only the target phrase for the question
    speakPrompt(q) {
      const phrase = phraseForQuestion(q);
      if (!phrase) return;
      // default: if phrase contains Devanagari chars, use 'hi-IN' or 'sa-IN'
      const hasDevanagari = /[\u0900-\u097F]/.test(phrase);
      speakText(phrase, { slow: false, lang: hasDevanagari ? "hi-IN" : "en-US" });
    },
    // slow replay (correct answer)
    speakPromptSlow(q) {
      const phrase = phraseForQuestion(q);
      if (!phrase) return;
      const hasDevanagari = /[\u0900-\u097F]/.test(phrase);
      speakText(phrase, { slow: true, lang: hasDevanagari ? "hi-IN" : "en-US" });
    },
    // speak option immediately (on click)
    speakOption(text) {
      if (!text) return;
      const hasDevanagari = /[\u0900-\u097F]/.test(text);
      // prefer hi-IN for Devanagari; fallback to en-US
      speakText(text, { slow: false, lang: hasDevanagari ? "hi-IN" : "en-US" });
    },
    // generic slow speak
    speakSlow(text) {
      if (!text) return;
      const hasDevanagari = /[\u0900-\u097F]/.test(text);
      speakText(text, { slow: true, lang: hasDevanagari ? "hi-IN" : "en-US" });
    },
    // placeholder for cloud TTS
    async fetchCloudTTS(text) {
      return null;
    },
    stop,
  };
}