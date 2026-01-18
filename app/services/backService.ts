import axios from "axios";

export const BACKEND_URL = "http://localhost:8080";

const backService = axios.create({
  baseURL: BACKEND_URL,
});

export default backService;
