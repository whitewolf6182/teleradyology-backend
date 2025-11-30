import { UserRepository } from '../repositories/user.repository';
import type { UpdateUserDTO } from '../models';

export class UserService {
  private userRepo = new UserRepository();

  async getProfile(loginId: string) {
    return await this.userRepo.getFullProfile(loginId);
  }

  async updateProfile(loginId: string, data: UpdateUserDTO) {
    return await this.userRepo.update(loginId, data);
  }

  async getAllUsers() {
    return await this.userRepo.getAllUsers();
  }

  async getCompanyUsers(companyId: string) {
    return await this.userRepo.getCompanyUsers(companyId);
  }

  async getUsersByCompany(companyId: string) {
    return await this.userRepo.findByCompanyId(companyId);
  }
}
