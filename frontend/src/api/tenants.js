import api from './auth';

export const getTenants = async () => {
    const { data } = await api.get('/tenants');
    return data;
};

export const createTenant = async (tenantData) => {
    const { data } = await api.post('/tenants', tenantData);
    return data;
};

export const updateTenant = async (id, payload) => {
    const { data } = await api.put(`/tenants/${id}`, payload);
    return data;
};

export const deleteTenant = async (id) => {
    const { data } = await api.delete(`/tenants/${id}`);
    return data;
};

export const getMyTenancy = async () => {
    const { data } = await api.get('/tenants/my/tenancy');
    return data;
};

export const signLease = async () => {
    const { data } = await api.post('/tenants/my/sign');
    return data;
};
