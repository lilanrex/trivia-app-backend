import mongoose from "mongoose";
import { Socket } from "socket.io";

const participantSchema = new mongoose.Schema({
    username: {
        type: String,
        default: 'Anonymous',
    },
    socketId: {
        type: String,
        required: true,
    },
    score: {
        type: Number,
        default: 0,
    },
   roomCode: {
    type: String,
    required: true,
   },
}, {timestamps: true})

const participant = mongoose.model("participant", participantSchema)

export default participant