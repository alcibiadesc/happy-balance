import { Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { SupabaseService } from '../services/SupabaseService';
import { ResendService } from '../services/ResendService';

const MagicLinkRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const VerifyMagicLinkSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

interface MagicLinkPayload {
  email: string;
  type: 'magic-link';
  jti: string;
}

export class MagicLinkController {
  private readonly magicLinkSecret: string;
  private readonly magicLinkExpiry = '15m';
  private readonly appUrl: string;

  constructor(
    private supabaseService: SupabaseService,
    private resendService: ResendService
  ) {
    this.magicLinkSecret =
      process.env.MAGIC_LINK_SECRET || process.env.JWT_ACCESS_SECRET || 'default-magic-link-secret';
    this.appUrl = process.env.APP_URL || 'http://localhost:5173';
  }

  /**
   * POST /api/auth/magic-link
   * Sends a magic link to the provided email and stores the lead
   */
  async requestMagicLink(req: Request, res: Response) {
    try {
      const validationResult = MagicLinkRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address',
          details: validationResult.error.errors,
        });
      }

      const { email } = validationResult.data;

      // Store lead in Supabase (non-blocking - don't fail if this errors)
      const ip =
        req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || undefined;
      await this.supabaseService.storeLead({
        email,
        source: 'magic-link',
        ip,
      });

      // Generate magic link token
      const token = this.generateMagicLinkToken(email);
      const magicLink = `${this.appUrl}/auth/verify?token=${token}`;

      // Send email via Resend
      const emailSent = await this.resendService.sendMagicLinkEmail(email, magicLink);

      if (!emailSent) {
        // If Resend is not configured (dev mode), still return success
        // but include a dev hint
        if (!this.resendService.isConfigured()) {
          return res.json({
            success: true,
            message: 'Magic link generated (email service not configured)',
            // Only expose token in development
            ...(process.env.NODE_ENV === 'development' ? { devToken: token } : {}),
          });
        }

        return res.status(500).json({
          success: false,
          error: 'Failed to send magic link email. Please try again.',
        });
      }

      return res.json({
        success: true,
        message: 'Magic link sent to your email',
      });
    } catch (error) {
      console.error('Magic link request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/auth/verify-magic-link
   * Verifies the magic link token
   */
  async verifyMagicLink(req: Request, res: Response) {
    try {
      const validationResult = VerifyMagicLinkSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Token is required',
          details: validationResult.error.errors,
        });
      }

      const { token } = validationResult.data;

      // Verify the token
      const payload = this.verifyMagicLinkToken(token);
      if (!payload) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired magic link',
        });
      }

      return res.json({
        success: true,
        data: {
          email: payload.email,
          verified: true,
        },
      });
    } catch (error) {
      console.error('Magic link verification error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  private generateMagicLinkToken(email: string): string {
    const payload: MagicLinkPayload = {
      email,
      type: 'magic-link',
      jti: randomUUID(),
    };

    return jwt.sign(payload, this.magicLinkSecret, {
      expiresIn: this.magicLinkExpiry,
    });
  }

  private verifyMagicLinkToken(token: string): MagicLinkPayload | null {
    try {
      const payload = jwt.verify(token, this.magicLinkSecret) as MagicLinkPayload;

      if (payload.type !== 'magic-link') {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}
