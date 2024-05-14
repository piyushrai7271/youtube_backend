import { Router } from "express";
import {upload} from "../middleware/multer.middleware.js";
import { registerUser,loginUser,logoutUser,refreshAccessToken } from "../controllers/register.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secure router

router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-Token").post(refreshAccessToken);


export default router;