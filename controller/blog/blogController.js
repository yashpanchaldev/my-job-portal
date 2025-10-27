import { Base } from "../../service/base.js";

export default class BlogController extends Base {
    // ✅ Create a new category (already done)
    async category(req, res, next) {
        try {
            const { name } = req.body;
            const user = req._id;

            const checkAdmin = await this.selectOne("SELECT * FROM users WHERE id = ? AND user_type = 'admin'", [user]);
            if (!checkAdmin) {
                this.s = 0;
                this.err = "Unauthorized access";
                return this.send_res(res);
            }

            if (this.varify_req(req, ["name"])) {
                this.s = 0;
                return this.send_res(res);
            }

            const slug = await this.generateSlug(name);
            const checkExist = await this.selectOne("SELECT * FROM blog_category WHERE slug = ?", [slug]);

            if (checkExist) {
                this.s = 0;
                this.m = "Category already exists";
                return this.send_res(res);
            }

            const insertId = await this.insert("INSERT INTO blog_category (name, slug) VALUES (?, ?)", [name, slug]);

            if (insertId) {
                this.m = "Category added successfully";
                this.r = { id: insertId, name, slug };
            } else {
                this.s = 0;
                this.err = "Failed to add category";
            }

            return this.send_res(res);
        } catch (error) {
            this.s = 0;
            this.err = error.message;
            return this.send_res(res);
        }
    }

    // ✅ Read all categories
    async getAllCategories(req, res, next) {
        try {
            const categories = await this.select("SELECT * FROM blog_category");
            this.r = categories;
            return this.send_res(res);
        } catch (error) {
            this.s = 0;
            this.err = error.message;
            return this.send_res(res);
        }
    }

    // ✅ Read a single category by ID
    async getCategoryById(req, res, next) {
        try {
            const { id } = req.params;
            const category = await this.selectOne("SELECT * FROM blog_category WHERE id = ?", [id]);

            if (!category) {
                this.s = 0;
                this.err = "Category not found";
                return this.send_res(res);
            }

            this.r = category;
            return this.send_res(res);
        } catch (error) {
            this.s = 0;
            this.err = error.message;
            return this.send_res(res);
        }
    }

    // ✅ Update category
    async updateCategory(req, res, next) {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const user = req._id;

            const checkAdmin = await this.selectOne("SELECT * FROM users WHERE id = ? AND user_type = 'admin'", [user]);
            if (!checkAdmin) {
                this.s = 0;
                this.err = "Unauthorized access";
                return this.send_res(res);
            }

            if (this.varify_req(req, ["name"])) {
                this.s = 0;
                return this.send_res(res);
            }

            const slug = await this.generateSlug(name);
            const updated = await this.update("UPDATE blog_category SET name = ?, slug = ? WHERE id = ?", [name, slug, id]);

            if (updated) {
                this.m = "Category updated successfully";
                this.r = { id, name, slug };
            } else {
                this.s = 0;
                this.err = "Failed to update category";
            }

            return this.send_res(res);
        } catch (error) {
            this.s = 0;
            this.err = error.message;
            return this.send_res(res);
        }
    }

    // ✅ Delete category
    async deleteCategory(req, res, next) {
        try {
            const { id } = req.params;
            const user = req._id;

            const checkAdmin = await this.selectOne("SELECT * FROM users WHERE id = ? AND user_type = 'admin'", [user]);
            if (!checkAdmin) {
                this.s = 0;
                this.err = "Unauthorized access";
                return this.send_res(res);
            }

            const deleted = await this.delete("DELETE FROM blog_category WHERE id = ?", [id]);

            if (deleted) {
                this.m = "Category deleted successfully";
            } else {
                this.s = 0;
                this.err = "Failed to delete category or already deleted";
            }

            return this.send_res(res);
        } catch (error) {
            this.s = 0;
            this.err = error.message;
            return this.send_res(res);
        }
    }
}
