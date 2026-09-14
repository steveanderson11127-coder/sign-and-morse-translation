import Link from "next/link";
import { Navigation } from "./navigation";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#07111f] text-slate-100"><Navigation />{children}<footer className="border-t border-white/10 px-5 py-7 text-center text-xs leading-6 text-slate-400">Sign &amp; Signal is an experimental accessibility project. It is not a substitute for a qualified interpreter or emergency communication service.<div className="mt-2"><Link className="text-cyan-300 hover:underline" href="/privacy">Read our privacy principles</Link></div></footer></div>;
}
