// server/src/sockets/index.ts
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

type Task = {
    id: string;
    title: string;
};

const roomTasks = new Map<string, Task[]>();
const roomUsers = new Map<string, Set<string>>();

export const initSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
        socket.on("room:join", (roomId: string) => {
            socket.join(roomId);

            if (!roomTasks.has(roomId)) roomTasks.set(roomId, []);
            if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Set());

            roomUsers.get(roomId)!.add(socket.id);

            socket.emit("room:state", {
                tasks: roomTasks.get(roomId),
            });

            io.to(roomId).emit("room:presence", {
                users: Array.from(roomUsers.get(roomId)!),
            });
        });

        socket.on(
            "task:add",
            (data: { roomId: string; title: string }) => {
                const tasks = roomTasks.get(data.roomId);
                if (!tasks) return;

                tasks.push({
                    id: crypto.randomUUID(),
                    title: data.title,
                });

                io.to(data.roomId).emit("task:list", tasks);
            }
        );

        socket.on(
            "task:update",
            (data: { roomId: string; taskId: string; title: string }) => {
                const tasks = roomTasks.get(data.roomId);
                if (!tasks) return;

                const task = tasks.find((t) => t.id === data.taskId);
                if (task) task.title = data.title;

                io.to(data.roomId).emit("task:list", tasks);
            }
        );

        socket.on(
            "task:delete",
            (data: { roomId: string; taskId: string }) => {
                const tasks = roomTasks.get(data.roomId);
                if (!tasks) return;

                const updated = tasks.filter((t) => t.id !== data.taskId);
                roomTasks.set(data.roomId, updated);

                io.to(data.roomId).emit("task:list", updated);
            }
        );

        socket.on("disconnect", () => {
            for (const [roomId, users] of roomUsers.entries()) {
                if (users.has(socket.id)) {
                    users.delete(socket.id);
                    io.to(roomId).emit("room:presence", {
                        users: Array.from(users),
                    });
                }
            }
        });
    });
};
