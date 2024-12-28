import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/fileupload.cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser= asyncHandler(async (req,res)=>{
    
    //get user details from the frontend
    const{fullName,username,email,password}=req.body
    console.log("email",email);
    console.log("password",password)

   //validation check ->1.not empty etc.
    if(
        [fullName,username,email,password].some(
        (field)=>field?.trim()===""
        )
    ){
           throw new ApiError(400,"All fields are required");
    }

    //check if user already exits:1.username,2.email etc.
   const existedUser= User.findOne({
            $or:[{username},{email}]
        })
     if (existedUser){
        throw new ApiError(409,"User with email or username already exits")
        
     }

     //check for images,check for avatar and localpath is known as server path not cloudinary server path.
    const avatarLocalpath= req.files?.avatar[0]?.path;
    const coverImageLocalpath=req.files?.converImage[0]?.path;

    if(!avatarLocalpath){
        throw new ApiError(400,"Avatar file is required")
    }

    //uplaod them to cloudinary and check avatar again on cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalpath);
    const coverImage= await uploadOnCloudinary(coverImageLocalpath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

   //create user object -create entry in db.
  const user=await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.toLowerCase()
   })

   //remove password and refresh token field from response.
   const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
   )

   //check for user creation
   if(!createdUser)
   {
    throw new ApiError(500,"something went wrong while registring the user")
   }

   //return res
   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
   )
})

export {registerUser}