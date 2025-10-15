import dotenv from "dotenv";
dotenv.config();

const ENV = process.env.NODE_ENV || "LOCAL";
const PREFIX = ENV.toUpperCase();

export const CONFIG = {
  // Server
  PORT: parseInt(process.env[`${PREFIX}_PORT`] || "3000", 10),
  API_URL: process.env[`${PREFIX}_API_URL`],
  ADMIN_URL: process.env[`${PREFIX}_ADMIN_URL`],
  STATIC_ROUTE: process.env[`${PREFIX}_STATIC_ROUTE`],
    CLOUDINARY_CLOUD_NAME: process.env[`${PREFIX}_CLOUDINARY_CLOUD_NAME`],
    CLOUDINARY_API_KEY: process.env[`${PREFIX}_CLOUDINARY_API_KEY`],
    CLOUDINARY_API_SECRET: process.env[`${PREFIX}_CLOUDINARY_API_SECRET`],

  // SMTP
  SMTP_HOST: process.env[`${PREFIX}_SMTP_HOST`],
  SMTP_PORT: parseInt(
    process.env[`${PREFIX}_SMTP_PORT`] || 
    (process.env[`${PREFIX}_SMTP_SECURE`] === "true" ? "465" : "587"),
    10
  ),
  SMTP_SECURE: process.env[`${PREFIX}_SMTP_SECURE`] === "true",
  SMTP_USER: process.env[`${PREFIX}_SMTP_USER`],
  SMTP_PASS: process.env[`${PREFIX}_SMTP_PASS`],
  SMTP_FROM: `${process.env[`${PREFIX}_SMTP_FROM_NAME`]} <${process.env[`${PREFIX}_SMTP_FROM`]}>`,

  // Database
  DB: {
    host: process.env[`${PREFIX}_DB_HOST`],
    user: process.env[`${PREFIX}_DB_USER`],
    password: process.env[`${PREFIX}_DB_PASS`],
    database: process.env[`${PREFIX}_DB_NAME`],
    connectionLimit: parseInt(process.env[`${PREFIX}_DB_CONN_LIMIT`] || "100", 10),
    dateStrings: process.env[`${PREFIX}_DB_DATE_STRINGS`],
  },

  // General
  APP_SECRET: process.env.APP_SECRET,

 
};
