import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/fileupload.cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens= async(userId)=>{
    try {
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        
        return {refreshToken,accessToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh token")
    }
}
const registerUser= asyncHandler(async (req,res)=>{
    
    //get user details from the frontend
    const{fullName,username,email,password}=req.body
   // console.log("email",email);
   // console.log("password",password)

   //validation check ->1.not empty etc.
    if(
        [fullName,username,email,password].some(
        (field)=>field?.trim()===""
        )
    ){
           throw new ApiError(400,"All fields are required");
    }

    //check if user already exits:1.username,2.email etc.
   const existedUser= await User.findOne({
            $or:[{username},{email}]
        })
     if (existedUser){
        throw new ApiError(409,"User with email or username already exits")
        
     }

     //check for images,check for avatar and localpath is known as server path not cloudinary server path.
    const avatarLocalpath= req.files?.avatar[0]?.path;
   // const coverImageLocalpath=req.files?.coverImage[0]?.path; this is not working for when converImage is not given.

   let coverImageLocalpath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalpath=req.files.coverImage[0].path;
   }

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
)})
const loginUser = asyncHandler(async (req,res)=>{ 
    //req body -> data
    const {email, username, password}=req.body;
    console.log(password,username);

    // username or email
    if(!(username || email)){
        throw new ApiError(400,"username or password is required");
    }
    //find the user
      const user=await User.findOne({
        $or: [{username},{email}]
    })
    console.log(user)
    if(!user){
        throw new ApiError(404,'User does not exist ');
    }
    // password check
    const isPasswordCorrect=await user.isPasswordCorrect(password);
    console.log(isPasswordCorrect)
    if(!isPasswordCorrect){
        throw new ApiError(404,"Invalid user credentials") 
    }

    //access and refresh token
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
     console.log(
    "yaitn"
     )
     //send cookie
    const loggedInUser=User.findById(user._id).
    select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged In Successfully"
        )
    )
})
const loggedOutUser=asyncHandler(async(req,res)=>{
  await  User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken:undefined
            }
        },
        {
            new:true
        }

    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    . status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out Successfully"))
})

const refreshAccessToken=asyncHandler(async(req,res=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken //this 2 option for  mobile
    if(!incomingRefreshToken){
        throw new ApiError("401","unauthorized request")
    }
   try {
     const decodeToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)//this is done for getting user from id.
     
     const user=User.findById(decodeToken?._id)
 
     if(!user){
         throw new ApiError("Invalid refresh token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken)
     {
         throw new ApiError("401","Refresh token is expried or used")
     }
 
     const options={
         httpOnly:true,
         secure:true
     }
     const {accessToken,newRefreshToken}=generateAccessAndRefreshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newRefreshToken,options)
     .json(
         new ApiResponse(
             200,
             {accessToken,refreshToken:newRefreshToken},
             "access token refreshed"
         )
     )
   } catch (error) {
     throw new ApiError(401,error?.message || "Invalid refresh token")
   }
}))

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;

    const user=await User.findById(req.user?._id)

    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password=newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password change successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body;

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user=User.findByIdAndUpdate(
        req.user?._id,
        { $set :{
            fullName,
            email:email
        }},
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Accont details update successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while upload avatar on cloudinary")
    }

   const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.usl
            }
        },
        {new:true}
    ).select("-password")
  
    return res
    .status(200)
    .json( new ApiResponse(200,user,"avatar update successfully") )
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while upload avatar on cloudinary")
    }

   const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
               } 
        },
        {new:true}
    ).select("-password")
  
    return res
    .status(200)
    .json(new ApiResponse(200,user,"cover Image  update successfully"))
})

export {
    registerUser,
    loginUser,
    loggedOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
}