import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { updateProperty } from '../../api/properties';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon } from 'lucide-react';

const AMENITY_CATEGORIES = {
    Basic: ['WiFi', 'Water Supply', 'Power Backup', 'Lift / Elevator'],
    Safety: ['Security Guard', 'CCTV', 'Fire Alarm'],
    Lifestyle: ['Gym', 'Pool', 'Parking', 'Garden']
};

const EditPropertyForm = ({ property, onSuccess }) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (property) {
      reset({
        name: property.name,
        address: property.address,
        city: property.city,
        state: property.state,
        pincode: property.pincode,
        propertyType: property.propertyType,
        totalUnits: property.totalUnits,
        coverImageUrl: property.coverImageUrl || '',
        plotAreaSqft: property.plotAreaSqft ?? '',
        builtUpAreaSqft: property.builtUpAreaSqft ?? '',
        lengthFt: property.lengthFt ?? '',
        widthFt: property.widthFt ?? '',
        floors: property.floors ?? '',
        amenities: property.amenities || []
      });
    }
  }, [property, reset]);

  const propertyType = watch('propertyType');
  const showUnitsInput = ['apartment', 'hostel', 'pg'].includes(propertyType);

  const onSubmit = async (data) => {
    try {
      await updateProperty(property.id, data);
      toast.success('Property updated successfully!');
      queryClient.invalidateQueries(['properties']);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update property');
    }
  };

  if (!property) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in duration-300">
      
      {/* Basic Info */}
      <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-2">Top Level Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
            <input {...register('name')} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Property Type</label>
              <select {...register('propertyType')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white">
                <option value="residential">Single Residential</option>
                <option value="commercial">Commercial</option>
                <option value="apartment">Apartment Building</option>
                <option value="pg">PG</option>
                <option value="hostel">Hostel</option>
              </select>
            </div>
            {showUnitsInput && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Limit</label>
                  <input {...register('totalUnits')} disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
                </div>
            )}
          </div>
      </div>

      <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-2">Location</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input {...register('address')} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input {...register('city')} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
              <input {...register('state')} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
            <input {...register('pincode')} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
          </div>
      </div>

      <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-2">Dimensions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plot Area (sqft)</label>
              <input {...register('plotAreaSqft')} type="number" min="0" step="1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Built-up Area (sqft)</label>
              <input {...register('builtUpAreaSqft')} type="number" min="0" step="1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Length (ft)</label>
              <input {...register('lengthFt')} type="number" min="0" step="0.1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Width (ft)</label>
              <input {...register('widthFt')} type="number" min="0" step="0.1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Floors</label>
              <input {...register('floors')} type="number" min="0" step="1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
            </div>
          </div>
          <p className="text-xs text-slate-500">Optional. Helps you keep property specifications organized.</p>
      </div>

      <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-2">Amenities</h3>
          <div className="space-y-4">
              {Object.entries(AMENITY_CATEGORIES).map(([category, amenities]) => (
                  <div key={category}>
                      <span className="text-xs font-semibold uppercase text-slate-500 mb-2 block">{category}</span>
                      <div className="grid grid-cols-2 gap-2">
                          {amenities.map(item => (
                              <label key={item} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                  <input type="checkbox" value={item} {...register('amenities')} className="rounded text-accent focus:ring-accent border-slate-300" />
                                  <span>{item}</span>
                              </label>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Cover Image
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
            <input {...register('coverImageUrl')} placeholder="https://..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
          </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-accent hover:bg-accent-hover text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
        >
            {isSubmitting ? 'Saving...' : 'Update Property'}
        </button>
      </div>
    </form>
  );
};

export default EditPropertyForm;
