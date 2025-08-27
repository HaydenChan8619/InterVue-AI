'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type ReportSummary = {
  report_id: string;
  created_at: string;
  report_grade: string | null;
  report_details: any;
};

export default function DashboardPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);
  const [doneAnimations, setDoneAnimations] = useState<boolean[]>([]);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/reports');
        if (!res.ok) throw new Error('Failed to load reports');
        const data = await res.json();
        if (mounted) setReports(data.reports || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const numberPerPage = 5;
  const showMore = () => setVisibleCount((v) => Math.min(reports.length, v + numberPerPage));

  const containerVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        // slightly increased stagger so items don't all start at once
        staggerChildren: 0.2,
        delayChildren: 0.05,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { type: 'tween', ease: 'easeOut', duration: 0.3 } },
  } as const;

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 flex items-center justify-center">
      <div className="text-gray-600">Loading reports...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4">     
      <div className="max-w-4xl mx-auto pt-32 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-indigo-600 mb-3">My Reports</h1>
          <p className="text-xl text-slate-700">Your past interview reports</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {reports.length === 0 && (
            <div className="text-center text-slate-600">No reports yet — try a practice interview.</div>
          )}

          {reports.slice(0, visibleCount).map((r, idx) => (
            <motion.div
              key={r.report_id}
              variants={itemVariants}
              whileHover={
                  doneAnimations[idx]
                    ? {
                        scale: 1.02,
                        transition: { type: 'tween', ease: 'easeOut', duration: 0.2 },
                      }
                    : {}
                }
                onAnimationComplete={() => {
                  setDoneAnimations((prev) => {
                    const next = [...prev];
                    next[idx] = true;
                    return next;
                  });
                }}
              className="bg-white rounded-2xl shadow border border-indigo-100 overflow-hidden"
              layout
            >
              <button
                onClick={() => router.push(`/reports/${r.report_id}`)}
                className="w-full text-left p-4 flex items-center justify-between"
              >
                <div className="text-slate-700">
                  <div className="font-medium text-indigo-600">{formatDate(r.created_at)}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {r.report_details?.jobDescription
                      ? (
                        r.report_details.jobDescription.length > 80
                          ? r.report_details.jobDescription.slice(0, 80) + '...'
                          : r.report_details.jobDescription
                      )
                      : ''}
                  </div>
                </div>
                <div className={`text-xl font-bold rounded-full px-4 py-2 ${getGradeColor(r.report_grade ?? '')}`}>
                  {r.report_grade ?? '—'}
                </div>
              </button>
            </motion.div>
          ))}

          {visibleCount < reports.length && (
            <div className="flex justify-center pt-2">
              <button
                onClick={showMore}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium shadow hover:brightness-105"
              >
                Show more
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function getGradeColor(grade: string) {
  switch ((grade || '').toLowerCase()) {
    case 'a': return 'bg-green-100 text-green-800 border border-green-200';
    case 'b': return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'c': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'd': return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'f': return 'bg-red-100 text-red-800 border border-red-200';
    default: return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
}
