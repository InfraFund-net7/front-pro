import { AxiosRequestConfig, AxiosResponse } from "axios";
import _axios from "../utils/axios.utils";
import { getAccessToken } from "@/utils/get-access-token.util";

interface ApiService {
    get: <T>(url: string, config?: AxiosRequestConfig) => Promise<AxiosResponse<T>>;
    post: <T>(url: string, data?: object, config?: AxiosRequestConfig) => Promise<AxiosResponse<T>>;
    put: <T>(url: string, data: object, config?: AxiosRequestConfig) => Promise<AxiosResponse<T>>;
    patch: <T>(url: string, data: object, config?: AxiosRequestConfig) => Promise<AxiosResponse<T>>;
}

function reWriteUrl(url: string): string {
    return `api${url}`;
}

async function getAxiosRequestConfig(): Promise<AxiosRequestConfig> {
    const token = getAccessToken();
    return {
        headers: {
            Authorization: token ? `Bearer ${token}` : "",
            Accept: "application/json",
        },
    };
}

const apiService: ApiService = {
    get: async <T>(url: string, config = {}): Promise<AxiosResponse<T>> => {
        const finalConfig = { ...(await getAxiosRequestConfig()), ...config };
        return _axios.get<T>(reWriteUrl(url), finalConfig);
    },

    post: async <T>(url: string, data?: object, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> => {
        const finalConfig = await getAxiosRequestConfig();
        return _axios.post<T>(reWriteUrl(url), data, { ...finalConfig, ...config });
    },

    put: async <T>(url: string, data: object, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> => {
        const finalConfig = await getAxiosRequestConfig();
        return _axios.put<T>(reWriteUrl(url), data, { ...finalConfig, ...config });
    },

    patch: async <T>(url: string, data: object, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> => {
        const finalConfig = await getAxiosRequestConfig();
        return _axios.patch<T>(reWriteUrl(url), data, { ...finalConfig, ...config });
    },
};

export default apiService;