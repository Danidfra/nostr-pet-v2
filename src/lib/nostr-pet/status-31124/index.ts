/**
 * Blobbi Current State (Kind 31124) - Main exports
 */

// Types
export type {
  BlobbiStatus,
  BlobbiLifeStage,
  BlobbiMood,
  BlobbiState,
  AdultType,
  StatusValidationResult,
  BlobbiStatusUpdate,
  CreateBlobbiStatusParams,
} from './types';

export {
  BLOBBI_STATUS_TAG_NAMES,
  BLOBBI_STATUS_DEFAULTS,
  STATUS_VALIDATION,
} from './types';

// Parsing
export {
  validateBlobbiStatusEvent,
  parseBlobbiStatusFromEvent,
  parseBlobbiStatusList,
  getLatestStatus,
} from './parse';

// Building
export {
  generateBlobbiId,
  buildBlobbiStatusEvent,
  createInitialBlobbiStatus,
} from './build';

// Selectors
export {
  filterByStage,
  filterByOwner,
  getEggs,
  getBabies,
  getAdults,
  getSleepingBlobbis,
  getAwakeBlobbis,
  getBreedingReadyBlobbis,
  sortByLastInteraction,
  sortByExperience,
  sortByGeneration,
  sortByCreatedAt,
  findById,
  findByName,
  getTotalCount,
  getCountByStage,
  needsAttention,
  getBlobbisNeedingAttention,
  getAverageStats,
  getHealthiest,
} from './selectors';

// Mappers
export {
  mapBlobbiStatusToBlobbi,
  mapBlobbiStatusListToBlobbis,
} from './mappers';
