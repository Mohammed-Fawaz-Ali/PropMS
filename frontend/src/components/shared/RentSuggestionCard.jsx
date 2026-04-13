import React, { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/auth';
import toast from 'react-hot-toast';

const RentSuggestionCard = ({ unitId }) => {
  const [suggestion, setSuggestion] = useState(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/ai/rent-suggestion', { unitId }).then(r => r.data.data),
    onSuccess: (data) => {
        setSuggestion(data);
        toast.success("Pricing suggested successfully!");
    },
    onError: () => toast.error('AI analysis failed. Please try again in a moment.')
  });

  const positionIcon = {
    below_market: <TrendingDown className="w-4 h-4 text-emerald-600" />,
    at_market: <Minus className="w-4 h-4 text-amber-600" />,
    above_market: <TrendingUp className="w-4 h-4 text-red-600" />,
  };

  const positionLabel = {
    below_market: { text: 'Below market — you can charge more', color: 'text-emerald-600 bg-emerald-50' },
    at_market: { text: 'At market rate', color: 'text-amber-600 bg-amber-50' },
    above_market: { text: 'Above market — may cause vacancy', color: 'text-red-600 bg-red-50' },
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">AI Rent Pricing</h3>
          <p className="text-xs text-slate-500 mt-0.5">Powered by Gemini Pro</p>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isPending}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          {isPending ? 'Analyzing...' : 'Get Suggestion'}
        </button>
      </div>

      {suggestion && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Rent range */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Minimum', value: suggestion.minRent, color: 'bg-slate-50' },
              { label: 'Recommended', value: suggestion.recommendedRent, color: 'bg-indigo-50 border border-indigo-200' },
              { label: 'Maximum', value: suggestion.maxRent, color: 'bg-slate-50' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} rounded-lg p-3 text-center`}>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{label}</p>
                <p className="text-base font-bold text-slate-900">
                  ₹{value.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          {/* Market position badge */}
          {suggestion.marketPosition && (
            <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${positionLabel[suggestion.marketPosition]?.color}`}>
              {positionIcon[suggestion.marketPosition]}
              {positionLabel[suggestion.marketPosition]?.text}
            </div>
          )}

          {/* Reasoning */}
          <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-indigo-100 pl-3">{suggestion.reasoning}</p>

          {/* Factors */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-tight">Key Factors</p>
            <ul className="space-y-1">
              {suggestion.factors?.map((f, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">•</span> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Tip */}
          {suggestion.tip && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <p className="text-xs font-bold text-amber-700">💡 Owner Tip</p>
              <p className="text-xs text-amber-600 mt-0.5">{suggestion.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RentSuggestionCard;
