import api from './auth';

export const getProperties = async () => {
    const { data } = await api.get('/properties');
    return data;
};

export const createProperty = async (propertyData) => {
    const { data } = await api.post('/properties', propertyData);
    return data;
};

export const updateProperty = async (id, propertyData) => {
    const { data } = await api.put(`/properties/${id}`, propertyData);
    return data;
};

export const deleteProperty = async (id) => {
    const { data } = await api.delete(`/properties/${id}`);
    return data;
};

export const getMarketPricingTrend = async (propertyId) => {
    const { data } = await api.post('/ai/market-pricing', { propertyId });
    return data;
};

export const getAmenityItems = async (propertyId) => {
    const { data } = await api.get(`/properties/${propertyId}/amenity-items`);
    return data;
};

export const addAmenityItem = async (propertyId, payload) => {
    const { data } = await api.post(`/properties/${propertyId}/amenity-items`, payload);
    return data;
};

export const removeAmenityItem = async (propertyId, amenityId) => {
    const { data } = await api.delete(`/properties/${propertyId}/amenity-items/${amenityId}`);
    return data;
};
