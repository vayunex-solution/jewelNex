export declare class CustomerService {
    static createCustomer(data: {
        name: string;
        phone?: string;
        email?: string;
        gstNumber?: string;
        address?: string;
    }, companyId: string): Promise<{
        id: string;
        name: string;
        companyId: string | null;
        email: string | null;
        phone: string | null;
        gstNumber: string | null;
        address: string | null;
        panNumber: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static searchCustomers(query: string, companyId?: string): Promise<{
        id: string;
        name: string;
        companyId: string | null;
        email: string | null;
        phone: string | null;
        gstNumber: string | null;
        address: string | null;
        panNumber: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
//# sourceMappingURL=customer.service.d.ts.map