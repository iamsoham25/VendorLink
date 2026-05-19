import { api } from "./api.js";

export async function signupUser(name, email, password) {
    return await api("/auth/signup", "POST", { name, email, password });
}

export async function loginUser(email, password) {
    return await api("/auth/login", "POST", { email, password });
}
