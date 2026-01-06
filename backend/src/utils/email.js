import { Resend } from "resend";

import config from "../config/config.js";

const resend = new Resend(config.emailApiKey);

const sendEmail = async (recipient, { subject, html }) => {
  console.log("Sending email to:", recipient);
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: [recipient],
    subject,
    html,
  });
};

export default sendEmail;
