import prisma from '../config/database';
import { AccountingService } from './accounting.service';

export class CustomerService {
  static async createCustomer(data: { name: string; phone?: string; email?: string; gstNumber?: string; address?: string }) {
    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          gstNumber: data.gstNumber,
          address: data.address
        }
      });

      // Automatically register Customer's AccountHead
      await AccountingService.getOrCreateCustomerHead(customer.id, customer.name, tx);

      return customer;
    });
  }

  static async searchCustomers(query: string) {
    return await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { phone: { contains: query } }
        ]
      },
      take: 10
    });
  }
}
