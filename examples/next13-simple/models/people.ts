import type { Company } from './company';

export interface People {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  age?: number;
  company?: Company;
}
