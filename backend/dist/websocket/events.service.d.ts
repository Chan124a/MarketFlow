import { IndexData } from '../indices/fetcher';
export declare class EventsService {
    private listeners;
    subscribe(callback: (data: IndexData[]) => void): () => void;
    emit(data: IndexData[]): void;
}
