/**
 * Routine Scrapper - About & Protocol Specification
 * Professional-grade technical details and sustainability protocol.
 * Forked from PaperKnife by potatameister
 */

import { useState } from 'react'
import { 
  Code as CodeIcon, 
  Cpu as CpuIcon, 
  Github as GHIcon, 
  Shield as ShieldIcon, 
  ChevronDown as ChevronDownIcon,
  ServerOff as ServerOffIcon,
  ExternalLink as ExternalLinkIcon,
  ChevronRight as ChevronRightIcon,
  HardDrive as DiskIcon,
  EyeOff as PrivacyIcon,
  GitFork as ForkIcon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { PaperKnifeLogo } from './Logo'
import { APP_VERSION } from '../utils/supabaseClient'
import { ViewMode } from '../types'

// --- UI COMPONENTS ---
const SpecItem = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 dark:border-zinc-800 last:border-0 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group transition-all"
      >
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-gray-50 dark:bg-zinc-900 text-gray-400 group-hover:text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/10'}`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
          <h4 className="font-black text-xs md:text-sm uppercase tracking-[0.2em] text-gray-900 dark:text-white transition-colors">{title}</h4>
        </div>
        <div className={`p-2 rounded-full transition-all ${isOpen ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'text-gray-300'}`}>
          <ChevronDownIcon size={18} className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className="pb-8 pl-16 pr-6 text-sm md:text-base text-gray-500 dark:text-zinc-400 font-medium leading-relaxed animate-in slide-in-from-top-4 duration-500">
          {children}
        </div>
      )}
    </div>
  )
}

// --- WEB VERSION (TITAN v1.2 EXPLANATORY) ---
const AboutWeb = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white pb-24">
      
      {/* 1. Impact Hero - Compact */}
      <section className="relative pt-20 pb-12 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.05),transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter dark:text-white mb-6 leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700">
            Privacy is a <br/>
            <span className="text-rose-500 font-black">Human Right.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Routine Scrapper is an absolute document engine. No servers, no tracking, no compromises. We transform your browser into a self-contained document laboratory.
          </p>
        </div>
      </section>

      {/* 2. Fork Attribution Card */}
      <section className="max-w-5xl mx-auto px-6 mb-12">
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <ForkIcon size={120} />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center shrink-0">
              <ForkIcon size={28} className="text-rose-500" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black tracking-tighter mb-2 dark:text-white">Forked from PaperKnife</h3>
              <p className="text-gray-500 dark:text-zinc-400 font-medium text-sm mb-4 max-w-xl leading-relaxed">
                Routine Scrapper is a fork of{' '}
                <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="text-rose-500 font-bold hover:underline">
                  PaperKnife
                </a>{' '}
                by potatameister. The original project is licensed under AGPL v3.
              </p>
              <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors">
                View Original Project <ExternalLinkIcon size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Deep Specification - Tighter Layout */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Narrative Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-zinc-100 dark:bg-white/5 rounded-md text-[9px] font-black uppercase tracking-widest text-gray-400 border border-gray-200/50 dark:border-white/5">
               Technical Manifesto
            </div>
            <h2 className="text-3xl font-black tracking-tighter dark:text-white leading-[1.1]">
              Architecture of <br/>
              <span className="text-rose-500">Absolute Sovereignty.</span>
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
              Routine Scrapper rejects the trade-off between convenience and privacy. We've built an engine that runs where the user is, ensuring your sensitive data never crosses a network boundary.
            </p>
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
               <h4 className="font-black text-[10px] uppercase tracking-widest text-emerald-500 mb-3 flex items-center gap-2">
                  <ServerOffIcon size={14} /> Zero Infrastructure
               </h4>
               <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">
                  We operate no backend. No databases. No file caches. Routine Scrapper is a static distribution of code that activates your browser's existing power.
               </p>
            </div>
          </div>

          {/* Accordion Column - Compact */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-[2.5rem] p-2 md:p-6 border border-gray-100 dark:border-white/5 shadow-sm">
             <SpecItem title="How it Works" icon={CpuIcon} defaultOpen={true}>
                Every action is executed locally on your device's CPU. Using high-performance <span className="text-rose-500 font-bold">Web Workers</span> and <span className="text-rose-500 font-bold">WebAssembly</span>, Routine Scrapper loads your PDF into a sandboxed environment within your browser tab.
             </SpecItem>

             <SpecItem title="Data Lifecycle" icon={PrivacyIcon}>
                Your documents live exclusively in your browser's <span className="text-rose-500 font-bold">volatile memory (RAM)</span>. We do not use persistent storage or cookies for your file content. Once the tab is closed, the data is destroyed.
             </SpecItem>

             <SpecItem title="Deep Metadata Clean" icon={DiskIcon}>
                Our "Deep Clean" metadata protocol purges identifying strings like Producer, Creator, and XMP metadata that standard editors leave behind, ensuring your files are truly anonymous.
             </SpecItem>

             <SpecItem title="Radical Transparency" icon={CodeIcon}>
                Routine Scrapper is <span className="text-rose-500 font-bold">100% Open Source</span> under the <span className="text-rose-500 font-bold">GNU AGPL v3</span> license. This gives you the right to audit every line of code and guarantees the engine remains free.
             </SpecItem>

             <SpecItem title="Privacy Nodes" icon={ShieldIcon}>
                By processing documents on-device, every user acts as their own "Privacy Node." There is no central point of failure and no surveillance capability.
             </SpecItem>
          </div>

        </div>
      </section>

      {/* 4. Final Footer Links - Condensed */}
      <section className="max-w-4xl mx-auto px-6 text-center border-t border-gray-100 dark:border-zinc-900 pt-16">
        <div className="flex flex-wrap justify-center gap-8 mb-12">
           <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors group">
              <GHIcon size={16} /> Original Source <ExternalLinkIcon size={12} className="opacity-40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </a>
           <button onClick={() => navigate('/thanks')} className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors group">
              <CodeIcon size={16} /> Credits <ChevronRightIcon size={12} className="opacity-40 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
        
        <div className="opacity-20 hover:opacity-50 transition-opacity duration-700">
          <PaperKnifeLogo size={32} iconColor="#F43F5E" partColor="currentColor" className="mx-auto mb-4" />
          <p className="text-[9px] font-black uppercase tracking-[0.6em] text-gray-400">Developed by Shakib • Math ERROR</p>
        </div>
      </section>

    </div>
  )
}


// --- APK VERSION (TITAN MOBILE OVERHAUL - PROTOCOL EXPLAINER) ---
const AboutAPK = () => {
  const navigate = useNavigate()
  return (
    <NativeToolLayout title="Protocol" description="System Internals" actions={null}>
      <div className="px-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">
        
        {/* 1. App Identity */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-black rounded-[1.5rem] flex items-center justify-center shadow-inner mb-4">
            <PaperKnifeLogo size={40} iconColor="#F43F5E" partColor="currentColor" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter dark:text-white leading-none mb-1">Routine Scrapper</h2>
          <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">v{APP_VERSION} Stable • Absolute Privacy</p>
        </div>

        {/* 2. Fork Attribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
              <ForkIcon size={20} className="text-rose-500" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight dark:text-white">Forked from PaperKnife</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium leading-relaxed mb-3">
            Routine Scrapper is a fork of{' '}
            <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="text-rose-500 font-bold hover:underline">
              PaperKnife
            </a>{' '}
            by potatameister. Licensed under AGPL v3.
          </p>
          <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-rose-500">
            View Original <ExternalLinkIcon size={10} />
          </a>
        </div>

        {/* 3. Explainer Protocol (The "Everything") */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-2 border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-gray-50 dark:border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">System Internal Specification</h3>
           </div>
           
           <div className="divide-y divide-gray-50 dark:divide-white/5 px-2">
              <SpecItem title="How it Works" icon={CpuIcon}>
                Every action you perform—merging, splitting, or encrypting—happens locally on your device's CPU. Routine Scrapper uses an internal local engine powered by <span className="text-rose-500 font-bold">pdf-lib</span> and <span className="text-rose-500 font-bold">WebAssembly</span>. No data ever leaves your hardware.
              </SpecItem>

              <SpecItem title="Data Privacy" icon={PrivacyIcon}>
                Your files are loaded into the app's <span className="text-rose-500 font-bold">volatile memory (RAM)</span> only during your active session. We do not use persistent storage for your PDF content. Once you close the app or navigate away, the processed document is permanently purged.
              </SpecItem>

              <SpecItem title="Deep Metadata Clean" icon={DiskIcon}>
                Privacy isn't just about servers. Most tools leave digital breadcrumbs in the PDF metadata. Routine Scrapper's "Deep Clean" protocol sanitizes every document, purging Producer, Creator, and XMP metadata to ensure absolute anonymity.
              </SpecItem>

              <SpecItem title="Open Source Integrity" icon={CodeIcon}>
                Trust is earned through transparency. Routine Scrapper is <span className="text-rose-500 font-bold">100% open-source</span> under the <span className="text-rose-500 font-bold">GNU AGPL v3</span> license. This ensures the engine remains free, auditable, and community-driven forever.
              </SpecItem>

              <SpecItem title="Zero Infrastructure" icon={ServerOffIcon}>
                We operate a <span className="text-rose-500 font-bold">Zero-Server Architecture</span>. We have no backend, no database, and no cloud. Your phone is the laboratory, and your documents stay in your hands alone.
              </SpecItem>
           </div>
        </div>

        {/* 4. Action Tiles */}
        <div className="grid grid-cols-1 gap-2 pt-2">
          <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-[2rem] active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-black rounded-xl flex items-center justify-center">
                   <GHIcon size={20} className="text-black dark:text-white" />
                </div>
                <div>
                   <h4 className="font-bold text-sm dark:text-white">Original Source Code</h4>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">AGPL v3 License</p>
                </div>
              </div>
              <ExternalLinkIcon size={16} className="text-gray-300" />
          </a>
          
          <button onClick={() => navigate('/thanks')} className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-[2rem] active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center">
                   <CodeIcon size={20} className="text-rose-500" />
                </div>
                <div className="text-left">
                   <h4 className="font-bold text-sm dark:text-white">Credits</h4>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Attributions</p>
                </div>
              </div>
              <ChevronRightIcon size={16} className="text-gray-300" />
          </button>
        </div>

        <p className="text-[8px] font-black uppercase text-center text-gray-400 tracking-[0.5em] pt-8 pb-4">Developed by Shakib • Math ERROR</p>
      </div>
    </NativeToolLayout>
  )
}

// --- MAIN ROUTER ---
export default function About({ viewMode }: { viewMode?: ViewMode }) {
  const isAndroid = viewMode === 'android' || (viewMode === undefined && Capacitor.isNativePlatform())
  return isAndroid ? <AboutAPK /> : <AboutWeb />
}
