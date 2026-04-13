import api from './auth';

export const getGlobalDocuments = async () => {
    const { data } = await api.get('/documents/templates');
    return data;
};

export const saveGlobalDocument = async (payload) => {
    const { data } = await api.post('/documents/templates', payload);
    return data;
};
