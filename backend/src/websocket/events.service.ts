import { Injectable } from '@nestjs/common';
import { IndexData } from '../indices/fetcher';

@Injectable()
export class EventsService {
  private listeners: ((data: IndexData[]) => void)[] = [];

  subscribe(callback: (data: IndexData[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  emit(data: IndexData[]) {
    this.listeners.forEach((cb) => cb(data));
  }
}