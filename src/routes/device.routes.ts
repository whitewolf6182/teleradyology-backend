import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { DeviceService } from '../services/device.service';
import { authMiddleware } from '../middleware/auth.middleware';

const deviceService = new DeviceService();

export const deviceRoutes = new Elysia({ prefix: '/devices' })
  .use(swagger({
    documentation: {
      tags: [
        { name: 'Devices', description: 'Cihaz yönetimi endpoints' }
      ]
    }
  }))
  .use(authMiddleware)
  
  // GET /devices - Tüm cihazları listele
  .get(
    '/',
    async ({ user, query, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      console.log("Query params:", query);

      try {
        const devices = await deviceService.getAllDevices(query);

        console.log("Devices:", devices.length);

        return {
          success: true,
          data: devices,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Tüm cihazları listele',
        description: 'Sistemde kayıtlı tüm cihazları filtreleme seçenekleriyle birlikte listeler'
      },
      query: t.Object({
        device_type: t.Optional(
          t.Union([
            t.Literal('mri'),
            t.Literal('ct'),
            t.Literal('xray'),
            t.Literal('ultrasound'),
            t.Literal('ecg'),
            t.Literal('analyzer'),
            t.Literal('other'),
          ])
        ),
        institution_id: t.Optional(t.String()),
        is_active: t.Optional(t.Boolean()),
        is_online: t.Optional(t.Boolean()),
        search: t.Optional(t.String()),
      }),
    }
  )
  
  // GET /devices/statistics - İstatistikler
  .get(
    '/statistics',
    async ({ user, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const statistics = await deviceService.getDeviceStatistics();
        return {
          success: true,
          data: statistics,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Cihaz istatistiklerini getir',
        description: 'Sistemdeki cihaz istatistiklerini (toplam cihaz sayısı, durum dağılımı vb.) getirir'
      }
    }
  )
  
  // GET /devices/maintenance-due - Bakımı yaklaşan cihazlar
  .get(
    '/maintenance-due',
    async ({ user, query, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const days = query.days ? parseInt(query.days) : 30;
        const devices = await deviceService.getMaintenanceDueDevices(days);
        return {
          success: true,
          data: devices,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Bakımı yaklaşan cihazları getir',
        description: 'Bakım tarihi belirtilen gün sayısı içinde olan cihazları listeler'
      },
      query: t.Object({
        days: t.Optional(t.String()),
      }),
    }
  )
  
  // GET /devices/overdue-maintenance - Bakımı gecikmiş cihazlar
  .get(
    '/overdue-maintenance',
    async ({ user, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const devices = await deviceService.getOverdueMaintenanceDevices();
        return {
          success: true,
          data: devices,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Bakımı gecikmiş cihazları getir',
        description: 'Bakım tarihi geçmiş cihazları listeler'
      }
    }
  )
  
  // GET /devices/institution/:institutionId - Kuruma ait cihazlar
  .get(
    '/institution/:institutionId',
    async ({ user, params, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const devices = await deviceService.getDevicesByInstitution(params.institutionId);
        return {
          success: true,
          data: devices,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Kuruma ait cihazları getir',
        description: 'Belirtilen kuruma ait tüm cihazları listeler'
      },
      params: t.Object({
        institutionId: t.String(),
      }),
    }
  )
  
  // GET /devices/type/:deviceType - Tipine göre cihazlar
  .get(
    '/type/:deviceType',
    async ({ user, params, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const devices = await deviceService.getDevicesByType(params.deviceType);
        return {
          success: true,
          data: devices,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Tipine göre cihazları getir',
        description: 'Belirtilen tipteki tüm cihazları listeler'
      },
      params: t.Object({
        deviceType: t.String(),
      }),
    }
  )
  
  // GET /devices/:id - ID ile cihaz getir
  .get(
    '/:id',
    async ({ user, params, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const device = await deviceService.getDeviceById(params.id);
        return {
          success: true,
          data: device,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'ID ile cihaz detayını getir',
        description: 'Belirtilen IDye sahip cihazın detaylı bilgilerini getirir'
      },
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  
  // GET /devices/code/:code - Kod ile cihaz getir
  .get(
    '/code/:code',
    async ({ user, params, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const device = await deviceService.getDeviceByCode(params.code);
        return {
          success: true,
          data: device,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Kod ile cihaz getir',
        description: 'Belirtilen cihaz koduna sahip cihazın detaylı bilgilerini getirir'
      },
      params: t.Object({
        code: t.String(),
      }),
    }
  )
  
  // POST /devices - Yeni cihaz oluştur
  .post(
    '/',
    async ({ user, body, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const device = await deviceService.createDevice(body);
        return {
          success: true,
          message: 'Cihaz başarıyla oluşturuldu',
          data: device,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Yeni cihaz oluştur',
        description: 'Sisteme yeni bir cihaz kaydı oluşturur'
      },
      body: t.Object({
        device_name: t.String({ minLength: 1, maxLength: 255 }),
        modality: t.Union([
          t.Literal('mri'),
          t.Literal('ct'),
          t.Literal('xray'),
          t.Literal('ultrasound'),
          t.Literal('ecg'),
          t.Literal('analyzer'),
          t.Literal('other'),
        ]),
        urgent: t.Boolean(),
        manufacturer: t.Optional(t.String({ maxLength: 255 })),
        model: t.Optional(t.String({ maxLength: 255 })),
        serial_number: t.Optional(t.String({ maxLength: 100 })),
        institution_id: t.String(),
        aet_title: t.Optional(t.String({ maxLength: 16 })),
        ip_address: t.Optional(t.String({ format: 'ipv4' })),
        port: t.Optional(t.Number({ default: 104, minimum: 1, maximum: 65535 })),
        location: t.Optional(t.String({ maxLength: 500 })),
        installation_date: t.Optional(t.String({ format: 'date' })),
        notes: t.Optional(t.String({ maxLength: 1000 })),
        is_active: t.Optional(t.Boolean({ default: true })),
        is_online: t.Optional(t.Boolean({ default: false }))
      }),
    }
  )
  
  // PUT /devices/:id - Cihaz güncelle
  .put(
    '/:id',
    async ({ user, params, body, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const device = await deviceService.updateDevice(params.id, body);
        return {
          success: true,
          message: 'Cihaz başarıyla güncellendi',
          data: device,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Cihaz bilgilerini güncelle',
        description: 'Belirtilen IDye sahip cihazın bilgilerini günceller'
      },
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        device_code: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        device_name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        device_type: t.Optional(t.Union([
          t.Literal('mri'),
          t.Literal('ct'),
          t.Literal('xray'),
          t.Literal('ultrasound'),
          t.Literal('ecg'),
          t.Literal('analyzer'),
          t.Literal('other'),
        ])),
        manufacturer: t.Optional(t.String({ maxLength: 255 })),
        model: t.Optional(t.String({ maxLength: 255 })),
        serial_number: t.Optional(t.String({ maxLength: 100 })),
        aet_title: t.Optional(t.String({ maxLength: 16 })),
        ip_address: t.Optional(t.String({ format: 'ipv4' })),
        port: t.Optional(t.Number({ minimum: 1, maximum: 65535 })),
        location: t.Optional(t.String({ maxLength: 500 })),
        installation_date: t.Optional(t.String({ format: 'date' })),
        notes: t.Optional(t.String({ maxLength: 1000 })),
        is_active: t.Optional(t.Boolean()),
        is_online: t.Optional(t.Boolean())
      }),
    }
  )
  
  // DELETE /devices/:id - Cihaz sil
  .delete(
    '/:id',
    async ({ user, params, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (user.role !== 'admin') {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        await deviceService.deleteDevice(params.id);
        return {
          success: true,
          message: 'Cihaz başarıyla silindi',
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Cihazı sil',
        description: 'Belirtilen IDye sahip cihazı soft delete yapar'
      },
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  
  // PATCH /devices/:id/restore - Cihaz geri yükle
  .patch(
    '/:id/restore',
    async ({ user, params, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (user.role !== 'admin') {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const device = await deviceService.restoreDevice(params.id);
        return {
          success: true,
          message: 'Cihaz başarıyla geri yüklendi',
          data: device,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Cihazı geri yükle',
        description: 'Silinmiş bir cihazı geri yükler'
      },
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // PATCH /devices/:id/activate - Cihazı aktifleştir
  .patch(
    '/:id/activate',
    async ({ user, params, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const device = await deviceService.activateDevice(params.id);
        return {
          success: true,
          message: 'Cihaz başarıyla aktifleştirildi',
          data: device,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Cihazı aktifleştir',
        description: 'Cihazı aktif duruma getirir'
      },
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // PATCH /devices/:id/deactivate - Cihazı pasifleştir
  .patch(
    '/:id/deactivate',
    async ({ user, params, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const device = await deviceService.deactivateDevice(params.id);
        return {
          success: true,
          message: 'Cihaz başarıyla pasifleştirildi',
          data: device,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Cihazı pasifleştir',
        description: 'Cihazı pasif duruma getirir'
      },
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // PATCH /devices/:id/online - Cihazı online yap
  .patch(
    '/:id/online',
    async ({ user, params, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const device = await deviceService.setDeviceOnline(params.id);
        return {
          success: true,
          message: 'Cihaz online duruma getirildi',
          data: device,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Cihazı online yap',
        description: 'Cihazı online duruma getirir'
      },
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // PATCH /devices/:id/offline - Cihazı offline yap
  .patch(
    '/:id/offline',
    async ({ user, params, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const device = await deviceService.setDeviceOffline(params.id);
        return {
          success: true,
          message: 'Cihaz offline duruma getirildi',
          data: device,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Cihazı offline yap',
        description: 'Cihazı offline duruma getirir'
      },
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // GET /devices/stats/count - Cihaz sayı istatistikleri
  .get(
    '/stats/count',
    async ({ user, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const [activeCount, onlineCount] = await Promise.all([
          deviceService.getActiveDevicesCount(),
          deviceService.getOnlineDevicesCount()
        ]);
        return {
          success: true,
          data: {
            activeCount,
            onlineCount
          }
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Cihaz sayı istatistiklerini getir',
        description: 'Aktif ve online cihaz sayılarını getirir'
      }
    }
  )

  // GET /devices/stats/by-institution - Kurum bazlı istatistikler
  .get(
    '/stats/by-institution',
    async ({ user, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const stats = await deviceService.getDevicesCountByInstitution();
        return {
          success: true,
          data: stats,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Kurum bazlı cihaz istatistiklerini getir',
        description: 'Kurumlara göre cihaz sayılarını getirir'
      }
    }
  )

  // GET /devices/stats/by-type - Cihaz tipi bazlı istatistikler
  .get(
    '/stats/by-type',
    async ({ user, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const stats = await deviceService.getDevicesCountByType();
        return {
          success: true,
          data: stats,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Cihaz tipi bazlı istatistikleri getir',
        description: 'Cihaz tiplerine göre dağılım istatistiklerini getirir'
      }
    }
  )

  // GET /devices/recently-added - Son eklenen cihazlar
  .get(
    '/recently-added',
    async ({ user, query, error }) => {
      // if (!user) {
      //   return error(401, { message: 'Unauthorized' });
      // }

      // if (!['admin', 'technician', 'viewer'].includes(user.role)) {
      //   return error(403, { message: 'Forbidden' });
      // }

      try {
        const limit = query.limit ? parseInt(query.limit) : 10;
        const devices = await deviceService.getRecentlyAddedDevices(limit);
        return {
          success: true,
          data: devices,
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message,
        };
      }
    },
    {
      detail: {
        tags: ['Devices'],
        summary: 'Son eklenen cihazları getir',
        description: 'En son eklenen cihazları listeler'
      },
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
    }
  );
