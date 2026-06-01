import prisma from '../config/database';

export class LocationService {
  static async createLocation(data: { name: string; type: string }) {
    return prisma.location.create({
      data,
    });
  }

  static async getLocations() {
    return prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  static async updateLocation(id: string, data: any) {
    return prisma.location.update({
      where: { id },
      data,
    });
  }

  static async deleteLocation(id: string) {
    return prisma.location.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
