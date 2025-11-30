// src/services/DeviceService.ts
import { DeviceRepository } from '../repositories/device.repository';
import type {
  Device,
  DeviceWithInstitution,
  CreateDeviceDTO,
  UpdateDeviceDTO,
  DeviceFilters
} from '../models';

export class DeviceService {
  private deviceRepo = new DeviceRepository();

  async getAllDevices(filters?: DeviceFilters) {
    return await this.deviceRepo.findAll(filters);
  }

  async getDeviceById(deviceId: string) {
    const device = await this.deviceRepo.findByIdWithInstitution(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }
    return device;
  }

  async getDeviceByCode(deviceCode: string) {
    const device = await this.deviceRepo.findByCode(deviceCode);
    if (!device) {
      throw new Error('Device not found');
    }
    return device;
  }

  async createDevice(data: CreateDeviceDTO) {
    const existingCode = await this.deviceRepo.findByCode(data.device_code);
    if (existingCode) {
      throw new Error('Device code already exists');
    }

    if (data.aet_title) {
      const existingAETitle = await this.deviceRepo.findByAETitle(data.aet_title);
      if (existingAETitle) {
        throw new Error('AE Title already exists');
      }
    }

    return await this.deviceRepo.create(data);
  }

  async updateDevice(deviceId: string, data: UpdateDeviceDTO) {
    const existing = await this.deviceRepo.findById(deviceId);
    if (!existing) {
      throw new Error('Device not found');
    }

    if (data.device_code && data.device_code !== existing.device_code) {
      const existingCode = await this.deviceRepo.findByCode(data.device_code);
      if (existingCode) {
        throw new Error('Device code already exists');
      }
    }

    if (data.aet_title && data.aet_title !== existing.aet_title) {
      const existingAETitle = await this.deviceRepo.findByAETitle(data.aet_title);
      if (existingAETitle) {
        throw new Error('AE Title already exists');
      }
    }

    return await this.deviceRepo.update(deviceId, data);
  }

  async deleteDevice(deviceId: string) {
    const existing = await this.deviceRepo.findById(deviceId);
    if (!existing) {
      throw new Error('Device not found');
    }

    await this.deviceRepo.softDelete(deviceId);
  }

  async permanentlyDeleteDevice(deviceId: string) {
    await this.deviceRepo.hardDelete(deviceId);
  }

  async restoreDevice(deviceId: string) {
    return await this.deviceRepo.restore(deviceId);
  }

  async getActiveDevicesCount() {
    return await this.deviceRepo.getActiveDevicesCount();
  }

  async getOnlineDevicesCount() {
    return await this.deviceRepo.getOnlineDevicesCount();
  }

  async getDevicesByInstitution(institutionId: string) {
    return await this.deviceRepo.findByInstitution(institutionId);
  }

  async getDevicesByType(deviceType: string) {
    return await this.deviceRepo.findByType(deviceType);
  }

  async getMaintenanceDueDevices(days: number = 30) {
    return await this.deviceRepo.findMaintenanceDue(days);
  }

  async getOverdueMaintenanceDevices() {
    return await this.deviceRepo.getOverdueMaintenanceDevices();
  }

  async getRecentlyAddedDevices(limit: number = 10) {
    return await this.deviceRepo.getRecentlyAdded(limit);
  }

  async getDeviceStatistics() {
    const [
      allDevices,
      activeCount,
      onlineCount,
      statusStats,
      typeStats,
      institutionStats
    ] = await Promise.all([
      this.deviceRepo.findAll(),
      this.deviceRepo.getActiveDevicesCount(),
      this.deviceRepo.getOnlineDevicesCount(),
      this.deviceRepo.getDevicesStatusStatistics(),
      this.deviceRepo.getDevicesCountByType(),
      this.deviceRepo.getDevicesCountByInstitution()
    ]);

    const typeCount = {
      mri: 0,
      ct: 0,
      xray: 0,
      ultrasound: 0,
      ecg: 0,
      analyzer: 0,
      other: 0
    };

    allDevices.forEach((device) => {
      if (device.device_type && typeCount.hasOwnProperty(device.device_type)) {
        typeCount[device.device_type as keyof typeof typeCount]++;
      }
    });

    return {
      total: allDevices.length,
      activeCount,
      onlineCount,
      statusStatistics: statusStats[0],
      typeCount,
      typeStatistics: typeStats,
      institutionStatistics: institutionStats
    };
  }
}

export const deviceService = new DeviceService();