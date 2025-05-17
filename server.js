import express from "express"

import dotenv from 'dotenv'
import http from 'http'


import cors from 'cors'
dotenv.config()

import { Server } from 'socket.io'
import mongoose from "mongoose"
const app = express()
app.use(express.json())
app.use(cors({origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods:['GET', 'POST']
 }))

const server = http.createServer(app)
// basically creating a http server directly via node's inbuilt function, then passing app(express) as the request handler.

// creating socket.IO server
const io = new Server(server, {
    cors:{
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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


// mongodb connection 
mongoose.connect('mongodb://localhost:27017/triviaDB')
.then(()=> console.log('mongoDB connected'))
.catch((err) => console.error('mongoD connection err: ', err))


server.listen(5000, ()=> {
    console.log('server running on port 5000')
})