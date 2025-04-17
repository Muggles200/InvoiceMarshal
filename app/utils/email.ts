import { createTransport } from "nodemailer";

interface VerificationEmailProps {
  to: string;
  token: string;
}

export async function sendVerificationEmail({ to, token }: VerificationEmailProps) {
  const transport = createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Verify your email address",
    text: `Please verify your email by clicking this link: ${verificationUrl}`,
    html: `
      <div>
        <p>Please verify your email by clicking the link below:</p>
        <p><a href="${verificationUrl}">Verify your email</a></p>
      </div>
    `,
  });
} 