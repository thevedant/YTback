import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express()
app.use(cors({
    origin:process.env.CORS_ORIGIN
    
}))

app.use(express.json({limit: "15kb"}))
app.use(express.urlencoded({extended:true  , limit : "15kb"}))
app.use(express.static("public"))
app.use(cookieParser());


// routes import
import userRouter from "./routes/user.routes.js"

//declaration
app.use("/api/v1/users" , userRouter)

// http://localhost:8000/api/v1/users/(route in userRouter)

export { app }