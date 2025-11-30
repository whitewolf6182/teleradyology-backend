import { LoginRepository } from '../repositories/login.repository';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../utils/password';
import type { CreateUserDTO, LoginDTO } from '../models';

export class AuthService {
  private loginRepo = new LoginRepository();
  private userRepo = new UserRepository();

  async register(data: CreateUserDTO) {
    const existingLogin = await this.loginRepo.findByUsername(data.username);
    if (existingLogin) {
      throw new Error('Username already exists');
    }

    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    const login = await this.loginRepo.create({
      username: data.username,
      password: hashedPassword,
      role: data.role,
    });

    const user = await this.userRepo.create({
      login_id: login.id,
      company_id: data.company_id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      license_number: data.license_number,
      specialization: data.specialization,
      hospital_name: data.hospital_name,
      department: data.department,
    });

    return {
      login,
      user,
    };
  }

  async login(data: LoginDTO) {
    const login = await this.loginRepo.findByUsername(data.username);

    if (!login) {
      throw new Error('Invalid credentials');
    }

    if (login.locked_until && new Date(login.locked_until) > new Date()) {
      throw new Error('Account is locked. Please try again later.');
    }

    if (!login.is_active) {
      throw new Error('Account is deactivated');
    }

    const isPasswordValid = await verifyPassword(data.password, login.password);

    if (!isPasswordValid) {
      await this.loginRepo.incrementLoginAttempts(login.id);

      if (login.login_attempt_count + 1 >= 5) {
        await this.loginRepo.lockAccount(login.id, 30);
        throw new Error('Too many failed attempts. Account locked for 30 minutes.');
      }

      throw new Error('Invalid credentials');
    }

    await this.loginRepo.resetLoginAttempts(login.id);
    await this.loginRepo.updateLastLogin(login.id);

    const user = await this.userRepo.findByLoginId(login.id);

    return {
      userId: login.id,
      username: login.username,
      role: login.role,
      user,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.loginRepo.updateRefreshToken(userId, refreshToken);
  }

  async verifyUser(userId: string) {
    const login = await this.loginRepo.findById(userId);
    if (!login || !login.is_active) {
      throw new Error('Invalid user');
    }

    const user = await this.userRepo.findByLoginId(userId);
    return {
      userId: login.id,
      username: login.username,
      role: login.role,
      user,
    };
  }
}
