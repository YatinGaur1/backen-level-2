import {Router} from "express"
import {registerUser} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middlewares.js"

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
export default router;