import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Building2, CreditCard, Wrench, Clock, AlertTriangle, Wallet, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDashboardData } from '../../api/dashboard';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, subinfo }) => (
  <div className="bg-surface rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
       <Icon className="w-16 h-16" />
    </div>
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-accent" />
      </div>
    </div>
    <h3 className="text-text-muted text-sm font-medium relative z-10">{title}</h3>
    <p className="text-2xl font-bold text-text-primary mt-1 relative z-10">{value}</p>
    {subinfo && <p className="text-xs text-slate-400 mt-2 relative z-10">{subinfo}</p>}
  </div>
);

const Dashboard = () => {
  const { data: qData, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardData });

  if (isLoading) return <div className="p-8 text-slate-500 animate-pulse">Computing real-time dashboard...</div>;

  const data = qData?.data;
  if (!data) return <div className="p-8 text-red-500">Failed to load dashboard data.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Morning Briefing</h2>
        <p className="text-text-muted mt-1">Real-time overview of your property metrics across all portfolios.</p>
      </div>

      {/* Primary Metrics Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="This Month Revenue" value={`₹${data.monthlyRevenue.toLocaleString()}`} icon={CreditCard} subinfo="Collections marked 'Paid' this month" />
        <StatCard title="Total Owned Units" value={data.totalUnits} icon={Building2} subinfo="Active units generating scope" />
        <StatCard title="Occupancy Rate" value={`${data.totalUnits > 0 ? Math.round((data.occupiedCount/data.totalUnits)*100) : 0}%`} icon={Users} subinfo={`${data.vacancyRate}% Vacancy (${data.totalUnits - data.occupiedCount} units empty)`} />
        <StatCard title="Overdue Rent" value={`${data.overdueCount} Pending`} icon={Clock} subinfo="Payments past their due date" />
      </div>

      {/* Expenses snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="This Month Expenses"
          value={`₹${Number(data.totalExpensesThisMonth || 0).toLocaleString()}`}
          icon={Wallet}
          subinfo="All recorded expenses this month"
        />
        <StatCard
          title="Amenities Expense"
          value={`₹${Number(data.amenitiesExpensesThisMonth || 0).toLocaleString()}`}
          icon={Sparkles}
          subinfo="From priced amenities you add"
        />
        <StatCard
          title="Repairs & Maintenance"
          value={`₹${Number(data.repairsExpensesThisMonth || 0).toLocaleString()}`}
          icon={Wrench}
          subinfo="Repairs/maintenance/renovation categories"
        />
        <StatCard
          title="Ticket Cost (This Month)"
          value={`₹${Number(data.ticketCostThisMonth || 0).toLocaleString()}`}
          icon={Wrench}
          subinfo="Sum of maintenance ticket costs entered"
        />
      </div>
      
      {/* Secondary Data visual layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Graphical Layer */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-5 shadow-sm h-[400px] flex flex-col">
           <h3 className="font-semibold text-text-primary mb-6 flex items-center justify-between">
              Revenue Tracking 
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">Last 6 Months</span>
           </h3>
           <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} dx={-10} />
                        <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val) => `₹${val.toLocaleString()}`} />
                        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                            {data.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === data.chartData.length - 1 ? '#4F46E5' : '#94A3B8'} />
                            ))}
                        </Bar>
                    </BarChart>
               </ResponsiveContainer>
           </div>
        </div>

        {/* Action Required Overdue Feed */}
        <div className="bg-surface rounded-xl border border-border p-0 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-red-50/30">
               <h3 className="font-semibold text-danger flex items-center justify-between">
                  Action Required
                  <AlertTriangle className="w-4 h-4" />
               </h3>
               <p className="text-xs text-slate-500 mt-1">Tenants currently overdue</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {data.overduePayments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm h-full flex items-center justify-center">No overdue payments. Great!</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {data.overduePayments.map(pay => (
                            <div key={pay.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start">
                                   <div>
                                       <p className="font-medium text-sm text-slate-800">{pay.tenancy?.tenant?.name}</p>
                                       <p className="text-xs text-slate-500">Unit: {pay.tenancy?.unit?.unitNumber}</p>
                                   </div>
                                   <div className="text-right">
                                       <p className="font-bold text-sm text-danger">₹{Number(pay.amount).toLocaleString()}</p>
                                       <p className="text-xs text-slate-400">{new Date(pay.dueDate).toLocaleDateString()}</p>
                                   </div>
                                </div>
                                <Link to="/payments" className="block mt-3 text-center text-xs font-medium text-accent hover:text-accent-hover bg-indigo-50 py-2 rounded-md">View Ledger</Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

      </div>

      {/* Tickets layer row */}
      {data.recentTickets.length > 0 && (
         <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-slate-400" /> Recent Maintenance Activity
                 </h3>
                 <Link to="/tickets" className="text-sm font-medium text-accent hover:underline">View All Helpdesk</Link>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 text-slate-500">
                         <tr>
                             <th className="px-4 py-3 font-medium rounded-tl-lg">Ticket</th>
                             <th className="px-4 py-3 font-medium">Unit</th>
                             <th className="px-4 py-3 font-medium">Tenant</th>
                             <th className="px-4 py-3 font-medium">Status</th>
                             <th className="px-4 py-3 font-medium rounded-tr-lg">Created</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {data.recentTickets.map(ticket => (
                             <tr key={ticket.id} className="hover:bg-slate-50">
                                 <td className="px-4 py-3 font-medium text-slate-700">{ticket.title}</td>
                                 <td className="px-4 py-3 text-slate-600">{ticket.unit?.unitNumber}</td>
                                 <td className="px-4 py-3 text-slate-600">{ticket.tenant?.name}</td>
                                 <td className="px-4 py-3">
                                     <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${ticket.status === 'open' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                        {ticket.status.toUpperCase()}
                                     </span>
                                 </td>
                                 <td className="px-4 py-3 text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         </div>
      )}
    </div>
  );
};

export default Dashboard;
