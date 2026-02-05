import crypto from "crypto";
import argon2 from "argon2";
import { Op } from "sequelize";

import { User } from "../db/models/User";
import { PasswordResetToken } from "../db/models/PasswordResetToken";
import { RefreshToken } from "../db/models/RefreshToken";

const RESET_TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES || 20);

export class PasswordResetService {

  static async createResetTokenForUser(user: User) {
    // invalidar tokens previos
    await PasswordResetToken.update(
      { used_at: new Date() },
      {
        where: {
          user_id: user.id,
          used_at: { [Op.is]: null },
        },
      }
    );

    // generar token opaco
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000
    );

    await PasswordResetToken.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
      // console.log("[DEV] Password reset token:", token);

    return token; // este va en el email
  }

  static async resetPasswordWithToken(token: string, newPassword: string) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await PasswordResetToken.findOne({
      where: {
        token_hash: tokenHash,
        used_at: { [Op.is]: null },
        expires_at: { [Op.gt]: new Date() },
      },
      include: [{ model: User, as: "user" }],
    });

    if (!record || !record.user) {
      throw new Error("Invalid or expired token");
    }

    const newHash = await argon2.hash(newPassword);

    await record.user.update({
      password_hash: newHash,
    });

    // marcar token como usado
    await record.update({ used_at: new Date() });

    // revocar todas las sesiones activas
    await RefreshToken.update(
      { revoked_at: new Date() },
      {
        where: {
          user_id: record.user.id,
          revoked_at: { [Op.is]: null },
        },
      }
    );
  }
}
