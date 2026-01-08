import http from "http"
import { app } from "./app.js"
import {initSocket} from "./sockets/index.js";


const server= http.createServer(app)
initSocket(server)

server.listen(5000, () => {
    console.log("Server started ")
})