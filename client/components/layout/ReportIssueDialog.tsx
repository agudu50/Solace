'use client';
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, MessageSquareWarning, X } from 'lucide-react';
import { reportIssue } from '../../utils/opsService';
import { useToast } from '../../context/ToastContext';
import { btn } from '../landing/primitives';

export interface ReportIssueDetail {
  title?: string;
  context?: string;
}

/** Opens the dialog from anywhere: `openReportIssue({ title, context })`. */
export function openReportIssue(detail: ReportIssueDetail = {}) {
  window.dispatchEvent(new CustomEvent<ReportIssueDetail>('solace:report-issue', { detail }));
}

const KINDS = [
  { value: 'bug', label: 'Something is broken' },
  { value: 'audit', label: 'Audit result looks wrong' },
  { value: 'payment', label: 'Payment or credits' },
  { value: 'account', label: 'Account or wallet' },
  { value: 'other', label: 'Other' },
];

const field =
  'w-full rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e0e0e] px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

export default function ReportIssueDialog() {
  const pathname = usePathname();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('bug');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('');
  const [sending, setSending] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<ReportIssueDetail>).detail || {};
      setTitle(d.title || '');
      setContext(d.context || '');
      setDescription('');
      setKind('bug');
      setOpen(true);
    };
    window.addEventListener('solace:report-issue', onOpen);
    return () => window.removeEventListener('solace:report-issue', onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => titleRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) return;
    setSending(true);
    try {
      await reportIssue({ title: title.trim(), description: description.trim() || undefined, kind, page: pathname || '/', context: context || undefined });
      setOpen(false);
      toast.success('Report sent', 'Thanks. An admin will look into it.');
    } catch (err) {
      toast.error(err, 'Could not send your report.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[105] grid place-items-center p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <motion.form
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            onSubmit={submit}
            initial={{ opacity: 0, y: 16, rotateX: 12 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: [0.165, 0.84, 0.44, 1] }}
            style={{ transformPerspective: 1000 }}
            className="w-full max-w-md rounded-[18px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161616] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent-subtle text-accent">
                  <MessageSquareWarning className="w-4 h-4" />
                </span>
                <div>
                  <h2 id="report-title" className="text-base font-medium text-slate-900 dark:text-white">
                    Report a problem
                  </h2>
                  <p className="text-xs text-slate-500">Goes straight to the Solace admin team.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid place-items-center w-8 h-8 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3.5">
              <div>
                <label htmlFor="report-what" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  What happened?
                </label>
                <input
                  id="report-what"
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                  minLength={3}
                  placeholder="e.g. Buy credits button does nothing"
                  className={`${field} h-10`}
                />
              </div>
              <div>
                <label htmlFor="report-kind" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Type
                </label>
                <select id="report-kind" value={kind} onChange={(e) => setKind(e.target.value)} className={`${field} h-10 cursor-pointer`}>
                  {KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="report-details" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Details <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="report-details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={4000}
                  rows={4}
                  placeholder="What were you trying to do? What did you expect?"
                  className={`${field} py-2 resize-none`}
                />
              </div>
              {context && (
                <p className="rounded-md bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-2.5 font-mono text-[10px] text-slate-500 break-words max-h-20 overflow-y-auto">
                  Attached: {context}
                </p>
              )}
              <p className="text-[11px] text-slate-500">We include the page you are on{context ? ' and the error above' : ''}. No contract code is sent.</p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>
                Cancel
              </button>
              <button type="submit" disabled={sending || title.trim().length < 3} className={btn.primary}>
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                Send report
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
