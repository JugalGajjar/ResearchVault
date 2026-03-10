import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Records
export const getRecords = (params) => api.get("/records/", { params });
export const getRecord = (id) => api.get(`/records/${id}`);
export const createRecord = (data) => api.post("/records/", data);
export const updateRecord = (id, data) => api.put(`/records/${id}`, data);
export const deleteRecord = (id) => api.delete(`/records/${id}`);
export const publishRecord = (id) => api.post(`/records/${id}/publish`);
export const addVersion = (id, data) => api.post(`/records/${id}/versions`, data);

// Search
export const searchRecords = (params) => api.get("/search/", { params });

// Upload
export const uploadFile = (recordId, file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/uploads/${recordId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  });
};
export const getDownloadUrl = (recordId) => `${API_BASE}/uploads/${recordId}/download`;

// Stats
export const getStats = () => api.get("/stats/");

export default api;
