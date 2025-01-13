import {Router} from "express"
import {loginUser,loggedOutUser,registerUser} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middlewares.js"
import{verifyJWT} from "../middlewares/auth.middlewares.js"

const router=Router();
router.route("/register").post(
    upload.fields(//inject middleware
    [
        {
            name:"avatar",
            maxCount:1//how many file you want like image file etc
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]
),registerUser
)
//secure login
router.route("/logIn").post(loginUser)
//secure logOut
router.route("/logOut").post(verifyJWT , loggedOutUser)
export default router;