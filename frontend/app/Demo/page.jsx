'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FiHome, FiTruck, FiDollarSign, FiShield, FiUser, FiArrowRight,
  FiCheck, FiClock, FiAlertTriangle, FiLock, FiZap, FiGlobe,
  FiChevronRight, FiRepeat, FiStar, FiTrendingUp, FiX,
} from 'react-icons/fi';
import { useTheme } from '../components/Atoms/ThemeProvider';

/* ── Mock data ──────────────────────────────────────────────────── */

const MOCK_LISTINGS = [
  {
    id: 'demo-1',
    title: '3BR Apartment in Lekki Phase 1',
    asset_type: 'property',
    listing_type: 'agent_brokered',
    price_usdc: 85000,
    commission_bps: 500,
    agent_name: 'Aisha Bello',
    agent_avatar: null,
    owner_name: 'Chukwu Emeka',
    image: null,
  },
  {
    id: 'demo-2',
    title: '2023 Toyota Land Cruiser V8',
    asset_type: 'vehicle',
    listing_type: 'owner_direct',
    price_usdc: 42000,
    commission_bps: 0,
    agent_name: null,
    owner_name: 'Tunde Bakare',
    image: null,
  },
  {
    id: 'demo-3',
    title: '2BR Flat in Ikoyi',
    asset_type: 'property',
    listing_type: 'agent_brokered',
    price_usdc: 120000,
    commission_bps: 300,
    agent_name: 'Ngozi Okafor',
    agent_avatar: null,
    owner_name: 'Adebayo Yusuf',
    image: null,
  },
];

const PLATFORM_FEE_BPS = 100;

/* ── Helpers ────────────────────────────────────────────────────── */

const fmt = (n) => Number(n).toLocaleString();
const bpsToPct = (bps) => (bps / 100).toFixed(1);

function computeSplit(price, commissionBps, platformFeeBps) {
  const commission = Math.round((price * commissionBps) / 10000);
  const platformFee = Math.round((price * platformFeeBps) / 10000);
  const seller = price - commission - platformFee;
  return { commission, platformFee, seller };
}

/* ── Step labels ────────────────────────────────────────────────── */

const OWNER_DIRECT_STEPS = [
  { key: 'browse',   label: 'Browse Listing',     icon: FiHome },
  { key: 'select',   label: 'Select & Review',     icon: FiDollarSign },
  { key: 'escrow',   label: 'Escrow Created',      icon: FiLock },
  { key: 'fund',     label: 'Buyer Funds Escrow',  icon: FiShield },
  { key: 'release',  label: 'Funds Released',       icon: FiZap },
];

const AGENT_BROKERED_STEPS = [
  { key: 'browse',   label: 'Browse Listing',         icon: FiHome },
  { key: 'request',  label: 'Buyer Requests',         icon: FiUser },
  { key: 'create',   label: 'Agent Creates Deal',     icon: FiLock },
  { key: 'fund',     label: 'Buyer Funds Escrow',     icon: FiShield },
  { key: 'release',  label: 'Atomic Settlement',      icon: FiZap },
];

/* ── Sub-components ─────────────────────────────────────────────── */

const StepIndicator = ({ steps, current, isDark }) => (
  <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
    {steps.map((s, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={s.key}>
          {i > 0 && (
            <div className={`hidden sm:block h-px w-4 md:w-8 flex-shrink-0 transition-colors duration-500 ${done ? 'bg-teal-500' : isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
            active
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 scale-105'
              : done
              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
              : isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'
          }`}>
            {done ? <FiCheck size={12} /> : <s.icon size={12} />}
            <span className="hidden md:inline">{s.label}</span>
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

const PaymentBar = ({ label, amount, total, color, delay }) => {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay || 0);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-white">{fmt(amount)} USDC</span>
      </div>
      <div className="h-3 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

const RoleCard = ({ role, icon: Icon, title, desc, active, onClick, isDark }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 text-center ${
      active
        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-lg shadow-teal-500/10 scale-105'
        : isDark ? 'border-white/10 bg-white/5 hover:border-white/20' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
    }`}
  >
    <Icon size={24} className={active ? 'text-teal-500' : 'text-gray-400'} />
    <span className={`text-sm font-bold ${active ? 'text-teal-700 dark:text-teal-300' : 'text-gray-700 dark:text-gray-300'}`}>{title}</span>
    <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{desc}</span>
  </button>
);

const MockListingCard = ({ item, selected, onClick, isDark }) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-xl border-2 overflow-hidden transition-all duration-300 ${
      selected
        ? 'border-teal-500 shadow-lg shadow-teal-500/10 scale-[1.02]'
        : isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'
    }`}
  >
    <div className={`h-32 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
      {item.asset_type === 'vehicle' ? <FiTruck size={40} className="text-teal-400 dark:text-teal-600" /> : <FiHome size={40} className="text-teal-400 dark:text-teal-600" />}
    </div>
    <div className="p-3">
      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.title}</p>
      <p className="text-teal-600 dark:text-teal-400 font-semibold text-sm mt-1">{fmt(item.price_usdc)} USDC</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.listing_type === 'agent_brokered' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'}`}>
          {item.listing_type === 'agent_brokered' ? 'Agent' : 'Owner'}
        </span>
        <span className="text-[10px] text-gray-400">{item.asset_type}</span>
      </div>
    </div>
  </button>
);

/* ── Main Demo Page ─────────────────────────────────────────────── */

const DemoPage = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [role, setRole] = useState('buyer');
  const [listing, setListing] = useState(MOCK_LISTINGS[0]);
  const [step, setStep] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const isAgentBrokered = listing.listing_type === 'agent_brokered';
  const steps = isAgentBrokered ? AGENT_BROKERED_STEPS : OWNER_DIRECT_STEPS;
  const split = computeSplit(listing.price_usdc, listing.commission_bps, PLATFORM_FEE_BPS);

  const reset = useCallback(() => {
    setStep(0);
    setSimulating(false);
    setAutoPlay(false);
  }, []);

  const nextStep = useCallback(() => {
    if (step < steps.length - 1) {
      setSimulating(true);
      setTimeout(() => {
        setStep((s) => s + 1);
        setSimulating(false);
      }, 800);
    }
  }, [step, steps.length]);

  const prevStep = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || step >= steps.length - 1) { setAutoPlay(false); return; }
    const t = setTimeout(nextStep, 1800);
    return () => clearTimeout(t);
  }, [autoPlay, step, steps.length, nextStep]);

  // Reset when listing changes
  useEffect(reset, [listing, reset]);

  /* ── Render ───────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12">

        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-teal-600 dark:text-teal-400">Interactive Walkthrough</span>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-3 mb-3 bg-gradient-to-r from-teal-700 to-teal-400 dark:from-teal-300 dark:to-teal-500 bg-clip-text text-transparent">
            How HybridAgent Works
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
            A hands-on simulation of the escrow payment flow. Pick a role, choose a listing, and watch the money move — atomically, on-chain.
          </p>
        </div>

        {/* Role selector */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay: '80ms' }}>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 text-center">Choose your role</p>
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            <RoleCard role="buyer" icon={FiDollarSign} title="Buyer" desc="Purchase property or vehicle" active={role === 'buyer'} onClick={() => { setRole('buyer'); reset(); }} isDark={isDark} />
            <RoleCard role="agent" icon={FiUser} title="Agent" desc="Broker a deal for a client" active={role === 'agent'} onClick={() => { setRole('agent'); setListing(MOCK_LISTINGS[0]); }} isDark={isDark} />
            <RoleCard role="owner" icon={FiHome} title="Owner" desc="Sell directly, zero commission" active={role === 'owner'} onClick={() => { setRole('owner'); setListing(MOCK_LISTINGS[1]); }} isDark={isDark} />
          </div>
        </div>

        {/* Listing selector */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 text-center">Select a listing</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {MOCK_LISTINGS.map((item) => (
              <MockListingCard key={item.id} item={item} selected={listing.id === item.id} onClick={() => setListing(item)} isDark={isDark} />
            ))}
          </div>
        </div>

        {/* Main simulation card */}
        <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl animate-fade-up" style={{ animationDelay: '240ms' }}>

          {/* Step indicator */}
          <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Escrow Flow Simulation</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setAutoPlay(!autoPlay)} disabled={step >= steps.length - 1}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${autoPlay ? 'bg-teal-600 text-white' : isDark ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} disabled:opacity-40`}>
                  {autoPlay ? '⏸ Pause' : '▶ Auto-play'}
                </button>
                <button onClick={reset} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/15 transition-colors">
                  ↺ Reset
                </button>
              </div>
            </div>
            <StepIndicator steps={steps} current={step} isDark={isDark} />
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Left: Step narrative + controls */}
              <div className="space-y-6">
                <StepNarrative step={step} listing={listing} role={role} isAgentBrokered={isAgentBrokered} isDark={isDark} />

                {/* Nav buttons */}
                <div className="flex items-center gap-3">
                  <button onClick={prevStep} disabled={step === 0}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-30 ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                    ← Back
                  </button>
                  <button onClick={nextStep} disabled={step === steps.length - 1 || simulating}
                    className="flex-1 flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 dark:bg-white/10 dark:hover:bg-teal-600 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-40">
                    {simulating ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</span>
                    ) : step === steps.length - 1 ? (
                      <span className="flex items-center gap-2"><FiCheck size={16} /> Flow Complete</span>
                    ) : (
                      <span className="flex items-center gap-2">Next Step <FiChevronRight size={16} /></span>
                    )}
                  </button>
                </div>

                {/* Toggle listing type */}
                <div className="flex items-center gap-2 pt-2">
                  <FiRepeat size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Switch listing type:</span>
                  <button onClick={() => setListing(isAgentBrokered ? MOCK_LISTINGS[1] : MOCK_LISTINGS[0])}
                    className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                    {isAgentBrokered ? 'Try Owner Direct →' : 'Try Agent Brokered →'}
                  </button>
                </div>
              </div>

              {/* Right: Payment visualization */}
              <div className="space-y-4">
                {/* Listing mini card */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                    {listing.asset_type === 'vehicle' ? <FiTruck size={20} className="text-teal-500" /> : <FiHome size={20} className="text-teal-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{listing.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{fmt(listing.price_usdc)} USDC · {listing.listing_type === 'agent_brokered' ? 'Agent Brokered' : 'Owner Direct'}</p>
                  </div>
                </div>

                {/* Escrow vault visualization */}
                <div className={`relative rounded-xl border p-5 ${isDark ? 'bg-black/40 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <FiLock size={16} className="text-teal-500" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Escrow Vault</span>
                    {step >= (isAgentBrokered ? 2 : 1) && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full animate-fade-in">
                        <FiShield size={10} /> {step >= steps.length - 1 ? 'SETTLED' : 'SECURED'}
                      </span>
                    )}
                  </div>

                  <div className="text-center py-6">
                    <div className={`text-3xl font-extrabold transition-all duration-700 ${
                      step >= (isAgentBrokered ? 2 : 1) ? 'text-teal-600 dark:text-teal-400 scale-110' : 'text-gray-300 dark:text-gray-600'
                    }`}>
                      {step >= (isAgentBrokered ? 2 : 1) ? `${fmt(listing.price_usdc)} USDC` : '— — —'}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {step < (isAgentBrokered ? 2 : 1) ? 'Waiting for deposit' : step >= steps.length - 1 ? 'Funds released to all parties' : 'Funds locked in smart contract'}
                    </p>
                  </div>

                  {/* Animated vault bars */}
                  {step >= steps.length - 1 && (
                    <div className="space-y-3 mt-4 animate-fade-up">
                      <PaymentBar label={`Agent${isAgentBrokered ? ` (${listing.agent_name})` : ''} commission`} amount={split.commission} total={listing.price_usdc} color="bg-amber-500" delay={0} />
                      <PaymentBar label="Platform fee" amount={split.platformFee} total={listing.price_usdc} color="bg-blue-500" delay={200} />
                      <PaymentBar label={`Owner${!isAgentBrokered ? ` (${listing.owner_name})` : ''} proceeds`} amount={split.seller} total={listing.price_usdc} color="bg-green-500" delay={400} />
                    </div>
                  )}
                </div>

                {/* Breakdown table */}
                {step >= steps.length - 1 && (
                  <div className={`rounded-xl border overflow-hidden animate-fade-up`} style={{ animationDelay: '300ms' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={isDark ? 'bg-white/5' : 'bg-gray-100'}>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Recipient</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Amount</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isAgentBrokered && (
                          <tr className="border-t border-gray-100 dark:border-white/5">
                            <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium">Agent · {listing.agent_name}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400">{fmt(split.commission)} USDC</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{bpsToPct(listing.commission_bps)}%</td>
                          </tr>
                        )}
                        <tr className="border-t border-gray-100 dark:border-white/5">
                          <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium">Platform · HybridAgent</td>
                          <td className="px-4 py-2.5 text-right font-bold text-blue-600 dark:text-blue-400">{fmt(split.platformFee)} USDC</td>
                          <td className="px-4 py-2.5 text-right text-gray-400">{bpsToPct(PLATFORM_FEE_BPS)}%</td>
                        </tr>
                        <tr className="border-t border-gray-100 dark:border-white/5">
                          <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium">Owner · {listing.owner_name}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-green-600 dark:text-green-400">{fmt(split.seller)} USDC</td>
                          <td className="px-4 py-2.5 text-right text-gray-400">{((split.seller / listing.price_usdc) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className={`border-t font-bold ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                          <td className="px-4 py-2.5 text-gray-900 dark:text-white">Total</td>
                          <td className="px-4 py-2.5 text-right text-teal-600 dark:text-teal-400">{fmt(listing.price_usdc)} USDC</td>
                          <td className="px-4 py-2.5 text-right text-gray-400">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* How it works section */}
        <div className="mt-16 animate-fade-up" style={{ animationDelay: '320ms' }}>
          <h2 className="text-2xl font-extrabold text-center mb-8">Why Escrow?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: FiShield, title: 'Buyer Protection', desc: 'Your USDC is locked in a smart contract. If the deal falls through, you get a full refund — no trust required.' },
              { icon: FiLock, title: 'Atomic Settlement', desc: 'Agent commission, platform fee, and owner proceeds are paid in a single transaction. No partial payouts, no disputes.' },
              { icon: FiGlobe, title: 'Global, On-Chain', desc: 'Settle in USDC on Ethereum or Base. Works cross-border without banks, delays, or hidden fees.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className={`p-6 rounded-2xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <Icon size={28} className="text-teal-500 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center animate-fade-up" style={{ animationDelay: '400ms' }}>
          <Link href="/Listings"
            className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-600 dark:bg-white/10 dark:hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-xl transition-colors text-sm">
            Browse Real Listings <FiArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ── Step narrative (left panel) ────────────────────────────────── */

function StepNarrative({ step, listing, role, isAgentBrokered, isDark }) {
  const split = computeSplit(listing.price_usdc, listing.commission_bps, PLATFORM_FEE_BPS);
  const narratives = isAgentBrokered ? [
    {
      title: 'Discover a Listing',
      body: `A buyer browses the marketplace and finds "${listing.title}" listed at ${fmt(listing.price_usdc)} USDC by agent ${listing.agent_name || 'Aisha Bello'} on behalf of owner ${listing.owner_name || 'Chukwu Emeka'}.`,
      detail: 'All listings show the asset type, price, and whether it is agent-brokered or owner-direct.',
    },
    {
      title: 'Buyer Requests Purchase',
      body: `The buyer clicks "Buy Now" and submits a purchase request. This notifies the agent that a buyer is ready.`,
      detail: 'No money moves yet. The request simply tells the agent to prepare the escrow deal.',
    },
    {
      title: 'Agent Creates Escrow Deal',
      body: `${listing.agent_name || 'Aisha Bello'} uses their embedded wallet to call createDeal() on the HybridEscrow smart contract. This locks in the buyer, seller, price, and commission.`,
      detail: `Commission: ${fmt(split.commission)} USDC (${bpsToPct(listing.commission_bps)}%). Platform fee: ${fmt(split.platformFee)} USDC (1%).`,
    },
    {
      title: 'Buyer Funds the Escrow',
      body: `The buyer approves and transfers ${fmt(listing.price_usdc)} USDC into the escrow contract. The funds are now locked on-chain.`,
      detail: 'Gas is paid in USDC via Privy smart wallets — no ETH needed. Works on Ethereum Sepolia or Base Sepolia.',
    },
    {
      title: 'Atomic Settlement',
      body: `Once the buyer confirms receipt, the smart contract instantly splits the funds: agent gets ${fmt(split.commission)} USDC, platform gets ${fmt(split.platformFee)} USDC, and owner receives ${fmt(split.seller)} USDC.`,
      detail: 'All in one transaction. No manual payouts. No trust needed.',
    },
  ] : [
    {
      title: 'Owner Lists Directly',
      body: `${listing.owner_name || 'Tunde Bakare'} lists "${listing.title}" at ${fmt(listing.price_usdc)} USDC as an owner_direct listing — meaning zero agent commission.`,
      detail: 'Owner-direct listings skip the agent entirely. The full amount (minus platform fee) goes to the seller.',
    },
    {
      title: 'Buyer Reviews & Buys',
      body: `The buyer sees the listing, reviews the details, and clicks "Buy Now". An escrow deal is created on-chain immediately.`,
      detail: 'Since there is no agent, the escrow contract is simpler — just buyer, seller, and platform fee.',
    },
    {
      title: 'Buyer Funds Escrow',
      body: `The buyer transfers ${fmt(listing.price_usdc)} USDC into the smart contract. Funds are locked until the deal completes.`,
      detail: `Commission: ${fmt(split.commission)} USDC (0%). Platform fee: ${fmt(split.platformFee)} USDC (1%).`,
    },
    {
      title: 'Funds Secured On-Chain',
      body: `The ${fmt(listing.price_usdc)} USDC is now held in the escrow contract. The seller proceeds with handover.`,
      detail: 'The buyer can dispute at any point before confirming receipt.',
    },
    {
      title: 'Settlement Complete',
      body: `The buyer confirms receipt. The contract releases ${fmt(split.seller)} USDC directly to the owner and ${fmt(split.platformFee)} USDC to the platform.`,
      detail: 'Zero commission since this is an owner-direct sale. Maximum value to the seller.',
    },
  ];

  const n = narratives[step] || narratives[narratives.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded-md">
          STEP {step + 1} / {narratives.length}
        </span>
        {role === 'buyer' && <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">BUYER VIEW</span>}
        {role === 'agent' && <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">AGENT VIEW</span>}
        {role === 'owner' && <span className="text-[10px] font-mono text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">OWNER VIEW</span>}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{n.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{n.body}</p>
      <div className={`flex items-start gap-2 text-xs p-3 rounded-lg ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
        <FiAlertTriangle size={12} className="mt-0.5 flex-shrink-0 text-teal-500" />
        <span>{n.detail}</span>
      </div>
    </div>
  );
}

export default DemoPage;
