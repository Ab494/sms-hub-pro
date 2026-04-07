import axios from 'axios';

// Create axios instance
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; phone?: string; company?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  updateProfile: (data: { name?: string; phone?: string; company?: string; senderId?: string }) =>
    api.put('/auth/profile', data),
  
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
};

// Contacts API
export const contactsAPI = {
  getAll: (params?: { page?: number; limit?: number; groupId?: string; search?: string }) =>
    api.get('/contacts', { params }),
  
  getOne: (id: string) =>
    api.get(`/contacts/${id}`),
  
  create: (data: { name: string; phone: string; email?: string; groupId?: string; notes?: string }) =>
    api.post('/contacts', data),
  
  update: (id: string, data: { name?: string; phone?: string; email?: string; groupId?: string; notes?: string }) =>
    api.put(`/contacts/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/contacts/${id}`),
  
  bulkDelete: (ids: string[]) =>
    api.post('/contacts/bulk-delete', { ids }),
  
  import: (formData: FormData) =>
    api.post('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getCount: () =>
    api.get('/contacts/count'),
};

// Groups API
export const groupsAPI = {
  getAll: () =>
    api.get('/groups'),
  
  getOne: (id: string) =>
    api.get(`/groups/${id}`),
  
  create: (data: { name: string; description?: string; color?: string }) =>
    api.post('/groups', data),
  
  update: (id: string, data: { name?: string; description?: string; color?: string }) =>
    api.put(`/groups/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/groups/${id}`),
  
  getContacts: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/groups/${id}/contacts`, { params }),
  
  addContacts: (id: string, contactIds: string[]) =>
    api.post(`/groups/${id}/contacts`, { contactIds }),
  
  removeContacts: (id: string, contactIds: string[]) =>
    api.delete(`/groups/${id}/contacts`, { data: { contactIds } }),
};

// SMS API
export const smsAPI = {
  send: (data: { phone: string; message: string }) =>
    api.post('/sms/send', data),

  sendBulk: (data: { phones?: string[]; message: string; groupId?: string; name?: string; senderId?: string }) =>
    api.post('/sms/bulk', data),

  uploadContacts: (formData: FormData) =>
    api.post('/sms/upload-contacts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getCampaigns: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/sms/campaigns', { params }),

  getCampaign: (id: string) =>
    api.get(`/sms/campaigns/${id}`),

  cancelCampaign: (id: string) =>
    api.post(`/sms/campaigns/${id}/cancel`),

  getLogs: (params?: { page?: number; limit?: number; status?: string; campaignId?: string; search?: string }) =>
    api.get('/sms/logs', { params }),

  getStats: () =>
    api.get('/sms/stats'),
};

// Credits API
export const creditsAPI = {
  getCredits: () =>
    api.get('/credits'),
  
  getPricing: () =>
    api.get('/credits/pricing'),
  
  purchaseCredits: (data: { amount: number; paymentMethod: string; phone?: string }) =>
    api.post('/credits/purchase', data),
  
  verifyPayment: (checkoutRequestId: string) =>
    api.post('/credits/verify', { checkoutRequestId }),
  
  getPaymentStatus: (checkoutRequestId: string) =>
    api.get(`/credits/status/${checkoutRequestId}`),
};

// Admin API
export const adminAPI = {
  // Stats
  getStats: () =>
    api.get('/admin/stats'),
  
  // Companies
  getCompanies: (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) =>
    api.get('/admin/companies', { params }),
  
  getCompany: (id: string) =>
    api.get(`/admin/companies/${id}`),
  
  updateCompany: (id: string, data: { name?: string; email?: string; company?: string; phone?: string; senderId?: string; isActive?: boolean }) =>
    api.put(`/admin/companies/${id}`, data),
  
  deleteCompany: (id: string) =>
    api.delete(`/admin/companies/${id}`),
  
  toggleCompanyActive: (id: string) =>
    api.patch(`/admin/companies/${id}/toggle-active`),
  
  // Settings
  getSettings: () =>
    api.get('/admin/settings'),
  
  updateSettings: (data: Record<string, any>) =>
    api.put('/admin/settings', data),
  
  // Transactions
  getTransactions: (params?: { page?: number; limit?: number; userId?: string; type?: string; startDate?: string; endDate?: string }) =>
    api.get('/admin/transactions', { params }),
  
  // SMS Logs
  getSMSLogs: (params?: { page?: number; limit?: number; userId?: string; status?: string; startDate?: string; endDate?: string; search?: string }) =>
    api.get('/admin/sms-logs', { params }),
  
  // Campaigns
  getCampaigns: (params?: { page?: number; limit?: number; userId?: string; status?: string }) =>
    api.get('/admin/campaigns', { params }),

  // Withdrawals
  requestWithdrawal: (data: {
    amount: number;
    method: 'mpesa' | 'bank_transfer';
    recipientDetails: {
      phone?: string;
      accountName?: string;
      accountNumber?: string;
      bankName?: string;
    };
  }) =>
    api.post('/admin/withdrawals', data),

  getWithdrawals: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/withdrawals', { params }),

  processWithdrawal: (id: string, data: { action: 'complete' | 'fail' | 'cancel'; notes?: string }) =>
    api.put(`/admin/withdrawals/${id}`, data),

  getWithdrawalStats: () =>
    api.get('/admin/withdrawals/stats'),
};

// Sender ID API
export const senderIdAPI = {
  getAvailable: (category?: string) =>
    api.get('/sender-ids/available', { params: { category } }),

  getMine: () =>
    api.get('/sender-ids/mine'),

  purchase: (id: string) =>
    api.post(`/sender-ids/${id}/purchase`),

  requestCustom: (data: { senderId: string; reason: string }) =>
    api.post('/sender-ids/request', data),

  getMyRequests: () =>
    api.get('/sender-ids/requests'),
};

export default api;
