import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
    },
    options: [{
        type: String,
        required: true,
    }],
    correctAnswer: {
        type: String,
        required: true,
    },
    category : {
        type: String,
        default: 'General',
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    timer: {
        type: Number,
        default: 30,
    },
    image: {
        type: String,
    },
    createdBy: {
        type: String,
        default: 'admin'
    },


}, {timestamps: true})

const question = mongoose.model('Question', questionSchema)

export default question