import { Base } from "../../service/base.js";

export default class postController extends Base {
  async createPost(req, res, next) {
    try {
      const employer_id = req._id;

      // Step 1: Check if user is an employer
      const checkEmployer = await this.selectOne(
        "SELECT user_type FROM users WHERE id = ?",
        employer_id
      );

      if (!checkEmployer || checkEmployer.user_type !== "employer") {
        this.s = 0;
        this.err = "Unauthorized: Only employers can post jobs.";
        return this.send_res(res);
      }

      // Step 2: Check required fields
      const requiredFields = [
        "job_role",
        "job_title",
        "education",
        "experience",
        "vacancies",
        "job_type",
        "job_level",
        "apply_on",
        "description",
        "responsibilities",
        "company_id",
      ];

      if (this.varify_req(req, requiredFields)) {
        this.s = 0;
        this.err = "Missing required fields.";
        return this.send_res(res);
      }

      // Step 3: Extract and sanitize input
      const {
        company_id,
        job_title,
        tags,
        job_role,
        min_salary,
        max_salary,
        salary_type,
        education,
        experience,
        job_type,
        vacancies,
        expiration_date,
        job_level,
        apply_on,
        description,
        responsibilities,
      } = req.body;

      // Convert types
      const min_salary_num = min_salary ? parseFloat(min_salary) : null;
      const max_salary_num = max_salary ? parseFloat(max_salary) : null;
      const vacancies_num = parseInt(vacancies);
      const company_id_num = parseInt(company_id);

      if (isNaN(vacancies_num) || isNaN(company_id_num)) {
        this.s = 0;
        this.err = "Vacancies and company_id must be numeric.";
        return this.send_res(res);
      }

      // Step 4: Insert into job_posts table
      const insertQuery = `
                INSERT INTO job_posts (
                    employer_id, company_id, job_title, tags, job_role,
                    min_salary, max_salary, salary_type,
                    education, experience, job_type, vacancies, expiration_date,
                    job_level, apply_on, description, responsibilities
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

      const params = [
        employer_id,
        company_id_num,
        job_title,
        tags,
        job_role,
        min_salary_num,
        max_salary_num,
        salary_type,
        education,
        experience,
        job_type,
        vacancies_num,
        expiration_date,
        job_level,
        apply_on,
        description,
        responsibilities,
      ];

      const result = await this.insert(insertQuery, params);
      console.log(result);

      // Step 5: Send success response
      this.s = 1;
      this.m = "Job post created successfully";
      this.r = {
        job_id: result,
      };
      return this.send_res(res);
    } catch (error) {
      // Handle and return error
      this.s = 0;
      this.err = error.message;
      return this.send_res(res);
    }
  }
  async updatepost(req, res, next) {
    try {
      const employer_id = req._id;
      const { job_id } = req.params;

      // Step 1: Check if user is an employer
      const checkEmployer = await this.selectOne(
        "SELECT user_type FROM users WHERE id = ?",
        employer_id
      );

      if (!checkEmployer || checkEmployer.user_type !== "employer") {
        this.s = 0;
        this.err = "Unauthorized: Only employers can post jobs.";
        return this.send_res(res);
      }

      // Step 3: Extract and sanitize input
      const {
        company_id,
        job_title,
        tags,
        job_role,
        min_salary,
        max_salary,
        salary_type,
        education,
        experience,
        job_type,
        vacancies,
        expiration_date,
        job_level,
        apply_on,
        description,
        responsibilities,
      } = req.body;

      // Convert types
      const min_salary_num = min_salary ? parseFloat(min_salary) : null;
      const max_salary_num = max_salary ? parseFloat(max_salary) : null;
      const vacancies_num = parseInt(vacancies);
      const company_id_num = parseInt(company_id);

      if (isNaN(vacancies_num) || isNaN(company_id_num)) {
        this.s = 0;
        this.err = "Vacancies and company_id must be numeric.";
        return this.send_res(res);
      }

      // Step 4: Insert into job_posts table
      const insertQuery = `
                UPDATE  job_posts SET
                    employer_id = ?, company_id = ?, job_title = ?, tags =?, job_role = ?,
                    min_salary = ?, max_salary = ?, salary_type = ?,
                    education = ?, experience = ?, job_type = ?, vacancies = ?, expiration_date = ?,
                    job_level = ?, apply_on = ?, description = ?, responsibilities = ?
                    WHERE id = ?
         
            `;

      const params = [
        employer_id,
        company_id_num,
        job_title,
        tags,
        job_role,
        min_salary_num,
        max_salary_num,
        salary_type,
        education,
        experience,
        job_type,
        vacancies_num,
        expiration_date,
        job_level,
        apply_on,
        description,
        responsibilities,
        job_id,
      ];

      const result = await this.update(insertQuery, params);
      console.log(result);

      // Step 5: Send success response
      this.s = 1;
      this.m = "Job post updated successfully";
      this.r = {
        job_id: result,
      };
      return this.send_res(res);
    } catch (error) {
      // Handle and return error
      this.s = 0;
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async deletePost(req, res, next) {
    try {
      const employer_id = req._id;
      const { job_id } = req.params;

      if (!job_id) {
        this.s = 0;
        this.err = "Job ID is required.";
        return this.send_res(res);
      }

      // Check if the job belongs to the employer
      const job = await this.selectOne(
        "SELECT id FROM job_posts WHERE id = ? AND employer_id = ?",
        [job_id, employer_id]
      );

      if (!job) {
        this.s = 0;
        this.err = "Job not found or unauthorized.";
        return this.send_res(res);
      }

      // Hard delete — remove from DB
      await this.delete(
        "DELETE FROM job_posts WHERE id = ? AND employer_id = ?",
        [job_id, employer_id]
      );

      this.s = 1;
      this.m = "Job post deleted successfully.";
      return this.send_res(res);
    } catch (error) {
      this.s = 0;
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async viewJobPosts(req, res, next) {
    try {
      const candidate_id = req._id;

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      //   Step 1: Get candidate profile
      const profile = await this.selectOne(
        `SELECT cd.title_headline, ci.latitude, ci.longitude, ci.location
       FROM candidate_details cd
       LEFT JOIN candidate_contact_info ci ON cd.user_id = ci.user_id
       WHERE cd.user_id = ?`,
        [candidate_id]
      );

      if (!profile) {
        this.s = 0;
        this.err = "Candidate profile not found.";
        return this.send_res(res);
      }

      const searchKeyword = profile.title_headline?.trim(); 

      // Step 2: Base query - calculate relevance
      let baseQuery = `
      SELECT
          jp.*,
          u.company_name,
          CASE
              WHEN jp.job_title LIKE ? OR jp.job_role LIKE ? THEN 1
              ELSE 0
          END AS relevance
      FROM job_posts jp
      LEFT JOIN company_details u ON jp.company_id = u.id
      WHERE 1 = 1
    `;

      const params = [`%${searchKeyword}%`, `%${searchKeyword}%`];

      // Step 3: Optional filters
      if (req.query.location) {
        baseQuery += " AND jp.location = ?";
        params.push(req.query.location);
      }

      if (req.query.job_type) {
        baseQuery += " AND jp.job_type = ?";
        params.push(req.query.job_type);
      }

      if (req.query.min_salary) {
        baseQuery += " AND jp.min_salary >= ?";
        params.push(parseFloat(req.query.min_salary));
      }

      if (req.query.max_salary) {
        baseQuery += " AND jp.max_salary <= ?";
        params.push(parseFloat(req.query.max_salary));
      }

      if (req.query.job_level) {
        baseQuery += " AND jp.job_level = ?";
        params.push(req.query.job_level);
      }

      if (req.query.apply_on) {
        baseQuery += " AND jp.apply_on = ?";
        params.push(req.query.apply_on);
      }

      baseQuery += " ORDER BY relevance DESC, jp.created_at DESC";
      baseQuery += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      console.log(baseQuery);
      console.log(params);
      const jobs = await this.select(baseQuery, params);

      // Step 6: For loop to attach company_details
      for (let job of jobs) {
        const company_details = await this.selectOne(
          `SELECT cd.logo_image_url,cd.company_name,cd.industry_type, cc.location 
FROM company_details cd 
LEFT JOIN company_contact cc ON cd.id = cc.company_id 
WHERE cd.id = ?
`,
          [job.company_id]
        );

        job.company_details = company_details;
      }

      // Step 7: Response
      this.s = 1;
      this.m = "Job posts fetched successfully";
      this.r = {
        candidate_profile: profile,
        jobs,
      };

      return this.send_res(res);
    } catch (error) {
      this.s = 0;
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async jobDetails(req, res, next) {
    try {
      const company_id = req.params.company_id;

      if (!company_id) {
        this.s = 0;
        this.m = "Invalid company ID.";
        return this.send_res(res);
      }

      // Fetch company details
      const company = await this.selectOne(
        `SELECT * FROM company_details WHERE id = ?`,
        [company_id]
      );

      if (!company) {
        this.s = 0;
        this.m = "Company not found.";
        return this.send_res(res);
      }

      // Fetch social media links
      const socialLinks = await this.select(
        `SELECT platform_name, profile_url 
       FROM company_social_media 
       WHERE company_id = ?`,
        [company_id]
      );

      // Fetch contact information
      const contactInfo = await this.selectOne(
        `SELECT location, phone_number, email 
       FROM company_contact 
       WHERE company_id = ?`,
        [company_id]
      );

      // Structure the response object
      const response = {
        ...company,
        social_links: socialLinks || [],
        contact_info: contactInfo || {},
      };

      this.s = 1;
      this.m = "Company details fetched successfully.";
      this.r = response;
      return this.send_res(res);
    } catch (error) {
      this.s = 0;
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async toggleSaveJob(req, res, next) {
    try {
      const user_id = req._id; // Candidate's ID
      const { job_id } = req.params;

      if (!job_id) {
        this.s = 0;
        this.m = "Job ID is required.";
        return this.send_res(res);
      }

      // Check if job is already saved
      const existing = await this.selectOne(
        "SELECT * FROM saved_jobs WHERE user_id = ? AND job_id = ?",
        [user_id, job_id]
      );
      if (existing) {
        if (existing.status == 1) {
          await this.update("UPDATE saved_jobs SET status = 0 ", [
            user_id,
            job_id,
          ]);
          this.s = 1;
          this.m = "Job unsaved successfully.";
        } else {
          await this.update("UPDATE saved_jobs SET status = 1 ", [
            user_id,
            job_id,
          ]);
          this.s = 1;
          this.m = "Job unsaved successfully.";
        }
      } else {
        await this.insert(
          "INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)",
          [user_id, job_id]
        );
        this.s = 1;
        this.m = "Job saved successfully.";
      }

      return this.send_res(res);
    } catch (error) {
      this.s = 0;
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async applyJob(req,res,next){
    try {
      const candidate_id = req._id
      const job_id = req.params.job_id

      const {resume_id, cover_letter} = req.body

      console.log(req.body)
      console.log(job_id)

      if(this.varify_req(req, ['resume_id'])){
        this.s =0
        this.err = "Missing required fields."
        return this.send_res(res)
      }
      // Check if already applied
      const existing = await this.selectOne(
        "SELECT * FROM job_applications WHERE candidate_id = ? AND job_id = ?",
        [candidate_id, job_id]
      )
      if(existing){
        this.s =0
        this.err = "You have already applied for this job."
        return this.send_res(res)
      }

      await  this.insert(
        `INSERT INTO job_applications 
        (candidate_id, job_id, resume_id, cover_letter) 
        VALUES (?, ?, ?, ?)`,
        [candidate_id, job_id, resume_id, cover_letter]
      )
      this.s =1
      this.m ="Job application submitted successfully."
      return this.send_res(res)



      
    } catch (error) {
      this.s =0
      this.err = error.message
      return this.send_res(res)
    }
  }

  async jobApplicants(req,res,next){
    try {
      const employer_id = req._id
      const {job_id} = req.params
      // Verify that the job belongs to the employer
      const job = await this.selectOne(
        "SELECT id FROM job_posts WHERE id = ? AND employer_id = ?",
        [job_id, employer_id]
      )
      if(!job){
        this.s =0
        this.err = "Job not found or unauthorized."
        return this.send_res(res)
      }
      // Fetch applicants
      const applicants = await this.select(
        `SELECT ja.*, u.username, u.fullname, cd.title_headline
        FROM job_applications ja
        LEFT JOIN users u ON ja.candidate_id = u.id
        LEFT JOIN candidate_details cd ON ja.candidate_id = cd.user_id
        WHERE ja.job_id = ?`,
        [job_id]
      )
      this.s =1
      this.m ="Applicants fetched successfully."
      this.r = {applicants}
      return this.send_res(res)
      
    } catch (error) {
      this.s =0
      this.err = error.message
      return this.send_res(res)
      
    }  }
 
async updateApplicationStatus(req, res, next) {
  try {
    const employer_id = req._id;
    const { application_id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['shortlisted', 'rejected', 'hired'];

    // Validate status if provided
    if (status && !allowedStatuses.includes(status)) {
      this.s = 0;
      this.err = "Invalid status. Allowed values: shortlisted, rejected, hired.";
      return this.send_res(res);
    }

    // Validate application ownership
    const application = await this.selectOne(
      `SELECT ja.id FROM job_applications ja
       LEFT JOIN job_posts jp ON ja.job_id = jp.id
       WHERE ja.id = ? AND jp.employer_id = ?`,
      [application_id, employer_id]
    );

    if (!application) {
      this.s = 0;
      this.err = "Application not found or unauthorized.";
      return this.send_res(res);
    }

    // If status is provided, update
    if (status) {
      await this.update(
        "UPDATE job_applications SET status = ? WHERE id = ?",
        [status, application_id]
      );
      this.s = 1;
      this.m = `Applicant ${status} successfully.`;
    }

    return this.send_res(res);
  } catch (error) {
    this.s = 0;
    this.err = error.message;
    return this.send_res(res);
  }
}
async getShortlistedApplications(req, res, next) {
  try {
    const employer_id = req._id;
    const { job_id } = req.params;

    // First validate if this job belongs to the employer
    const job = await this.selectOne(
      "SELECT id FROM job_posts WHERE id = ? AND employer_id = ?",
      [job_id, employer_id]
    );
    console.log(job);

    if (!job) {
      this.s = 0;
      this.err = "Job post not found or unauthorized.";
      return this.send_res(res);
    }

    // Fetch all shortlisted applications for this job
    const shortlisted = await this.select(
      `SELECT ja.*, u.fullname AS applicant_name, r.file_path AS resume_path
       FROM job_applications ja
       LEFT JOIN users u ON ja.id = u.id
       LEFT JOIN candidate_resumes r ON ja.resume_id = r.id
       WHERE ja.job_id = ? AND ja.status = 'shortlisted'`,
      [job_id]
    );

    this.s = 1;
    this.r = shortlisted;
    return this.send_res(res);

  } catch (error) {
    this.s = 0;
    this.err = error.message;
    return this.send_res(res);
  }
}

async reletedJobs(req,res,next){
  try {
    
    const  user_id = req._id; 

    const userDetails = await this.selectOne("SELECT cd.title_headline,ci.location FROM candidate_details cd INNER JOIN candidate_contact_info ci ON cd.user_id = ci.user_id  WHERE cd.user_id = ?", [user_id]);
    if(!userDetails){      this.s =0
      this.err = "Candidate profile not found."
      return this.send_res(res)
    }
    const searchKeyword = userDetails.title_headline?.trim(); 
    const location = userDetails.location;  

    const relatedJobs = await this.select(
      `SELECT * FROM job_posts jp WHERE (jp.job_title LIKE ? OR jp.job_role LIKE ?) OR jp.location = ? ORDER BY jp.created_at DESC LIMIT 10`,
      [`%${searchKeyword}%`, `%${searchKeyword}%`, location]
      );
    this.s =1
    this.m ="Related jobs fetched successfully."
    this.r = {relatedJobs}
    return this.send_res(res)
  } catch (error) {
    this.s =0
    this.err = error.message
    return this.send_res(res)
  }

}
}
