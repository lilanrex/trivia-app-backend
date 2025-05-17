
import participant from "../models.js/players";
import Room from "../models.js/room";
import question from "../models.js/questions";

export const joinRoom = async (socket, io, data) => {
          try {
            const {roomCode, username} = data

            const room = await Room.findOne({roomCode})  // finding room by code

            if (!room || !room.isActive) {
                return socket.emit('roomJoinError', {message: 'Room not found or inactive'})
            }

            const newParticipant = await participant.create({
                username,
                socketId: socket.id,
                room: room._id
            }) 
            room.participant.push(newParticipant._id)
            await room.save()

            socket.join(roomCode) // so this practically joins users(sockets) into a particular room code, used to 
            // a socket ( user) to a named group 
            
           
            const updatedRoom = await Room.findOneById(room._id).populate('participants')
            io.to(roomCode).emit('updatedParticipantList', updatedRoom.participants)

            socket.emit('joinedRoom', {
                roomCode,
                username,
                participantId: newParticipant._id,
                participants: updatedRoom.participants,
                message: 'Successfully joined room'
            }) // socket.emit listens to the event 'joinedRoom and sends the payload{} to the socket instance(user)

            io.to(roomCode).emit('playerJoined', {
                username,
                participantId: newParticipant._id
            }) // this notifies others in the room 


            console.log(`${username} joined room ${roomCode}`)




          } catch (err) {
            console.log('joinRoom error : ', err)
            socket.emit('roomJoinError', {message:'Failed to join Room'})
          }
}


export const startGame = async (socket, io, data) => {
    try {
     const{roomCode} = data
     const room = await room.findOne({roomCode})
     
     if (!room) {
        return socket.emit('startGameError', {message:'Room not found'})
     }
     if(!room.isActive) {
        return socket.emit('startGameError', {message:'Room is not active'})
     }
     if(room.gameStarted) {
        return socket.emit('startRoomError', {message:'Game has already started'})
     }

     if(socket.id !== room.hostSocketId) {
        return socket.emit('startGameError', {message:'Only hosts can start game'})
     }

     if(!room.questions || room.questions.length===0) {
        return socket.emit('startGameError', {message:'no questions found'})
     }

     room.gameStarted = true
     room.currentQuestionIndex = 0
     await room.save()

     const firstQuestionId = room.questions[0]
     const firstQuestion = await question.findOneById(firstQuestionId)
     
     if (!firstQuestion) {
        console.error(`error starting game ${roomCode}: First question(${firstQuestionId}) not found`)
        return socket.emit('startGameError', {message: 'error fetching the first question'})
     }
     
     const questionDataforClient = {
        questionIndex: 0,
        totalQuestions: room.questions.length,
        questionText: firstQuestion.questionText,
        options: firstQuestion.options,
        timer: firstQuestion.timer,
     }
     io.to(roomCode).emit('newQuestion', questionDataforClient) // so this sends to everyone including the admin/sender
     socket.emit('gameStartedSuccessfully', {roomCode}) // this only emit to the admin/sender
     console.log(`game started in room ${roomCode} by host ${socket.id}`)
    } catch (err) {
        console.error(`startGame error in room ${data.roomCode}:`, err)
        socket.emit('startGameError', {message: 'failed to start game due to a server error'})
    }
}


