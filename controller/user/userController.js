import axios from "axios";
import "../../routes/auth.js";
import { Base } from "../../service/base.js";
import { CONFIG } from "../../config/flavour.js";

export default class userController extends Base {
  constructor() {
    super();
  }
  async getFullProfile(req, res, next) {
  try {
    const user_id = req._id;
    console.log(user_id)

    // 🧠 1️⃣ Get basic user info
    const user = await this.selectOne(
      "SELECT id, fullname, email FROM users WHERE id = ?",
      [user_id]
    );

    if (!user) {
      this.s = 0;
      this.m = "User not found!";
      return this.send_res(res);
    }

    // 🧩 2️⃣ Get candidate details
    const candidateDetails = await this.selectOne(
      `SELECT id, title_headline, personal_website_url, profile_picture_url,
              nationality, date_of_birth, gender, marital_status, biography,
              profile_is_public, resume_is_private
       FROM candidate_details WHERE user_id = ?`,
      [user_id]
    );

    // 📄 3️⃣ Get all resumes
    const resumes = await this.select(
      `SELECT id, file_name, file_path, file_size_mb
       FROM candidate_resumes WHERE user_id = ? ORDER BY upload_date DESC`,
      [user_id]
    );

    // 🎓 4️⃣ Get all education entries
    const education = await this.select(
      `SELECT id, institution_name, degree_name, field_of_study,
              start_date, end_date, description
       FROM candidate_education WHERE user_id = ?`,
      [user_id]
    );

    // 💼 5️⃣ Get all experience entries
    const experience = await this.select(
      `SELECT id, job_title, company_name, location,
              start_date, end_date, description
       FROM candidate_experience WHERE user_id = ?`,
      [user_id]
    );

    // 🔗 6️⃣ Get social links
    const social_links = await this.select(
      `SELECT id, platform_name, profile_url
       FROM candidate_social_links WHERE user_id = ?`,
      [user_id]
    );

    // ☎️ 7️⃣ Get contact info
    const contact_info = await this.selectOne(
      `SELECT country_code, phone_number, email, location, latitude, longitude
       FROM candidate_contact_info WHERE user_id = ?`,
      [user_id]
    );

    // 🔔 8️⃣ Get job alerts & notifications
    const job_alerts = await this.selectOne(
      `SELECT alert_role, alert_location, latitude, longitude,
              notify_shortlisted, notify_applied_jobs_expire,
              notify_up_to_5_job_alerts, notify_employers_rejected,
              notify_employers_saved_profile
       FROM job_alerts_and_notifications WHERE user_id = ?`,
      [user_id]
    );

    // 🧩 Combine all
    const fullProfile = {
      user,
      candidate_details: candidateDetails || {},
      resumes: resumes || [],
      education: education || [],
      experience: experience || [],
      social_links: social_links || [],
      contact_info: contact_info || {},
      job_alerts_and_notifications: job_alerts || {},
    };

    this.s = 1;
    this.m = "Full profile fetched successfully!";
    this.r = fullProfile;
    return this.send_res(res);
  } catch (error) {
    console.error("Error fetching full profile:", error);
    this.s = 0;
    this.err = error.message;
    return this.send_res(res);
  }
}


async change_pass(req, res, next) {
  try {
    // Validate required password fields
    if (this.varify_req(req, ["old_pass", "new_pass", "confirm_pass"])) {
      this.s = 0;
      return this.send_res(res);
    }

    const { old_pass, new_pass, confirm_pass, profile_is_public, resume_is_private } = req.body;

    // Fetch user
    const user = await this.selectOne(
      "SELECT password FROM users WHERE id = ?",
      [req._id]
    );
    if (!user) {
      this.s = 0;
      this.m = "User not found!";
      return this.send_res(res);
    }

    // Confirm password match
    if (new_pass !== confirm_pass) {
      this.s = 0;
      this.m = "New password and confirm password do not match!";
      return this.send_res(res);
    }

    // Verify old password
    const isPasswordCorrect = this.check_password(user.password, old_pass);
    if (!isPasswordCorrect) {
      this.s = 0;
      this.m = "Old password is incorrect!";
      return this.send_res(res);
    }

    // Hash and update password
    const hashedPassword = await this.generate_password(new_pass);
    await this.update("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      req._id,
    ]);

    // ✅ Update profile privacy settings if provided
    if (typeof profile_is_public !== "undefined" || typeof resume_is_private !== "undefined") {
      const existingCandidate = await this.selectOne(
        "SELECT id FROM candidate_details WHERE user_id = ?",
        [req._id]
      );

      if (existingCandidate) {
        const fields = [];
        const values = [];

        if (typeof profile_is_public !== "undefined") {
          fields.push("profile_is_public = ?");
          values.push(profile_is_public);
        }

        if (typeof resume_is_private !== "undefined") {
          fields.push("resume_is_private = ?");
          values.push(resume_is_private);
        }

        if (fields.length > 0) {
          values.push(req._id); // for WHERE clause
          const updateQuery = `UPDATE candidate_details SET ${fields.join(", ")} WHERE user_id = ?`;
          await this.update(updateQuery, values);
        }
      }
    }

    this.s = 1;
    this.m = "Password and profile settings updated successfully!";
    return this.send_res(res);

  } catch (error) {
    console.error("Error in change_pass:", error);
    this.s = 0;
    this.m = "Something went wrong!";
    return this.send_res(res);
  }
}


 async personalDetails(req, res, next) {
  try {
    const user_id = req._id;
    const { title_headline, personal_website_url, resume_file_name } = req.body;

    let profile_picture_url = null;
    let resume_file_url = null;
    let resume_file_size = null;

    // 🖼️ Upload profile image if provided
    if (req.files && req.files.profile_picture_url) {
      profile_picture_url = await this.uploadToCloudinary(
        req.files.profile_picture_url,
        "candidate_profile_pictures"
      );
    }

    // 🧮 Convert bytes → MB
    const bytesToMegabytes = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

    // 📄 Upload resume if provided
    if (req.files && req.files.resume_file_url) {
      const file = req.files.resume_file_url;
      resume_file_url = await this.uploadToCloudinary(file, "candidate_resumes");
      resume_file_size = bytesToMegabytes(file.size);
    }

    // 🧩 Check if candidate_details exists
    const existingCandidate = await this.selectOne(
      "SELECT * FROM candidate_details WHERE user_id = ?",
      [user_id]
    );

    if (existingCandidate) {
      // If profile already exists and profile_picture not uploaded this time, keep old one
      if (!profile_picture_url && existingCandidate.profile_picture_url) {
        profile_picture_url = existingCandidate.profile_picture_url;
      }

      // 🔁 UPDATE
      await this.update(
        `UPDATE candidate_details 
         SET title_headline = ?, 
             personal_website_url = ?, 
             profile_picture_url = ? 
         WHERE user_id = ?`,
        [title_headline, personal_website_url, profile_picture_url, user_id]
      );
    } else {
      // 🆕 INSERT
      await this.insert(
        `INSERT INTO candidate_details 
         (user_id, title_headline, personal_website_url, profile_picture_url) 
         VALUES (?, ?, ?, ?)`,
        [user_id, title_headline, personal_website_url, profile_picture_url]
      );
    }

    // 🧾 Insert resume if uploaded and not duplicate
    if (resume_file_url) {
      const existingResume = await this.selectOne(
        `SELECT * FROM candidate_resumes 
         WHERE user_id = ? AND file_name = ? AND file_path = ?`,
        [user_id, resume_file_name, resume_file_url]
      );

      if (!existingResume) {
        await this.insert(
          `INSERT INTO candidate_resumes 
           (user_id, file_name, file_path, file_size_mb) 
           VALUES (?, ?, ?, ?)`,
          [user_id, resume_file_name, resume_file_url, resume_file_size]
        );
      } else {
        console.log("✅ Duplicate resume skipped (same user, file name, and URL).");
      }
    }

    this.s = 1;
    this.m = "Personal details saved successfully!";
    return this.send_res(res);
  } catch (error) {
    console.error(error);
    this.s = 0;
    this.err = error.message;
    return this.send_res(res);
  }
}


  async deleteResume(req, res, next) {
    try {
      const resume_id = req.params.resume_id;

      const existResume = await this.selectOne(
        "SELECT id FROM candidate_resumes WHERE id = ?",
        resume_id
      );
      if (!existResume) {
        this.s = 0;

        this.m = "resume not exist ";
        return this.send_res(res);
      }

      await this.delete("DELETE FROM candidate_resumes WHERE id = ?", [
        resume_id,
      ]);
      this.s = 1;
      this.m = "resume deleted successful ";
      return this.send_res(res);
    } catch (error) {
      this.s = 0;
      return this.send_res(res);
    }
  }

  async profileDetails(req, res, next) {
    try {
      const user_id = req._id;

      const {
        nationality,
        date_of_birth,
        gender,
        marital_status,
        biography,
        education,
        experience,
      } = req.body;

      // 🧩 Check if candidate_details exists
      const existingCandidate = await this.selectOne(
        "SELECT * FROM candidate_details WHERE user_id = ?",
        [user_id]
      );

      if (existingCandidate) {
        // ✅ Update candidate details
        await this.update(
          "UPDATE candidate_details SET nationality = ?, date_of_birth = ?, gender = ?, marital_status = ?, biography = ? WHERE user_id = ?",
          [
            nationality,
            date_of_birth,
            gender,
            marital_status,
            biography,
            user_id,
          ]
        );
      } else {
        // ✅ Insert new candidate details
        await this.insert(
          "INSERT INTO candidate_details (user_id, nationality, date_of_birth, gender, marital_status, biography) VALUES (?, ?, ?, ?, ?, ?)",
          [
            user_id,
            nationality,
            date_of_birth,
            gender,
            marital_status,
            biography,
          ]
        );
      }

      // 📘 Insert education entries (supporting multiple)
      if (Array.isArray(education)) {
        for (const edu of education) {
          await this.insert(
            "INSERT INTO candidate_education (user_id, institution_name, degree_name, field_of_study, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              user_id,
              edu.institution_name,
              edu.degree_name,
              edu.field_of_study,
              edu.start_date,
              edu.end_date,
              edu.description,
            ]
          );
        }
      }

      // 💼 Insert experience entries (supporting multiple)
      if (Array.isArray(experience)) {
        for (const exp of experience) {
          await this.insert(
            "INSERT INTO candidate_experience (user_id, job_title, company_name, location, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              user_id,
              exp.job_title,
              exp.company_name,
              exp.location,
              exp.start_date,
              exp.end_date,
              exp.description,
            ]
          );
        }
      }

      this.s = 1;
      this.m = "Personal details saved successfully!";
      return this.send_res(res);
    } catch (error) {
      console.error("Error saving profile details:", error);
      this.s = 0;
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async addSocialLinks(req, res, next) {
    try {
      const user_id = req._id;
      const { social_links } = req.body;

      if (!Array.isArray(social_links) || social_links.length === 0) {
        this.s = 0;
        this.m = "No social links provided.";
        return this.send_res(res);
      }

      for (const link of social_links) {
        const { platform_name, profile_url } = link;

     const existLink = await this.selectOne(
      "SELECT * FROM candidate_social_links WHERE user_id = ? AND platform_name = ? AND profile_url = ?  ",[user_id,platform_name,profile_url]
);


        if (!existLink) {
          await this.insert(
          "INSERT INTO candidate_social_links (user_id, platform_name, profile_url) VALUES (?, ?, ?)",
          [user_id, platform_name, profile_url]
        );
        }
        
      }

      this.s = 1;
      this.m = "Social links saved successfully!";
      return this.send_res(res);
    } catch (error) {
      console.error("Error adding social links:", error);
      this.s = 0;
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async addOrUpdateContactInfo(req, res, next) {
  try {
    const user_id = req._id;
    const {
      country_code,
      phone_number,
      email,
      location,
      latitude,
      longitude
    } = req.body;
    console.log(req.body)

    // Check if contact info already exists
    const existing = await this.selectOne(
      "SELECT * FROM candidate_contact_info WHERE user_id = ?",
      [user_id]
    );

    if (existing) {
      // Update existing contact info
      await this.update(
        `UPDATE candidate_contact_info
         SET country_code = ?, phone_number = ?, email = ?, location = ?, latitude = ?, longitude = ?
         WHERE user_id = ?`,
        [country_code, phone_number, email, location, latitude, longitude, user_id]
      );
    } else {
      // Insert new contact info
      await this.insert(
        `INSERT INTO candidate_contact_info
         (user_id, country_code, phone_number, email, location, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, country_code, phone_number, email, location, latitude, longitude]
      );
    }

    this.s = 1;
    this.m = "Contact information saved successfully.";
    return this.send_res(res);

  } catch (error) {
    console.error("Error saving contact info:", error);
    this.s = 0;
    this.err = error.message;
    return this.send_res(res);
  }
}

async addOrUpdateJobAlertsAndNotifications(req, res, next) {
  try {
    const user_id = req._id;

    const {
      alert_role,
      alert_location,
      latitude,
      longitude,
      notify_shortlisted,
      notify_applied_jobs_expire,
      notify_up_to_5_job_alerts,
      notify_employers_rejected,
      notify_employers_saved_profile
    } = req.body;

    const existing = await this.selectOne(
      "SELECT * FROM job_alerts_and_notifications WHERE user_id = ?",
      [user_id]
    );

    if (existing) {
      await this.update(
        `UPDATE job_alerts_and_notifications SET
          alert_role = ?, alert_location = ?, latitude = ?, longitude = ?,
          notify_shortlisted = ?, notify_applied_jobs_expire = ?, notify_up_to_5_job_alerts = ?,
          notify_employers_rejected = ?, notify_employers_saved_profile = ?
        WHERE user_id = ?`,
        [
          alert_role, alert_location, latitude, longitude,
          notify_shortlisted, notify_applied_jobs_expire, notify_up_to_5_job_alerts,
          notify_employers_rejected, notify_employers_saved_profile,
          user_id
        ]
      );
    } else {
      await this.insert(
        `INSERT INTO job_alerts_and_notifications (
          user_id, alert_role, alert_location, latitude, longitude,
          notify_shortlisted, notify_applied_jobs_expire, notify_up_to_5_job_alerts,
          notify_employers_rejected, notify_employers_saved_profile
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id, alert_role, alert_location, latitude, longitude,
          notify_shortlisted, notify_applied_jobs_expire, notify_up_to_5_job_alerts,
          notify_employers_rejected, notify_employers_saved_profile
        ]
      );
    }

    this.s = 1;
    this.m = "Job alerts and notifications updated successfully.";
    return this.send_res(res);

  } catch (error) {
    console.error("Error updating job alerts and notifications:", error);
    this.s = 0;
    this.err = error.message;
    return this.send_res(res);
  }
}



}
