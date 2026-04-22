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
export interface CandlePoint {
    time: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
}
export interface TrendPoint {
    time: string;
    value: number;
}
export interface IndexDetails {
    code: string;
    name: string;
    kline: Record<'1d' | '3d' | '7d', CandlePoint[]>;
    trend: Record<'1d' | '1m' | '3m' | '6m' | '9m' | '1y' | '2y' | '3y', TrendPoint[]>;
}
export declare function fetchIndices(): Promise<IndexData[]>;
export declare function fetchIndexDetails(code: string): Promise<IndexDetails>;
