import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, LayoutGrid, ArrowLeft, Plus, Trash2, IndianRupee } from 'lucide-react';
import api from '../../api/auth';
import { addAmenityItem, getAmenityItems, getMarketPricingTrend, removeAmenityItem } from '../../api/properties';
import MaintenanceInsightsPanel from '../../components/shared/MaintenanceInsightsPanel';

const PropertyDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: propertyData, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => api.get(`/properties/${id}`).then(res => res.data.data)
  });

  const [pricingTrend, setPricingTrend] = useState(null);
  const [amenityDraft, setAmenityDraft] = useState({ name: '', price: '', billing: 'monthly' });

  const { data: amenityItemsData } = useQuery({
    queryKey: ['property-amenity-items', id],
    queryFn: () => getAmenityItems(id).then(res => res.data),
    enabled: Boolean(id),
  });

  const amenityItems = amenityItemsData || [];
  const amenityTotals = useMemo(() => {
    const monthly = amenityItems
      .filter(i => i.billing === 'monthly')
      .reduce((sum, i) => sum + Number(i.price || 0), 0);
    const oneTime = amenityItems
      .filter(i => i.billing === 'one_time')
      .reduce((sum, i) => sum + Number(i.price || 0), 0);
    return { monthly, oneTime };
  }, [amenityItems]);

  const marketPricingMutation = useMutation({
    mutationFn: () => getMarketPricingTrend(id).then(res => res.data.data),
    onSuccess: (data) => {
      setPricingTrend(data);
    },
    onError: () => {
      setPricingTrend(null);
    }
  });

  const addAmenityMutation = useMutation({
    mutationFn: (payload) => addAmenityItem(id, payload).then(res => res.data),
    onSuccess: () => {
      setAmenityDraft({ name: '', price: '', billing: 'monthly' });
      queryClient.invalidateQueries(['property-amenity-items', id]);
    }
  });

  const removeAmenityMutation = useMutation({
    mutationFn: (amenityId) => removeAmenityItem(id, amenityId).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries(['property-amenity-items', id])
  });

  if (isLoading) return <div className="p-10 text-center animate-pulse">Loading property details...</div>;
  if (!propertyData) return <div className="p-10 text-center text-red-500">Property not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link to="/properties" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to List
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Basic Info */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{propertyData.name}</h2>
              <p className="text-slate-500 flex items-center gap-1.5 mt-1 text-sm">
                <MapPin className="w-4 h-4" /> {propertyData.address}, {propertyData.city}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Units Tracking</p>
                <div className="mt-2 flex items-baseline gap-2">
                   <p className="text-2xl font-black text-slate-900">{propertyData.units?.length || 0}</p>
                   <p className="text-xs text-slate-400">/ {propertyData.totalUnits} Total capacity</p>
                </div>
             </div>
             <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Estimated Revenue</p>
                <p className="mt-2 text-2xl font-black text-slate-900">₹{propertyData.units?.reduce((acc, u) => acc + Number(u.rentAmount), 0).toLocaleString()}</p>
             </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Property Amenities</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {propertyData.amenities?.length ? (
                propertyData.amenities.map(a => (
                  <span key={a} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                    {a}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">No property amenities selected yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Know Market Pricing</p>
                <p className="text-sm text-slate-600 mt-2">Fetch the current market trend for {propertyData.propertyType || 'this residence type'} in {propertyData.city}.</p>
              </div>
              <button
                onClick={() => marketPricingMutation.mutate()}
                disabled={marketPricingMutation.isLoading}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {marketPricingMutation.isLoading ? 'Checking...' : 'Know Market Pricing'}
              </button>
            </div>

            {pricingTrend ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">{pricingTrend.headline || 'Market Pricing Trend'}</p>
                <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                  <p><span className="font-semibold">Trend:</span> {pricingTrend.marketTrend || 'Unknown'}</p>
                  <p><span className="font-semibold">Suggested Range:</span> {pricingTrend.suggestedMarketRange || 'Not available'}</p>
                  <p><span className="font-semibold">Average Rent:</span> {pricingTrend.currentAverageRent ? `₹${Number(pricingTrend.currentAverageRent).toLocaleString()}/month` : 'N/A'}</p>
                  <p><span className="font-semibold">Residence Type:</span> {pricingTrend.residenceType || propertyData.propertyType || 'Unknown'}</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{pricingTrend.marketSummary}</p>
                <p className="text-sm font-medium text-slate-800">Recommendation: {pricingTrend.recommendedAction}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Click the button above to view the real market pricing trend for this area and residence type.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
               <LayoutGrid className="w-4 h-4 text-slate-400" /> Managed Units
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {propertyData.units?.map(unit => {
                  const activeTenancy = unit.tenancies?.[0];
                  const displayRent = activeTenancy?.monthlyRent ?? unit.rentAmount;
                  const displayDeposit = activeTenancy?.depositPaid ?? unit.depositAmount;
                  const isOccupied = unit.status === 'occupied';

                  return (
                  <Link 
                    key={unit.id} 
                    to={`/units/${unit.id}`}
                    className="border border-slate-100 rounded-xl p-4 hover:border-indigo-200 hover:bg-slate-50 transition-all group"
                  >
                     <div className="flex items-start justify-between gap-3">
                       <div className="min-w-0">
                         <p className="font-bold text-slate-900 truncate">Unit {unit.unitNumber}</p>
                         {activeTenancy?.tenant?.name ? (
                           <p className="mt-1 text-xs font-semibold text-slate-500 truncate">
                             Tenant: <span className="text-slate-700">{activeTenancy.tenant.name}</span>
                           </p>
                         ) : (
                           <p className="mt-1 text-xs font-semibold text-slate-400">
                             {isOccupied ? 'Occupied' : 'Vacant'}
                           </p>
                         )}
                       </div>
                       <span className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isOccupied ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                         {unit.status}
                       </span>
                     </div>

                     <div className="mt-4 grid grid-cols-2 gap-2">
                       <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rent</p>
                         <p className="mt-1 text-sm font-black text-indigo-700">
                           ₹{Number(displayRent || 0).toLocaleString()}
                           <span className="ml-1 text-[10px] font-bold text-slate-400">/mo</span>
                         </p>
                       </div>
                       <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deposit</p>
                         <p className="mt-1 text-sm font-black text-slate-700">
                           ₹{Number(displayDeposit || 0).toLocaleString()}
                         </p>
                       </div>
                     </div>

                     <p className="mt-3 text-xs text-slate-400 group-hover:text-indigo-600 transition-colors">
                       View unit details →
                     </p>
                  </Link>
                  );
               })}
            </div>
          </div>
        </div>

        {/* Right: AI Insights */}
        <div className="lg:w-96 space-y-6">
           <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
             <div className="flex items-start justify-between gap-4">
               <div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Amenity Pricing</h3>
                 <p className="mt-1 text-xs text-slate-500">
                   Add/remove amenities with prices. These also appear as <span className="font-semibold">Amenities expenses</span> in the dashboard.
                 </p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly total</p>
                 <p className="mt-1 text-base font-black text-emerald-700 flex items-center justify-end gap-1">
                   <IndianRupee className="w-4 h-4" /> {Number(amenityTotals.monthly || 0).toLocaleString()}
                 </p>
               </div>
             </div>

             <div className="mt-5 grid grid-cols-1 gap-3">
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Amenity</label>
                   <input
                     value={amenityDraft.name}
                     onChange={(e) => setAmenityDraft(d => ({ ...d, name: e.target.value }))}
                     placeholder="e.g., WiFi"
                     className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Price</label>
                   <input
                     value={amenityDraft.price}
                     onChange={(e) => setAmenityDraft(d => ({ ...d, price: e.target.value }))}
                     placeholder="e.g., 799"
                     type="number"
                     min="0"
                     step="1"
                     className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                   />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Billing</label>
                   <select
                     value={amenityDraft.billing}
                     onChange={(e) => setAmenityDraft(d => ({ ...d, billing: e.target.value }))}
                     className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                   >
                     <option value="monthly">Monthly</option>
                     <option value="one_time">One-time</option>
                   </select>
                 </div>
                 <div className="flex items-end">
                   <button
                     onClick={() => addAmenityMutation.mutate({ ...amenityDraft, price: Number(amenityDraft.price || 0) })}
                     disabled={addAmenityMutation.isPending || !amenityDraft.name.trim()}
                     className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                   >
                     <Plus className="w-4 h-4" /> Add
                   </button>
                 </div>
               </div>
             </div>

             <div className="mt-6">
               <div className="flex items-center justify-between mb-3">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saved amenities</p>
                 <p className="text-xs text-slate-400">
                   One-time total: ₹{Number(amenityTotals.oneTime || 0).toLocaleString()}
                 </p>
               </div>

               {amenityItems.length === 0 ? (
                 <div className="p-5 text-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                   No priced amenities yet.
                 </div>
               ) : (
                 <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                   {amenityItems.map(item => (
                     <div key={item.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                       <div className="min-w-0">
                         <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                         <p className="text-xs text-slate-500">
                           {item.billing === 'one_time' ? 'One-time' : 'Monthly'} · ₹{Number(item.price || 0).toLocaleString()}
                         </p>
                       </div>
                       <button
                         onClick={() => removeAmenityMutation.mutate(item.id)}
                         disabled={removeAmenityMutation.isPending}
                         className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                         title="Remove"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>

           <MaintenanceInsightsPanel propertyId={id} propertyName={propertyData.name} />
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
