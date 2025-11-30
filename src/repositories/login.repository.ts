import db from '../config/database';
import type { Login, CreateLoginDTO } from '../models';

export class LoginRepository {
  async findByUsername(username: string): Promise<Login | null> {
    const result = await db`
      SELECT * FROM logins
      WHERE username = ${username}
    `;
    return result[0] || null;
  }

  async findById(id: string): Promise<Login | null> {
    const result = await db`
      SELECT * FROM logins
      WHERE id = ${id}
    `;
    return result[0] || null;
  }

  async create(data: CreateLoginDTO): Promise<Login> {
    const result = await db`
      INSERT INTO logins (username, password, role)
      VALUES (${data.username}, ${data.password}, ${data.role || 'user'})
      RETURNING *
    `;
    return result[0];
  }

  async updateLastLogin(id: string): Promise<void> {
    await db`
      UPDATE logins
      SET last_login_at = NOW()
      WHERE id = ${id}
    `;
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await db`
      UPDATE logins
      SET refresh_token = ${refreshToken}
      WHERE id = ${id}
    `;
  }

  async incrementLoginAttempts(id: string): Promise<void> {
    await db`
      UPDATE logins
      SET login_attempt_count = login_attempt_count + 1
      WHERE id = ${id}
    `;
  }

  async resetLoginAttempts(id: string): Promise<void> {
    await db`
      UPDATE logins
      SET login_attempt_count = 0, locked_until = NULL
      WHERE id = ${id}
    `;
  }

  async lockAccount(id: string, lockDuration: number): Promise<void> {
    await db`
      UPDATE logins
      SET locked_until = NOW() + INTERVAL '${db.raw(lockDuration.toString())} minutes'
      WHERE id = ${id}
    `;
  }

  async setPasswordResetToken(
    id: string,
    token: string,
    expiresIn: number
  ): Promise<void> {
    await db`
      UPDATE logins
      SET password_reset_token = ${token},
          password_reset_expires_at = NOW() + INTERVAL '${db.raw(expiresIn.toString())} minutes'
      WHERE id = ${id}
    `;
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await db`
      UPDATE logins
      SET password = ${newPassword},
          password_reset_token = NULL,
          password_reset_expires_at = NULL
      WHERE id = ${id}
    `;
  }
}
