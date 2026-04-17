import axios from "axios";
import { getAuthToken } from "../utils/authToken";

const API = axios.create({
  baseURL: "http://localhost:8081/api",
});

// Attach token automatically
API.interceptors.request.use((req) => {
  const token = getAuthToken();
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;