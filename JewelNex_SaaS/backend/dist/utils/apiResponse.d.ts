export interface ApiResponse<T = undefined> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}
export declare const successResponse: <T>(message: string, data?: T) => ApiResponse<T>;
export declare const errorResponse: (message: string, error?: string) => ApiResponse;
//# sourceMappingURL=apiResponse.d.ts.map