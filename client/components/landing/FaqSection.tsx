'use client';
import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  tag: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Why anchor audit results on-chain instead of keeping them off-chain?',
    answer:
      'On-chain anchoring creates immutable, tamper-proof provenance. Users, decentralized launchpads, DEX aggregators, and indexers can verify on-chain whether a contract bytecode was audited by an authorized auditor keypair before interacting with a protocol—without relying on centralized servers or untrusted PDF certificates.',
    tag: 'Ledger Provenance',
  },
  {
    question: 'How does Solace prevent false positives and hallucinations from AI models?',
    answer:
      'Solace uses a hybrid deterministic-and-generative approach. First, our static Abstract Syntax Tree (AST) engine validates specific Soroban compiler invariants (e.g., require_auth() checks, caller address isolation, extend_ttl() invocations). Gemini AI is then constrained to strictly typed JSON schemas that must pass AST cross-validation before being accepted.',
    tag: 'AST Invariants',
  },
  {
    question: 'What happens if a generative AI API has downtime?',
    answer:
      'Solace incorporates an adaptive multi-model fallback pipeline in our backend (aiAuditor.js) that automatically alternates between candidate models with exponential backoff retries. If an AI endpoint is unreachable, our deterministic AST rule engine continues evaluating critical authorization and storage rent invariants.',
    tag: 'Resilience',
  },
  {
    question: 'What is the protocol revenue and economic sustainability model?',
    answer:
      'Solace features a built-in on-chain micro-fee: a 1.0 XLM protocol fee is routed directly to the protocol treasury address during each on-chain audit anchor. This fee auto-funds the persistent storage rent longevity of solace_core on Stellar. In addition, automated CI/CD bots and multi-sig auditor signatures are offered for high-volume enterprise teams.',
    tag: 'Tokenomics',
  },
  {
    question: 'What Soroban vulnerabilities does Solace detect?',
    answer:
      'Solace inspects 6 primary threat categories: 1) Authorization bypasses and missing require_auth(), 2) Persistent storage rent expiration and TTL eviction, 3) Host panic crash traps like naked .unwrap() calls, 4) Unchecked arithmetic overflow/underflow, 5) Admin privilege escalation, and 6) Soroban 64KB bytecode limits and gas spikes.',
    tag: 'Coverage',
  },
  {
    question: 'How can I integrate Solace into my team’s GitHub workflow?',
    answer:
      'We offer an automated GitHub Action that triggers on every pull request targeting Soroban Rust contracts. The bot audits the PR diff, computes the delta in risk score, and comments inline remediation patches before code is merged to main.',
    tag: 'CI/CD Bot',
  },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="relative w-full py-16 sm:py-24">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold mb-3 shadow-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Everything You Need to Know
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Detailed answers regarding Solace's cryptographic provenance, AST invariant verification, and economic model for Stellar Soroban.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#111726] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-accent-subtle text-accent border border-accent/20 shrink-0 hidden sm:inline">
                      {faq.tag}
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                      {faq.question}
                    </span>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-accent text-white' : 'text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
