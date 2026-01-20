import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Transaction } from "sequelize";
import { sequelize } from "../db/sequelizeSetup";
import { User } from "../db/models/User";
import { Organization } from "../db/models/Organization";
import { OrganizationMember } from "../db/models/OrganizationMember";
import { RefreshToken } from "../db/models/RefreshToken";

type RegisterInput = {
  email: string;
  password: string;
  workspaceName: string;
};

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-secret-change-me";
const ACCESS_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900); // 15m
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function ensureUniqueOrgSlug(baseSlug: string, t: Transaction) {
  const slug = baseSlug || "workspace";

  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;

    const exists = await Organization.findOne({
      where: { slug: candidate },
      transaction: t,
    
      lock: t.LOCK.UPDATE,
    });

    if (!exists) return candidate;
  }

  throw new Error("Could not generate a unique workspace slug");
}

function signAccessToken(payload: { userId: string }) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL_SECONDS });
}

function newOpaqueToken() {
  return crypto.randomBytes(48).toString("base64url");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function refreshExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TTL_DAYS);
  return d;
}

export class AuthService {
  
  static async register(input: RegisterInput) {
    const password_hash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    return await sequelize.transaction(async (t) => {
      const existing = await User.findOne({
        where: { email: input.email },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (existing) throw new Error("Email already registered");

      const user = await User.create(
        {
          auth0_user_id: null,
          email: input.email,
          password_hash,
          email_verified: false,
          full_name: null,
          avatar_url: null,
          last_seen_at: new Date(),
        },
        { transaction: t }
      );

      const baseSlug = slugify(input.workspaceName);
      const slug = await ensureUniqueOrgSlug(baseSlug, t);

      const org = await Organization.create(
        {
          name: input.workspaceName,
          slug,
          created_by_user_id: user.id,
        },
        { transaction: t }
      );

      await OrganizationMember.create(
        {
          org_id: org.id,
          user_id: user.id,
          role: "admin",
          status: "active",
          joined_at: new Date(),
        },
        { transaction: t }
      );

      return {
        user: { id: user.id, email: user.email, auth0_user_id: user.auth0_user_id },
        organization: { id: org.id, name: org.name, slug: org.slug },
        membership: { role: "admin" as const, status: "active" as const },
      };
    });
  }

  
  static async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const ok = await argon2.verify(user.password_hash, password);
    if (!ok) throw new Error("Invalid credentials");

    await user.update({ last_seen_at: new Date() });

    const refresh_token = newOpaqueToken();
    const token_hash = hashToken(refresh_token);

    await RefreshToken.create({
      user_id: user.id,
      token_hash,
      expires_at: refreshExpiryDate(),
      revoked_at: null,
      replaced_by_token_id: null,
    });

    const access_token = signAccessToken({ userId: user.id });

    return {
      access_token,
      refresh_token,
      user: { id: user.id, email: user.email },
    };
  }

static async refresh(refreshToken: string) {
  const token_hash = hashToken(refreshToken);

  const row = await RefreshToken.findOne({ where: { token_hash } });
  if (!row) throw new Error("Invalid refresh token");
  if (row.revoked_at) throw new Error("Refresh token revoked");
  if (row.expires_at.getTime() <= Date.now()) throw new Error("Refresh token expired");

  row.expires_at = refreshExpiryDate();
  await row.save();

  const access_token = signAccessToken({ userId: row.user_id });

  const user = await User.findByPk(row.user_id);
  if (!user) throw new Error("User not found");

  return {
    access_token,
    refresh_token: refreshToken, // ✅ mismo token
    user: { id: user.id, email: user.email },
  };
}


 
  static async logout(refreshToken: string) {
    const token_hash = hashToken(refreshToken);

    const row = await RefreshToken.findOne({ where: { token_hash } });
    if (!row) return { ok: true as const };

    if (!row.revoked_at) {
      await row.update({ revoked_at: new Date() });
    }

    return { ok: true as const };
  }
}
