import { CompanyRepository } from '../repositories/company.repository';
import type { CreateCompanyDTO, UpdateCompanyDTO, CompanyFilters, CompanyStatistics } from '../models';

export class CompanyService {
  private companyRepo = new CompanyRepository();

  async getAllCompanies(filters?: CompanyFilters) {
    return await this.companyRepo.findAll(filters);
  }

  async getCompanyById(companyId: string) {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }
    return company;
  }

  async getCompanyByCode(companyCode: string) {
    const company = await this.companyRepo.findByCode(companyCode);
    if (!company) {
      throw new Error('Company not found');
    }
    return company;
  }

  async createCompany(data: CreateCompanyDTO, userId: string) {
    const existingCode = await this.companyRepo.findByCode(data.company_code);
    if (existingCode) {
      throw new Error('Company code already exists');
    }

    if (data.tax_number) {
      const existingTax = await this.companyRepo.findByTaxNumber(data.tax_number);
      if (existingTax) {
        throw new Error('Tax number already exists');
      }
    }

    return await this.companyRepo.create(data, userId);
  }

  async updateCompany(companyId: string, data: UpdateCompanyDTO, userId: string) {
    const existing = await this.companyRepo.findById(companyId);
    if (!existing) {
      throw new Error('Company not found');
    }

    if (data.tax_number && data.tax_number !== existing.tax_number) {
      const existingTax = await this.companyRepo.findByTaxNumber(data.tax_number);
      if (existingTax) {
        throw new Error('Tax number already exists');
      }
    }

    return await this.companyRepo.update(companyId, data, userId);
  }

  async deleteCompany(companyId: string) {
    const existing = await this.companyRepo.findById(companyId);
    if (!existing) {
      throw new Error('Company not found');
    }

    await this.companyRepo.softDelete(companyId);
  }

  async permanentlyDeleteCompany(companyId: string) {
    await this.companyRepo.hardDelete(companyId);
  }

  async restoreCompany(companyId: string) {
    return await this.companyRepo.restore(companyId);
  }

  async getActiveCompaniesCount() {
    return await this.companyRepo.getActiveCompaniesCount();
  }

  async getCompaniesByServiceLevel(serviceLevel: string) {
    return await this.companyRepo.getCompaniesByServiceLevel(serviceLevel);
  }

  async getExpiringSoonLicenses(days: number = 30) {
    return await this.companyRepo.getExpiringSoonLicenses(days);
  }

  async getExpiringContracts(days: number = 30) {
    return await this.companyRepo.getExpiringContracts(days);
  }

  async getCompanyStatistics(): Promise<CompanyStatistics> {
    const allCompanies = await this.companyRepo.findAll();
    const activeCount = await this.companyRepo.getActiveCompaniesCount();

    const statusCount = {
      active: 0,
      inactive: 0,
      suspended: 0,
      pending: 0,
    };

    const licenseTypeCount = {
      hospital: 0,
      imaging_center: 0,
      telemedicine: 0,
      other: 0,
    };

    const serviceLevelCount = {
      basic: 0,
      standard: 0,
      premium: 0,
      custom: 0,
    };

    allCompanies.forEach((company) => {
      if (company.status) {
        statusCount[company.status]++;
      }
      if (company.license_type) {
        licenseTypeCount[company.license_type]++;
      }
      if (company.service_level) {
        serviceLevelCount[company.service_level]++;
      }
    });

    return {
      total: allCompanies.length,
      activeCount,
      statusCount,
      licenseTypeCount,
      serviceLevelCount,
    };
  }
}
