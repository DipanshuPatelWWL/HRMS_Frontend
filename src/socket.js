import { io } from "socket.io-client";
import { BASE_URL } from "./services/api";

const user = JSON.parse(localStorage.getItem("user"));

const socket = io(BASE_URL, {
    auth: {
        token: user?.token,
    },
    withCredentials: true,
    transports: ["websocket", "polling"],
});

export default socket;