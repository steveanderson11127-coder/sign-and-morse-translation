"use client";

import { Mic, MicOff, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MORSE_MAP } from "@/lib/morse";

const DOT_MAX_MS = 250;
const DASH_MAX_MS = 650;
const LETTER_GAP_MS = 450;
const WORD_GAP_MS = 1050;

export default function MorseRecorder() {
  const [isListening, setIsListening] = useState(false);
  const [isSignal, setIsSignal] = useState(false);
  const [volume, setVolume] = useState(0);
  const [threshold, setThreshold] = useState(4);
  const [rawMorse, setRawMorse] = useState("");
  const [decodedText, setDecodedText] = useState("");
  const [message, setMessage] = useState("Microphone is off. Start listening when you are ready.");

  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const signalRef = useRef(false);
  const toneStartRef = useRef<number | null>(null);
  const thresholdRef = useRef(threshold);
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
    setMessage(letter === "?" ? `“${sequence}” is not a known Morse character.` : `Decoded ${sequence} as ${letter}.`);
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

  function addTone(duration: number) {
    if (duration > DASH_MAX_MS) {
      setMessage("Tone was too long. Try a shorter dot or dash.");
      scheduleGaps();
      return;
    }
    const symbol = duration <= DOT_MAX_MS ? "." : "-";
    const next = morseRef.current + symbol;
    morseRef.current = next;
    setRawMorse(next);
    setMessage(`${symbol === "." ? "Dot" : "Dash"} detected: ${Math.round(duration)}ms.`);
    scheduleGaps();
  }

  function measureLoop() {
    const analyser = analyserRef.current;
    const values = dataRef.current;
    if (!analyser || !values) return;
    analyser.getByteTimeDomainData(values);
    let sum = 0;
    for (const value of values) {
      const sample = (value - 128) / 128;
      sum += sample * sample;
    }
    const nextVolume = Math.min(100, Math.sqrt(sum / values.length) * 100);
    setVolume(nextVolume);
    const now = performance.now();
    const detectedSignal = nextVolume >= thresholdRef.current;
    if (detectedSignal && !signalRef.current) {
      clearGapTimers();
      signalRef.current = true;
      toneStartRef.current = now;
      setIsSignal(true);
      setMessage("Tone detected.");
    }
    if (!detectedSignal && signalRef.current) {
      signalRef.current = false;
      setIsSignal(false);
      const start = toneStartRef.current;
      toneStartRef.current = null;
      if (start !== null) addTone(now - start);
    }
    frameRef.current = window.requestAnimationFrame(measureLoop);
  }

  async function startMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("This browser does not support microphone access.");
      return;
    }
    try {
      setMessage("Requesting microphone permission…");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { autoGainControl: false, echoCancellation: false, noiseSuppression: false } });
      const context = new AudioContext();
      await context.resume();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      streamRef.current = stream;
      contextRef.current = context;
      sourceRef.current = source;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      setIsListening(true);
      setMessage("Listening locally. Adjust the threshold until the signal indicator stays quiet in silence.");
      measureLoop();
    } catch (error) {
      const denied = error instanceof DOMException && error.name === "NotAllowedError";
      setMessage(denied ? "Microphone permission was blocked. Allow it in the browser and try again." : "Could not start the microphone. Please try again.");
    }
  }

  async function stopMicrophone() {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    clearGapTimers();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (contextRef.current?.state !== "closed") await contextRef.current?.close();
    sourceRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    contextRef.current = null;
    dataRef.current = null;
    signalRef.current = false;
    toneStartRef.current = null;
    setIsSignal(false);
    setIsListening(false);
    setVolume(0);
    setMessage("Microphone stopped. No audio was saved or uploaded.");
  }

  function clearTranscript() {
    clearGapTimers();
    morseRef.current = "";
    setRawMorse("");
    setDecodedText("");
    setMessage("Transcript cleared.");
  }

  useEffect(() => () => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (contextRef.current?.state !== "closed") void contextRef.current?.close();
    clearGapTimers();
  }, []);

  const currentLetter = rawMorse ? (MORSE_MAP[rawMorse] ?? "?") : "—";
  return <section className="mt-8 rounded-2xl border border-white/10 bg-[#0b1b30] p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Microphone input</p><h2 className="mt-2 text-2xl font-semibold">Listen for a signal.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Audio remains in this browser. Use a clear, steady tone; the decoder measures volume rather than recording sound.</p></div><button type="button" onClick={clearTranscript} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"><RotateCcw size={15} /> Clear</button></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_230px]"><div className="rounded-xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between"><span className="text-sm font-semibold">Live volume</span><span className="font-mono text-sm text-cyan-100">{volume.toFixed(1)}%</span></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300 transition-[width] duration-75" style={{ width: `${Math.min(volume, 100)}%` }} /></div><div className="mt-5 flex items-center gap-2 text-sm"><span className={`h-2.5 w-2.5 rounded-full ${isSignal ? "bg-cyan-300 shadow-[0_0_12px_#67e8f9]" : "bg-slate-500"}`} /><span className={isSignal ? "text-cyan-100" : "text-slate-400"}>{isSignal ? "Tone detected" : "Listening for silence"}</span></div></div><div className="rounded-xl border border-white/10 bg-white/[.025] p-5"><label htmlFor="threshold" className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={16} className="text-cyan-200" /> Noise threshold: {threshold}%</label><input id="threshold" type="range" min="0.5" max="25" step="0.5" value={threshold} onChange={(event) => { const value = Number(event.target.value); thresholdRef.current = value; setThreshold(value); }} className="mt-5 w-full accent-cyan-300" /><p className="mt-3 text-xs leading-5 text-slate-400">Raise it if room noise looks like a tone. Lower it if your tone is missed.</p></div></div>
    <button type="button" onClick={isListening ? () => void stopMicrophone() : () => void startMicrophone()} className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${isListening ? "border border-white/20 text-white hover:bg-white/5" : "bg-cyan-300 text-slate-950 hover:bg-cyan-200"}`}>{isListening ? <><MicOff size={17} /> Stop microphone</> : <><Mic size={17} /> Start microphone</>}</button>
    <p className="mt-3 min-h-5 text-center text-xs text-slate-400" aria-live="polite">{message}</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-3"><Output label="Raw Morse" value={rawMorse || "—"} /><Output label="Current letter" value={currentLetter} /><Output label="Decoded text" value={decodedText || "—"} /></div>
  </section>;
}

function Output({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 min-h-7 break-words font-mono text-lg text-cyan-100">{value}</p></div>;
}
