import type { Result } from '../result/result.js';

/**
 * Base interface for all use cases.
 *
 * Use cases represent application-specific business logic.
 * They orchestrate domain entities and are the entry points for application operations.
 *
 * Rules:
 * - Use cases contain business logic only
 * - Use cases receive repository interfaces (not implementations)
 * - Use cases return Result types for expected failures
 * - Use cases are the only place where transactions are coordinated
 *
 * @example
 * ```ts
 * interface CreateOrderInput {
 *   customerId: string;
 *   items: { productId: string; quantity: number }[];
 * }
 *
 * interface CreateOrderOutput {
 *   orderId: string;
 *   total: number;
 * }
 *
 * class CreateOrderUseCase implements UseCase<CreateOrderInput, CreateOrderOutput> {
 *   constructor(
 *     private orderRepository: IOrderRepository,
 *     private productRepository: IProductRepository
 *   ) {}
 *
 *   async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
 *     // Business logic here
 *   }
 * }
 * ```
 */
export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Use case that returns a Result type for explicit error handling
 */
export interface ResultUseCase<TInput, TOutput, TError extends Error = Error> {
  execute(input: TInput): Promise<Result<TOutput, TError>>;
}

/**
 * Use case with no input
 */
export interface QueryUseCase<TOutput> {
  execute(): Promise<TOutput>;
}

/**
 * Use case with no output (command)
 */
export interface CommandUseCase<TInput> {
  execute(input: TInput): Promise<void>;
}

/**
 * Marker interface for use cases that modify state
 */
export interface MutationUseCase<TInput, TOutput> extends UseCase<TInput, TOutput> {
  readonly __mutation: true;
}
