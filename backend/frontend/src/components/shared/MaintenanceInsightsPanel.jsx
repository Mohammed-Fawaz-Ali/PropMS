import React, { useState } from 'react';
import { Brain, AlertTriangle, TrendingDown, Clock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/auth';
import toast from 'react-hot-toast';

const probabilityConfig = {
  high:   { color: 'bg-red-50 border-red-200 text-red-700',    dot: 'bg-red-500' },
  medium: { color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
  low:    { color: 'bg-slate-50 border-slate-200 text-slate-600', dot: 'bg-slate-400' },
};

const PredictionCard = ({ prediction }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = probabilityConfig[prediction.probability] || probabilityConfig.low;

  return (
    <div className={`border rounded-xl p-5 mb-3 transition-all ${cfg.color} ${expanded ? 'shadow-inner' : 'hover:shadow-sm'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 shadow-sm ${cfg.dot}`} />
          <div className="flex-1">
            <p className="text-sm font-bold leading-tight">{prediction.title}</p>
            <div className="flex flex-wrap items-center gap-4 mt-1.5">
              <span className="text-[10px] uppercase font-bold opacity-70 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {prediction.expectedTimeframe}
              </span>
              <span className="text-[10px] uppercase font-bold opacity-70">
                Units: {prediction.affectedUnits?.join(', ') || 'All Units'}
              </span>
              <span className="text-[10px] uppercase font-black tracking-widest bg-white/40 px-1.5 py-0.5 rounded border border-white/20">
                {prediction.category}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="opacity-40 hover:opacity-100 flex-shrink-0 bg-white/20 p-1 rounded-full transition-all">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 pl-6 animate-in slide-in-from-top-2 duration-300">
          <p className="text-xs opacity-90 leading-relaxed font-medium">✨ {prediction.reasoning}</p>
          
          <div className="bg-white/50 rounded-xl p-4 border border-white/30 backdrop-blur-sm">
            <p className="text-[10px] uppercase font-black text-indigo-800 mb-2">Preventive recommendation</p>
            <p className="text-xs opacity-90 font-semibold">{prediction.preventiveAction}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/40 p-3 rounded-lg border border-white/20">
                <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-tighter">Cost if ignored</p>
                <p className="text-sm font-black text-red-600">₹{prediction.estimatedCostIfIgnored?.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white/40 p-3 rounded-lg border border-white/20">
                <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-tighter">Cost to prevent</p>
                <p className="text-sm font-black text-emerald-600">₹{prediction.preventionCost?.toLocaleString('en-IN')}</p>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MaintenanceInsightsPanel = ({ propertyId, propertyName }) => {
  const [insights, setInsights] = useState(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/ai/maintenance-insights', { propertyId }).then(r => r.data.data),
    onSuccess: (data) => {
        setInsights(data);
        toast.success("Insights Refreshed!");
    },
    onError: () => toast.error('Analysis failed. Try later.')
  });

  const healthColor = insights
    ? insights.overallHealthScore >= 70 ? 'text-emerald-600'
    : insights.overallHealthScore >= 40 ? 'text-amber-600'
    : 'text-red-600'
    : 'text-slate-400';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center text-indigo-600">
             <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Predictive Maintenance</h3>
            <p className="text-xs text-slate-500 font-medium">AI Insights for {propertyName}</p>
          </div>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isPending}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" />
          {isPending ? 'Generating...' : 'Refresh AI'}
        </button>
      </div>

      {insights && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          {/* Health index card */}
          <div className="flex items-center gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-center w-24">
              <p className={`text-4xl font-black ${healthColor}`}>{insights.overallHealthScore}</p>
              <p className="text-[10px] text-slate-500 font-black uppercase">Health Index</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-700 font-bold leading-tight">{insights.summary}</p>
              {insights.seasonalAlert && (
                <div className="flex items-start gap-2 mt-3 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-snug">{insights.seasonalAlert}</p>
                </div>
              )}
            </div>
          </div>

          {/* Predictions feed */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Forecast — 60 Days</p>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">Ranked by Probability</span>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {insights.predictions?.map((p) => (
                <PredictionCard key={p.rank} prediction={p} />
              ))}
            </div>
          </div>

          {/* Red flag risks */}
          {insights.highCostRisks?.length > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <div className="p-2 bg-red-100 rounded-lg text-red-600"><TrendingDown className="w-5 h-5 mt-0.5" /></div>
              <div>
                <p className="text-[10px] font-black text-red-700 mb-1 uppercase tracking-widest">Financial Risk Alert</p>
                {insights.highCostRisks.map((r, i) => (
                  <p key={i} className="text-sm text-red-600 font-bold leading-snug italic">{r}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!insights && !isPending && (
        <div className="text-center py-20 px-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <Brain className="w-16 h-16 text-slate-200 mx-auto mb-4 animate-pulse" />
          <h4 className="text-base font-black text-slate-400 uppercase">Awaiting AI analysis</h4>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">Click Refresh AI to generate preventive insights based on your property's ticket history and current season.</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceInsightsPanel;
