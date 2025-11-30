import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger'; // Swagger import edildi
import { CompanyService } from '../services/company.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { gzipSync } from "zlib"; // Bun.js global olarak zlib sağlar


const companyService = new CompanyService();

export const companyRoutes = new Elysia({ prefix: '/companies' })
  // Swagger middleware eklendi
  .use(swagger({
    documentation: {
      tags: [
        { name: 'Companies', description: 'Firma yönetimi endpoints' }
      ]
    }
  }))
  .use(authMiddleware)
  
  // GET /companies - Tüm firmaları listele
  .get(
    '/',
async ({ query, error }) => {
    console.log(query);

    try {
        const companies = await companyService.getAllCompanies(query);

        // JSON olarak direkt döndür
        return new Response(JSON.stringify({
            success: true,
            data: companies,
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });

    } catch (err: any) {
        // Hata yönetimi
        return new Response(JSON.stringify({
            success: false,
            message: err.message,
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}
,
    {
      detail: {
        tags: ['Companies'],
        summary: 'Tüm firmaları listele',
        description: 'Sistemde kayıtlı tüm firmaları filtreleme seçenekleriyle birlikte listeler'
      },
      hasRole: ['admin'],
      query: t.Object({
        status: t.Optional(
          t.Union([
            t.Literal('active'),
            t.Literal('inactive'),
            t.Literal('suspended'),
            t.Literal('pending'),
          ])
        ),
        license_type: t.Optional(
          t.Union([
            t.Literal('hospital'),
            t.Literal('imaging_center'),
            t.Literal('telemedicine'),
            t.Literal('other'),
          ])
        ),
        service_level: t.Optional(
          t.Union([
            t.Literal('basic'),
            t.Literal('standard'),
            t.Literal('premium'),
            t.Literal('custom'),
          ])
        ),
        city: t.Optional(t.String()),
        country: t.Optional(t.String()),
      }),
    }
  )
  
  // GET /companies/statistics - İstatistikler
  .get(
    '/statistics',
    async ({ user, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const statistics = await companyService.getCompanyStatistics();
        return {
          success: true,
          data: statistics,
        };
      } catch (err: any) {
        return error(500, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      detail: {
        tags: ['Companies'],
        summary: 'Firma istatistiklerini getir',
        description: 'Sistemdeki firma istatistiklerini (toplam firma sayısı, durum dağılımı vb.) getirir'
      },
      hasRole: ['admin'],
    }
  )
  
  // GET /companies/expiring-licenses - Süresi yaklaşan lisanslar
  .get(
    '/expiring-licenses',
    async ({ user, query, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const companies = await companyService.getExpiringSoonLicenses(query.days || 30);
        return {
          success: true,
          data: companies,
        };
      } catch (err: any) {
        return error(500, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      detail: {
        tags: ['Companies'],
        summary: 'Süresi yaklaşan lisansları getir',
        description: 'Lisans süresi belirtilen gün sayısı içinde dolacak firmaları listeler'
      },
      hasRole: ['admin'],
      query: t.Object({
        days: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
      }),
    }
  )
  
  // GET /companies/expiring-contracts - Süresi yaklaşan kontratlar
  .get(
    '/expiring-contracts',
    async ({ user, query, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const companies = await companyService.getExpiringContracts(query.days || 30);
        return {
          success: true,
          data: companies,
        };
      } catch (err: any) {
        return error(500, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      detail: {
        tags: ['Companies'],
        summary: 'Süresi yaklaşan kontratları getir',
        description: 'Kontrat süresi belirtilen gün sayısı içinde dolacak firmaları listeler'
      },
      hasRole: ['admin'],
      query: t.Object({
        days: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
      }),
    }
  )
  
  // GET /companies/:id - ID ile firma getir
  .get(
    '/:id',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const company = await companyService.getCompanyById(params.id);
        return {
          success: true,
          data: company,
        };
      } catch (err: any) {
        return error(404, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      detail: {
        tags: ['Companies'],
        summary: 'ID ile firma detayını getir',
        description: 'Belirtilen IDye sahip firmanın detaylı bilgilerini getirir'
      },
      hasRole: ['admin'],
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  
  // GET /companies/code/:code - Kod ile firma getir
  .get(
    '/code/:code',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const company = await companyService.getCompanyByCode(params.code);
        return {
          success: true,
          data: company,
        };
      } catch (err: any) {
        return error(404, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      detail: {
        tags: ['Companies'],
        summary: 'Kod ile firma getir',
        description: 'Belirtilen firma koduna sahip firmanın detaylı bilgilerini getirir'
      },
      hasRole: ['admin'],
      params: t.Object({
        code: t.String(),
      }),
    }
  )
  
  // POST /companies - Yeni firma oluştur
  .post(
    '/',
    async ({ user, body, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (user.role !== 'admin') {
      //   return error(403, { message: 'Forbidden' });
      // }

      console.log(body);
      
      try {
        const company = await companyService.createCompany(body, user?.userId);
        return {
          success: true,
          message: 'Company created successfully',
          data: company,
        };
      } catch (err: any) {


        return {
          status: 400,
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Companies'],
        summary: 'Yeni firma oluştur',
        description: 'Sisteme yeni bir firma kaydı oluşturur'
      },
      hasRole: ['admin'],
      body: t.Object({
        company_title: t.String({ minLength: 1, maxLength: 50 }),
        company_name: t.String({ minLength: 1, maxLength: 255 }),
        company_code: t.String({ minLength: 1, maxLength: 50 }),
        tax_number: t.Optional(t.String({ maxLength: 100 })),
        tax_office: t.Optional(t.String({ maxLength: 100 })),
        email: t.Optional(t.String({ format: 'email' })),
        phone: t.Optional(t.String({ maxLength: 20 })),
        website: t.Optional(t.String({ maxLength: 255 })),
        address: t.Optional(t.String()),
        city: t.Optional(t.String({ maxLength: 100 })),
        state: t.Optional(t.String({ maxLength: 100 })),
        country: t.Optional(t.String({ maxLength: 100 })),
        postal_code: t.Optional(t.String({ maxLength: 20 })),
        license_type: t.Optional(
          t.Union([
            t.Literal('hospital'),
            t.Literal('imaging_center'),
            t.Literal('telemedicine'),
            t.Literal('other'),
          ])
        ),
        health_license_number: t.Optional(t.String({ maxLength: 100 })),
        license_expiry_date: t.Optional(t.String()),
        service_level: t.Optional(
          t.Union([
            t.Literal('basic'),
            t.Literal('standard'),
            t.Literal('premium'),
            t.Literal('custom'),
          ])
        ),
        sla_agreement_url: t.Optional(t.String()),
        contract_start_date: t.Optional(t.String()),
        contract_end_date: t.Optional(t.String()),
        billing_cycle: t.Optional(
          t.Union([
            t.Literal('monthly'),
            t.Literal('quarterly'),
            t.Literal('annually'),
          ])
        ),
        currency: t.Optional(t.String({ maxLength: 3 })),
        status: t.Optional(
          t.Union([
            t.Literal('active'),
            t.Literal('inactive'),
            t.Literal('suspended'),
            t.Literal('pending'),
          ])
        ),
        timezone: t.Optional(t.String({ maxLength: 50 })),
        language: t.Optional(t.String({ maxLength: 10 })),
      }),
    }
  )
  
  // PUT /companies/:id - Firma güncelle
  .put(
    '/:id',
    async ({ user, params, body, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (user.role !== 'admin') {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const company = await companyService.updateCompany(params.id, body, user.userId);
        return {
          success: true,
          message: 'Company updated successfully',
          data: company,
        };
      } catch (err: any) {
        return error(400, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      detail: {
        tags: ['Companies'],
        summary: 'Firma bilgilerini güncelle',
        description: 'Belirtilen IDye sahip firmanın bilgilerini günceller'
      },
      hasRole: ['admin'],
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        company_title: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        company_name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        tax_number: t.Optional(t.String({ maxLength: 100 })),
        tax_office: t.Optional(t.String({ maxLength: 100 })),
        email: t.Optional(t.String({ format: 'email' })),
        phone: t.Optional(t.String({ maxLength: 20 })),
        website: t.Optional(t.String({ maxLength: 255 })),
        address: t.Optional(t.String()),
        city: t.Optional(t.String({ maxLength: 100 })),
        state: t.Optional(t.String({ maxLength: 100 })),
        country: t.Optional(t.String({ maxLength: 100 })),
        postal_code: t.Optional(t.String({ maxLength: 20 })),
        license_type: t.Optional(
          t.Union([
            t.Literal('hospital'),
            t.Literal('imaging_center'),
            t.Literal('telemedicine'),
            t.Literal('other'),
          ])
        ),
        health_license_number: t.Optional(t.String({ maxLength: 100 })),
        license_expiry_date: t.Optional(t.String()),
        service_level: t.Optional(
          t.Union([
            t.Literal('basic'),
            t.Literal('standard'),
            t.Literal('premium'),
            t.Literal('custom'),
          ])
        ),
        sla_agreement_url: t.Optional(t.String()),
        contract_start_date: t.Optional(t.String()),
        contract_end_date: t.Optional(t.String()),
        billing_cycle: t.Optional(
          t.Union([
            t.Literal('monthly'),
            t.Literal('quarterly'),
            t.Literal('annually'),
          ])
        ),
        currency: t.Optional(t.String({ maxLength: 3 })),
        status: t.Optional(
          t.Union([
            t.Literal('active'),
            t.Literal('inactive'),
            t.Literal('suspended'),
            t.Literal('pending'),
          ])
        ),
        timezone: t.Optional(t.String({ maxLength: 50 })),
        language: t.Optional(t.String({ maxLength: 10 })),
      }),
    }
  )
  
  // DELETE /companies/:id - Firma sil
  .delete(
    '/:id',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        await companyService.deleteCompany(params.id);
        return {
          success: true,
          message: 'Company deleted successfully',
        };
      } catch (err: any) {
        return error(404, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      detail: {
        tags: ['Companies'],
        summary: 'Firmayı sil',
        description: 'Belirtilen IDye sahip firmayı soft delete yapar'
      },
      hasRole: ['admin'],
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  
  // POST /companies/:id/restore - Firma geri yükle
  .post(
    '/:id/restore',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const company = await companyService.restoreCompany(params.id);
        return {
          success: true,
          message: 'Company restored successfully',
          data: company,
        };
      } catch (err: any) {
        return error(404, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      detail: {
        tags: ['Companies'],
        summary: 'Firmayı geri yükle',
        description: 'Silinmiş bir firmayı geri yükler'
      },
      hasRole: ['admin'],
      params: t.Object({
        id: t.String(),
      }),
    }
  );