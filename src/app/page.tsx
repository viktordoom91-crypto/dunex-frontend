'use client';

import { useState } from 'react';
import {
  Apple, Smartphone, ShieldCheck, Zap,
  Headset, Lock, Globe, ChevronRight, X,
  CheckCircle2, TrendingUp, Users, Award,
  FileCheck, Eye, Fingerprint, AlertTriangle,
  Share, Plus, Home, MoreHorizontal, MessageSquareQuote, CreditCard, MapPin
} from 'lucide-react';

// ─── iOS Add-to-Homescreen Modal ──────────────────────────────────────────────
interface IOSModalProps {
  onClose: () => void;
}
function IOSModal({ onClose }: IOSModalProps) { 
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Globe size={32} className="text-purple-400" />,
      title: "Open Safari",
      desc: "Launch Apple Safari on your iPhone or iPad. Please ensure you are using Safari, as this feature relies on Apple's built-in tools.",
      visual: (
        <div className="relative w-full h-40 bg-[#0d0d1a] rounded-2xl border border-gray-800 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-transparent" />
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Globe size={30} className="text-white" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Safari</span>
          </div>
        </div>
      ),
    },
    {
      icon: <Globe size={32} className="text-blue-400" />,
      title: "Navigate to the Website",
      desc: "In the Safari address bar at the bottom or top of your screen, enter our official secure address.",
      visual: (
        <div className="w-full bg-[#0d0d1a] rounded-2xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-4 py-3 border border-gray-700">
            <Lock size={14} className="text-green-400 flex-shrink-0" />
            <span className="text-sm font-mono text-purple-400 truncate">app.dunexmarkets.com</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">Tap and hold to copy ↑</p>
        </div>
      ),
    },
    {
      icon: <Share size={32} className="text-purple-400" />,
      title: 'Tap the Share Button',
      desc: 'At the bottom of Safari, tap the Share icon (it looks like a square with an arrow pointing up out of it).',
      visual: (
        <div className="w-full bg-[#0d0d1a] rounded-2xl border border-gray-800 p-4 relative">
          <div className="h-8 bg-gray-900 rounded-lg mb-3 flex items-center px-4">
            <div className="w-24 h-2 bg-gray-700 rounded-full" />
          </div>
          <div className="h-24 bg-gray-900 rounded-lg mb-3" />
          <div className="h-12 bg-[#111] rounded-xl flex items-center justify-around border-t border-gray-800">
            <div className="text-gray-700"><MoreHorizontal size={20} /></div>
            <div className="text-gray-700"><Home size={20} /></div>
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.5)] animate-pulse">
              <Share size={18} className="text-white" />
            </div>
            <div className="text-gray-700"><Plus size={20} /></div>
            <div className="text-gray-700"><MoreHorizontal size={20} /></div>
          </div>
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-0 h-0" style={{borderLeft:'8px solid transparent',borderRight:'8px solid transparent',borderTop:'10px solid #9333ea'}} />
        </div>
      ),
    },
    {
      icon: <Plus size={32} className="text-blue-400" />,
      title: 'Add to Home Screen',
      desc: 'Scroll down through the menu list until you see "Add to Home Screen", tap it, then confirm by tapping "Add" in the top corner.',
      visual: (
        <div className="w-full bg-[#0d0d1a] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-800">
            <span className="text-sm font-semibold text-white">Share</span>
            <X size={14} className="text-gray-500" />
          </div>
          {['Copy Link', 'Message', 'Mail'].map(item => (
            <div key={item} className="px-4 py-3 flex items-center gap-3 border-b border-gray-800/50">
              <div className="w-8 h-8 rounded-lg bg-gray-800" />
              <span className="text-sm text-gray-400">{item}</span>
            </div>
          ))}
          <div className="px-4 py-3 flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 mx-2 my-1 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-purple-300">Add to Home Screen</span>
          </div>
        </div>
      ),
    },
    {
      icon: <CheckCircle2 size={32} className="text-green-400" />,
      title: "Setup Complete",
      desc: "The Dunex Markets app is now securely placed on your phone's home screen. Tap our logo anytime to log in.",
      visual: (
        <div className="w-full bg-[#0d0d1a] rounded-2xl border border-gray-800 p-6 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-[#05050A] flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.3)] border border-gray-800">
            <img src="/icon.png" alt="Dunex Logo" className="w-14 h-14 object-contain" />
          </div>
          <div className="text-center">
            <p className="font-bold text-white text-lg">Dunex Markets</p>
            <p className="text-xs text-gray-500">app.dunexmarkets.com</p>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 size={18} />
            <span className="text-sm font-semibold">Ready for Secure Access</span>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className="relative bg-[#0a0a0f] border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-[0_0_60px_rgba(147,51,234,0.15)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-600/20 blur-[60px] rounded-full pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">iPhone / iPad Guide</p>
            <h3 className="text-lg font-black text-white">App Installation</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="flex gap-1.5 mb-6 relative z-10">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-purple-500' : 'bg-gray-800'}`}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <span className="text-sm font-black text-purple-400">{step + 1}</span>
            </div>
            <h4 className="text-xl font-bold text-white">{current.title}</h4>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-5">{current.desc}</p>
          {current.visual}
        </div>

        <div className="flex gap-3 mt-6 relative z-10">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <a
              href="https://app.dunexmarkets.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Access My Account <ChevronRight size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function DunexLandingPage() {
  const [iosModalOpen, setIosModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#05050a] text-white selection:bg-purple-500/30 overflow-hidden font-sans">

      {iosModalOpen && <IOSModal onClose={() => setIosModalOpen(false)} />}

      {/* AMBIENT GLOWS - Adjusted to match Logo Gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-cyan-900/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-0 w-[400px] h-[400px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* NAVBAR */}
      <nav className="fixed w-full top-0 z-50 border-b border-white/5 bg-[#05050a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="Dunex Logo" className="w-10 h-10 object-contain rounded-lg" />
            <span className="text-xl font-black tracking-tight">DUNEX <span className="text-gray-500 font-medium">MARKETS</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#platform" className="hover:text-white transition-colors">Platform</a>
            <a href="#policies" className="hover:text-white transition-colors">Policies & Payouts</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </div>

          <a
            href="https://app.dunexmarkets.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-black px-5 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2"
          >
            <Lock size={14} className="text-black" /> Secure Online Access
          </a>
        </div>
      </nav>

      {/* HERO */}
      <main className="pt-40 pb-24 px-6 max-w-7xl mx-auto relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">

          <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              Regulated · Transparent · Secure
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              Professional Trading.<br />
              <span className="bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Accessible Anywhere.
              </span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Dunex Markets provides stable, transparent infrastructure for accessing global financial markets. Execute trades across Forex, Indices, and Commodities with reliable routing and dedicated support.
            </p>

            {/* DOWNLOAD BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button
                onClick={() => setIosModalOpen(true)}
                className="group relative flex items-center gap-4 bg-[#0e0e1a] border border-gray-800 p-4 rounded-2xl hover:border-purple-500/60 hover:bg-[#131323] transition-all w-full sm:w-auto shadow-lg"
              >
                <div className="bg-white text-black p-3 rounded-xl group-hover:scale-110 transition-transform shadow">
                  <Apple size={24} fill="currentColor" />
                </div>
                <div className="text-left pr-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Setup For</p>
                  <p className="text-lg font-black text-white">Apple iOS</p>
                </div>
              </button>

        <a 
  href="https://drive.google.com/uc?export=download&id=1G3H0JIwvD4pguER-PNeYw-IjKknSqXyd" 
  download
  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
>
 Download For Android
</a>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-5 justify-center lg:justify-start text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-500" /> Secure encrypted connection</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-purple-500" /> Compliant infrastructure</span>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="flex-1 relative hidden md:flex justify-center z-10">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 blur-3xl rounded-full" />
            <div className="relative w-[290px] h-[590px] bg-[#0a0a0f] border-[7px] border-gray-800 rounded-[3rem] shadow-2xl overflow-hidden transform rotate-[-4deg] hover:rotate-0 transition-all duration-700 hover:shadow-[0_0_60px_rgba(147,51,234,0.15)]">
              <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-20">
                <div className="w-28 h-7 bg-gray-900 rounded-b-3xl" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-[#11111a] to-[#05050a] p-5 pt-12 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col">
                    <p className="text-xs text-gray-500 font-medium">Account Overview</p>
                    <p className="text-sm font-bold text-white">Portfolio</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xs font-black text-white">US</div>
                </div>
                <div className="bg-[#12121A] border border-gray-800 rounded-2xl p-4 mb-4">
                  <p className="text-gray-400 text-xs mb-1">Total Equity</p>
                  <p className="text-3xl font-black text-white">$124,590.00</p>
                  <p className="text-gray-500 text-xs font-medium mt-1">Live Environment</p>
                </div>
                <div className="h-32 w-full mb-4 relative">
                  <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                      <linearGradient id="fill2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,50 Q10,40 20,45 T40,20 T60,35 T80,10 T100,5 L100,50 Z" fill="url(#fill2)" />
                    <path d="M0,50 Q10,40 20,45 T40,20 T60,35 T80,10 T100,5" fill="none" stroke="url(#grad2)" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['BTC/USD','EUR/USD','XAU/USD','S&P 500'].map((pair, i) => (
                    <div key={pair} className="bg-gray-900/60 rounded-xl p-2.5">
                      <p className="text-[10px] text-gray-500 font-bold">{pair}</p>
                      <p className={`text-xs font-black mt-0.5 ${i % 2 === 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {i % 2 === 0 ? '▲' : '▼'} {(Math.random()*3+0.5).toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* STATS */}
      <section className="border-y border-white/5 bg-white/[0.01] backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: 'Global', label: 'Market Access' },
            { val: '24/7', label: 'System Uptime' },
            { val: 'Tier-1', label: 'Liquidity Providers' },
            { val: 'Secure', label: 'Fund Segregation' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl md:text-3xl font-black text-white">{s.val}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section id="platform" className="py-32 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Professional Infrastructure</p>
          <h2 className="text-3xl md:text-5xl font-black mb-5">A Trading Environment<br />Built on Stability</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            We focus on providing reliable infrastructure rather than making unrealistic promises. Your trading success depends on your strategy; our job is to provide the stable tools you need to execute it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            {
              icon: <TrendingUp size={24} className="text-purple-400" />,
              title: 'Direct Market Access',
              desc: 'We route orders directly to established liquidity providers. Experience transparent execution without artificial market making or conflict of interest.',
            },
            {
              icon: <CreditCard size={24} className="text-cyan-400" />,
              title: 'Transparent Pricing',
              desc: 'Clear, upfront fee structures. We believe in building long-term partnerships, which starts with absolute clarity on all trading costs and spreads.',
            },
            {
              icon: <Headset size={24} className="text-blue-400" />,
              title: 'Dedicated Assistance',
              desc: 'From technical onboarding to account management, our specialized support team is structured to resolve your platform queries efficiently and professionally.',
            },
          ].map((card, i) => (
            <div key={card.title} className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-8 hover:border-gray-600 transition-colors group relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-5 group-hover:bg-gray-800 transition-colors">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CORE POLICIES & PAYOUTS (The "No Lies" section) */}
      <section id="policies" className="py-20 px-6 max-w-7xl mx-auto relative z-10 border-t border-gray-900">
        <div className="bg-gradient-to-r from-purple-900/10 to-cyan-900/10 border border-purple-500/20 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-shrink-0 w-20 h-20 rounded-3xl bg-[#0a0a0f] border border-gray-800 flex items-center justify-center shadow-xl">
            <Award size={32} className="text-purple-400" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-2xl md:text-3xl font-black text-white mb-4">Our Standard for Withdrawals</h3>
            <p className="text-gray-400 leading-relaxed text-lg mb-6">
              We operate on a strict policy of financial transparency. When you request a withdrawal, our finance department processes the transaction within <strong className="text-white">6 to 12 hours</strong>. 
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl p-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-sm font-medium text-gray-300">Processing: 6 - 12 Hours</span>
              </div>
              <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl p-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-300">Delivery: 1 - 3 Business Days</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-6 italic">
              *Delivery times depend entirely on your selected payment provider or banking institution. We do not hold funds or create artificial delays.
            </p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Client Experiences</p>
          <h2 className="text-3xl md:text-4xl font-black mb-5">Trusted by Active Traders</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "The platform stability during high-volume sessions is exactly what I need for my strategy. Order execution is crisp, and the interface doesn't lag when it matters most.",
              author: "Independent Analyst",
              tag: "Platform Stability"
            },
            {
              quote: "What I appreciate most is the transparency regarding payouts. When I request a withdrawal, it is processed within hours and hits my account within two days. Reliable and professional.",
              author: "Verified Client",
              tag: "Withdrawal Reliability"
            },
            {
              quote: "Moving my portfolio here was seamless. The support team is highly responsive, knowledgeable about the technical infrastructure, and actually helps resolve queries promptly.",
              author: "Portfolio Manager",
              tag: "Client Support"
            }
          ].map((review, i) => (
            <div key={i} className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <MessageSquareQuote size={28} className="text-gray-700 mb-6" />
                <p className="text-gray-300 text-sm leading-loose mb-8">"{review.quote}"</p>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-gray-800/50">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{review.author}</span>
                <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">{review.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-gray-900">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Security Architecture</p>
          <h2 className="text-3xl md:text-4xl font-black mb-5">Comprehensive Asset Protection</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            We employ enterprise-grade security protocols to ensure your data and capital remain strictly protected at all times.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: <Lock size={22} className="text-green-400" />,
              title: 'Industry-Standard Encryption',
              desc: 'Data transmission is secured utilizing advanced encryption standards to protect sensitive financial information from unauthorized access.',
            },
            {
              icon: <Fingerprint size={22} className="text-purple-400" />,
              title: 'Strict Authentication Controls',
              desc: 'Account access is fortified with multi-factor authentication protocols, adding a necessary layer of verification for all users.',
            },
            {
              icon: <ShieldCheck size={22} className="text-blue-400" />,
              title: 'Segregated Capital',
              desc: 'Client funds are maintained in segregated accounts, ensuring they are separated from corporate operational capital at all times.',
            },
            {
              icon: <Eye size={22} className="text-cyan-400" />,
              title: 'Continuous System Monitoring',
              desc: 'Our infrastructure is monitored around the clock to detect and mitigate potential anomalies or unauthorized access attempts.',
            },
          ].map((item, i) => (
            <div key={i} className="bg-[#0a0a0f] border border-gray-800 rounded-2xl p-7 flex gap-5">
              <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KYC / COMPLIANCE */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-gray-900">
        <div className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-2xl font-black text-white mb-4">Regulatory Compliance & Verification</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              To maintain platform integrity and comply with international Anti-Money Laundering (AML) directives, all clients must complete a standard identity verification process before initiating withdrawals.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-300 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
                <FileCheck size={14} className="text-purple-400" /> Identity Verification
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-300 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
                <Globe size={14} className="text-purple-400" /> Security Screening
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 w-32 h-32 relative">
            <div className="absolute inset-0 bg-purple-500/10 rounded-full animate-pulse" />
            <div className="absolute inset-4 bg-gray-900 rounded-full border border-gray-800 flex items-center justify-center">
              <ShieldCheck size={32} className="text-purple-400" />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-[#0a0a0f] border border-gray-800 rounded-3xl p-12 relative overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-black mb-5 text-white">Begin Your Trading Journey Today</h2>
            <p className="text-gray-400 mb-10 max-w-xl mx-auto">Access professional trading tools and reliable infrastructure. Download the application and complete your registration in minutes.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => setIosModalOpen(true)}
                className="flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-all"
              >
                <Apple size={20} fill="currentColor" /> iPhone Setup
              </button>
              <a
                href="/dunex-markets.apk"
                download
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-4 rounded-full font-bold hover:opacity-90 transition-all"
              >
                <Smartphone size={20} /> Android Download
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-900 bg-[#020205] relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-start gap-8">
          
          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/icon.png" alt="Dunex Logo" className="w-8 h-8 object-contain rounded-md" />
              <span className="font-black tracking-tight">DUNEX <span className="text-gray-500 font-medium">MARKETS</span></span>
            </div>
            <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
              Professional trading infrastructure built for stability, security, and transparent execution.
            </p>
          </div>

          {/* Links Columns */}
          <div className="flex flex-wrap gap-10 text-sm text-gray-500">
            
            <div>
              <p className="text-white font-bold mb-3">Platform</p>
              <div className="flex flex-col gap-2">
                <a href="#platform" className="hover:text-gray-300 transition-colors">Infrastructure</a>
                <a href="#security" className="hover:text-gray-300 transition-colors">Security</a>
                <a href="#policies" className="hover:text-gray-300 transition-colors">Payouts</a>
              </div>
            </div>

            <div>
              <p className="text-white font-bold mb-3">Legal</p>
              <div className="flex flex-col gap-2">
                <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-gray-300 transition-colors">Security Policy</a>
              </div>
            </div>

            {/* Corporate Office Address */}
            <div>
              <p className="text-white font-bold mb-3 flex items-center gap-1.5">
                <MapPin size={16} className="text-purple-400" /> Corporate Office
              </p>
              <div className="flex flex-col gap-1.5 text-gray-500 text-xs">
                <span>Office No: 812</span>
                <span>ETA Star Al Manara Tower</span>
                <span>Business Bay, Dubai, UAE</span>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="max-w-7xl mx-auto px-6 py-5 border-t border-gray-900">
          <p className="text-xs text-gray-700 text-center">
            © 2026 Dunex Markets. All rights reserved. <strong>Risk Warning:</strong> Trading leveraged products involves a significant level of risk and may not be suitable for all investors. Ensure you fully understand the risks involved before participating in the financial markets.
          </p>
        </div>
      </footer>
    </div>
  );
}
