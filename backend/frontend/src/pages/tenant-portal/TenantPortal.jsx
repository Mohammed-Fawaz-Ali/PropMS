import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyTenancy, signLease } from '../../api/tenants';
import { Building2, Calendar, CreditCard, ShieldCheck, PenTool, ExternalLink, TicketPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const TenantPortal = () => {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ['my-tenancy'], queryFn: getMyTenancy });

    const signMutation = useMutation({
        mutationFn: signLease,
        onSuccess: () => {
            toast.success("Welcome! Your lease terms have been accepted.");
            queryClient.invalidateQueries(['my-tenancy']);
        }
    });

    const tenancy = data?.data;

    if (isLoading) return <div className="p-8 text-slate-500 animate-pulse">Loading portal...</div>;

    if (!tenancy) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <Building2 className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-text-primary">No Active Unit Assigned</h2>
                <p className="text-text-muted mt-2 max-w-sm">Your owner has not assigned you to a property unit yet. Once assigned, your lease specifics will appear here.</p>
            </div>
        );
    }

    if (!tenancy.isLeaseSigned) {
        return (
            <div className="max-w-2xl mx-auto mt-10">
                <div className="bg-surface border border-border shadow-md rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PenTool className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Pending E-Signature</h2>
                    <p className="text-slate-600 mb-8 max-w-lg mx-auto">
                        Welcome to {tenancy.unit.property.name}! Before accessing your portal, you must review and digitally accept the terms of stay provided by your landlord.
                    </p>

                    <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-200 flex flex-col gap-4 text-left">
                        <h4 className="font-semibold text-slate-800">Your Agreement Brief:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <p><span className="text-slate-500">Unit:</span> <b>{tenancy.unit.unitNumber}</b></p>
                            <p><span className="text-slate-500">Rent:</span> <b>₹{Number(tenancy.monthlyRent).toLocaleString()}</b></p>
                            <p><span className="text-slate-500">Starts:</span> <b>{new Date(tenancy.leaseStart).toLocaleDateString()}</b></p>
                        </div>
                        {tenancy.masterLeaseUrl ? (
                            <a href={tenancy.masterLeaseUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-300 rounded-lg text-accent font-semibold hover:bg-slate-50 transition-colors">
                                <ExternalLink className="w-5 h-5" /> View Full Document
                            </a>
                        ) : (
                            <div className="text-amber-700 bg-amber-50 p-3 rounded text-xs border border-amber-200">
                                No master lease document attached by owner. You agree to standard tenancy rules.
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => signMutation.mutate()}
                        disabled={signMutation.isLoading}
                        className="w-full bg-accent hover:bg-accent-hover text-white text-lg font-semibold py-4 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        {signMutation.isLoading ? 'Signing...' : 'I Accept & E-Sign Document'}
                    </button>
                    <p className="text-xs text-slate-400 mt-4">By clicking accept, this date and your user ID gets digitally logged as consent to the lease rules above.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-text-primary mb-1">Welcome Home, {tenancy.tenant?.name?.split(' ')[0]}</h2>
                    <p className="text-text-muted">{tenancy.unit?.property?.name} • Unit {tenancy.unit?.unitNumber}</p>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-medium border border-green-200">
                    <ShieldCheck className="w-5 h-5" /> Lease Active
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
                        <CreditCard className="absolute top-8 right-8 w-24 h-24 text-white/5" />
                        <h3 className="text-indigo-200 font-medium mb-1">Upcoming Payment</h3>
                        <p className="text-5xl font-bold mb-6">₹{Number(tenancy.monthlyRent).toLocaleString()}</p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 flex-1">
                                <p className="text-xs text-indigo-200 uppercase tracking-widest font-semibold mb-1">Due Date</p>
                                <p className="font-medium text-lg">Day {tenancy.rentDueDay} of Month</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 flex-1">
                                <p className="text-xs text-indigo-200 uppercase tracking-widest font-semibold mb-1">Deposit Retained</p>
                                <p className="font-medium text-lg">₹{Number(tenancy.depositPaid).toLocaleString()}</p>
                            </div>
                        </div>

                        <button className="bg-white text-indigo-950 font-bold py-3 px-8 rounded-lg hover:bg-indigo-50 transition-colors w-full sm:w-auto shadow-sm">
                            Pay Rent Now
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center text-center gap-3 py-10">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <h4 className="font-semibold text-slate-800">Payment History</h4>
                         </div>
                         <div className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center text-center gap-3 py-10">
                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                                <TicketPlus className="w-6 h-6" />
                            </div>
                            <h4 className="font-semibold text-slate-800">Raise Ticket</h4>
                         </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-surface rounded-xl border border-border p-6">
                        <h3 className="font-semibold text-text-primary border-b border-border pb-3 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-accent" /> Property Details
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-muted">Type:</span>
                                <span className="font-medium text-slate-800 capitalize">{tenancy.unit?.property?.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">Unit:</span>
                                <span className="font-medium text-slate-800">{tenancy.unit?.unitNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">Floor:</span>
                                <span className="font-medium text-slate-800">{tenancy.unit?.floor}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">Property Name:</span>
                                <span className="font-medium text-slate-800">{tenancy.unit?.property?.name}</span>
                            </div>
                        </div>

                        {tenancy.masterLeaseUrl && (
                             <a href={tenancy.masterLeaseUrl} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-accent font-medium hover:bg-slate-100 transition-colors text-sm">
                                 <ExternalLink className="w-4 h-4" /> View Lease Document
                             </a>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};

export default TenantPortal;
