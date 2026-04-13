import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteProperty, getProperties } from '../../api/properties';
import { Building2, Plus, Search, Trash2 } from 'lucide-react';
import SlideOver from '../../components/shared/SlideOver';
import AddPropertyForm from '../../components/shared/AddPropertyForm';
import EditPropertyForm from '../../components/shared/EditPropertyForm';
import toast from 'react-hot-toast';

const PropertiesList = () => {
  const [isSlideOverOpen, setSlideOverOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const queryClient = useQueryClient();

  const openEditPanel = (property) => {
      setEditingProperty(property);
  };

  const handleDelete = async (id) => {
      if (window.confirm('Are you ABSOLUTELY sure you want to delete this property and EVERYTHING inside it? This is irreversible!')) {
          try {
              await deleteProperty(id);
              toast.success('Property entirely removed');
              queryClient.invalidateQueries(['properties']);
          } catch(err) {
              toast.error('Failed to remove property');
          }
      }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
  });

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>;

  const properties = data?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Properties</h2>
          <p className="text-text-muted mt-1">Manage your properties and units</p>
        </div>
        <button onClick={() => setSlideOverOpen(true)} className="bg-accent hover:bg-accent-hover text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 bg-surface p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search properties..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-slate-50 transition-all"
          />
        </div>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white">
          <option value="">All Types</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-surface rounded-xl border border-border shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">No properties found</h3>
          <p className="text-sm text-slate-500 mb-4 max-w-xs">Get started by creating your first property to manage units and tenants.</p>
          <button onClick={() => setSlideOverOpen(true)} className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors">
            Add Your First Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(prop => (
            <div key={prop.id} className="bg-surface rounded-xl border border-border overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <div className="h-40 bg-slate-200 relative">
                {prop.coverImageUrl ? (
                    <img src={prop.coverImageUrl} alt={prop.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-slate-400 bg-slate-100 italic text-sm">No Image Provided</div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-accent px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
                  {prop.propertyType.toUpperCase()}
                </div>
              </div>
              <div className="p-5">
                <Link to={`/properties/${prop.id}`} className="hover:text-accent transition-colors">
                  <h3 className="font-semibold text-lg text-text-primary truncate">{prop.name}</h3>
                </Link>
                <p className="text-sm text-text-muted mt-1 line-clamp-1">{prop.address}, {prop.city}</p>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm">
                  <span className="text-slate-600"><span className="font-semibold text-slate-900">{prop._count?.units || 0}</span> Units Total</span>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => openEditPanel(prop)} 
                          className="text-accent hover:text-accent-hover font-medium text-sm transition-colors"
                      >
                          Edit Details
                      </button>
                      <button 
                          onClick={() => handleDelete(prop.id)} 
                          className="text-slate-400 hover:text-danger transition-colors"
                          title="Delete Property"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SlideOver Form for Add */}
      <SlideOver isOpen={isSlideOverOpen} onClose={() => setSlideOverOpen(false)} title="Add New Property">
         <AddPropertyForm onSuccess={() => setSlideOverOpen(false)} />
      </SlideOver>

      {/* SlideOver Form for Edit */}
      <SlideOver isOpen={!!editingProperty} onClose={() => setEditingProperty(null)} title="Edit Property">
         <EditPropertyForm property={editingProperty} onSuccess={() => setEditingProperty(null)} />
      </SlideOver>
    </div>
  );
};

export default PropertiesList;
