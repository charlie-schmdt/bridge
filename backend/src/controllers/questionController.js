const { sendQuestionEmail } = require("../services/emailService.js");


exports.submitQuestion = async (req, res) => {
  try {
    const { email, question } = req.body;

    if (!email || !question) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    await sendQuestionEmail(email, question);

    res.json({ success: true, message: "Question sent" });
  } catch (err) {
    console.error("Error sending question email:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
