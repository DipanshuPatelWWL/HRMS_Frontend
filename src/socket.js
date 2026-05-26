import { io } from "socket.io-client";
import { BASE_URL } from "./services/api";

const token = localStorage.getItem("token");

const socket = io(BASE_URL, {
    auth: {
        token,
    },
    withCredentials: true,
    transports: ["websocket", "polling"],
});

export default socket;