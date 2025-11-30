import { InstitutionRepository } from '../repositories/institution.repository';
import type {
  CreateInstitutionDTO,
  UpdateInstitutionDTO,
  InstitutionFilters,
  InstitutionStatistics,
} from '../models';

export class InstitutionService {
  private institutionRepo = new InstitutionRepository();

  // ----------------------------------------------------------
  // LIST / GET
  // ----------------------------------------------------------

  async getAllInstitutions(filters?: InstitutionFilters) {
    return await this.institutionRepo.findAll(filters);
  }

  async getInstitutionById(institutionId: string) {
    const institution = await this.institutionRepo.findById(institutionId);
    if (!institution) {
      throw new Error('Institution not found');
    }
    return institution;
  }

  // async getInstitutionByName(name: string) {
  //   const institution = await this.institutionRepo.findByName(name);
  //   if (!institution) {
  //     throw new Error('Institution not found');
  //   }
  //   return institution;
  // }

  // ----------------------------------------------------------
  // CREATE
  // ----------------------------------------------------------

  async createInstitution(data: CreateInstitutionDTO, userId: string) {


    console.log("Creating institution:", data);

    return await this.institutionRepo.create(data, userId);
  }

  // ----------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------

  async updateInstitution(institutionId: string, data: UpdateInstitutionDTO, userId: string) {
    const existing = await this.institutionRepo.findById(institutionId);
    if (!existing) {
      throw new Error('Institution not found');
    }


    return await this.institutionRepo.update(institutionId, data, userId);
  }

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  // async deleteInstitution(institutionId: string) {
  //   const existing = await this.institutionRepo.findById(institutionId);
  //   if (!existing) {
  //     throw new Error('Institution not found');
  //   }

  //   await this.institutionRepo.softDelete(institutionId);
  // }

  // async permanentlyDeleteInstitution(institutionId: string) {
  //   await this.institutionRepo.hardDelete(institutionId);
  // }

  // async restoreInstitution(institutionId: string) {
  //   return await this.institutionRepo.restore(institutionId);
  // }

  // ----------------------------------------------------------
  // STATISTICS
  // ----------------------------------------------------------

  // async getInstitutionStatistics(): Promise<InstitutionStatistics> {
  //   const allInstitutions = await this.institutionRepo.findAll();
  //   const activeCount = await this.institutionRepo.getActiveInstitutionsCount();

  //   const typeCount: Record<string, number> = {};
  //   const cityCount: Record<string, number> = {};
  //   const statusCount = { active: 0, inactive: 0 };

  //   allInstitutions.forEach((inst) => {

  //     // type (FK → institution_types)
  //     if (inst.type_code) {
  //       typeCount[inst.type_code] = (typeCount[inst.type_code] || 0) + 1;
  //     }

  //     // city
  //     if (inst.city) {
  //       cityCount[inst.city] = (cityCount[inst.city] || 0) + 1;
  //     }

  //     // is_active
  //     if (inst.is_active) statusCount.active++;
  //     else statusCount.inactive++;
  //   });

  //   return {
  //     total: allInstitutions.length,
  //     activeCount,
  //     typeCount,
  //     cityCount,
  //     statusCount,
  //   };
  // }
}

