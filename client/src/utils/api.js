import axios from "axios";
import { getToken } from "./auth";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5009/api";

export const getApi = () => {
  return axios.create({
    baseURL,
    headers: {
      Accept: "application/json",
    },
  });
};

export const getAuthApi = () => {
  const token = getToken();
  console.log("Creating auth API instance with token:", token);
  return axios.create({
    baseURL,
    headers: {
      Accept: "application/json",
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
};
