import api from './auth';

export const getDashboardData = async () => {
    const { data } = await api.get('/dashboard');
    return data;
};
