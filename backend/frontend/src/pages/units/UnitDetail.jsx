import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Bed, Bath, Armchair, ArrowLeft, Tag, Info, IndianRupee } from 'lucide-react';
import api from '../../api/auth';
import RentSuggestionCard from '../../components/shared/RentSuggestionCard';

const UnitDetail = () => {
  const { id } = useParams();

  const { data: unit, isLoading } = useQuery({
    queryKey: ['unit', id],
    queryFn: () => api.get(`/units/${id}`).then(res => res.data.data)
  });

  if (isLoading) return <div className="p-10 text-center animate-pulse">Loading unit blueprint...</div>;
  if (!unit) return <div className="p-10 text-center text-red-500">Unit not found.</div>;

  const activeTenancy = unit.tenancies?.[0];
  const displayRent = activeTenancy?.monthlyRent ?? unit.rentAmount;
  const displayDeposit = activeTenancy?.depositPaid ?? unit.depositAmount;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link to={`/properties/${unit.propertyId}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Property
      </Link>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: Unit Specs */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
             <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${unit.status === 'vacant' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                   {unit.status}
                </span>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">ID: {unit.id.split('-')[0]}</p>
             </div>
             <h2 className="text-3xl font-black text-slate-900 mb-1">Unit {unit.unitNumber}</h2>
             <p className="text-slate-500 text-sm font-medium flex items-center gap-2"><LayoutGrid className="w-4 h-4" /> {unit.property?.name}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <p className="text-2xl font-black text-indigo-700">₹{Number(displayRent || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">/Mo</p>
                </div>
             </div>
             <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimension</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{unit.areaSqft || '0'} <span className="text-[10px] font-bold text-slate-400 opacity-70">SQFT</span></p>
             </div>
             <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Floor</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{unit.floor || 'G'}<span className="text-[10px] font-bold text-slate-400 opacity-70">FL</span></p>
             </div>
             <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Deposit</p>
                <p className="mt-2 text-xl font-black text-slate-600">₹{Number(displayDeposit || 0).toLocaleString()}</p>
             </div>
          </div>

          {activeTenancy?.tenant?.name && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Tenant</p>
              <p className="mt-2 text-base font-black text-slate-900">{activeTenancy.tenant.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                Lease rent: ₹{Number(activeTenancy.monthlyRent || 0).toLocaleString()} / month · Deposit paid: ₹{Number(activeTenancy.depositPaid || 0).toLocaleString()}
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-wrap gap-8">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Bed className="w-5 h-5" /></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Bedrooms</p>
                   <p className="text-base font-black text-slate-900">{unit.bedrooms} BHK</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Bath className="w-5 h-5" /></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Bathrooms</p>
                   <p className="text-base font-black text-slate-900">{unit.bathrooms}</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Armchair className="w-5 h-5" /></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Furnishing</p>
                   <p className="text-base font-black text-slate-900 capitalize">{unit.furnishing}</p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" /> Pricing & Charges
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rent (monthly)</p>
                  <p className="mt-2 text-lg font-black text-indigo-700 flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" /> {Number(displayRent || 0).toLocaleString()}
                  </p>
                  {activeTenancy?.monthlyRent && Number(activeTenancy.monthlyRent) !== Number(unit.rentAmount) && (
                    <p className="mt-1 text-xs text-slate-500">
                      Unit base rent: ₹{Number(unit.rentAmount || 0).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deposit</p>
                  <p className="mt-2 text-lg font-black text-slate-800 flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" /> {Number(displayDeposit || 0).toLocaleString()}
                  </p>
                  {activeTenancy?.depositPaid && Number(activeTenancy.depositPaid) !== Number(unit.depositAmount) && (
                    <p className="mt-1 text-xs text-slate-500">
                      Unit base deposit: ₹{Number(unit.depositAmount || 0).toLocaleString()}
                    </p>
                  )}
                </div>
             </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" /> Amenities Provided
             </h3>
             <div className="flex flex-wrap gap-2">
                {unit.amenities?.length > 0 ? (
                  unit.amenities.map(item => (
                    <span key={item} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">{item}</span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No specific unit amenities listed.</p>
                )}
             </div>
          </div>
        </div>

        {/* Right: AI Appraisal Engine */}
        <div className="xl:w-96 space-y-6">
           <RentSuggestionCard unitId={id} />
           <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 shadow-inner">
              <h4 className="text-[10px] font-black uppercase text-indigo-700 mb-3 tracking-widest flex items-center gap-1.5"><Tag className="w-4 h-4" /> Market Intelligence</h4>
              <p className="text-xs text-indigo-800/80 leading-relaxed font-medium">Use the AI Suggestion tool to baseline your rent against localized market data and unit specs. A 10% deviation in rent can reduce vacancy periods by up to 25%.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UnitDetail;
