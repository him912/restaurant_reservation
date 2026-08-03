const User = require("../models/User");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../utils/sendEmail");

class ForgetPasswordController {
  buildResetLink(resetToken) {
    const baseUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "");
    return `${baseUrl}/#/reset-password/${resetToken}`;
  }

  buildResetEmailHtml({ resetLink, username }) {
    const greeting = username ? `Hello ${username},` : "Hello,";

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">DineFlow Password Reset</h2>
        <p>${greeting}</p>
        <p>We received a request to reset your DineFlow account password. Click the button below to proceed:</p>
        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        <p>This link will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">© 2026 DineFlow. All rights reserved.</p>
      </div>
    `;
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");

      user.resetToken = resetToken;
      user.resetTokenExpiry = Date.now() + 10 * 60 * 1000;

      await user.save();

      const resetLink = this.buildResetLink(resetToken);

      try {
        await sendEmail({
          to: normalizedEmail,
          subject: "DineFlow Password Reset Request",
          html: this.buildResetEmailHtml({
            resetLink,
            username: user.username,
          }),
        });

        return res.status(200).json({
          success: true,
          message: "Reset link sent to email",
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError.message);
        return res.status(500).json({
          success: false,
          message: "Failed to send reset email",
        });
      }
    } catch (error) {
      console.error("Error in forgotPassword handler:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async verifyResetToken(req, res) {
    try {
      const { token } = req.params;

      const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or Expired Token",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Token Valid",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required",
        });
      }

      const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or Expired Token",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password Reset Successful",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

const forgetPasswordController = new ForgetPasswordController();

module.exports = {
  forgotPassword: forgetPasswordController.forgotPassword.bind(
    forgetPasswordController,
  ),
  verifyResetToken: forgetPasswordController.verifyResetToken.bind(
    forgetPasswordController,
  ),
  resetPassword: forgetPasswordController.resetPassword.bind(
    forgetPasswordController,
  ),
};
