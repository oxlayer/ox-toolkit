/**
 * Dependency Injection Container
 *
 * Wires together all the dependencies for the application.
 */

import { CompleteContainerTemplate } from '@oxlayer/snippets';
import { createPostgresConnection } from '../config/postgres.config.js';
import { createRedisConnection } from '../config/redis.config.js';
import { createEventBus } from '../config/rabbitmq.config.js';
import { ItemRepository } from '../repositories/item.repository.js';
import { ItemsController } from '../controllers/index.js';
import * as useCases from '../use-cases/index.js';

/**
 * DI Container for {{PROJECT_NAME}} API
 */
export class Container extends CompleteContainerTemplate {
  // Lazy-loaded use cases
  private _createItemUseCase?: useCases.CreateItemUseCase;
  private _listItemsUseCase?: useCases.ListItemsUseCase;
  private _getItemUseCase?: useCases.GetItemUseCase;
  private _updateItemUseCase?: useCases.UpdateItemUseCase;
  private _deleteItemUseCase?: useCases.DeleteItemUseCase;

  // Lazy-loaded controller
  private _itemsController?: ItemsController;

  // Getters for use cases
  get createItemUseCase(): useCases.CreateItemUseCase {
    if (!this._createItemUseCase) {
      this._createItemUseCase = new useCases.CreateItemUseCase(
        this.createItemRepository()
      );
    }
    return this._createItemUseCase;
  }

  get listItemsUseCase(): useCases.ListItemsUseCase {
    if (!this._listItemsUseCase) {
      this._listItemsUseCase = new useCases.ListItemsUseCase(
        this.createItemRepository()
      );
    }
    return this._listItemsUseCase;
  }

  get getItemUseCase(): useCases.GetItemUseCase {
    if (!this._getItemUseCase) {
      this._getItemUseCase = new useCases.GetItemUseCase(
        this.createItemRepository()
      );
    }
    return this._getItemUseCase;
  }

  get updateItemUseCase(): useCases.UpdateItemUseCase {
    if (!this._updateItemUseCase) {
      this._updateItemUseCase = new useCases.UpdateItemUseCase(
        this.createItemRepository()
      );
    }
    return this._updateItemUseCase;
  }

  get deleteItemUseCase(): useCases.DeleteItemUseCase {
    if (!this._deleteItemUseCase) {
      this._deleteItemUseCase = new useCases.DeleteItemUseCase(
        this.createItemRepository()
      );
    }
    return this._deleteItemUseCase;
  }

  // Repository factory
  createItemRepository(): ItemRepository {
    return new ItemRepository(this.db);
  }

  // Controller factory
  createItemsController(): ItemsController {
    if (!this._itemsController) {
      this._itemsController = new ItemsController(
        this.createItemUseCase,
        this.listItemsUseCase,
        this.getItemUseCase,
        this.updateItemUseCase,
        this.deleteItemUseCase
      );
    }
    return this._itemsController;
  }

  /**
   * Initialize infrastructure services
   */
  async initialize() {
    console.log('[Container] Initializing infrastructure...');

    // Initialize PostgreSQL
    console.log('[Container] Connecting to PostgreSQL...');
    this._postgres = await createPostgresConnection();
    console.log('[Container] ✓ PostgreSQL connected');

    // Initialize Redis
    console.log('[Container] Connecting to Redis...');
    this._redis = await createRedisConnection();
    console.log('[Container] ✓ Redis connected');

    // Initialize RabbitMQ
    console.log('[Container] Connecting to RabbitMQ...');
    this._eventBus = await createEventBus();
    this._eventBusPublic = this._eventBus;
    console.log('[Container] ✓ RabbitMQ connected');

    console.log('[Container] Infrastructure initialized');
  }

  /**
   * Shutdown infrastructure services
   */
  async shutdown() {
    console.log('[Container] Shutting down infrastructure...');

    if (this._postgres) {
      await this._postgres.close();
      console.log('[Container] ✓ PostgreSQL closed');
    }

    if (this._redis) {
      await this._redis.quit();
      console.log('[Container] ✓ Redis closed');
    }

    if (this._eventBus) {
      await this._eventBus.close();
      console.log('[Container] ✓ RabbitMQ closed');
    }

    console.log('[Container] Shutdown complete');
  }
}

let container: Container | null = null;

export function getContainer(): Container {
  if (!container) {
    container = new Container();
  }
  return container;
}
