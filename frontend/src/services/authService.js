import axios from "axios";

const API = "http://localhost:8080/auth";

export const registerUser = (data) => {
  return axios.post(`${API}/register`, data);
};

export const loginUser = (data) => {
  return axios.post(`${API}/token`, data);
};

export const loginWithGoogle = (idToken) => {
  return axios.post(`${API}/google`, { idToken });
};