import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {
        videoFile:{
            type:String,//cloudinary url
            required:true
        },
        thumbnail:{
            type:String,
            required:true
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        title:{
            type:String,
            required:true,
            trim:true
        },
        description:{
            type:String,
            required:true,
        },
        duration:{
            type:Number,
        },
        views:{
            type:Number
        },
        isPublished:{
            type:Boolean,
            default:true
        }
    },
    {timestamps:true}
);

videoSchema.plugin(mongooseAggregatePaginate);


export const Video = mongoose.model("Video",videoSchema);