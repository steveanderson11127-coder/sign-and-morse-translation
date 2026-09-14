"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [["Live sign", "/sign"], ["Morse code", "/morse"], ["Learn", "/learn"], ["Privacy", "/privacy"]] as const;

export function Navigation() {
  const [open, setOpen] = useState(false);
  return <header className="border-b border-white/10 bg-[#07111f]/80 backdrop-blur"><nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8" aria-label="Main navigation"><Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white" onClick={() => setOpen(false)}><span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300 font-serif text-xl text-slate-950">S</span>Sign <span className="text-cyan-300">&amp;</span> Signal</Link><div className="hidden items-center gap-6 text-sm text-slate-300 md:flex">{links.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-cyan-200">{label}</Link>)}<Link href="/history" className="rounded-full border border-cyan-200/25 px-4 py-2 text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-200/10">History</Link></div><button className="rounded-lg p-2 text-slate-100 md:hidden" type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button></nav>{open && <div className="border-t border-white/10 px-5 pb-5 md:hidden"><div className="mx-auto flex max-w-6xl flex-col gap-1 pt-3">{[...links, ["History", "/history"] as const].map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5">{label}</Link>)}</div></div>}</header>;
}
