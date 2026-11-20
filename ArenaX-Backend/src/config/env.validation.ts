import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(10).required(),
  JWT_EXPIRES_IN: Joi.number().default(3600),
  MAIL_HOST: Joi.string().allow('').optional(),
  MAIL_PORT: Joi.number().default(2525),
  MAIL_USER: Joi.string().allow('').optional(),
  MAIL_PASS: Joi.string().allow('').optional(),
  MAIL_FROM: Joi.string().default('ArenaX <no-reply@arenax.local>'),
  ADMIN_NAME: Joi.string().default('System Admin'),
  ADMIN_EMAIL: Joi.string().email({ tlds: { allow: false } }).default('admin@arenax.local'),
  ADMIN_PASSWORD: Joi.string().min(6).default('Admin@123'),
});
