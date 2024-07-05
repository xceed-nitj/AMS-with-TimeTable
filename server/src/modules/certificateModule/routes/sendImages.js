const express = require("express");
const imageRouter = express.Router();
const path = require("path")

imageRouter.get("/uploads/certificateModuleImages/*",(req,res)=>{
    try {
        const p = req.url
        const image = path.join(__dirname,"../../../../",p)
        const parts = image.split(".")
        if(parts[parts.length-1].toLocaleLowerCase()=="png" || parts[parts.length-1].toLocaleLowerCase()=="jpg" || parts[parts.length-1].toLocaleLowerCase()=="jpeg"){return res.sendFile(image)}
        else{
            res
            .status(400)
            .json({error:"invalid request"})
        }
    } catch (error) {
        console.log(error)
    }
})

module.exports = imageRouter