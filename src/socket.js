import { io } from "socket.io-client";

const user = JSON.parse(localStorage.getItem("user"));


const socket = io("http://localhost:5000", {
    auth: {
        token: user?.token,
    },
    withCredentials: true,
    transports: ["websocket", "polling"],
});


export default socket;