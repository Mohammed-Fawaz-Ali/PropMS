import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/auth';
import toast from 'react-hot-toast';

const riskConfig = {
  low:       { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: ShieldCheck, label: 'Low risk' },
  moderate:  { color: 'text-amber-700 bg-amber-50 border-amber-200',       icon: Shield,      label: 'Moderate risk' },
  high:      { color: 'text-orange-700 bg-orange-50 border-orange-200',    icon: ShieldAlert, label: 'High risk' },
  very_high: { color: 'text-red-700 bg-red-50 border-red-200',             icon: ShieldX,     label: 'Very high risk' },
};

const ScoreBar = ({ label, score, maxScore, comment }) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1.5">
      <span className="text-xs font-medium text-slate-600 uppercase tracking-tighter">{label}</span>
      <span className="text-xs font-bold text-slate-900">{score}/{maxScore}</span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
      <div
        className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${(score / maxScore) * 100}%` }}
      />
    </div>
    <p className="text-[10px] text-slate-500 mt-1 italic">{comment}</p>
  </div>
);

const TenantRiskScore = ({ tenantId, unitId }) => {
  const [result, setResult] = useState(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/ai/tenant-risk', { tenantId, unitId }).then(r => r.data.data),
    onSuccess: (data) => {
        setResult(data);
        toast.success("Risk assessment completed.");
    },
    onError: () => toast.error('Risk assessment failed. Try later.')
  });

  const cfg = result ? riskConfig[result.riskLevel] : null;
  const Icon = cfg?.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Tenant Risk Index</h3>
          <p className="text-xs text-slate-500 mt-0.5">Automated AI-powered screening</p>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isPending}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-bold transition-all shadow-md disabled:opacity-60 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          {isPending ? 'Calculating...' : 'Run Assessment'}
        </button>
      </div>

      {!result && !isPending && (
          <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
              <Shield className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Score has not been generated for this profile yet.</p>
          </div>
      )}

      {result && cfg && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
          {/* Main Score UI */}
          <div className={`flex items-center gap-6 p-5 rounded-xl border-2 ${cfg.color}`}>
            <div className="text-center bg-white/40 rounded-full p-4 border border-white/40 shadow-sm w-20 h-20 flex flex-col justify-center">
              <p className="text-3xl font-black">{result.score}</p>
              <p className="text-[10px] font-bold opacity-70">/ 100</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-5 h-5" />
                <span className="text-base font-bold uppercase tracking-tight">{cfg.label}</span>
              </div>
              <p className="text-xs opacity-90 italic leading-tight">{result.verdict}</p>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-6">
            {Object.entries(result.scoreBreakdown).map(([key, val]) => (
              <ScoreBar
                key={key}
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                score={val.score}
                maxScore={val.maxScore}
                comment={val.comment}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl p-4 border-l-4 ${result.redFlags?.length > 0 ? 'bg-red-50 border-red-400' : 'bg-slate-50 border-slate-300'}`}>
              <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">🚩 Negative Factors</p>
              {result.redFlags?.length > 0 ? (
                  result.redFlags.map((f, i) => <p key={i} className="text-[11px] text-red-600 mb-1 leading-snug">• {f}</p>)
              ) : (
                  <p className="text-[11px] text-slate-400">No flags detected.</p>
              )}
            </div>
            <div className={`rounded-xl p-4 border-l-4 ${result.greenFlags?.length > 0 ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-300'}`}>
              <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">✅ Strengths</p>
              {result.greenFlags?.map((f, i) => <p key={i} className="text-[11px] text-emerald-600 mb-1 leading-snug">• {f}</p>)}
            </div>
          </div>

          {/* Recommendations Block */}
          {result.recommendations?.length > 0 && (
            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
              <p className="text-xs font-bold text-indigo-700 mb-2 uppercase tracking-wider">Expert Recommendations</p>
              {result.recommendations.map((r, i) => (
                <p key={i} className="text-[11px] text-indigo-800 mb-1.5 leading-relaxed bg-white/60 p-2 rounded border border-indigo-50">⚡ {r}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantRiskScore;
