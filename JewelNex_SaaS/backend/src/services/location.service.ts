import prisma from '../config/database';

export class LocationService {
  static async createLocation(data: { name: string; type: string }, companyId: string) {
    return prisma.location.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  static async getLocations(companyId?: string) {
    return prisma.location.findMany({
      where: {
        isActive: true,
        companyId: companyId || 'NO_COMPANY_ACCESS',
      },
      orderBy: { name: 'asc' },
    });
  }

  static async updateLocation(id: string, data: any, companyId?: string) {
    return prisma.location.update({
      where: { id, companyId: companyId || 'NO_COMPANY_ACCESS' },
      data,
    });
  }

  static async deleteLocation(id: string, companyId?: string) {
    return prisma.location.update({
      where: { id, companyId: companyId || 'NO_COMPANY_ACCESS' },
      data: { isActive: false },
    });
  }
}
