import { UserCompanyRepository } from '../repositories/user-company.repository';
import { UserRepository } from '../repositories/user.repository';
import { CompanyRepository } from '../repositories/company.repository';
import type { CreateUserCompanyDTO, UpdateUserCompanyDTO } from '../models';

/**
 * UserCompanyService
 * Kullanıcı-Firma ilişkilerini yöneten iş mantığı katmanı
 * Kullanıcıların firmalara eklenmesi, çıkarılması ve yönetimi için servis
 */
export class UserCompanyService {
  private userCompanyRepo = new UserCompanyRepository();
  private userRepo = new UserRepository();
  private companyRepo = new CompanyRepository();

  /**
   * Kullanıcıyı firmaya ekler (many-to-many ilişki oluşturur)
   * Kullanıcı ve firmanın varlığını kontrol eder, aynı ilişki varsa hata döner
   * @param data - Eklenecek ilişki bilgileri (user_id, company_id, role_in_company, department, start_date)
   * @returns Oluşturulan UserCompany ilişkisi
   * @throws Kullanıcı bulunamazsa "User not found"
   * @throws Firma bulunamazsa "Company not found"
   * @throws İlişki zaten varsa "User is already associated with this company"
   */
  async addUserToCompany(data: CreateUserCompanyDTO) {
    const user = await this.userRepo.findById(data.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    const company = await this.companyRepo.findById(data.company_id);
    if (!company) {
      throw new Error('Company not found');
    }

    const existing = await this.userCompanyRepo.findByUserAndCompany(
      data.user_id,
      data.company_id
    );
    if (existing) {
      throw new Error('User is already associated with this company');
    }

    return await this.userCompanyRepo.create(data);
  }

  /**
   * Kullanıcıyı firmadan kalıcı olarak çıkarır (ilişkiyi siler)
   * Not: Genellikle deactivateUserInCompany() tercih edilir (soft delete)
   * @param relationshipId - Silinecek ilişkinin ID'si (UUID)
   * @throws İlişki bulunamazsa "Relationship not found"
   */
  async removeUserFromCompany(relationshipId: string) {
    const relationship = await this.userCompanyRepo.findById(relationshipId);
    if (!relationship) {
      throw new Error('Relationship not found');
    }

    await this.userCompanyRepo.delete(relationshipId);
  }

  /**
   * Kullanıcının firmadaki durumunu pasif yapar (soft delete)
   * is_active = false ve end_date = bugün olarak işaretler
   * Kullanıcı firmadan ayrıldığında kullanılır
   * @param relationshipId - Pasif yapılacak ilişkinin ID'si (UUID)
   * @returns Güncellenmiş UserCompany ilişkisi
   * @throws İlişki bulunamazsa "Relationship not found"
   */
  async deactivateUserInCompany(relationshipId: string) {
    const relationship = await this.userCompanyRepo.findById(relationshipId);
    if (!relationship) {
      throw new Error('Relationship not found');
    }

    return await this.userCompanyRepo.deactivate(relationshipId);
  }

  /**
   * Pasif yapılmış kullanıcı-firma ilişkisini tekrar aktif yapar
   * is_active = true ve end_date = null yapar
   * Kullanıcı firmaya geri döndüğünde kullanılır
   * @param relationshipId - Aktif yapılacak ilişkinin ID'si (UUID)
   * @returns Güncellenmiş UserCompany ilişkisi
   * @throws İlişki bulunamazsa "Relationship not found"
   */
  async activateUserInCompany(relationshipId: string) {
    const relationship = await this.userCompanyRepo.findById(relationshipId);
    if (!relationship) {
      throw new Error('Relationship not found');
    }

    return await this.userCompanyRepo.activate(relationshipId);
  }

  /**
   * Kullanıcının firmadaki rolünü veya departmanını günceller
   * @param relationshipId - Güncellenecek ilişkinin ID'si (UUID)
   * @param data - Güncellenecek alanlar (role_in_company, department, is_active, end_date)
   * @returns Güncellenmiş UserCompany ilişkisi
   * @throws İlişki bulunamazsa "Relationship not found"
   */
  async updateUserCompanyRole(relationshipId: string, data: UpdateUserCompanyDTO) {
    const relationship = await this.userCompanyRepo.findById(relationshipId);
    if (!relationship) {
      throw new Error('Relationship not found');
    }

    return await this.userCompanyRepo.update(relationshipId, data);
  }

  /**
   * Bir kullanıcının tüm firma ilişkilerini getirir (aktif + pasif)
   * Kullanıcının geçmiş ve şimdiki tüm firmalarını görmek için kullanılır
   * @param userId - Kullanıcı ID'si (UUID)
   * @returns UserCompanyWithDetails dizisi (kullanıcı ve firma bilgileriyle)
   * @throws Kullanıcı bulunamazsa "User not found"
   */
  async getUserCompanies(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await this.userCompanyRepo.findByUserId(userId);
  }

  /**
   * Bir kullanıcının sadece aktif firma ilişkilerini getirir
   * Kullanıcının şu an çalıştığı firmaları görmek için kullanılır
   * @param userId - Kullanıcı ID'si (UUID)
   * @returns Aktif UserCompanyWithDetails dizisi
   * @throws Kullanıcı bulunamazsa "User not found"
   */
  async getActiveUserCompanies(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await this.userCompanyRepo.getActiveByUserId(userId);
  }

  /**
   * Bir firmanın tüm kullanıcı ilişkilerini getirir (aktif + pasif)
   * Firmanın geçmiş ve şimdiki tüm çalışanlarını görmek için kullanılır
   * @param companyId - Firma ID'si (UUID)
   * @returns UserCompanyWithDetails dizisi (kullanıcı ve firma bilgileriyle)
   * @throws Firma bulunamazsa "Company not found"
   */
  async getCompanyUsers(companyId: string) {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    return await this.userCompanyRepo.findByCompanyId(companyId);
  }

  /**
   * Bir firmanın sadece aktif kullanıcı ilişkilerini getirir
   * Firmanın şu an çalışan personelini görmek için kullanılır
   * @param companyId - Firma ID'si (UUID)
   * @returns Aktif UserCompanyWithDetails dizisi
   * @throws Firma bulunamazsa "Company not found"
   */
  async getActiveCompanyUsers(companyId: string) {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    return await this.userCompanyRepo.getActiveByCompanyId(companyId);
  }

  /**
   * Bir firmanın sadece manager rolündeki aktif kullanıcılarını getirir
   * Firma yöneticilerini listelemek için kullanılır
   * @param companyId - Firma ID'si (UUID)
   * @returns Manager rolündeki UserCompanyWithDetails dizisi
   * @throws Firma bulunamazsa "Company not found"
   */
  async getCompanyManagers(companyId: string) {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    return await this.userCompanyRepo.getManagersByCompany(companyId);
  }

  /**
   * Kullanıcı bilgilerini ve tüm firma ilişkilerini birlikte getirir
   * Kullanıcının profil sayfasında çalıştığı firmaları göstermek için kullanılır
   * @param userId - Kullanıcı ID'si (UUID)
   * @returns Kullanıcı bilgileri + firma ilişkileri (UserWithCompanies)
   * @throws Kullanıcı bulunamazsa "User not found"
   */
  async getUserWithCompanies(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const companies = await this.userCompanyRepo.findByUserId(userId);

    return {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      companies,
    };
  }

  /**
   * Firma bilgilerini ve tüm kullanıcı ilişkilerini birlikte getirir
   * Firmanın detay sayfasında çalışanları göstermek için kullanılır
   * @param companyId - Firma ID'si (UUID)
   * @returns Firma bilgileri + kullanıcı ilişkileri (CompanyWithUsers)
   * @throws Firma bulunamazsa "Company not found"
   */
  async getCompanyWithUsers(companyId: string) {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const users = await this.userCompanyRepo.findByCompanyId(companyId);

    return {
      company_id: company.company_id,
      company_name: company.company_name,
      company_code: company.company_code,
      users,
    };
  }
}
