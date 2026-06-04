const User = require("../models/User");
const crypto = require("crypto");
const { MailtrapClient } = require("mailtrap");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

// Initialize Mailtrap Client
const client = new MailtrapClient({
  token: process.env.MAILTRAP_API_TOKEN,
});

exports.forgotPassword = async (req, res) => {
  try {
    // console.log("Received API call: POST /api/auth/forgot-password");
    // console.log("Request Body:", req.body);

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    // console.log("Generated Reset Token:", resetToken);

    // Set reset token and expiry (10 minutes)
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();
    // console.log("User updated with reset token");

    // Create reset link
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    // console.log("Reset Link:", resetLink);

    // Send email using Mailtrap SDK
    try {
      await client.send({
        from: {
          email: process.env.MAIL_SMTP_USER,
          name: process.env.MAIL_FROM_NAM || "Password Reset",
        },
        to: [
          {
            email: email,
          },
        ],
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to proceed:</p>
            <a href="${resetLink}" style="background-color: #ffc107; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
              Reset Password
            </a>
            <p>This link will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">© 2026 Password Reset. All rights reserved.</p>
          </div>
        `,
        category: "Password Reset",
      });

      // console.log("Reset email sent successfully to:", email);

      res.status(200).json({
        message: "Reset link sent to email",
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError.message);
      res.status(500).json({
        message: "Failed to send reset email",
      });
    }
  } catch (error) {
    console.error("Error in forgotPassword handler:", error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or Expired Token",
      });
    }

    res.status(200).json({
      message: "Token Valid",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Token Expired",
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;

    // Clear token
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json({
      message: "Password Reset Successful",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
