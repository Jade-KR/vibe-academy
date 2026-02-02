import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail(params: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@yourdomain.com",
      ...params,
    });

    if (error) {
      console.error("[sendEmail] Resend error:", error);
      return { error };
    }

    return { data };
  } catch (err) {
    console.error("[sendEmail] Unexpected error:", err);
    return { error: err };
  }
}
