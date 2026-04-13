import api from './auth';

export const getTickets = async () => {
    const { data } = await api.get('/tickets');
    return data;
};

export const createTicket = async (payload) => {
    const { data } = await api.post('/tickets', payload);
    return data;
};

export const updateTicket = async (id, param) => {
    const { data } = await api.put(`/tickets/${id}`, param);
    return data;
};
