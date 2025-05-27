import  Room from "../models/room.js";
import participant from "../models/players.js";
import question from "../models/questions.js";
import {nanoid} from 'nanoid' // for generating random unique room codes

export const createRoom = async (req,res) => {
    try {
        const {roomName, questionIds, hostSocketId} = req.body
        
        if (!questionIds || !Array.isArray(questionIds) ||questionIds.length === 0 ) {
            return res.status(400).json({
         sucess : false,
         message:'provide a non-empty array of questionIds'})
         }

        if (!hostSocketId) {
            return res.status(400).json({
                success: false,
                message: 'hostSocketId is required to create a room for testing'
            })
        }
        // trying to validate if all questionIds actually exist in the Database
        const questionsExist = await question.find({'_id': {$in: questionIds}})
        if (questionsExist.length !== questionIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more provided questionIds are invalid or do not exist'
            })
        }
        const roomCode = nanoid(6).toUpperCase() // generating a unique room code
        const newRoom = new Room ({  // btw I could have just used savedRoom = Room.create({}) makes it easier
            roomCode,
            hostSocketId,
            questions: questionIds,
            participants: [],
            currentQustionIndex: 0,
            gameStarted: false,
            isActive: true,
            roomName: roomName || `Room ${roomCode}`

        })
        const savedRoom = await newRoom.save();
        res.status(201).json({
            success: true,
            message: 'Room created Successfully',
            data: {
                roomCode: savedRoom.roomCode,
                hostSocketId: savedRoom.hostSocketId,
                questions: savedRoom.questions,
                roomIds: savedRoom._id
            }
        })
    } catch (error) {
        console.error('Error creating room:', error)
        if (error.name === 'ValidationError') {  // this is an error hnadler for schema-level validation i.e if the schema couldn't save or perform an action
            return res.status(400).json({success: false, message: error.message})
        }

        res.status(500).json({
           success: false,
           message: 'Server error while creating room',
           error: error.message,
        })
        
    }
}