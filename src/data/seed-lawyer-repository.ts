import type { LawyerRepository } from "../domain/lawyer-repository.js";
import type { Lawyer } from "../types/lawyer.js";
import { seedLawyers } from "./seed-lawyers.js";

export class SeedLawyerRepository implements LawyerRepository {
  constructor(private readonly lawyers: Lawyer[] = seedLawyers) {}

  async listAll(): Promise<Lawyer[]> {
    return [...this.lawyers];
  }

  async getById(id: string): Promise<Lawyer | null> {
    return this.lawyers.find((lawyer) => lawyer.id === id) ?? null;
  }
}
