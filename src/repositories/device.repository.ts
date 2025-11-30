import db from '../config/database';
import type {
  Device,
  DeviceWithInstitution,
  CreateDeviceDTO,
  UpdateDeviceDTO,
  DeviceFilters
} from '../models';

/**
 * DeviceRepository
 * Tıbbi görüntüleme cihazları (MR, BT, US, vb.) için veri erişim katmanı
 * Hastane ve kurumların cihazlarını yönetir
 */
export class DeviceRepository {
  /**
   * ID'ye göre cihaz getirir
   * @param id - Cihaz ID'si (UUID)
   * @returns Device veya null
   */
  async findById(id: string): Promise<Device | null> {
    const result = await db`
      SELECT * FROM devices
      WHERE device_id = ${id}
      ORDER BY device_id DESC
    `;
    return result[0] || null;
  }

  /**
   * Detaylı bilgilerle cihaz getirir (kurum bilgileriyle)
   * @param id - Cihaz ID'si (UUID)
   * @returns DeviceWithInstitution veya null
   */
  async findByIdWithInstitution(id: string): Promise<DeviceWithInstitution | null> {
    const result = await db`
      SELECT
        d.*,
        i.institution_name,
        i.institution_code
      FROM devices d
      LEFT JOIN institutions i ON i.institution_id = d.institution_id
      WHERE d.device_id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Cihaz koduna göre cihaz getirir
   * @param code - Cihaz kodu (unique)
   * @returns Device veya null
   */
  async findByCode(code: string): Promise<Device | null> {
    const result = await db`
      SELECT * FROM devices
      WHERE device_code = ${code}
    `;
    return result[0] || null;
  }

  /**
   * AE Title'a göre cihaz getirir (DICOM için)
   * @param aeTitle - DICOM Application Entity Title
   * @returns Device veya null
   */
  async findByAETitle(aeTitle: string): Promise<Device | null> {
    const result = await db`
      SELECT * FROM devices
      WHERE aet_title = ${aeTitle}
    `;
    return result[0] || null;
  }

  /**
   * Tüm cihazları filtrelerle birlikte getirir
   * @param filters - Filtreleme kriterleri (device_type, institution_id, is_active, is_online, search)
   * @returns DeviceWithInstitution dizisi
   */
  async findAll(filters?: DeviceFilters): Promise<DeviceWithInstitution[]> {
    // let whereConditions: string[] = ['1=1'];

    // if (filters?.device_type) {
    //   whereConditions.push(`d.device_type = '${filters.device_type}'`);
    // }

    // if (filters?.institution_id) {
    //   whereConditions.push(`d.institution_id = '${filters.institution_id}'`);
    // }

    // if (filters?.is_active !== undefined) {
    //   whereConditions.push(`d.is_active = ${filters.is_active}`);
    // }

    // if (filters?.is_online !== undefined) {
    //   whereConditions.push(`d.is_online = ${filters.is_online}`);
    // }

    // if (filters?.search) {
    //   const searchTerm = `%${filters.search}%`;
    //   whereConditions.push(`(
    //     d.device_name ILIKE '${searchTerm}' OR
    //     d.device_code ILIKE '${searchTerm}' OR
    //     d.location ILIKE '${searchTerm}'
    //   )`);
    // }

    // const whereClause = whereConditions.join(' AND ');

    // return await db`
    //   SELECT
    //     d.*,
    //     i.institution_name,
    //     i.institution_code
    //   FROM devices d
    //   LEFT JOIN institutions i ON i.institution_id = d.institution_id
    //   WHERE ${db.raw(whereClause)}
    //   ORDER BY d.device_name ASC
    // `;

    return await db`
      SELECT
        d.*,
        i.institution_name
      FROM devices d
      LEFT JOIN institutions i ON i.institution_id = d.institution_id
      ORDER BY d.device_name ASC
    `;

  }

  /**
   * Belirli bir kuruma ait cihazları getirir
   * @param institutionId - Kurum ID'si (UUID)
   * @returns DeviceWithInstitution dizisi
   */
  async findByInstitution(institutionId: string): Promise<DeviceWithInstitution[]> {
    return await db`
      SELECT
        d.*,
        i.institution_name,
        i.institution_code
      FROM devices d
      LEFT JOIN institutions i ON i.institution_id = d.institution_id
      WHERE d.institution_id = ${institutionId}
      ORDER BY d.device_name ASC
    `;
  }

  /**
   * Aktif cihazları getirir
   * @returns DeviceWithInstitution dizisi
   */
  async findActive(): Promise<DeviceWithInstitution[]> {
    return await db`
      SELECT
        d.*,
        i.institution_name,
        i.institution_code
      FROM devices d
      LEFT JOIN institutions i ON i.institution_id = d.institution_id
      WHERE d.is_active = true
      ORDER BY d.device_name ASC
    `;
  }

  /**
   * Online (çalışır durumda) cihazları getirir
   * @returns DeviceWithInstitution dizisi
   */
  async findOnline(): Promise<DeviceWithInstitution[]> {
    return await db`
      SELECT
        d.*,
        i.institution_name,
        i.institution_code
      FROM devices d
      LEFT JOIN institutions i ON i.institution_id = d.institution_id
      WHERE d.is_online = true AND d.is_active = true
      ORDER BY d.device_name ASC
    `;
  }

  /**
   * Cihaz tipine göre cihazları getirir (MR, CT, US, vb.)
   * @param deviceType - Cihaz tipi/Modalite
   * @returns DeviceWithInstitution dizisi
   */
  async findByType(deviceType: string): Promise<DeviceWithInstitution[]> {
    return await db`
      SELECT
        d.*,
        i.institution_name,
        i.institution_code
      FROM devices d
      LEFT JOIN institutions i ON i.institution_id = d.institution_id
      WHERE d.device_type = ${deviceType} AND d.is_active = true
      ORDER BY d.device_name ASC
    `;
  }

  /**
   * Bakım tarihi yaklaşan cihazları getirir
   * @param daysAhead - Kaç gün sonrası için kontrol (varsayılan: 30)
   * @returns DeviceWithInstitution dizisi
   */
  async findMaintenanceDue(daysAhead: number = 30): Promise<DeviceWithInstitution[]> {
    return await db`
      SELECT
        d.*,
        i.institution_name,
        i.institution_code
      FROM devices d
      LEFT JOIN institutions i ON i.institution_id = d.institution_id
      WHERE d.next_maintenance_date IS NOT NULL
        AND d.next_maintenance_date <= CURRENT_DATE + ${daysAhead}
        AND d.is_active = true
      ORDER BY d.next_maintenance_date ASC
    `;
  }

  /**
   * Yeni cihaz oluşturur
   * @param data - Cihaz bilgileri
   * @returns Oluşturulan Device
   */
  async create(data: CreateDeviceDTO): Promise<Device> {
    const result = await db`
      INSERT INTO devices (
        device_code, device_name, device_type, manufacturer,
        model, serial_number, institution_id, aet_title,
        ip_address, port, location, installation_date, notes
      )
      VALUES (
        ${data.device_code}, ${data.device_name}, ${data.device_type},
        ${data.manufacturer || null}, ${data.model || null},
        ${data.serial_number || null}, ${data.institution_id},
        ${data.aet_title || null}, ${data.ip_address || null},
        ${data.port || 104}, ${data.location || null},
        ${data.installation_date || null}, ${data.notes || null}
      )
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Cihaz bilgilerini günceller
   * @param id - Cihaz ID'si
   * @param data - Güncellenecek alanlar
   * @returns Güncellenmiş Device
   * @throws Cihaz bulunamazsa hata fırlatır
   */
  async update(id: string, data: UpdateDeviceDTO): Promise<Device> {
    const fields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${db.escape(value)}`)
      .join(', ');

    if (!fields) {
      throw new Error('No fields to update');
    }

    const result = await db`
      UPDATE devices
      SET ${db.raw(fields)}
      WHERE device_id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Device not found');
    }

    return result[0];
  }

  /**
   * Cihazı online yapar
   * @param id - Cihaz ID'si
   * @returns Güncellenmiş Device
   */
  async setOnline(id: string): Promise<Device> {
    const result = await db`
      UPDATE devices
      SET is_online = true
      WHERE device_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Cihazı offline yapar
   * @param id - Cihaz ID'si
   * @returns Güncellenmiş Device
   */
  async setOffline(id: string): Promise<Device> {
    const result = await db`
      UPDATE devices
      SET is_online = false
      WHERE device_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Cihazı aktif yapar
   * @param id - Cihaz ID'si
   * @returns Güncellenmiş Device
   */
  async activate(id: string): Promise<Device> {
    const result = await db`
      UPDATE devices
      SET is_active = true
      WHERE device_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Cihazı pasif yapar (soft delete)
   * @param id - Cihaz ID'si
   * @returns Güncellenmiş Device
   */
  async deactivate(id: string): Promise<Device> {
    const result = await db`
      UPDATE devices
      SET is_active = false, is_online = false
      WHERE device_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Bakım tarihini günceller
   * @param id - Cihaz ID'si
   * @param maintenanceDate - Son bakım tarihi
   * @param nextMaintenanceDate - Sonraki bakım tarihi
   * @returns Güncellenmiş Device
   */
  async updateMaintenance(
    id: string,
    maintenanceDate: string,
    nextMaintenanceDate?: string
  ): Promise<Device> {
    const result = await db`
      UPDATE devices
      SET last_maintenance_date = ${maintenanceDate},
          next_maintenance_date = ${nextMaintenanceDate || null}
      WHERE device_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Cihazı kalıcı olarak siler
   * @param id - Cihaz ID'si
   */
  async delete(id: string): Promise<void> {
    await db`
      DELETE FROM devices
      WHERE device_id = ${id}
    `;
  }

  /**
   * Cihaz istatistiklerini getirir
   * @param id - Cihaz ID'si
   * @returns İstatistik bilgileri
   */
  async getStatistics(id: string) {
    const result = await db`
      SELECT
        COUNT(*) as total_studies,
        COUNT(*) FILTER (WHERE study_status = 'pending') as pending_studies,
        COUNT(*) FILTER (WHERE study_status = 'completed') as completed_studies,
        MAX(study_date) as last_study_date
      FROM studies
      WHERE device_id = ${id}
    `;
    return result[0];
  }

  /**
   * Kurum bazlı cihaz sayılarını getirir
   * @returns Kurumlara göre cihaz sayıları
   */
  async getCountByInstitution() {
    return await db`
      SELECT
        i.institution_id,
        i.institution_name,
        COUNT(d.device_id) as device_count,
        COUNT(d.device_id) FILTER (WHERE d.is_active = true) as active_count,
        COUNT(d.device_id) FILTER (WHERE d.is_online = true) as online_count
      FROM institutions i
      LEFT JOIN devices d ON d.institution_id = i.institution_id
      GROUP BY i.institution_id, i.institution_name
      ORDER BY device_count DESC
    `;
  }

  /**
   * Cihaz tiplerine göre sayıları getirir
   * @returns Cihaz tiplerine göre istatistikler
   */
  async getCountByType() {
    return await db`
      SELECT
        device_type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_online = true) as online
      FROM devices
      GROUP BY device_type
      ORDER BY total DESC
    `;
  }
}
