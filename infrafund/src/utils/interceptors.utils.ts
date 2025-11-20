import { AxiosInstance } from "axios";
import { getAccessToken } from "./get-access-token.util";

export const setupInterceptors = (axiosInstance: AxiosInstance): void => {
    axiosInstance.interceptors.request.use(
        async (config) => {
            const token = getAccessToken();

            if (token) {
                config.headers["Authorization"] = `Bearer ${token}`;
            }

            return config;
        },
        (error) => {
            return Promise.reject(error);
        },
    );
    axiosInstance.interceptors.response.use(
        (response) => response,

        (error) => {
            if (error.response) {
                console.error("API Error:", error.response.data);

                return Promise.reject({
                    status: error.response.status,
                    data: error.response.data,
                    message: error.response.data?.message || "API Error",
                });
            }

            if (error.request) {
                console.error("Network Error:", error.request);
                return Promise.reject({
                    status: null,
                    data: null,
                    message: "Network error, please try again later",
                });
            }

            console.error("Error:", error.message);
            return Promise.reject({
                status: null,
                data: null,
                message: error.message,
            });
        }
    );

};
