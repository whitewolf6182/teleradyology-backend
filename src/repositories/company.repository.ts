import db from '../config/database';
import type { Company, CreateCompanyDTO, UpdateCompanyDTO, CompanyFilters } from '../models';

export class CompanyRepository {
  async findAll(filters?: CompanyFilters): Promise<Company[]> {
    let conditions = ['deleted_at IS NULL'];
    let params: any[] = [];

    if (filters?.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters?.license_type) {
      conditions.push('license_type = ?');
      params.push(filters.license_type);
    }

    if (filters?.service_level) {
      conditions.push('service_level = ?');
      params.push(filters.service_level);
    }

    if (filters?.city) {
      conditions.push('city = ?');
      params.push(filters.city);
    }

    if (filters?.country) {
      conditions.push('country = ?');
      params.push(filters.country);
    }

    const whereClause = conditions.join(' AND ');

    console.log('Query Params:', params);
    console.log('Where Clause:', whereClause);

    // return await db`
    //   SELECT * FROM companies
    //   WHERE ${whereClause}
    //   ORDER BY created_at DESC
    // ` as Company[];

        return await db`SELECT * FROM companies` as Company[];
  }

  async findById(companyId: string): Promise<Company | null> {
    const result = await db`
      SELECT * FROM companies
      WHERE company_id = ${companyId} AND deleted_at IS NULL
    `;
    return result[0] || null;
  }

  async findByCode(companyCode: string): Promise<Company | null> {
    const result = await db`
      SELECT * FROM companies
      WHERE company_code = ${companyCode} AND deleted_at IS NULL
    `;
    return result[0] || null;
  }

  async findByTaxNumber(taxNumber: string): Promise<Company | null> {
    const result = await db`
      SELECT * FROM companies
      WHERE tax_number = ${taxNumber} AND deleted_at IS NULL
    `;
    return result[0] || null;
  }

  async create(data: CreateCompanyDTO, userId: string): Promise<Company> {
    const result = await db`
      INSERT INTO companies (
        company_title, company_name, company_code, tax_number, tax_office,
        email, phone, website, address, city, state, country, postal_code,
        license_type, health_license_number, license_expiry_date,
        service_level, sla_agreement_url, contract_start_date, contract_end_date,
        billing_cycle, currency, status, timezone, language, created_by, updated_by
      )
      VALUES (
        ${data.company_title}, ${data.company_name}, ${data.company_code},
        ${data.tax_number || null}, ${data.tax_office || null},
        ${data.email || null}, ${data.phone || null}, ${data.website || null},
        ${data.address || null}, ${data.city || null}, ${data.state || null},
        ${data.country || 'Türkiye'}, ${data.postal_code || null},
        ${data.license_type || null}, ${data.health_license_number || null},
        ${data.license_expiry_date || null}, ${data.service_level || null},
        ${data.sla_agreement_url || null}, ${data.contract_start_date || null},
        ${data.contract_end_date || null}, ${data.billing_cycle || null},
        ${data.currency || 'TRY'}, ${data.status || 'pending'},
        ${data.timezone || 'Europe/Istanbul'}, ${data.language || 'tr'},
        ${userId}, ${userId}
      )
      RETURNING *
    `;
    return result[0];
  }

  async update(companyId: string, data: UpdateCompanyDTO, userId: string): Promise<Company> {
    const updates = { ...data, updated_by: userId };
    const fields = Object.entries(updates)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${db.escape(value)}`)
      .join(', ');

    if (!fields) {
      throw new Error('No fields to update');
    }

    const result = await db`
      UPDATE companies
      SET ${db.raw(fields)}
      WHERE company_id = ${companyId} AND deleted_at IS NULL
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Company not found');
    }

    return result[0];
  }

  async softDelete(companyId: string): Promise<void> {
    await db`
      UPDATE companies
      SET deleted_at = NOW()
      WHERE company_id = ${companyId}
    `;
  }

  async hardDelete(companyId: string): Promise<void> {
    await db`
      DELETE FROM companies
      WHERE company_id = ${companyId}
    `;
  }

  async restore(companyId: string): Promise<Company> {
    const result = await db`
      UPDATE companies
      SET deleted_at = NULL
      WHERE company_id = ${companyId}
      RETURNING *
    `;
    return result[0];
  }

  async getActiveCompaniesCount(): Promise<number> {
    const result = await db`
      SELECT COUNT(*) as count
      FROM companies
      WHERE status = 'active' AND deleted_at IS NULL
    `;
    return parseInt(result[0].count);
  }

  async getCompaniesByServiceLevel(serviceLevel: string): Promise<Company[]> {
    return await db`
      SELECT * FROM companies
      WHERE service_level = ${serviceLevel} AND deleted_at IS NULL
      ORDER BY company_name
    `;
  }

  async getExpiringSoonLicenses(days: number): Promise<Company[]> {
    return await db`
      SELECT * FROM companies
      WHERE license_expiry_date IS NOT NULL
        AND license_expiry_date <= CURRENT_DATE + INTERVAL '${db.raw(days.toString())} days'
        AND license_expiry_date >= CURRENT_DATE
        AND deleted_at IS NULL
      ORDER BY license_expiry_date ASC
    `;
  }

  async getExpiringContracts(days: number): Promise<Company[]> {
    return await db`
      SELECT * FROM companies
      WHERE contract_end_date IS NOT NULL
        AND contract_end_date <= CURRENT_DATE + INTERVAL '${db.raw(days.toString())} days'
        AND contract_end_date >= CURRENT_DATE
        AND deleted_at IS NULL
      ORDER BY contract_end_date ASC
    `;
  }
}
