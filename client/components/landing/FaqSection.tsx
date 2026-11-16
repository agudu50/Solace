'use client';
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeading, container } from './primitives';

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
      'Solace uses a prepaid audit-credit bundle model: Starter (30 XLM for 3 audits), Growth (60 XLM for 6 audits), and Professional (90 XLM for 9 audits). Each payment is verified and recorded on-chain, routing XLM to the protocol treasury to fund persistent storage rent. Crucially, audit credits NEVER expire—users can consume them at their own pace without arbitrary monthly deadlines or recurring token deductions. Any newly purchased package adds to your existing balance.',
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

  return (
    <section id="faq" className="w-full py-20 sm:py-28 border-b border-slate-200 dark:border-white/10">
      <div className={`${container} grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16`}>
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="FAQ"
              title="Questions, answered"
              description="How Solace verifies, anchors and charges for audits on Stellar."
              className="mb-0 sm:mb-0"
            />
          </div>
        </div>

        <div className="lg:col-span-8 border-t border-slate-200 dark:border-white/10">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            const panelId = `faq-panel-${idx}`;
            return (
              <div key={faq.question} className="border-b border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full py-6 flex items-start justify-between gap-6 text-left cursor-pointer group"
                >
                  <span>
                    <span className="eyebrow block mb-2">{faq.tag}</span>
                    <span className="text-base sm:text-lg font-medium text-slate-900 dark:text-white group-hover:text-accent transition-colors">
                      {faq.question}
                    </span>
                  </span>
                  <Plus
                    className={`w-5 h-5 mt-6 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-45 text-accent' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-10 text-sm sm:text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
