import MorseKeyboard from "@/components/MorseKeyboard";
import MorseRecorder from "@/components/MorseRecorder";
import { Radio } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { TranslatorWorkspace } from "@/components/translator-workspace";

export default function MorsePage() {
  return <SiteShell><main className="mx-auto max-w-6xl px-5 py-12 lg:px-8"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-200"><Radio size={15} /> Morse code</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Every dot has a voice.</h1><p className="mt-4 max-w-2xl leading-7 text-slate-400">This workspace is prepared for button, keyboard, and microphone Morse input. Signal decoding will be added next.</p><div className="mt-9"><TranslatorWorkspace mode="morse" /></div><MorseKeyboard /><MorseRecorder /></main></SiteShell>;
}
