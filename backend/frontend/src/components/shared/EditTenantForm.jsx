import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { updateTenant } from '../../api/tenants';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const EditTenantForm = ({ tenancy, onSuccess }) => {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (tenancy) {
      reset({
        name: tenancy.tenant?.name || '',
        phone: tenancy.tenant?.phone || '',
        email: tenancy.tenant?.email || '',
        personalEmail: tenancy.tenant?.personalEmail || '',
        password: '',
        leaseEnd: tenancy.leaseEnd ? new Date(tenancy.leaseEnd).toISOString().split('T')[0] : '',
        monthlyRent: tenancy.monthlyRent || 0,
        depositPaid: tenancy.depositPaid || 0,
        noticePeriodDays: tenancy.noticePeriodDays || 0,
      });
    }
  }, [tenancy, reset]);

  const onSubmit = async (data) => {
    try {
      if (!data.password) delete data.password;
      await updateTenant(tenancy.id, data);
      toast.success('Tenant details updated successfully!');
      queryClient.invalidateQueries(['tenants']);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update tenant');
    }
  };

  if (!tenancy) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in duration-300 pb-10">
      
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 text-sm text-indigo-800">
         <p>Editing associated details for <b>{tenancy.tenant?.name}</b> in Unit <b>{tenancy.unit?.unitNumber}</b>.</p>
      </div>

      <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-2">Tenant Credentials & Identity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input {...register('name')} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input {...register('phone')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Personal Email (For Updates)</label>
              <input {...register('personalEmail')} type="email" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Login Email</label>
                  <input {...register('email')} type="email" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password (Optional)</label>
                  <input {...register('password')} placeholder="Leave blank to keep" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
               </div>
            </div>
          </div>
      </div>

      <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-2">Lease Financials</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Extended Lease End</label>
              <input {...register('leaseEnd')} type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Updated Monthly Rent</label>
              <input {...register('monthlyRent')} type="number" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deposit Retained</label>
              <input {...register('depositPaid')} type="number" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period (Days)</label>
              <input {...register('noticePeriodDays')} type="number" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-accent hover:bg-accent-hover text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
            {isSubmitting ? 'Saving...' : 'Update All Details'}
        </button>
      </div>
    </form>
  );
};

export default EditTenantForm;
