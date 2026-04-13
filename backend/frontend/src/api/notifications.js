import api from './auth';

export const getNotifications = async () => {
    const { data } = await api.get('/notifications');
    return data;
};

export const markNotificationAsRead = async (id) => {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data;
};
