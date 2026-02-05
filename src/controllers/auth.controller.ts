import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { PasswordResetService } from "../services/passwordReset.service";
import { User } from "../db/models/User";
import { EmailService } from "../services/email.service";



function getRefreshCookie(req: Request) {
  return (req as any).cookies?.refresh_token as string | undefined;
}

function setRefreshCookie(res: Response, token: string) {
  const secure = (process.env.COOKIE_SECURE || "false") === "true";
  const domain = process.env.COOKIE_DOMAIN || undefined;
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/auth",
    domain,
    maxAge: 1000 * 60 * 60 * 24 * days,
  });
}

function clearRefreshCookie(res: Response) {
  const domain = process.env.COOKIE_DOMAIN || undefined;
  res.clearCookie("refresh_token", { path: "/api/auth", domain });
}

export class AuthController {
  
  static async register(req: Request, res: Response) {
    try {
      const { email, password, workspaceName } = req.body ?? {};

      if (!email || typeof email !== "string") {
        return res.status(400).json({ ok: false, error: "email is required" });
      }

      if (!password || typeof password !== "string") {
        return res.status(400).json({ ok: false, error: "password is required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ ok: false, error: "password must be at least 8 characters" });
      }

      if (!workspaceName || typeof workspaceName !== "string") {
        return res.status(400).json({ ok: false, error: "workspaceName is required" });
      }

      const result = await AuthService.register({
        email: email.trim().toLowerCase(),
        password,
        workspaceName: workspaceName.trim(),
      });

      return res.status(201).json({
        ok: true,
        message: "User created",
        data: result,
      });
    } catch (e: any) {
      const msg = e?.message ?? "unknown error";

      if (
        msg.toLowerCase().includes("unique") ||
        msg.toLowerCase().includes("duplicate") ||
        msg.toLowerCase().includes("already registered")
      ) {
        return res.status(409).json({ ok: false, error: msg });
      }

      console.error(e);
      return res.status(500).json({ ok: false, error: msg });
    }
  }

 
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body ?? {};

      if (!email || typeof email !== "string") {
        return res.status(400).json({ ok: false, error: "email is required" });
      }

      if (!password || typeof password !== "string") {
        return res.status(400).json({ ok: false, error: "password is required" });
      }

      const result = await AuthService.login(email.trim().toLowerCase(), password);

      // set refresh token in httpOnly cookie
      setRefreshCookie(res, result.refresh_token);

      return res.status(200).json({
        ok: true,
        data: {
          access_token: result.access_token,
          user: result.user,
        },
      });
    } catch (e: any) {
      return res.status(401).json({ ok: false, error: e?.message ?? "Invalid credentials" });
    }
  }

static async refresh(req: Request, res: Response) {
  try {
    const token = getRefreshCookie(req);
    if (!token) return res.status(401).json({ ok: false, error: "Missing refresh token" });

    const result = await AuthService.refresh(token);

    setRefreshCookie(res, result.refresh_token);

    return res.status(200).json({
      ok: true,
      data: {
        access_token: result.access_token,
        user: result.user,
      },
    });
  } catch (e: any) {
    clearRefreshCookie(res);
    return res.status(401).json({ ok: false, error: e?.message ?? "Refresh failed" });
  }
}



  static async logout(req: Request, res: Response) {
    try {
      const token = getRefreshCookie(req);
      if (token) await AuthService.logout(token);

      clearRefreshCookie(res);
      return res.status(200).json({ ok: true });
    } catch {
      clearRefreshCookie(res);
      return res.status(200).json({ ok: true });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });

      if (user) {
        const token = await PasswordResetService.createResetTokenForUser(user);

        const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
        const resetUrl = `${appBaseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

        await EmailService.sendPasswordResetEmail({
          to: user.email,
          resetUrl,
        });
      }

        return res.json({ ok: true });
      }catch (err: any) {
          console.error("forgotPassword error:", err?.name, err?.message);
          if (err?.$metadata) console.error("AWS metadata:", err.$metadata);
          return res.status(500).json({ message: "Internal server error" });
        }
    }

static async resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and newPassword are required" });
    }

    await PasswordResetService.resetPasswordWithToken(token, newPassword);

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("resetPassword error:", err);
    return res.status(400).json({ message: err.message || "Invalid token" });
  }
}

}
