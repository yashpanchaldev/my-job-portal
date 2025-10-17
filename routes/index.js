import { authMiddleware } from "../middleware/auth.js";
import { Router } from "express";
import Auth from "./auth.js";
import User from "./user.js";
import Company from "./company.js";
import post from "./post.js";
const router = Router();

// without middleware routes
router.use("/auth", Auth);

// with middleware routes
router.use(authMiddleware);
router.use("/user", User);
router.use('/company',Company)
router.use('/post',post)
export default router;
