import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT=asyncHandler(async(req,_,next)=>{//if res not user then you can convert it by _
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
         
        if(!token){
            throw new ApiError(401,"unauthorized request")
        }

        const decodeToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

        const user=await User.findById(decodeToken?._id).select("-password -refreshToken")

        if(!user){
            //nextvideo:discuss about frontend
            throw new ApiError(401,"Invalid Access Token")
        }

        req.user=user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message ||"Invalid access token")
    }
})