import db from '../config/database';
import type { User, UpdateUserDTO, UserProfile } from '../models';

interface CreateUserData {
  login_id: string;
  company_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  license_number?: string;
  specialization?: string;
  hospital_name?: string;
  department?: string;
}

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await db`
      SELECT * FROM users
      WHERE id = ${id}
    `;
    return result[0] || null;
  }

  async findByLoginId(loginId: string): Promise<User | null> {
    const result = await db`
      SELECT * FROM users
      WHERE login_id = ${loginId}
    `;
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db`
      SELECT * FROM users
      WHERE email = ${email}
    `;
    return result[0] || null;
  }

  async create(data: CreateUserData): Promise<User> {
    const result = await db`
      INSERT INTO users (
        login_id, company_id, first_name, last_name, email, phone,
        license_number, specialization, hospital_name, department
      )
      VALUES (
        ${data.login_id}, ${data.company_id || null}, ${data.first_name}, ${data.last_name}, ${data.email},
        ${data.phone || null}, ${data.license_number || null},
        ${data.specialization || null}, ${data.hospital_name || null},
        ${data.department || null}
      )
      RETURNING *
    `;
    return result[0];
  }

  async update(loginId: string, data: UpdateUserDTO): Promise<User> {
    const fields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${db.escape(value)}`)
      .join(', ');

    if (!fields) {
      throw new Error('No fields to update');
    }

    const result = await db`
      UPDATE users
      SET ${db.raw(fields)}
      WHERE login_id = ${loginId}
      RETURNING *
    `;
    return result[0];
  }

  async getFullProfile(loginId: string): Promise<UserProfile | null> {
    const result = await db`
      SELECT
        u.*,
        l.username,
        l.role,
        l.is_active,
        l.last_login_at,
        c.company_name,
        c.company_code
      FROM users u
      INNER JOIN logins l ON l.id = u.login_id
      LEFT JOIN companies c ON c.company_id = u.company_id
      WHERE u.login_id = ${loginId}
    `;
    return result[0] || null;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    return await db`
      SELECT
        u.*,
        l.username,
        l.role,
        l.is_active,
        l.last_login_at,
        c.company_name,
        c.company_code
      FROM users u
      INNER JOIN logins l ON l.id = u.login_id
      LEFT JOIN companies c ON c.company_id = u.company_id
      ORDER BY u.created_at DESC
    `;
  }

  async findByCompanyId(companyId: string): Promise<User[]> {
    return await db`
      SELECT * FROM users
      WHERE company_id = ${companyId}
      ORDER BY created_at DESC
    `;
  }

  async getCompanyUsers(companyId: string): Promise<UserProfile[]> {
    return await db`
      SELECT
        u.*,
        l.username,
        l.role,
        l.is_active,
        l.last_login_at,
        c.company_name,
        c.company_code
      FROM users u
      INNER JOIN logins l ON l.id = u.login_id
      LEFT JOIN companies c ON c.company_id = u.company_id
      WHERE u.company_id = ${companyId}
      ORDER BY u.created_at DESC
    `;
  }
}
