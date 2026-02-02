export {
  emailSchema,
  passwordSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  socialProviderSchema,
  magicLinkSchema,
  otpSendSchema,
  otpVerifySchema,
} from "./auth";

export { updateProfileSchema, changePasswordSchema } from "./user";

export { checkoutSchema, subscriptionActionSchema } from "./payment";

export { courseListQuerySchema, reviewListQuerySchema } from "./course";
