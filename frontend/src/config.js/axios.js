import axios from "axios";
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const instance = axios.create({
  baseURL,
  withCredentials: true, // to send cookies with requests
});
export default instance;
