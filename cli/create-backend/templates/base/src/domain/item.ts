/**
 * Item Domain Entity
 *
 * This is an example entity. Replace with your own domain entities.
 */

import { CrudEntityTemplate } from '@oxlayer/snippets';

export class ItemEntity extends CrudEntityTemplate {
  readonly name: string;
  readonly description?: string;
}
