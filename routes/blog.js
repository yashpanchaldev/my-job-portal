import { Router } from "express";
import Company from "../controller/blog/blogController.js";
const router = Router();

router.route("/cat").post((req, res, next) => {
  const c = new Company();
  return c.category(req, res, next);
});

export default router;
