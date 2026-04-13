import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Download, Plus, Mail, Phone, Home, Calendar, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import SlideOver from '../../components/shared/SlideOver';
import AddTenantForm from '../../components/shared/AddTenantForm';
import EditTenantForm from '../../components/shared/EditTenantForm';
import { getTenants, deleteTenant } from '../../api/tenants';

const TenantsList = () => {
  const queryClient = useQueryClient();
  const [isAddOpen, setAddOpen] = useState(false);
  const [editingTenancy, setEditingTenancy] = useState(null);

  const { data, isLoading } = useQuery({
      queryKey: ['tenants'],
      queryFn: getTenants
  });

  console.log('Tenants Query Data:', data);

  const handleDelete = async (id) => {
      if (window.confirm('Are you ABSOLUTELY sure you want to end this tenancy? This will cascade remove all payment history and tickets.')) {
          try {
              await deleteTenant(id);
              toast.success('Tenant successfully removed');
              queryClient.invalidateQueries(['tenants']);
          } catch(err) {
              toast.error('Failed to remove tenant');
          }
      }
  };

  const handleExportCSV = () => {
      if (!data?.data || data.data.length === 0) return toast.error("No tenants to export");
      const headers = ["ID", "Name", "Email", "Phone", "Property", "Unit", "Lease Start", "Status"];
      const rows = data.data.map(t => [
          t.id,
          t.tenant?.name,
          t.tenant?.email,
          t.tenant?.phone || 'N/A',
          t.unit?.property?.name,
          t.unit?.unitNumber,
          new Date(t.leaseStart).toLocaleDateString(),
          t.status
      ]);
      const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `PropMS_Tenants_Export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Tenants Exported!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Tenants Directory</h2>
          <p className="text-text-muted mt-1">Manage all your active and past tenants</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="bg-accent hover:bg-accent-hover text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 bg-surface p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
          />
        </div>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white">
          <option value="">All Properties</option>
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="notice">Notice Period</option>
          <option value="ended">Ended</option>
        </select>
        <button onClick={handleExportCSV} className="ml-auto flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 transition-colors font-medium text-slate-700 shadow-sm bg-white">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading tenants...</div>
      ) : (!data?.data || data.data.length === 0) ? (
          <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden text-center py-20 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-semibold text-lg text-text-primary mb-2">No tenants found</h3>
            <p className="text-text-muted mb-6 max-w-sm mx-auto">You haven't added any tenants yet. Once you onboard tenants to units, they will appear here.</p>
            <button onClick={() => setAddOpen(true)} className="bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors shadow-sm">
              Add Your First Tenant
            </button>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.map(tenancy => (
                  <div key={tenancy.id} className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 p-5 relative group">
                      
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg border border-slate-200">
                                  {tenancy.tenant?.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                  <Link to={`/tenants/${tenancy.id}`} className="hover:text-accent transition-colors block">
                                      <h3 className="font-semibold text-text-primary leading-tight">{tenancy.tenant?.name}</h3>
                                  </Link>
                                  <span className={`inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tenancy.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {tenancy.status}
                                  </span>
                              </div>
                          </div>
                          
                          {/* Actions Map */}
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingTenancy(tenancy)} className="p-1.5 text-slate-400 hover:text-accent bg-slate-50 rounded-md hover:bg-indigo-50 transition-colors">
                                  <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(tenancy.id)} className="p-1.5 text-slate-400 hover:text-danger bg-slate-50 rounded-md hover:bg-red-50 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      </div>

                      <div className="space-y-2 mt-4 text-sm text-slate-600 border-t border-slate-100 pt-4">
                          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {tenancy.tenant?.email}</div>
                          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {tenancy.tenant?.phone || 'No phone provided'}</div>
                          <div className="flex items-center gap-2"><Home className="w-4 h-4 text-slate-400" /> {tenancy.unit?.property?.name} • Unit {tenancy.unit?.unitNumber}</div>
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> Joined {new Date(tenancy.leaseStart).toDateString()}</div>
                      </div>

                  </div>
              ))}
          </div>
      )}

      {/* Add Drawer */}
      <SlideOver isOpen={isAddOpen} onClose={() => setAddOpen(false)} title="Onboard New Tenant">
         <AddTenantForm onSuccess={() => setAddOpen(false)} />
      </SlideOver>

      {/* Edit Drawer */}
      <SlideOver isOpen={!!editingTenancy} onClose={() => setEditingTenancy(null)} title="Edit Tenant Details">
         <EditTenantForm tenancy={editingTenancy} onSuccess={() => setEditingTenancy(null)} />
      </SlideOver>
    </div>
  );
};

export default TenantsList;
