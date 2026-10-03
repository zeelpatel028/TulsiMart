import apiClient, { clearApiCache } from '../api/axios';

export const staffApi = {
  getStaff: (params = {}, config = {}) => {
    return apiClient.get('/core/staff/', { params, ...config });
  },

  createStaff: async (data, config = {}) => {
    clearApiCache('/core/staff');
    return await apiClient.post('/core/staff/', data, config);
  },

  updateStaff: async (id, data, config = {}) => {
    clearApiCache('/core/staff');
    return await apiClient.put(`/core/staff/${id}/`, data, config);
  },

  deleteStaff: async (id, config = {}) => {
    clearApiCache('/core/staff');
    return await apiClient.delete(`/core/staff/${id}/`, config);
  },

  toggleStaffStatus: async (id, config = {}) => {
    clearApiCache('/core/staff');
    return await apiClient.post(`/core/staff/${id}/toggle_status/`, {}, config);
  },

  updateStaffAttendance: async (id, attendance_data, config = {}) => {
    clearApiCache('/core/staff');
    return await apiClient.post(`/core/staff/${id}/update_attendance/`, { attendance_data }, config);
  },

  getActivityLogs: (params = {}, config = {}) => {
    return apiClient.get('/core/logs/', { params, ...config });
  },
};

export default staffApi;
