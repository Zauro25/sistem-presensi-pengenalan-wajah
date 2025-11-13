import http from "./http";

export const apiClient = {
  auth: {
    login: (username, password) => http.post("/login-token/", { username, password }),
    refresh: (refresh) => http.post("/users/token/refresh/", { refresh }),
  },
  santri: {
    list: (params) => http.get("/santri/", { params }),
    registerFace: (id, image) => http.post(`/santri/${id}/register-face/`, { image }),
    recognize: (image) => http.post("/santri/recognize/", { image }),
  },
  attendance: {
    list: (params) => http.get("/rekap/", { params }),
    recognizeAndAttend: (payload) => http.post("/recognize/", payload),
  },
  reports: {
    rekapXlsx: (params) => http.get("/rekap/export/xlsx/", { params, responseType: "blob" }),
  },
  permits: {
    list: () => http.get("/izin/list/"),
    create: (formData) => http.post("/santri/izin/", formData),
  },
  legacy: {
    loginToken: (username, password) => http.post("/login-token/", { username, password }, { headers: { "Content-Type": "application/json" } }),
    startAbsensi: (payload) => http.post("/start-absensi/", payload, { headers: { "Content-Type": "application/json" } }),
    startTelat: (payload) => http.post("/start-telat/", payload, { headers: { "Content-Type": "application/json" } }),
    endAbsensi: () => http.post("/end-absensi/"),
    registerWajah: (santri_id, image) => http.post("/santri/registrasi-wajah/", { santri_id, image }, { headers: { "Content-Type": "application/json" } }),
    uploadFoto: (formData) => http.post("/santri/upload-foto/", formData),
    rekap: (params) => http.get("/rekap/", { params }),
    exportXlsx: (params) => http.get("/rekap/export/xlsx/", { params, responseType: "blob" }),
    registerSantri: (formData) => http.post("/santri/register/", formData),
    uploadIzin: (formData) => http.post("/santri/izin/", formData),
  },
};
