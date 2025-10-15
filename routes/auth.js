import { Router } from "express";
import Auth from "../controller/auth/authcontroller.js";
const router = Router();

router.route("/signup").post((req, res, next) => {
  const c = new Auth();
  return c.signup(req, res, next);
});

router.route("/verify-email").post((req,res,next)=>{
  const c = new Auth()
  return c.verifyEmail(req,res,next)
})
router.route("/resend-otp").post((req,res,next)=>{
  const c = new Auth()
  return c.resendOtp(req,res,next)
})
router.route("/login").post((req, res, next) => {
  const c = new Auth();
  return c.login(req, res, next);
});

router.route("/forgot_password").post((req,res,next)=>{
  const c = new Auth()
  return c.forgotPass(req,res,next);
})
router.route("/reset_password").post((req,res,next)=>{
  const c = new Auth()
  return c.resetPass(req,res,next);
})
export default router;
