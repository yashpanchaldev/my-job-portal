import { Base } from "../../service/base.js";

export default class CompnayController extends Base {
  constructor() {
    super();
  }
  async AddCompanyInfo(req, res, next) {
    try {
      const user_id = req._id;
      // console.log(req.files)

      const checkEmployer = await this.selectOne(
        "SELECT user_type FROM users WHERE id = ?",
        [user_id]
      );

      if (checkEmployer.user_type !== "employer") {
        this.s = 0;
        this.m = "Don't have access to add company.";
        return this.send_res(res);
      }

      let logo_image_url = null;
      let banner_image_url = null;

      if (req.files && req.files.logo_image_url) {
        logo_image_url = await this.uploadToCloudinary(
          req.files.logo_image_url,
          "logo_image_url"
        );
      }

      if (req.files && req.files.banner_image_url) {
        banner_image_url = await this.uploadToCloudinary(
          req.files.banner_image_url,
          "banner_image_url"
        );
      }

      const { company_name, about_us } = req.body;

      const existingCompany = await this.selectOne(
        "SELECT * FROM company_details WHERE user_id = ?",
        [user_id]
      );

      if (existingCompany) {
        // Update the existing company details
        await this.update(
          "UPDATE company_details SET company_name = ?, about_us = ?, logo_image_url = COALESCE(?, logo_image_url), banner_image_url = COALESCE(?, banner_image_url) WHERE user_id = ?",
          [company_name, about_us, logo_image_url, banner_image_url, user_id]
        );
        this.s = 1;
        this.m = "Company details updated successfully.";
      } else {
        // Insert new company details
        await this.insert(
          "INSERT INTO company_details (user_id, company_name, logo_image_url, banner_image_url, about_us) VALUES (?, ?, ?, ?, ?)",
          [user_id, company_name, logo_image_url, banner_image_url, about_us]
        );
        this.s = 1;
        this.m = "Company details added successfully.";
      }

      return this.send_res(res);
    } catch (error) {
      this.s = 0;
      this.err = error.message;
      return this.send_res(res);
    }
  }
 async AddFoundingInfo(req, res, next) {
    try {
        const user_id = req._id;

        const checkEmployer = await this.selectOne("SELECT user_type FROM users WHERE id = ?", [user_id]);

        if (checkEmployer.user_type !== "employer") {
            this.s = 0;
            this.m = "Don't have access to add company.";
            return this.send_res(res);
        }

        const {
            company_id ,
            organization_type,
            industry_type,
            team_size,
            year_of_establishment,
            company_website_url,
            company_vision
        } = req.body;

        // Check if the company details already exist for this user
        const existingCompany = await this.selectOne(
            "SELECT * FROM company_details WHERE id = ?",
            [company_id]
        );

        if (existingCompany) {
            // Update the existing company details with founding info
            await this.update(
                `UPDATE company_details 
                 SET 
                    organization_type = ?,
                    industry_type = ?,
                    team_size = ?,
                    year_of_establishment = ?,
                    company_website_url = ?,
                    company_vision = ?
                 WHERE id = ?`,
                [
                    organization_type,
                    industry_type,
                    team_size,
                    year_of_establishment,
                    company_website_url,
                    company_vision,
                    company_id
                ]
            );
            this.s = 1;
            this.m = "Founding details updated successfully.";
        } else {
            this.s = 0;
            this.m = "Company not found. Please add basic company info first.";
        }
        
        return this.send_res(res);

    } catch (error) {
        this.s = 0;
        this.err = error.message;
        return this.send_res(res);
    }
}
async addSocialmedia(req, res, next) {
    try {
      const user_id = req._id;
      const { social_links,company_id } = req.body;

      if (!Array.isArray(social_links) || social_links.length === 0) {
        this.s = 0;
        this.m = "No social links provided.";
        return this.send_res(res);
      }

      for (const link of social_links) {
        const { platform_name, profile_url } = link;

     const existLink = await this.selectOne(
      "SELECT * FROM company_social_media WHERE company_id = ? AND platform_name = ? AND profile_url = ?  ",[company_id,platform_name,profile_url]
);


        if (!existLink) {
          await this.insert(
          "INSERT INTO company_social_media (company_id, platform_name, profile_url) VALUES (?, ?, ?)",
          [company_id, platform_name, profile_url]
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
    const {company_id,
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
      "SELECT * FROM company_contact WHERE company_id = ?",
      [company_id]
    );

    if (existing) {
      // Update existing contact info
      await this.update(
        `UPDATE company_contact
         SET country_code = ?, phone_number = ?, email = ?, location = ?, latitude = ?, longitude = ?
         WHERE company_id = ?`,
        [country_code, phone_number, email, location, latitude, longitude, company_id]
      );
    } else {
      // Insert new contact info
      await this.insert(
        `INSERT INTO company_contact
         (company_id, country_code, phone_number, email, location, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [company_id, country_code, phone_number, email, location, latitude, longitude]
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
// Get all companies with details
async getAllCompanies(req, res, next) {
  try {
    const companies = await this.select(`SELECT * FROM company_details`);

    for (let company of companies) {
      const companyId = company.id;

      const contact = await this.selectOne(
        `SELECT * FROM company_contact WHERE company_id = ?`,
        [companyId]
      );

      const socials = await this.select(
        `SELECT platform_name, profile_url FROM company_social_media WHERE company_id = ?`,
        [companyId]
      );

      company.contact_info = contact || null;
      company.social_links = socials || [];
    }

    this.s = 1;
    this.r = companies;
    this.m = "Companies fetched successfully.";
    return this.send_res(res);

  } catch (error) {
    this.s = 0;
    this.err = error.message;
    return this.send_res(res);
  }

  
}
// Get company info and all jobs posted by that company
async getCompanyWithJobs(req, res, next) {
  try {
    const company_id = req.params.company_id;

    const company = await this.selectOne(
      `SELECT * FROM company_details WHERE id = ?`,
      [company_id]
    );

    if (!company) {
      this.s = 0;
      this.m = "Company not found.";
      return this.send_res(res);
    }

    const jobs = await this.select(
      `SELECT * FROM job_posts WHERE company_id = ?`,
      [company_id]
    );

    company.jobs = jobs || [];

    const contact = await this.selectOne(
      `SELECT * FROM company_contact WHERE company_id = ?`,
      [company_id]
    );

    const socials = await this.select(
      `SELECT platform_name, profile_url FROM company_social_media WHERE company_id = ?`,
      [company_id]
    );

    company.contact_info = contact || null;
    company.social_links = socials || [];

    this.s = 1;
    this.r = company;
    this.m = "Company and jobs fetched successfully.";
    return this.send_res(res);

  } catch (error) {
    this.s = 0;
    this.err = error.message;
    return this.send_res(res);
  }
}




}
