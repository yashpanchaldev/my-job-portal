import axios from "axios";
import "../../routes/auth.js";
import { Base } from "../../service/base.js";
import MailService from "../../service/mail.js";


export default class AuthController extends Base {
  constructor() {
    super();
  }


async signup(req, res, next) {
  try {
    if (this.varify_req(req, ["fullname", "username", "email", "user_type", "password"])) {
      this.s = 0;
      return this.send_res(res);
    }

    const { username, fullname, email, password, user_type } = req.body;

    const existingUsername = await this.selectOne("SELECT id FROM users WHERE username = ?", [username]);
    if (existingUsername) {
      this.s = 0;
      this.m = "This username is already taken.";
      return this.send_res(res);
    }

    const existingEmail = await this.selectOne("SELECT id FROM users WHERE email = ?", [email]);
    if (existingEmail) {
      this.s = 0;
      this.m = "This email address is already registered.";
      return this.send_res(res);
    }

    const hashedPassword = this.generate_password(password);

    const userId = await this.insert(
      "INSERT INTO users (username, email, fullname, password, user_type, email_verified) VALUES (?, ?, ?, ?, ?, ?)",
      [username, email, fullname, hashedPassword, user_type, 0]
    );

    if (!userId) {
      this.s = 0;
      this.m = "Signup failed. Please try again.";
      return this.send_res(res);
    }

    const apikey = this.generate_apikey(userId);
    const token = this.generate_token(userId);

    await this.insert(
      "INSERT INTO user_auth (user_id, apikey, token) VALUES (?, ?, ?)",
      [userId, apikey, token]
    );

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiryTimestamp = Date.now() + 10 * 60 * 1000;

    const otpHash = this.generateOtpHash(email, otp, expiryTimestamp);

    await this.update(
      `UPDATE user_auth 
       SET otp_hash = ?, otp_expires_at = ?, otp_verified = 0 
       WHERE user_id = ?`,
      [otpHash, expiryTimestamp, userId]
    );

    const mailService = new MailService();
    await mailService.sendMail({
      to: email,
      subject: "Verify Your Email - My Job Post",
      templateName: "verifyEmail",
      data: { email, otp },
    });

    const userInfo = await this.selectOne(
      "SELECT id, user_type, username, email, created_at FROM users WHERE id = ?",
      [userId]
    );

    const authInfo = await this.selectOne(
      "SELECT apikey, token FROM user_auth WHERE user_id = ?",
      [userId]
    );

    userInfo.user_auth = authInfo;

    this.s = 1;
    this.m = "Signup successful! Please check your email to verify your account.";
    this.r = userInfo;
    return this.send_res(res);

  } catch (err) {
    console.error("Signup Error:", err);
    this.s = 0;
    this.m = "An error occurred during signup.";
    this.err = err.message;
    return this.send_res(res);
  }
}



async verifyEmail(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (this.varify_req(req, ["email", "otp"])) {
      this.s = 0;
      this.m = "Email and OTP are required.";
      return this.send_res(res);
    }

    const user = await this.selectOne("SELECT id FROM users WHERE email = ?", [email]);
    if (!user) {
      this.s = 0;
      this.m = "User not found.";
      return this.send_res(res);
    }

    const auth = await this.selectOne(
      `SELECT otp_hash, otp_expires_at, otp_verified 
       FROM user_auth WHERE user_id = ?`,
      [user.id]
    );

    if (!auth || auth.otp_verified || Number(auth.otp_expires_at) < Date.now()) {
      this.s = 0;
      this.m = "OTP has expired or already verified.";
      return this.send_res(res);
    }

    const calculatedHash = this.generateOtpHash(email, otp, auth.otp_expires_at);

    if (calculatedHash !== auth.otp_hash) {
      this.s = 0;
      this.m = "Invalid OTP.";
      return this.send_res(res);
    }

    await this.update("UPDATE users SET email_verified = 1 WHERE id = ?", [user.id]);
    await this.update("UPDATE user_auth SET otp_verified = 1 WHERE user_id = ?", [user.id]);

    this.s = 1;
    this.m = "Email successfully verified.";
    return this.send_res(res);

  } catch (err) {
    console.error("Verify Email Error:", err);
    this.s = 0;
    this.m = "An error occurred during email verification.";
    this.err = err.message;
    return this.send_res(res);
  }
}


async resendOtp(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      this.s = 0;
      this.m = "Email is required.";
      return this.send_res(res);
    }

    const user = await this.selectOne("SELECT id, email_verified FROM users WHERE email = ?", [email]);

    if (!user) {
      this.s = 0;
      this.m = "No user found with this email address.";
      return this.send_res(res);
    }

    if (user.email_verified) {
      this.s = 0;
      this.m = "This email is already verified.";
      return this.send_res(res);
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiryTimestamp = Date.now() + 10 * 60 * 1000;

    const hash = this.generateOtpHash(email, otp, expiryTimestamp);

    await this.update(
      `UPDATE user_auth 
       SET otp_hash = ?, otp_expires_at = ?, otp_verified = 0 
       WHERE user_id = ?`,
      [hash, expiryTimestamp, user.id]
    );

    const mailService = new MailService();
    await mailService.sendMail({
      to: email,
      subject: "Resend OTP - Verify Your Email | My Job Post",
      templateName: "verifyEmail",
      data: { email, otp }
    });

    this.s = 1;
    this.m = "A new OTP has been sent to your email address.";
    return this.send_res(res);

  } catch (err) {
    console.error("Resend OTP Error:", err);
    this.s = 0;
    this.m = "An error occurred while resending OTP.";
    this.err = err.message;
    return this.send_res(res);
  }
}


  async login(req, res, next) {
  try {
    if (this.varify_req(req, ["email", "password"])) {
      return this.send_res(res);
    }
    const { email, password } = req.body;
    // 1. Find the user by email
    const user = await this.selectOne(`SELECT * FROM users WHERE email = ?`, [
      email,
    ]);
    if (user) {
      // 2. Check if the password is correct
      const isPasswordCorrect = this.check_password(user.password, password);
      if (isPasswordCorrect) {
        // 3. Get user details and auth info to send back
        const get_details = await this.selectOne(
          "SELECT id, username, email, created_at FROM users WHERE id = ?",
          [user.id]
        );
        get_details.user_auth = await this.selectOne(
          "SELECT apikey, token FROM user_auth WHERE user_id = ?",
          [user.id]
        );

        this.s = 1;
        this.m = "Login successful!";  
        this.r = get_details;
        return this.send_res(res);
      } else {
        this.s = 0;
        this.m = "Incorrect password.";
        return this.send_res(res);
      }
    } else {
      this.s = 0;
      this.m = "Email is not registered.";
      return this.send_res(res);
    }
  } catch (error) {
    this.err = error.message;
    return this.send_res(res);
  }
}
  async forgotPass(req, res, next) {
  try {
    if (this.varify_req(req, ["email"])) {
      return this.send_res(res);
    }
    const { email } = req.body;

    // check user exist
    const user = await this.selectOne("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      this.s = 0;
      this.m = "Email not registered!";
      return this.send_res(res);
    }

    // generate OTP
    const secret = process.env.OTP_SECRET || "mySecretKey";
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit
    const expiryTimestamp = Date.now() + 5 * 60 * 1000; // 5 min

    const rawData = `${email}${otp}${secret}${expiryTimestamp}`;
    const hash = await this.generateHash(rawData);

    // send email
    const mailService = new MailService();
    await mailService.sendMail({
      to: email,
      subject: "Password Reset OTP - healthCare",
      templateName: "forgotPass",
      data: { email, otp },
    });

    this.s = 1;
    this.m = "OTP sent to your email";
    this.r = {
      hash,
      expiryTimestamp,
    };
    return this.send_res(res);
  } catch (error) {
    this.err = error.message;
    return this.send_res(res);
  }
}
  async resetPass(req, res, next) {
  try {
    if (this.varify_req(req, ["otp", "hash", "expiryTimestamp", "newPassword", "email"])) {
      return this.send_res(res);
    }

    let { otp, hash, expiryTimestamp, newPassword, email } = req.body;
    const secret = process.env.OTP_SECRET || "mySecretKey";

    // check expiry
    if (Date.now() > Number(expiryTimestamp)) {
      this.s = 0;
      this.m = "OTP expired!";
      return this.send_res(res);
    }

    // verify hash
    const rawData = `${email}${otp}${secret}${expiryTimestamp}`;
    const isValid = await this.compareHash(rawData, hash);

    if (!isValid) {
      this.s = 0;
      this.m = "Invalid OTP!";
      return this.send_res(res);
    }

    // update new password
    const user = await this.selectOne("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      this.s = 0;
      this.m = "User not found!";
      return this.send_res(res);
    }

    const hash_password = this.generate_password(newPassword);
    await this.update("UPDATE users SET password = ? WHERE id = ?", [hash_password, user.id]);

    // ✅ Expire token immediately after success
    expiryTimestamp = 0;

    // send mail
    const mailService = new MailService();
    await mailService.sendMail({
      to: email,
      subject: "Password Reset Successful - Candleaf",
      templateName: "reset-passmail",
      data: { email }
    });

    this.s = 1;
    this.m = "Password reset successfully!";
    this.d = { expiryTimestamp }; // client ko 0 bhej do
    return this.send_res(res);
  } catch (error) {
    this.err = error.message;
    return this.send_res(res);
  }
}
}
