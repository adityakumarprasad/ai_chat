import axios from "axios";
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ,
  withCredentials: true, // to send cookies with requests
});
export default instance;