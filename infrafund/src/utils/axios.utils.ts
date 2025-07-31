import axios from "axios";
import { setupInterceptors } from "./interceptors.utils";

const _axios = axios.create({
  baseURL: http://localhost:3310,
  headers: {
    "Content-Type": "application/json",
  },
});

setupInterceptors(_axios);

export default _axios;
