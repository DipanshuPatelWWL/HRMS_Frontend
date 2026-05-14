import API from "./API"; // your configured axios instance with baseURL + auth interceptor

const BASE = "/assets";

// ─── HR / Manager ─────────────────────────────────────────────────────────────

export const getEmployeeAssets = (employeeId) =>
    API.get(`${BASE}/employee/${employeeId}`);

export const addAsset = (employeeId, assetData) =>
    API.post(`${BASE}/employee/${employeeId}`, assetData);

export const updateDesk = (employeeId, deskNumber) =>
    API.patch(`${BASE}/employee/${employeeId}/desk`, { deskNumber });

export const updateSystemPassword = (employeeId, systemPassword) =>
    API.patch(`${BASE}/employee/${employeeId}/password`, { systemPassword });

// ─── Asset-level ──────────────────────────────────────────────────────────────

export const updateAssetCondition = (assetId, payload) =>
    API.patch(`${BASE}/${assetId}/condition`, payload);

export const uploadAssetPhoto = (assetId, formData) =>
    API.patch(`${BASE}/${assetId}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const getAssetHistory = (assetId) =>
    API.get(`${BASE}/${assetId}/history`);

// ─── Employee (self) ──────────────────────────────────────────────────────────

export const getMyAssets = () =>
    API.get(`${BASE}/me`);