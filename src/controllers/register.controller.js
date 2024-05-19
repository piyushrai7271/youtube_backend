import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utills/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "somthing went worng while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, resp) => {
  const { fullName, email, userName, password } = req.body;

  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(404, "These fields Must not be empty");
  }

  const existedUser = await User.findOne({
    $or: [{ userName, email }],
  });

  if (existedUser) {
    throw new ApiError(401, "userName and email must be Unique");
  }

  const avatarlocalPath = req.files?.avatar[0]?.path;
  const coverImageocalPath = req.files?.coverImage[0]?.path;

  console.log(avatarlocalPath);

  if (!avatarlocalPath) {
    throw new ApiError(409, "avatar local path is missing");
  }

  const avatar = await uploadOnCloudinary(avatarlocalPath);
  const coverImage = await uploadOnCloudinary(coverImageocalPath);

  console.log(avatar);

  if (!avatar) {
    throw new ApiError(404, "Avatar is required");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    userName: userName.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "somthing went wrong");
  }

  return resp
    .status(200)
    .json(new ApiResponse(200, createdUser, "user register successfully"));
});
 
const loginUser = asyncHandler(async (req, resp) => {
  //get data from (req.body)
  const { userName, email, password } = req.body;

  //make login on basic of username,email
  if (!(userName || email)) {
    throw new ApiError(401, "Username or email is not present");
  }
  //check user is present or not and if not send error message
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does't exiest with this userName and email");
  }

  //check password is correct or not
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is not Valid");
  }
  //if password is correct provide access and refresh token

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //send cookie
  // for sending cookies we have to desine some options
  const options = {
    // now these cookies can only modified from server
    httpOnly: true,
    secure: true,
  };

  //send response

  return resp
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: accessToken,
          refreshToken,
          loggedInUser,
        },
        "user loggedIn successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, resp) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return resp
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User LogedOut"));
});

const refreshAccessToken = asyncHandler(async (req, resp) => {

  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(404, "Unauthorize access");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodedToken) {
      throw new ApiError(402, "decoded token is not comming");
    }

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(404, "invalid refreshToken");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(405, "RefreshToken is expired or used");
    }

    const { accessToken, newRefreshToken } = generateAccessAndRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return resp
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "refreshToken Token is refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(404, error?.message || "invalide refreshToken");
  }
});

const changeCurrentPassword = asyncHandler(async (req, resp) => {
  
  const { oldPassword, newPassword } = req.body;

  if (!(oldPassword && newPassword)) {
    throw new ApiError(402, "these fields are required");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(401, "user does't exist");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return resp.status(200).json(new ApiResponse(200, {}, "password is changed"));
});

const getCurrentUser = asyncHandler(async (req, resp) => {
  return resp.status(200).json(200, req.user, "current user fetched");
});

const updateAccountDetails = asyncHandler(async (req, resp) => {
  const { fullName, email } = req.body;

  if (!(fullName && email)) {
    throw new ApiError(404, "Fullname or email is missing");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      fullName,
      email,
    },
    {
      new: true,
    }
  ).select("-password");

  return resp
    .status(200)
    .json(new ApiResponse(200, user, "Account detail updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, resp) => {

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(402, "Avatar Local path is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (avatar.url) {
    throw new ApiError(403, "Avatar url is missing");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return resp
    .status(200)
    .json(new ApiResponse(200, user, "User Avatar is changed"));
});


const updateUserCoverImage = asyncHandler(async (req, resp) => {

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(402, "Cover Image Local path is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (coverImage.url) {
    throw new ApiError(403, "Cover Image url is missing");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return resp
    .status(200)
    .json(new ApiResponse(200, user, "cover Image is updated"));
});


const getUserChannelProfile = asyncHandler(async(req,resp)=>{
    
    const {userName} = req.params;

    if(!userName){
       throw new ApiError(401,"userName is missing")
    }

    const channel = await User.aggregate([
       {
        $match:{
           userName:userName?.toLowerCase(),
        }
       },
       {
         $lookup:{
           from:"subscriptions",
           localField:"_id",
           foreignField:"channel",
           as:"Subscribers"
         }
       },
       {
        $lookup:{
          from:"subscriptions",
          localField:"_id",
          foreignField:"subscriber",
          as:"SubscribedTo"
        }
       },
       {
        $addFields:{
          subscriptionCount:{
            $size:"$Subscribers"
          },
          channelSubscribedToCount:{
            $size:"$SubscribedTo"
          },
          isSubscribed:{
            $cond:{
               if:{$in:[req.user?._id,"$Subscribers.subscriber"]},
               then:true,
               else:false
            }
          }
        }
       },
       {
        $project:{
          userName:1,
          fullName:1,
          email:1,
          avatar:1,
          coverImage:1,
          subscriptionCount:1,
          channelSubscribedToCount:1,
          isSubscribed:1
        }
       } 
    ])

    if(!channel){
       throw new ApiError(400,"channel is missing")
    }

    return resp.status(201)
               .json(
                new ApiResponse(
                  200,channel[0]," user channel Profile is fetched successfully"
                )
               )
})

const getWatchHistory = asyncHandler(async(req,resp)=>{

   const user = await User.aggregate([
      {
        $match:{
          _id: new mongoose.Types.ObjectId(req.user._id)
       }
      },
      {
        $lookup:{
          from:"videos",
          localField:"",
          foreignField: "_id",
          as:"watchHistory",
          pipeline:[
            {
              $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                  {
                    $project:{
                      fullName:1,
                      userName:1,
                      avatar:1
                    }
                  }
                ]
              }
            },
            {
              $addFields:{
                owner:{
                  $first: "$owner"
                }
              }
            }
          ]
        }
      }
   ])

   if(!user){
     throw new ApiError(401,"user is missing from watch history")
   }

   return resp.status(200)
              .json(
                new ApiResponse(
                  201,user[0].watchHistory,
                  "Watch history is fetched succesfully"
                )
              )
})



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
