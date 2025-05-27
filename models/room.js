import mongoose from "mongoose";
import participant from "./players.js";

const roomShema = new mongoose.Schema({
    roomCode: {
    type:String,
    required: true,
    unique: true,
    uppercase: true
    },
    hostSocketId: {
        type: String,
        required: true,
    },
    participants : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'participant',
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    questions:[{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'question'
    }],
    currentQuestionIndex: {
        type: Number,
        default: 0,
    },
    gameStarted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const Room = new mongoose.model('Room', roomShema)
export default Room