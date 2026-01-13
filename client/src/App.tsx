// client/src/App.tsx
import { useEffect, useState } from "react";
import { socket } from "./socket";

type Task = {
    id: string;
    title: string;
};

function App() {
    const [roomId, setRoomId] = useState("board-1");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<string[]>([]);
    const [taskTitle, setTaskTitle] = useState("");

    useEffect(() => {
        socket.connect();

        socket.on("room:state", (data: { tasks: Task[] }) => {
            setTasks(data.tasks);
        });

        socket.on("task:list", (tasks: Task[]) => {
            setTasks(tasks);
        });

        socket.on("room:presence", (data: { users: string[] }) => {
            setUsers(data.users);
        });

        return () => socket.disconnect();
    }, []);

    const joinRoom = () => {
        socket.emit("room:join", roomId);
        setTasks([]);
        setUsers([]);
    };

    const addTask = () => {
        if (!taskTitle.trim()) return;

        socket.emit("task:add", {
            roomId,
            title: taskTitle,
        });

        setTaskTitle("");
    };

    const updateTask = (taskId: string, title: string) => {
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, title } : t))
        );

        socket.emit("task:update", {
            roomId,
            taskId,
            title,
        });
    };

    const deleteTask = (taskId: string) => {
        // Optimistic update
        setTasks((prev) => prev.filter((t) => t.id !== taskId));

        socket.emit("task:delete", {
            roomId,
            taskId,
        });
    };

    return (
        <div style={{ padding: "2rem", fontSize: "18px" }}>
            <h1>Real-Time Collaborative Task Board</h1>

            <input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
            />
            <button onClick={joinRoom}>Join Room</button>

            <h3>Users</h3>
            <ul>
                {users.map((u) => (
                    <li key={u}>{u}</li>
                ))}
            </ul>

            <h3>Tasks</h3>
            <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="New task"
            />
            <button onClick={addTask}>Add</button>

            <ul>
                {tasks.map((task) => (
                    <li key={task.id}>
                        <input
                            value={task.title}
                            onChange={(e) =>
                                updateTask(task.id, e.target.value)
                            }
                        />
                        <button onClick={() => deleteTask(task.id)}>
                            ❌
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;
