import { appConfig } from "../config/env.js";
import { NotFoundError } from "./errors.js";
import { mapLawyerToProfile } from "./mappers.js";
import type { LawyerRepository } from "./lawyer-repository.js";
import { LawyerSearchService } from "../search/lawyer-search-service.js";
import type {
  LawyerProfileResponse,
  LawyerSearchInput,
  LawyerSearchResponse,
} from "../types/lawyer.js";

export class LawyerDirectoryService {
  constructor(
    private readonly repository: LawyerRepository,
    private readonly searchService: LawyerSearchService,
  ) {}

  async findLawyers(input: LawyerSearchInput): Promise<LawyerSearchResponse> {
    const lawyers = await this.repository.listAll();
    return this.searchService.search(lawyers, input);
  }

  async getLawyerProfile(lawyerId: string): Promise<LawyerProfileResponse> {
    const lawyer = await this.repository.getById(lawyerId);

    if (!lawyer) {
      throw new NotFoundError(
        `Kein Anwaltsprofil mit der ID '${lawyerId}' gefunden.`,
      );
    }

    return {
      profile: mapLawyerToProfile(lawyer),
      source: appConfig.source,
    };
  }
}
