export declare const INDEX_CODES: {
    sh000001: string;
    sz399001: string;
    sh000688: string;
    sz399006: string;
    hkHSI: string;
    hkHSCEI: string;
    hkHSTECH: string;
    usNDX: string;
    usINX: string;
    usDJI: string;
};
export interface IndexData {
    code: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: string;
}
export declare function fetchIndices(): Promise<IndexData[]>;
