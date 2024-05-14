import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";2611

const  userSchema = new mongoose.Schema(
    {
        userName:{
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
            index:true
        },
        fullName:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
        },
        avatar:{
            type:String,// cloudinary url
            required:true
        },
        coverImage:{
            type:String,// cloudinary url
            required:true
        },
        password:{
            type:String,
            required:[true,"password is required"]
        },
        refreshToken:{
            type:String
        },
        watchHistory:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
        
    },
    {timestamps:true}
);

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password  = await bcrypt.hash(this.password,10);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return  await  bcrypt.compare(password.toString(),this.password);
}


userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            userName:this.userName,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
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


export const User = mongoose.model("User",userSchema);