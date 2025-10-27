import { Router } from "express";
const router = Router()
import Post from "../controller/job-post/postController.js"
router.route("/").post((req,res,next)=>{
    const p =  new Post()
    return p.createPost(req,res,next)
})
router.route("/:job_id").delete((req,res,next)=>{
    const p =  new Post()
    return p.deletePost(req,res,next)
})
router.route("/:job_id").put((req,res,next)=>{
    const p =  new Post()
    return p.updatepost(req,res,next)
})

router.route("/jobs").get((req,res,next)=>{
    const p  = new Post()
    return p.viewJobPosts(req,res,next)
})

router.route("/jobs/:company_id").get((req,res,next)=>{
    const p  = new Post()
    return p.jobDetails(req,res,next)
})
router.route("/togglesavejob/:job_id").post((req,res,next)=>{
    const p = new Post()
    return p.toggleSaveJob(req,res,next)
})

router.route("/apply-job/:job_id").post((req,res,next)=>{
     const p = new Post()
    return p.applyJob(req,res,next)
})

router.route("/jobapplicants/:job_id").get((req,res,next)=>{
    const p = new Post()
    return p.jobApplicants(req,res,next)
})
router.route("/updateApplicationStatus/:application_id").post((req, res, next) => {
  const p = new Post();
  return p.updateApplicationStatus(req, res, next);
});

router.route("/jobPost/:job_id/shortlistedApplications").get((req, res, next) => {
  const p = new Post();
  return p.getShortlistedApplications(req, res, next);
});


router.route("/releted-jobs").get((req,res,next)=>{
    const p  = new Post()
    return p.reletedJobs(req,res,next)
})
export default router