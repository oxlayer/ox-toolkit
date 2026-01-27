// Result
export { Result, Success, Failure, isOk, isErr } from './result/result.js';

// Use Cases
export type {
  UseCase,
  ResultUseCase,
  QueryUseCase,
  CommandUseCase,
  MutationUseCase,
} from './use-cases/use-case.js';

// Mappers
export type { Mapper, ReadMapper, PersistenceMapper } from './mappers/mapper.js';
export { mapArray, mapOptional } from './mappers/mapper.js';
