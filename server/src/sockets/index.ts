import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

export const initSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
        },
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};
