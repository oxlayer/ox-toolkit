// Controllers
export { BaseController } from './controllers/base-controller.js';

// Errors
export {
  HttpStatus,
  HttpError,
  mapDomainErrorToHttpStatus,
  domainErrorToResponse,
  errorToResponse,
} from './errors/http-error.js';
export type { HttpStatusCode } from './errors/http-error.js';

// Validation
export {
  validate,
  validateOrThrow,
  validationErrorResponse,
} from './validation/validation.js';
export type { ValidationResult, ValidationErrorDetail } from './validation/validation.js';

// Pagination
export {
  base64Encode,
  base64Decode,
  buildPageInfo,
  buildPaginatedPayload,
} from './utils/pagination.js';

export type { PageInfo, PaginationMeta } from './utils/pagination.js';

