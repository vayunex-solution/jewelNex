import prisma from '../config/database';
import { AccountingService } from './accounting.service';

export class CustomerService {
  static async createCustomer(data: { name: string; phone?: string; email?: string; gstNumber?: string; address?: string }, companyId: string) {
    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          gstNumber: data.gstNumber,
          address: data.address,
          companyId
        }
      });

      // Automatically register Customer's AccountHead
      await AccountingService.getOrCreateCustomerHead(customer.id, customer.name, tx);

      return customer;
    });
  }

  static async searchCustomers(query: string, companyId?: string) {
    return await prisma.customer.findMany({
      where: {
        companyId: companyId || 'NO_COMPANY_ACCESS',
        OR: [
          { name: { contains: query } },
          { phone: { contains: query } }
        ]
      },
      take: 10
    });
  }
}
