import { Router } from "express";
import {verifyJwt} from "../middlewares/auth.middlewares.js"
import { healthcheck } from "../controllers/healthcheck.controller.js";
const router = Router()

router.route("/helth-check").get(verifyJwt,healthcheck)
export default router