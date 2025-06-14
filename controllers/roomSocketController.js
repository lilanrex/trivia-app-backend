
import participant from "../models/players.js";
import Room from "../models/room.js";
import question from "../models/questions.js";

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
                roomCode: roomCode
            }) 
            console.log(newParticipant)
            room.participants.push(newParticipant._id)
            await room.save()

            socket.join(roomCode) // so this practically joins users(sockets) into a particular room code, used to 
            // a socket ( user) to a named group 
            
           
            const updatedRoom = await Room.findById(room._id).populate('participants')
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
     const room = await Room.findOne({roomCode})
     
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
     const firstQuestion = await question.findById(firstQuestionId)
     
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


export const submitAnswer = async (socket, io, data) => {
   // this handles a player submitting an answer for te current question

   try {
     const {roomCode, answer} = data;
     // find and validate the room, we're using .populate because we'll be searching for participants socketId rather than objectId
     const room = await Room.findOne({roomCode}).populate('participants')
     if (!room||!room.isActive||!room.gameStarted) {
      return socket.emit('answerError', {message: 'cannot submit answer. Room is not active or game has not started'})
     }

     // finding the current question to get the correct answer
     const currentQuestionId = room.questions[room.currentQuestionIndex]
     if(!currentQuestionId) {
      return socket.emit('answerError', {message: 'could not determine the current question'})
     }
     const currentQuestion = await question.findById(currentQuestionId)
     if(!currentQuestion) {
      return socket.emit('answerError', {message: 'Error fetching current question details'})
     }
     // find the participants in the room's array using thier socket.id
     const participantz = room.participants.find(p => p.socketId === socket.id )
     if (!participantz) {
      return socket.emit('answerError', {message:'not a registered participant'})
     }

     //we need to implement a prevention for answering twice 
     if (participantz.hasAnswered) {
      return socket.emit('answerError', {message: 'you have already answered the question'})
     }

     participantz.hasAnswered = true

     //checking if the submitted answer is correct
     let isCorrect = false
     if(answer === currentQuestion.correctAnswer) {
      isCorrect = true
      // increase participant's score by 100 points
      participantz.score += 100
     }

     await room.save()  // we're saving the room with the updated score, because participant(participantz) is a subdocument within the room document, saving the room will save the score change

     // sending an immediate feedback to the players who answered
     socket.emit('answerResult', {
      isCorrect: isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      yourScore: participantz.score
     })

     console.log(`Player ${participantz.username} in room ${roomCode} answered. Correct: ${isCorrect}`)
     
     //letting the host know who answered
     io.to(room.hostSocketId).emit('playerAnswered', {
      username: participantz.username,
      socketId: participantz.socketId
     })

   } catch (error) {
      console.error('submitError: ', err)
      socket.emit('answerError', {message: 'Server error occured while submitting your answer'})
   }
}