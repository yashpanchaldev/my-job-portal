import { Router } from "express";
import User from "../controller/user/userController.js";
const router = Router();

router.route("/profile").get((req,res,next)=>{
  const c = new User()
  return c.getFullProfile(req,res,next);
})

router.route("/personal").post((req,res,next)=>{
  const c = new User()
  return c.personalDetails(req,res,next);
})

router.route("/profile").post((req,res,next)=>{
  const c = new User()
  return c.profileDetails(req,res,next)
})

router.route("/social-link").post((req,res,next)=>{
  const c = new User()
  return c.addSocialLinks(req,res,next)
})
router.route("/delete-resume/:resume_id").delete((req,res,next)=>{
  const c = new User()
  return c.deleteResume(req,res,next);
})


router.route("/add-contact-info").post((req,res,next)=>{
  const c = new User()
  return c.addOrUpdateContactInfo(req,res,next)
})
router.route("/notify-alert").post((req,res,next)=>{
  const c = new User()
  return c.addOrUpdateJobAlertsAndNotifications(req,res,next)
})
router.route("/change_pass").post((req,res,next)=>{
  const c = new User()
  return c.change_pass(req,res,next);
})



export default router;
