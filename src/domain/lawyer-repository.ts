import type { Lawyer } from "../types/lawyer.js";

export interface LawyerRepository {
  listAll(): Promise<Lawyer[]>;
  getById(id: string): Promise<Lawyer | null>;
}
