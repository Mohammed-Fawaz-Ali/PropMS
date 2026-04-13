import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, CheckCircle, Clock, MessageSquare, AlertCircle, TrendingUp, HandCoins, Download } from 'lucide-react';
import { getTickets, createTicket, updateTicket } from '../../api/tickets';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import SlideOver from '../../components/shared/SlideOver';

const TicketsList = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  
  const { data, isLoading } = useQuery({ queryKey: ['tickets'], queryFn: getTickets });

  const updateMut = useMutation({
      mutationFn: ({ id, params }) => updateTicket(id, params),
      onSuccess: () => {
          toast.success("Ticket updated & expense logged!");
          queryClient.invalidateQueries(['tickets']);
      }
  });

  const getStatusBadge = (status) => {
      switch(status) {
          case 'resolved': return <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Resolved</span>;
          case 'in_progress': return <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 w-fit"><TrendingUp className="w-3 h-3" /> In Progress</span>;
          default: return <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Open</span>;
      }
  };

  const [isRaising, setIsRaising] = useState(false);

  const raiseMut = useMutation({
      mutationFn: createTicket,
      onSuccess: () => {
          toast.success("Ticket submitted successfully!");
          setIsRaising(false);
          queryClient.invalidateQueries(['tickets']);
      }
  });

  const handleRaiseSubmit = (e) => {
      e.preventDefault();
      const title = e.target.title.value;
      const category = e.target.category.value;
      const priority = e.target.priority.value;
      const description = e.target.description.value;
      raiseMut.mutate({ title, category, priority, description });
  };

  const handleExportCSV = () => {
      if (!tickets || tickets.length === 0) return toast.error("No records to export");

      const headers = ["ID", "Title", "Unit", "Tenant", "Priority", "Category", "Status", "Cost", "Created At"];
      const rows = tickets.map(t => [
          t.id,
          t.title,
          `${t.unit?.unitNumber} - ${t.unit?.property?.name}`,
          t.tenant?.name,
          t.priority,
          t.category,
          t.status,
          t.cost || 0,
          new Date(t.createdAt).toLocaleDateString()
      ]);

      const csvContent = [
          headers.join(","),
          ...rows.map(e => e.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `PropMS_Maintenance_Export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Maintenance Log Exported!");
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Tickets...</div>;

  const tickets = data?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold tracking-tight text-text-primary">Maintenance Desk</h2>
           <p className="text-text-muted mt-1">Tenant maintenance requests, repairs, and auto-expense tracking.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleExportCSV} className="flex-1 md:flex-none border border-border bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Export Log
            </button>
            {user?.role === 'tenant' && (
                 <button onClick={() => setIsRaising(true)} className="flex-1 md:flex-none bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center justify-center gap-2">
                     <Wrench className="w-4 h-4" /> Raise Issue
                 </button>
            )}
        </div>
      </div>

      <SlideOver isOpen={isRaising} onClose={() => setIsRaising(false)} title="Submit Maintenance Request">
          <form onSubmit={handleRaiseSubmit} className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
                  <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                      Fill out the details below and your property owner will be notified immediately to schedule a repair.
                  </p>
              </div>

              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Issue Title</label>
                  <input name="title" required placeholder="e.g. Broken AC in Bedroom" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                      <select name="category" required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent bg-white">
                          <option value="plumbing">Plumbing</option>
                          <option value="electrical">Electrical</option>
                          <option value="appliance">Appliance</option>
                          <option value="carpentry">Carpentry</option>
                          <option value="cleaning">Cleaning</option>
                          <option value="other">Other</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                      <select name="priority" required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent bg-white">
                          <option value="medium">Medium</option>
                          <option value="high">High (Urgent)</option>
                          <option value="low">Low</option>
                          <option value="urgent">Urgent / Emergency</option>
                      </select>
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Detailed Description</label>
                  <textarea name="description" required placeholder="Please provide as much detail as possible to help us diagnose the issue..." className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 h-32 outline-none focus:ring-2 focus:ring-accent" />
              </div>

              <button disabled={raiseMut.isLoading} className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-lg text-sm font-bold shadow-md transition-all active:scale-[0.98] mt-4">
                  {raiseMut.isLoading ? 'Submitting...' : 'Submit Maintenance Ticket'}
              </button>
          </form>
      </SlideOver>

      <div className="grid grid-cols-1 gap-4">
          {tickets.length === 0 ? (
               <div className="bg-surface rounded-xl border border-border p-8 text-center text-slate-500">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-6 h-6 text-slate-400" /></div>
                   No active tickets. Everything is running smoothly!
               </div>
          ) : (
              tickets.map(ticket => (
                  <div key={ticket.id} className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm flex flex-col md:flex-row">
                      <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border">
                          <div className="flex justify-between items-start mb-3">
                              <h3 className="font-semibold text-lg text-text-primary">{ticket.title}</h3>
                              {getStatusBadge(ticket.status)}
                          </div>
                          <p className="text-slate-600 text-sm mb-4 leading-relaxed">{ticket.description || 'No description provided.'}</p>
                          
                          <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                             <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4 text-slate-400" /> Priority: <span className="capitalize text-slate-700">{ticket.priority}</span></span>
                             <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4 text-slate-400" /> Category: <span className="capitalize text-slate-700">{ticket.category}</span></span>
                          </div>

                          {ticket.resolutionNote && (
                              <div className="mt-4 p-4 bg-green-50/50 rounded-lg border border-green-100 text-sm text-green-900">
                                  <span className="font-semibold block mb-1">Resolution Note:</span>
                                  {ticket.resolutionNote}
                              </div>
                          )}
                      </div>

                      <div className="p-6 md:w-80 bg-slate-50 flex flex-col justify-between">
                          <div className="space-y-4 text-sm mb-6">
                              <div>
                                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Location / Unit</p>
                                  <p className="font-medium text-slate-800">{ticket.unit?.unitNumber} - {ticket.unit?.property?.name}</p>
                              </div>
                              <div>
                                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Requested By</p>
                                  <p className="font-medium text-slate-800">{ticket.tenant?.name}</p>
                                  <p className="text-slate-500">{ticket.tenant?.phone}</p>
                              </div>
                              {ticket.cost && (
                                  <div>
                                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Expensed Amount</p>
                                      <p className="font-bold text-danger">₹{Number(ticket.cost).toLocaleString()}</p>
                                  </div>
                              )}
                          </div>

                          {user?.role === 'owner' && ticket.status !== 'resolved' && (
                              <div className="pt-4 border-t border-slate-200 mt-auto space-y-3">
                                  {ticket.status === 'open' ? (
                                     <button 
                                        disabled={updateMut.isLoading}
                                        onClick={() => updateMut.mutate({ id: ticket.id, params: { status: 'in_progress' } })}
                                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                     >
                                         Start Work
                                     </button>
                                  ) : (
                                     <div className="space-y-3">
                                         <input id={`cost-${ticket.id}`} type="number" placeholder="Enter Repair Cost (₹)" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2" />
                                         <textarea id={`note-${ticket.id}`} placeholder="Resolution Notes..." className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 h-16" />
                                         <button 
                                            disabled={updateMut.isLoading}
                                            onClick={() => {
                                                const cost = document.getElementById(`cost-${ticket.id}`).value;
                                                const resolutionNote = document.getElementById(`note-${ticket.id}`).value;
                                                updateMut.mutate({ id: ticket.id, params: { status: 'resolved', cost, resolutionNote } });
                                            }}
                                            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex justify-center items-center gap-2"
                                         >
                                            <CheckCircle className="w-4 h-4" /> Mark Resolved
                                         </button>
                                         <p className="text-[10px] text-slate-400 text-center leading-tight">Cost automatically moves to Property Expense sheet</p>
                                     </div>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};

export default TicketsList;
