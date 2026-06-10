import ExcelJS from 'exceljs';
export declare class ExportService {
    static exportTrialBalanceXLSX(date?: Date): Promise<ExcelJS.Workbook>;
    static exportDayBookXLSX(startDate?: Date, endDate?: Date): Promise<ExcelJS.Workbook>;
    static exportGeneralLedgerXLSX(accountId: string, startDate?: Date, endDate?: Date): Promise<ExcelJS.Workbook>;
    static exportInvoiceRegisterCSV(startDate?: Date, endDate?: Date): Promise<string>;
}
//# sourceMappingURL=export.service.d.ts.map