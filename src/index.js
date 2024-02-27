// require('dotenv').config({path:'./env'})
// new way to import dotenv

import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

connectDB();

































/*
(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error",(err)=>{
            console.log(`Error: ${err}`)
            throw err
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App started on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
})()

*/