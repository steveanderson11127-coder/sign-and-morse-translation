"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MORSE_MAP } from "@/lib/morse";

const DOT_MAX_MS = 250;
const DASH_MAX_MS = 650;
const LETTER_GAP_MS = 450;
const WORD_GAP_MS = 1050;

export default function MorseKeyboard() {
  const [rawMorse, setRawMorse] = useState("");
  const [decodedText, setDecodedText] = useState("");
  const [isPressing, setIsPressing] = useState(false);
  const [message, setMessage] = useState("Press and hold the button or use the Space key.");
  const startRef = useRef<number | null>(null);
  const morseRef = useRef("");
  const letterTimerRef = useRef<number | null>(null);
  const wordTimerRef = useRef<number | null>(null);

  function clearGapTimers() {
    if (letterTimerRef.current) window.clearTimeout(letterTimerRef.current);
    if (wordTimerRef.current) window.clearTimeout(wordTimerRef.current);
    letterTimerRef.current = null;
    wordTimerRef.current = null;
  }

  function decodeCurrentLetter() {
    const sequence = morseRef.current;
    if (!sequence) return;
    const letter = MORSE_MAP[sequence] ?? "?";
    setDecodedText((value) => value + letter);
    setMessage(letter === "?" ? `“${sequence}” is not in the Morse dictionary.` : `Decoded ${sequence} as ${letter}.`);
    morseRef.current = "";
    setRawMorse("");
  }

  function scheduleGaps() {
    clearGapTimers();
    letterTimerRef.current = window.setTimeout(decodeCurrentLetter, LETTER_GAP_MS);
    wordTimerRef.current = window.setTimeout(() => {
      setDecodedText((value) => (value && !value.endsWith(" ") ? `${value} ` : value));
      setMessage("Word gap detected.");
    }, WORD_GAP_MS);
  }

  function startPress() {
    if (startRef.current !== null) return;
    clearGapTimers();
    startRef.current = performance.now();
    setIsPressing(true);
    setMessage("Listening for your press…");
  }

  function endPress() {
    if (startRef.current === null) return;
    const duration = performance.now() - startRef.current;
    startRef.current = null;
    setIsPressing(false);
    if (duration > DASH_MAX_MS) {
      setMessage("Press was too long. Try a dot or dash length.");
      scheduleGaps();
      return;
    }
    const symbol = duration <= DOT_MAX_MS ? "." : "-";
    const next = morseRef.current + symbol;
    morseRef.current = next;
    setRawMorse(next);
    setMessage(symbol === "." ? "Dot added." : "Dash added.");
    scheduleGaps();
  }

  function reset() {
    clearGapTimers();
    morseRef.current = "";
    setRawMorse("");
    setDecodedText("");
    setMessage("Cleared. Press and hold the button or use the Space key.");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || event.repeat) return;
      event.preventDefault();
      startPress();
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.code !== "Space") return;
      event.preventDefault();
      endPress();
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearGapTimers();
    };
  }, []);

  const currentLetter = rawMorse ? (MORSE_MAP[rawMorse] ?? "?") : "—";

  return <section className="mt-8 rounded-2xl border border-white/10 bg-[#0b1b30] p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Manual Morse input</p><h2 className="mt-2 text-2xl font-semibold">Tap the rhythm.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Press under 250ms for a dot, 250–650ms for a dash. Pause to finish a letter, then pause longer to add a word space.</p></div><button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"><RotateCcw size={15} /> Clear</button></div>
    <button type="button" onPointerDown={(event) => { event.preventDefault(); startPress(); }} onPointerUp={endPress} onPointerCancel={endPress} onPointerLeave={() => { if (isPressing) endPress(); }} className={`mt-7 min-h-36 w-full rounded-2xl border text-lg font-bold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200 ${isPressing ? "border-cyan-200 bg-cyan-300 text-slate-950" : "border-cyan-200/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20"}`} aria-label="Press and hold to enter a Morse dot or dash"><span className="block text-3xl">{isPressing ? "●" : "Press & hold"}</span><span className="mt-2 block text-xs font-medium uppercase tracking-widest">or hold Space</span></button>
    <p className="mt-3 min-h-5 text-center text-xs text-slate-400" aria-live="polite">{message}</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-3"><Output label="Raw Morse" value={rawMorse || "—"} /><Output label="Current letter" value={currentLetter} /><Output label="Decoded text" value={decodedText || "—"} wide /></div>
  </section>;
}

function Output({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={`rounded-xl border border-white/10 bg-white/[.025] p-4 ${wide ? "sm:col-span-1" : ""}`}><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 min-h-7 break-words font-mono text-lg text-cyan-100">{value}</p></div>;
}
