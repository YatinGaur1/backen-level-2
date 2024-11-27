//require('dotenv').config({path:"./env"})

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js"


dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("EXPRESS ERRR..",error);
        throw error;
    })
    app.listen(process.env.PORT||5000,()=>{
        console.log(`server is running on port:${process.env.PORT}`); 
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed !!!",err);
})

















// import express from "express"

// const app=express();

// ;(async ()=>{
//  try {
//    await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)//connect of database
//    app.on("error",(error)=>{
//     console.log("ERROR",error)
//     throw error;
//    })
//    app.listen(process.env.PORT,()=>{
//     console.log(`app is listening on port ${process.env.PORT}`)
//    })

//  } catch (error) {
//     console.error("ERROR",error);
//     throw error;
//  }
// }
// )()