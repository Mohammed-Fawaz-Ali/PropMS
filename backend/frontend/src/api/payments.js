import api from './auth';

export const getPayments = async () => {
    const { data } = await api.get('/payments');
    return data;
};

export const issueBill = async (payload) => {
    const { data } = await api.post('/payments/issue', payload);
    return data;
};

export const markAsPaid = async (id, param) => {
    const { data } = await api.put(`/payments/${id}/pay`, param);
    return data;
};

export const initRazorpay = async (id) => {
    const { data } = await api.post(`/payments/${id}/razorpay-init`);
    return data;
};

export const verifyRazorpay = async (id, param) => {
    const { data } = await api.post(`/payments/${id}/razorpay-verify`, param);
    return data;
};
