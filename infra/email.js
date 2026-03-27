import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWD,
  },
  secure: process.env.NODE_ENV === "production" ? true : false,
});

async function send({ from, to, subject, text }) {
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
}

const email = {
  send,
};

export default email;
