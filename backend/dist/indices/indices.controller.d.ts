import { IndicesService } from './indices.service';
export declare class IndicesController {
    private readonly service;
    constructor(service: IndicesService);
    findAll(): Promise<{
        success: boolean;
        data: import("./fetcher").IndexData[];
        stale: boolean;
    }>;
    findDetails(code: string): Promise<{
        success: boolean;
        data: import("./fetcher").IndexDetails;
    }>;
    findOne(code: string): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
    } | {
        success: boolean;
        data: import("./fetcher").IndexData;
        error?: undefined;
    }>;
}
