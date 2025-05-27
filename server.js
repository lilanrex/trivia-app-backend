import express from "express"
import roomRoutes from './routes/roomRoutes.js'
import questionRoutes from './routes/questionRoutes.js'
import dotenv from 'dotenv'
import http from 'http'
import { joinRoom,startGame } from "./controllers/roomSocketController.js"

import cors from 'cors'
dotenv.config()

import { Server } from 'socket.io'
import mongoose from "mongoose"
const app = express()
app.use(express.json())

const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000', // Your default/main frontend
    'http://127.0.0.1:5500', // Typical VS Code Live Server origin
    
];

// Express CORS
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, curl) or from allowed origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'] // Add other methods like PUT, DELETE if needed later
}));

const server = http.createServer(app)
// basically creating a http server directly via node's inbuilt function, then passing app(express) as the request handler.

// creating socket.IO server
const io = new Server(server, {
    cors:{
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
})


// handling websocket cnnections
io.on('connection', (socket) => {
  console.log('user connected')
  socket.on('joinRoom', (data) => {
    joinRoom(socket, io, data);
  });

  socket.on('startGame', (data) => {
    startGame(socket, io, data);
  });
  socket.on('submitAnswer', (data)=> {
    submitAnswer(socket ,io, data)
  })
  socket.on('disconnect', ()=> {
    disconnect(socket, io)
  })
})

app.use('/api/questions', questionRoutes)
app.use('/api/rooms', roomRoutes)


// mongodb connection 
mongoose.connect('mongodb://localhost:27017/triviaDB')
.then(()=> console.log('mongoDB connected'))
.catch((err) => console.error('mongoD connection err: ', err))


server.listen(5000, ()=> {
    console.log('server running on port 5000')
})