import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getGlobalDocuments, saveGlobalDocument } from '../../api/documents';
import { updateMe } from '../../api/auth';
import { FileText, Save, Home, Building2, Building } from 'lucide-react';

const LeaseCard = ({ title, type, icon, existingDoc }) => {
    const IconComponent = icon;
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm();

    useEffect(() => {
        if (existingDoc) {
            reset({ url: existingDoc.url, name: existingDoc.name });
        }
    }, [existingDoc, reset]);

    const mutation = useMutation({
        mutationFn: saveGlobalDocument,
        onSuccess: () => {
            toast.success(`${title} Template Saved!`);
            queryClient.invalidateQueries(['documents']);
        },
        onError: () => toast.error('Failed to save document')
    });

    const onSubmit = (data) => {
        if (!data.url) return toast.error('URL is required');
        mutation.mutate({ relatedType: type, url: data.url, name: data.name || `${title} Terms` });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface rounded-xl border border-border p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 border-b border-border pb-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <IconComponent className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-text-primary">{title}</h3>
                    <p className="text-xs text-text-muted">Master lease assigned to all new units of this type.</p>
                </div>
            </div>
            
            <div className="space-y-3 flex-1">
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Document Display Name</label>
                    <input {...register('name')} placeholder="e.g. Standard Apartment Lease v2" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Public Document URL (PDF Link)</label>
                    <input {...register('url')} placeholder="https://..." required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
                </div>
                {existingDoc && (
                    <a href={existingDoc.url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1 mt-2">
                        <FileText className="w-3 h-3" /> View Current Document
                    </a>
                )}
            </div>

            <button type="submit" disabled={mutation.isLoading} className="mt-auto flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                <Save className="w-4 h-4" /> Save Template
            </button>
        </form>
    );
};

const SettingsPage = () => {
  const user = useAuthStore(state => state.user);
  const setAuth = useAuthStore(state => state.setAuth);
  const { register, handleSubmit, reset } = useForm();
  
  const { data, isLoading } = useQuery({
      queryKey: ['documents'],
      queryFn: getGlobalDocuments
  });

  useEffect(() => {
      if (user) {
          reset({
              name: user.name || '',
              email: user.email || '',
              phone: user.phone || '',
              personalEmail: user.personalEmail || ''
          });
      }
  }, [user, reset]);

  const updateMutation = useMutation({
      mutationFn: updateMe,
      onSuccess: (res) => {
          toast.success(res.message);
          setAuth(res.data, localStorage.getItem('token'));
      },
      onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to update profile');
      }
  });

  const onSubmitProfile = (payload) => {
      updateMutation.mutate(payload);
  };

  const getDoc = (type) => data?.data?.find(d => d.relatedType === type);

  if (user?.role === 'tenant') return <Navigate to="/" replace />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Master Settings</h2>
        <p className="text-text-muted mt-1">Configure global lease tracking, organizational documents, and owner contact details shown to tenants.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          <section className="bg-surface border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                      <h3 className="text-xl font-semibold text-text-primary">Owner Profile</h3>
                      <p className="text-sm text-text-muted">These details are shared with your tenants on their portal.</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Public info</span>
              </div>

              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Owner Name</label>
                      <input
                          {...register('name')}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="Owner name"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Owner Email</label>
                      <input
                          {...register('email')}
                          type="email"
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="owner@example.com"
                      />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">Phone Number</label>
                          <input
                              {...register('phone')}
                              type="tel"
                              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                              placeholder="+91 98765 43210"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">Tenant Contact Email</label>
                          <input
                              {...register('personalEmail')}
                              type="email"
                              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                              placeholder="support@example.com"
                          />
                      </div>
                  </div>
                  <button
                      type="submit"
                      disabled={updateMutation.isLoading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
                  >
                      {updateMutation.isLoading ? 'Saving...' : 'Save Owner Details'}
                  </button>
              </form>
          </section>

          <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl text-sm border border-indigo-100 flex gap-3 shadow-sm">
              <FileText className="w-5 h-5 flex-shrink-0" />
              <p>
                <b>E-Sign Templates:</b> Setting a Document URL here automatically enforces it upon new tenants assigned to that specific property type. Tenants will not be able to clear their pending status until they accept these identical terms globally in their Tenant Portal.
              </p>
          </div>
      </div>

      {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading configurations...</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LeaseCard type="apartment" title="Apartment Agreements" icon={Building2} existingDoc={getDoc('apartment')} />
              <LeaseCard type="commercial" title="Commercial Leases" icon={Building} existingDoc={getDoc('commercial')} />
              <LeaseCard type="residential" title="Residential Terms" icon={Home} existingDoc={getDoc('residential')} />
          </div>
      )}
    </div>
  );
};

export default SettingsPage;
