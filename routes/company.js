import { Router } from "express";
import Company from "../controller/company/companyController.js";
const router = Router();

router.route("/compnay-info").post((req, res, next) => {
  const c = new Company();
  return c.AddCompanyInfo(req, res, next);
});
router.route("/founding-info").post((req, res, next) => {
  const c = new Company();
  return c.AddFoundingInfo(req, res, next);
});

router.route("/social-media").post((req, res, next) => {
  const c = new Company();
  return c.addSocialmedia(req, res, next);
});
router.route("/contact").post((req, res, next) => {
  const c = new Company();
  return c.addOrUpdateContactInfo(req, res, next);
});


export default router;
