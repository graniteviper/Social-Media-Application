import express from "express";
import { login, sendotp, verifyOTP } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/login", login);
router.post("/sendotp", sendotp);
router.post("/verifyOTP",verifyOTP);

export default router;
