import room from "../models.js/room";
import participant from "../models.js/players";
import question from "../models.js/questions";

export const createRoom = async (req,res) => {
    try {
        const {roomName, questions} = req.body
        const newRoom = await room.create({
            
        })
    } catch (error) {
        
    }
}