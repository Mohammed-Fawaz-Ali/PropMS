import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, Phone, Mail, Briefcase, MapPin, ArrowLeft, ShieldCheck, FileText, CheckCircle, Clock } from 'lucide-react';
import api from '../../api/auth';
import TenantRiskScore from '../../components/shared/TenantRiskScore';

const TenantProfile = () => {
  const { id } = useParams();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => api.get(`/tenants/${id}`).then(res => res.data.data)
  });

  if (isLoading) return <div className="p-10 text-center animate-pulse">Loading tenant profile...</div>;
  if (!tenant) return <div className="p-10 text-center text-red-500">Tenant not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link to="/tenants" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </Link>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: Tenant Identity & Employment */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
               <div className="absolute -bottom-6 left-6 w-20 h-20 bg-white rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-slate-400">
                  <User className="w-10 h-10" />
               </div>
            </div>
            <div className="pt-10 pb-6 px-6">
               <h2 className="text-2xl font-black text-slate-900">{tenant.tenant?.name}</h2>
               <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium"><Mail className="w-4 h-4" /> {tenant.tenant?.email}</span>
                  <span className="flex items-center gap-1.5 font-medium"><Phone className="w-4 h-4" /> {tenant.tenant?.phone || 'No phone'}</span>
                  <span className="flex items-center gap-1.5 font-medium"><MapPin className="w-4 h-4" /> {tenant.unit?.property?.city}</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Employment Info */}
             <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-4">
                   <Briefcase className="w-4 h-4 text-slate-400" /> Professional Footprint
                </h3>
                <div className="space-y-4">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Employment Status</p>
                      <p className="font-bold text-slate-800 capitalize">{tenant.tenant?.employmentType || 'Unspecified'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Current Employer</p>
                      <p className="font-bold text-slate-800">{tenant.tenant?.employerName || 'Self-employed / Private'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Monthly Income</p>
                      <p className="font-bold text-emerald-600">₹{Number(tenant.tenant?.monthlyIncome || 0).toLocaleString()}</p>
                   </div>
                </div>
             </div>

             {/* Lease Summary */}
             <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-4">
                   <FileText className="w-4 h-4 text-slate-400" /> Tenancy Pulse
                </h3>
                <div className="space-y-4">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Current Unit</p>
                      <p className="font-bold text-slate-800">{tenant.unit?.unitNumber} - {tenant.unit?.property?.name}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Monthly Rent</p>
                      <p className="font-bold text-indigo-600">₹{Number(tenant.monthlyRent).toLocaleString()}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Status</p>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${tenant.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{tenant.status}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Safety Deposit</p>
                        <p className="font-bold text-slate-800">₹{Number(tenant.depositPaid).toLocaleString()}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Payment Snapshot */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Financial History Snapshot</h3>
                <Link to="/payments" className="text-[10px] font-bold text-accent uppercase hover:underline">Full Ledger →</Link>
             </div>
             <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                   <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                   <p className="text-lg font-black text-slate-900">{tenant.payments?.filter(p => p.status === 'paid').length || 0}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">Paid Bills</p>
                </div>
                <div className="text-center">
                   <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                   <p className="text-lg font-black text-slate-900">{tenant.payments?.filter(p => p.status === 'pending').length || 0}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">Pending</p>
                </div>
                <div className="text-center">
                   <ShieldCheck className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                   <p className="text-lg font-black text-slate-900">100%</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">On-time rate</p>
                </div>
                <div className="text-center">
                   <Briefcase className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                   <p className="text-lg font-black text-slate-900">{((tenant.tenant?.monthlyIncome || 0) / (tenant.monthlyRent || 1)).toFixed(1)}x</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">Rent Coverage</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right: AI Risk Engine */}
        <div className="xl:w-[420px] space-y-6">
           <TenantRiskScore tenantId={tenant.tenant?.id} unitId={tenant.unit?.id} />
        </div>
      </div>
    </div>
  );
};

export default TenantProfile;
