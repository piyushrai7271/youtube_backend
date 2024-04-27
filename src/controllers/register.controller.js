import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utills/cloudinary.js";

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
    throw new ApiError(404, "user does't exiest");
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


const logOut = asyncHandler(async(req,resp)=>{
   //clear cookie
   //clear refresh Token
})

export {
     registerUser,
     loginUser,
     logOut
};
