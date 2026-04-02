import { SeedLawyerRepository } from "../data/seed-lawyer-repository.js";
import { LawyerDirectoryService } from "../domain/lawyer-directory-service.js";
import type { LawyerRepository } from "../domain/lawyer-repository.js";
import { LawyerSearchService } from "../search/lawyer-search-service.js";

export interface AppContext {
  repository: LawyerRepository;
  searchService: LawyerSearchService;
  directoryService: LawyerDirectoryService;
}

export function createAppContext(
  repository: LawyerRepository = new SeedLawyerRepository(),
): AppContext {
  const searchService = new LawyerSearchService();
  const directoryService = new LawyerDirectoryService(repository, searchService);

  return {
    repository,
    searchService,
    directoryService,
  };
}
