const nodemailer = require("nodemailer");

async function sendQuestionEmail(userEmail, question) {
  try {
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_USER,   // your Gmail address
    //     pass: process.env.EMAIL_PASS,   // your app password
    //   },
    // });
    const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.BREVO_USER,
            pass: process.env.BREVO_PASS,
        },
    });

    await transporter.sendMail({
      from: process.env.BREVO_SENDER,
      to: process.env.BREVO_TO, // where the questions should go
      subject: "New Question Submitted",
      text: `From: ${userEmail}\n\nQuestion:\n${question}`,
    });

    return { success: true };
  } catch (err) {
    console.error("Email error:", err);
    return { success: false, error: err.message };
  }
}

module.exports = { sendQuestionEmail };
