import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, CheckCircle, Clock, AlertCircle, FileText, Check, Download } from 'lucide-react';
import { getPayments, markAsPaid, issueBill, initRazorpay, verifyRazorpay } from '../../api/payments';
import { getTenants } from '../../api/tenants';
import api from '../../api/auth';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import SlideOver from '../../components/shared/SlideOver';
const PaymentsPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  
  const { data, isLoading } = useQuery({ queryKey: ['payments'], queryFn: getPayments });
  const { data: tenantsData } = useQuery({ 
      queryKey: ['tenants'], 
      queryFn: getTenants,
      enabled: user?.role === 'owner'
  });

  const markPaidMut = useMutation({
      mutationFn: ({ id, method }) => markAsPaid(id, { paymentMethod: method }),
      onSuccess: () => {
          toast.success("Payment marked as paid!");
          queryClient.invalidateQueries(['payments']);
      }
  });

  const tenantMockMut = useMutation({
      mutationFn: async (id) => await api.put(`/payments/${id}/mock-pay`),
      onSuccess: () => {
          toast.success("Test Payment Mock Processed!");
          queryClient.invalidateQueries(['payments']);
      }
  });

  const [issueForm, setIssueForm] = useState({ tenancyId: '', amount: '', dueDate: '', forMonth: '' });
  const selectedTenancy = tenantsData?.data?.find(t => t.id === issueForm.tenancyId);

  const calculateDueDateFromForMonth = (forMonth, dueDay) => {
      if (!forMonth) return '';
      const baseDate = new Date(`${forMonth}-01`);
      const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
      const maxDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
      const day = Math.min(Number(dueDay || baseDate.getDate()), maxDay);
      nextMonth.setDate(day);
      return nextMonth.toISOString().slice(0, 10);
  };

  const updateIssueForm = (field, value) => {
      const selected = field === 'tenancyId'
          ? tenantsData?.data?.find(t => t.id === value)
          : selectedTenancy;

      setIssueForm(prev => {
          const next = { ...prev, [field]: value };
          if (field === 'forMonth' && next.tenancyId) {
              const rentDueDay = selected?.rentDueDay ?? new Date(selected?.leaseStart).getDate();
              next.dueDate = calculateDueDateFromForMonth(value, rentDueDay);
          }
          if (field === 'tenancyId' && next.forMonth) {
              const rentDueDay = selected?.rentDueDay ?? new Date(selected?.leaseStart).getDate();
              next.dueDate = calculateDueDateFromForMonth(next.forMonth, rentDueDay);
          }
          return next;
      });
  };

  // Load Razorpay Script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const [paymentLoading, setPaymentLoading] = useState(false);

  const handlePayment = async (payment) => {
    setPaymentLoading(true);
    const res = await loadRazorpay();

    if (!res) {
      toast.error("Razorpay SDK failed to load. Are you online?");
      setPaymentLoading(false);
      return;
    }

    try {
      const orderRes = await initRazorpay(payment.id);
      if (!orderRes.success) {
        toast.error(orderRes.message);
        setPaymentLoading(false);
        return;
      }

      const { orderId, amount, currency, key } = orderRes.data;

      const options = {
        key,
        amount,
        currency,
        name: "PropMS Payment",
        description: `Rent for ${new Date(payment.forMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await verifyRazorpay(payment.id, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              toast.success("Payment successful! Receipt generated.");
              queryClient.invalidateQueries(['payments']);
            } else {
              toast.error(verifyRes.message);
            }
          } catch {
            toast.error("Verification failed");
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.personalEmail || user.email,
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch {
      toast.error("Failed to initiate payment");
      setPaymentLoading(false);
    }
  };

  const [isIssuing, setIsIssuing] = useState(false);

  const issueMut = useMutation({
      mutationFn: issueBill,
      onSuccess: () => {
          toast.success("Rent Bill Issued successfully!");
          setIsIssuing(false);
          queryClient.invalidateQueries(['payments']);
      }
  });

  const handleIssueSubmit = (e) => {
      e.preventDefault();
      issueMut.mutate({
          tenancyId: issueForm.tenancyId,
          amount: issueForm.amount,
          dueDate: issueForm.dueDate,
          forMonth: issueForm.forMonth ? `${issueForm.forMonth}-01` : ''
      });
  };

  const handleExportCSV = () => {
      if (!data?.data || data.data.length === 0) return toast.error("No records to export");

      const headers = ["ID", "Tenant", "Unit", "Property", "Amount", "Status", "For Month", "Due Date", "Paid Date", "Receipt"];
      const rows = data.data.map(p => [
          p.id,
          p.tenancy?.tenant?.name,
          p.tenancy?.unit?.unitNumber,
          p.tenancy?.unit?.property?.name,
          p.amount,
          p.status,
          p.forMonth ? new Date(p.forMonth).toLocaleDateString() : 'N/A',
          new Date(p.dueDate).toLocaleDateString(),
          p.paidDate ? new Date(p.paidDate).toLocaleDateString() : 'N/A',
          p.receiptNumber || 'N/A'
      ]);

      const csvContent = [
          headers.join(","),
          ...rows.map(e => e.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `PropMS_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Ledger Exported successfully!");
  };

  const getStatusBadge = (status) => {
      switch(status) {
          case 'paid': return <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Paid</span>;
          case 'overdue': return <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Overdue</span>;
          default: return <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>;
      }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Ledger...</div>;

  const payments = data?.data || [];
  const today = new Date();
  const beforeTodayPayments = payments.filter((p) => {
      if (!p?.dueDate) return false;
      const due = new Date(p.dueDate);
      return due <= today;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold tracking-tight text-text-primary">Financial Ledger</h2>
           <p className="text-text-muted mt-1">Track all your scheduled payments, overdue amounts, and active receipts. Auto-generated rent bills use the tenant's rent due day and lease start details.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleExportCSV} className="flex-1 md:flex-none border border-border bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Export Ledger
            </button>
            {user?.role === 'owner' && (
                <button onClick={() => setIsIssuing(true)} className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                    + Issue Rent Bill
                </button>
            )}
        </div>
      </div>

      <SlideOver isOpen={isIssuing} onClose={() => setIsIssuing(false)} title="Issue Rent Bill">
          <form onSubmit={handleIssueSubmit} className="space-y-6">
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Active Tenant</label>
                  <select
                      name="tenancyId"
                      value={issueForm.tenancyId}
                      onChange={(e) => updateIssueForm('tenancyId', e.target.value)}
                      required
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent outline-none"
                  >
                      <option value="">-- Choose Tenant --</option>
                      {tenantsData?.data?.map(t => (
                          <option key={t.id} value={t.id}>
                              {t.tenant?.name} ({t.unit?.unitNumber} - {t.unit?.property?.name})
                          </option>
                      ))}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-400">Only tenants with active leases are shown here.</p>
              </div>
              
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Billing Amount (₹)</label>
                  <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                      <input
                          type="number"
                          name="amount"
                          value={issueForm.amount}
                          onChange={(e) => updateIssueForm('amount', e.target.value)}
                          required
                          placeholder="15000"
                          className="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                      />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Billing Month</label>
                      <input
                          type="month"
                          name="forMonth"
                          value={issueForm.forMonth}
                          onChange={(e) => updateIssueForm('forMonth', e.target.value)}
                          required
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent"
                      />
                      <p className="mt-1 text-[10px] text-slate-400">Select the month for which this bill applies.</p>
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Due Date</label>
                      <input
                          type="date"
                          name="dueDate"
                          value={issueForm.dueDate}
                          onChange={(e) => updateIssueForm('dueDate', e.target.value)}
                          required
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent"
                      />
                      <p className="mt-1 text-[10px] text-slate-400">
                          Default shown from the selected tenancy rent due day and billing month.
                      </p>
                  </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mt-6">
                  <p className="text-xs text-indigo-700 leading-relaxed">
                      <span className="font-bold">Note:</span> Issuing a bill will immediately notify the tenant via Email and In-App notification. They will be able to pay via UPI or Card instantly.
                  </p>
              </div>

              <button disabled={issueMut.isLoading} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg text-sm font-bold shadow-md transition-all active:scale-[0.98] mt-4">
                  {issueMut.isLoading ? 'Processing...' : 'Generate and Send Bill'}
              </button>
          </form>
      </SlideOver>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 border-b border-border">
                      <tr>
                          <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Tenant</th>
                          <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Unit</th>
                          <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">For Month</th>
                          <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Due Date</th>
                          <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-right">Receipt / Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {beforeTodayPayments.length === 0 ? (
                         <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400">No payment records found for due dates before today.</td></tr>
                     ) : (
                         beforeTodayPayments.map((p) => (
                             <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-6 py-4 font-medium text-slate-800">{p.tenancy?.tenant?.name}</td>
                                 <td className="px-6 py-4 text-slate-600">{p.tenancy?.unit?.unitNumber} - {p.tenancy?.unit?.property?.name}</td>
                                 <td className="px-6 py-4 text-slate-600">{p.forMonth ? new Date(p.forMonth).toLocaleString('default', { month: 'long', year: 'numeric'}) : 'N/A'}</td>
                                 <td className="px-6 py-4 font-semibold text-slate-800">₹{Number(p.amount).toLocaleString()}</td>
                                 <td className="px-6 py-4 text-slate-500">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'Not set'}</td>
                                 <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                                 <td className="px-6 py-4 text-right">
                                     {p.status === 'paid' ? (
                                         <div className="inline-flex gap-2 items-center text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                            <FileText className="w-3 h-3 text-accent" /> {p.receiptNumber}
                                         </div>
                                     ) : (
                                         user?.role === 'owner' ? (
                                             <div className="inline-flex gap-2 items-center">
                                                 <select id={`method-${p.id}`} className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-accent">
                                                     <option value="cash">Cash</option>
                                                     <option value="upi">UPI</option>
                                                     <option value="bank_transfer">Bank Transfer</option>
                                                     <option value="card">Card</option>
                                                 </select>
                                                 <button 
                                                    disabled={markPaidMut.isLoading}
                                                    onClick={() => {
                                                        const method = document.getElementById(`method-${p.id}`).value;
                                                        markPaidMut.mutate({ id: p.id, method });
                                                    }}
                                                    className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                                                 >
                                                    <Check className="w-3 h-3" /> Mark Paid
                                                 </button>
                                             </div>
                                         ) : (
                                            <div className="inline-flex gap-2">
                                                <button 
                                                   disabled={tenantMockMut.isLoading || paymentLoading}
                                                   onClick={() => tenantMockMut.mutate(p.id)}
                                                   className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                                                >
                                                   Test Pay
                                                </button>
                                                <button 
                                                   disabled={paymentLoading || tenantMockMut.isLoading}
                                                   onClick={() => handlePayment(p)}
                                                   className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                                                >
                                                   Pay via Razorpay
                                                </button>
                                            </div>
                                         )
                                     )}
                                 </td>
                             </tr>
                         ))
                     )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
