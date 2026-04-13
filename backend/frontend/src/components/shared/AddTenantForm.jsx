import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createTenant } from '../../api/tenants';
import { getProperties } from '../../api/properties';
import api from '../../api/auth';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const AddTenantForm = ({ onSuccess }) => {
  const queryClient = useQueryClient();
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    // Quick fetch for properties list
    const fetchProps = async () => {
        try {
            const data = await getProperties();
            setProperties(data.data || []);
        } catch(e) {}
    }
    fetchProps();
  }, []);

  const [selectedProperty, setSelectedProperty] = useState('');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
      defaultValues: {
          name: 'Sarah Jenkins',
          email: 'sarah.jenkins@example.com',
          personalEmail: 'sarah.jenk.p@gmail.com',
          phone: '+919876543210',
          password: 'securepassword123!',
          unitId: '', // Will be picked from dropdown
          leaseStart: new Date().toISOString().split('T')[0],
          leaseEnd: '', // Automatically computed or manual override
          monthlyRent: 25000,
          depositPaid: 75000,
          noticePeriodDays: 30
      }
  });

  const onSubmit = async (data) => {
    try {
      await createTenant(data);
      toast.success('Tenant onboarded & welcome email dispatched via PropMS!');
      queryClient.invalidateQueries(['tenants']);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to onboard tenant');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
       <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 text-sm text-indigo-800">
         <p className="font-semibold mb-1">Owner Controls:</p>
         <p>You can pre-assign the login credentials for your tenant below. They will use this Email and Password to log into their Tenant Portal.</p>
       </div>

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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Login Email/Username</label>
          <input {...register('email')} type="email" placeholder="tenant.login@propms.io" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Personal Email (For Updates)</label>
          <input {...register('personalEmail')} type="email" placeholder="user.personal@gmail.com" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Assign Initial Password</label>
        <input {...register('password')} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </div>

      <hr className="my-4 border-slate-100" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Property</label>
          <select 
              value={selectedProperty} 
              onChange={e => setSelectedProperty(e.target.value)} 
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
          >
              <option value="">-- Choose Property --</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Unit</label>
          <select 
              {...register('unitId')} 
              required 
              disabled={!selectedProperty}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white disabled:bg-slate-100 disabled:text-slate-400"
          >
              <option value="">-- Choose Unit --</option>
              {
                 selectedProperty 
                 ? properties.find(p => p.id === selectedProperty)?.units?.filter(u => u.status === 'vacant')?.map(u => (
                     <option key={u.id} value={u.id}>{u.unitNumber} (Floor {u.floor})</option>
                 )) 
                 : null
              }
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lease Start</label>
          <input {...register('leaseStart')} type="date" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lease End Date</label>
          <input {...register('leaseEnd')} type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Rent</label>
          <input {...register('monthlyRent')} type="number" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Deposit Paid</label>
          <input {...register('depositPaid')} type="number" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notice Params (Days)</label>
          <input {...register('noticePeriodDays')} type="number" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-accent hover:bg-accent-hover text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
            {isSubmitting ? 'Onboarding...' : 'Onboard Tenant'}
        </button>
      </div>
    </form>
  );
};

export default AddTenantForm;
