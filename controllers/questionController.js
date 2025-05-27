import question from "../models/questions.js";
//import question from "../models.js/questions.js";

export const createQuestion = async (req,res) => {
    try {
        const {
            questionText,
            options,
            correctAnswer,
            category,
            difficulty,
            timer,
        } = req.body // so I'm destructuring the expected fields from the request body

        if (!questionText || !options || !correctAnswer) {
            return res.status(400).json({
                success: false,
                message: 'Please provide questionText, options and correctAnswer'
            })
        }
        if(!Array.isArray(options)|| options.length < 2) {
            return res.status(400).json({
                success: false, 
                message: 'Options must be an array with at least 2 choices'
            })
        }
        if(!options.includes(correctAnswer)) {
            res.status(400).json({
                success: false,
                message: 'Correct answer must be one of the provided options'
            })
        }

        const savedQuestion = await question.create({
            questionText,
            options,
            correctAnswer,
            category,
            difficulty,
            timer
        })

        console.log(savedQuestion)

        res.status(201).json({
            success: true,
            message: 'Question created successfully',
            data: savedQuestion
        })
    } catch (error) {
        console.error('Error creating question: ', error)
        if(error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'validation Error: ' + error.message,
                error: error.errors // this logs all validator errors if encountered
            })
        }
        res.status(500).json({
            success:false,
            message: 'server error while creating question',
            error: error.message,
        })
        
    }
}

export const getAllQuestions = async (req,res) => {
    try {
        const questions = await question.find({})
        res.status(200).json({
            success: true,
            count: questions.length,
            data: questions
        })
    } catch (error) {
        console.error('error fetching questions: ', error)
        res.status(500).json({
            success: false,
            message: 'server error while fetching questions',
            error: error.message,
        })
    }
}