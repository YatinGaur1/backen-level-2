import jwt from "jsonwebtoken";
import mongoose,{Schema} from "mongoose";
import bcrypt  from " bcrypt";

const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
    },
    avatar:{
        type:String, // cloudnary url
        required:true
    },
    coverImage:{
        type:String//cloudnary url 
    },
    wathcHistory:[
        {
            type:Schema.Types.ObjectId,
            rer:"video"
        }
    ],
    password:{
        type:String,
        required:[true,"password is required"]
    },
    refreshToken:{
        type:String,

    }
},
{
    timestamps:true
}
)
userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();

    this.password=bcrypt.hash(this.password,10)//mean 10 round of decrpt process run
    next();
})
userSchema.methods.isPasswordCorrect=async function(password) {
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
        _id:this._id,
        fullName:this.fullName,
        email:this.email,
        username:this.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}
export const User=mongoose.model("User",userSchema)