import axios from "axios";

export const BASE_URL = "https://hrmsback.digitalwebguider.com";
// export const BASE_URL = "http://localhost:5000";
export const QR_CODE_URL = "https://wwlhrms.digitalwebguider.com";
// export const QR_CODE_URL = "http://localhost:5173";


const API = axios.create({
    baseURL: `${BASE_URL}/api`,
    timeout: 15000,
});

export const sessionAPI = {
    getSessions: () => API.get("/auth/sessions"),
    logoutSession: (sessionId) => API.delete(`/auth/sessions/${sessionId}`),
    logoutAll: (keepCurrent = false) =>
        API.post("/auth/sessions/logout-all", { keepCurrent }),
};

API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");

    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API; 