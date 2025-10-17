import { Router } from "express";
const router = Router()
import Post from "../controller/post/postController.js"
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
export default router