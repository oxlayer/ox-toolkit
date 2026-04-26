/**
 * Row-Level Security (RLS) Manager
 *
 * Dynamic RLS policy management that works with any client database schema.
 * Automatically adds tenant_id columns and RLS policies to all tables.
 *
 * This implementation:
 * 1. Inspects the database schema to find all tables
 * 2. Adds tenant_id column if it doesn't exist
 * 3. Creates RLS policies for tenant isolation
 * 4. Works with ANY client table structure
 *
 * @example
 * ```ts
 * import { RLSManager } from './rls-manager.js';
 *
 * const rls = new RLSManager(db);
 * await rls.enableRLSForAllTables();
 * await rls.setTenantContext('acme-corp');
 * ```
 */

import type { PgDatabase } from "drizzle-orm/pg-core";

/**
 * Type alias for Drizzle database instance
 * Import Database from tenancy-aware-postgres.ts for the public API
 */
type RLSDatabase = PgDatabase<any, any, any>;

/**
 * RLS policy configuration
 */
export interface RLSPolicyConfig {
  /** Schema name (default: 'public') */
  schema?: string;
  /** Tenant ID column name (default: 'tenant_id') */
  tenantColumn?: string;
  /** Whether to create tenant_id column if missing (default: true) */
  addColumnIfMissing?: boolean;
  /** Tables to exclude from RLS (optional) */
  excludeTables?: string[];
  /** Tables to include in RLS (if specified, only these tables get RLS) */
  includeTables?: string[];
}

/**
 * Table metadata from database inspection
 */
export interface TableMetadata {
  /** Table name */
  name: string;
  /** Schema name */
  schema: string;
  /** Whether table has tenant_id column */
  hasTenantColumn: boolean;
  /** Whether RLS is enabled */
  rlsEnabled: boolean;
  /** Existing policies on the table */
  policies: string[];
}

/**
 * RLS execution result
 */
export interface RLSResult {
  /** Tables processed */
  tables: string[];
  /** Columns added */
  columnsAdded: string[];
  /** Policies created */
  policiesCreated: string[];
  /** Errors encountered */
  errors: Array<{ table: string; error: string }>;
}

/**
 * Row-Level Security Manager
 *
 * Dynamically applies RLS to all tables in a database.
 * Works with any client schema.
 */
export class RLSManager {
  constructor(
    private db: RLSDatabase,
    private config: RLSPolicyConfig = {}
  ) { }

  /**
   * Enable RLS for all tables in the database
   *
   * This method:
   * 1. Inspects all tables in the schema
   * 2. Adds tenant_id column if missing
   * 3. Enables RLS on each table
   * 4. Creates tenant isolation policies
   *
   * @returns Result of RLS application
   */
  async enableRLSForAllTables(): Promise<RLSResult> {
    const schema = this.config.schema || "public";
    const tenantColumn = this.config.tenantColumn || "tenant_id";
    const addColumn = this.config.addColumnIfMissing !== false;

    const result: RLSResult = {
      tables: [],
      columnsAdded: [],
      policiesCreated: [],
      errors: [],
    };

    try {
      // Get all tables in the schema
      const tables = await this.inspectTables(schema);

      // Filter tables based on include/exclude config
      const tablesToProcess = this.filterTables(tables);

      for (const table of tablesToProcess) {
        try {
          await this.processTable(table, tenantColumn, addColumn, result);
        } catch (error) {
          result.errors.push({
            table: table.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } catch (error) {
      result.errors.push({
        table: "*",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return result;
  }

  /**
   * Set tenant context for RLS
   *
   * Sets the app.current_tenant session variable used by RLS policies.
   * Must be called within a transaction for SET LOCAL to work.
   *
   * @param tenantId - Tenant identifier
   * @param useLocal - Use SET LOCAL (transaction-scoped, default: true)
   */
  async setTenantContext(tenantId: string, useLocal = true): Promise<void> {
    const sql = this.db as any;
    const command = useLocal ? "SET LOCAL" : "SET";
    const query = `SET ${command} app.current_tenant = '${this.escapeLiteral(tenantId)}'`;

    if (typeof sql.execute === "function") {
      await sql.execute(query);
    } else if (typeof sql.run === "function") {
      await sql.run(query);
    } else {
      throw new Error("Database does not support direct SQL execution");
    }
  }

  /**
   * Reset tenant context
   */
  async resetTenantContext(): Promise<void> {
    const sql = this.db as any;
    const query = "RESET app.current_tenant";

    if (typeof sql.execute === "function") {
      await sql.execute(query);
    } else if (typeof sql.run === "function") {
      await sql.run(query);
    }
  }

  /**
   * Inspect all tables in the schema
   */
  private async inspectTables(schema: string): Promise<TableMetadata[]> {
    const _sql = this.db as any;
    const tables: TableMetadata[] = [];

    // Get all tables
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = '${this.escapeIdentifier(schema)}'
      AND table_type = 'BASE TABLE'
    `;

    const tableRows = await this.executeQuery(tablesQuery);

    for (const row of tableRows) {
      const tableName = row.table_name;
      const hasTenantColumn = await this.checkHasTenantColumn(schema, tableName);
      const rlsEnabled = await this.checkRLSEnabled(schema, tableName);
      const policies = await this.getTablePolicies(schema, tableName);

      tables.push({
        name: tableName,
        schema,
        hasTenantColumn,
        rlsEnabled,
        policies,
      });
    }

    return tables;
  }

  /**
   * Check if table has tenant_id column
   */
  private async checkHasTenantColumn(
    schema: string,
    table: string
  ): Promise<boolean> {
    const tenantColumn = this.config.tenantColumn || "tenant_id";
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = '${this.escapeIdentifier(schema)}'
        AND table_name = '${this.escapeIdentifier(table)}'
        AND column_name = '${this.escapeIdentifier(tenantColumn)}'
      )
    `;

    const result = await this.executeQuery(query);
    return result[0]?.exists === true;
  }

  /**
   * Check if RLS is enabled on table
   */
  private async checkRLSEnabled(schema: string, table: string): Promise<boolean> {
    const query = `
      SELECT relrowsecurity
      FROM pg_class
      JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
      WHERE pg_namespace.nspname = '${this.escapeIdentifier(schema)}'
      AND pg_class.relname = '${this.escapeIdentifier(table)}'
    `;

    const result = await this.executeQuery(query);
    return result[0]?.relrowsecurity === true;
  }

  /**
   * Get existing RLS policies on table
   */
  private async getTablePolicies(schema: string, table: string): Promise<string[]> {
    const query = `
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = '${this.escapeIdentifier(schema)}'
      AND tablename = '${this.escapeIdentifier(table)}'
    `;

    const result = await this.executeQuery(query);
    return result.map((r: any) => r.policyname);
  }

  /**
   * Filter tables based on include/exclude config
   */
  private filterTables(tables: TableMetadata[]): TableMetadata[] {
    const { includeTables, excludeTables } = this.config;

    let filtered = tables;

    if (includeTables && includeTables.length > 0) {
      filtered = filtered.filter((t) => includeTables.includes(t.name));
    }

    if (excludeTables && excludeTables.length > 0) {
      filtered = filtered.filter((t) => !excludeTables.includes(t.name));
    }

    return filtered;
  }

  /**
   * Process a single table for RLS
   */
  private async processTable(
    table: TableMetadata,
    tenantColumn: string,
    addColumn: boolean,
    result: RLSResult
  ): Promise<void> {
    const { name, schema } = table;
    const escapedTable = `${this.escapeIdentifier(schema)}.${this.escapeIdentifier(name)}`;

    result.tables.push(name);

    // Add tenant_id column if missing
    if (!table.hasTenantColumn && addColumn) {
      await this.addTenantColumn(schema, name, tenantColumn);
      result.columnsAdded.push(name);
    }

    // Enable RLS
    if (!table.rlsEnabled) {
      await this.executeSql(`ALTER TABLE ${escapedTable} ENABLE ROW LEVEL SECURITY`);
    }

    // Create tenant isolation policy
    const policyName = `tenant_isolation_${name}`;
    if (!table.policies.includes(policyName)) {
      await this.createTenantIsolationPolicy(schema, name, tenantColumn, policyName);
      result.policiesCreated.push(policyName);
    }
  }

  /**
   * Add tenant_id column to table
   */
  private async addTenantColumn(
    schema: string,
    table: string,
    columnName: string
  ): Promise<void> {
    const escapedTable = `${this.escapeIdentifier(schema)}.${this.escapeIdentifier(table)}`;
    const escapedColumn = this.escapeIdentifier(columnName);
    const query = `ALTER TABLE ${escapedTable} ADD COLUMN ${escapedColumn} TEXT DEFAULT 'main' NOT NULL`;

    await this.executeSql(query);
  }

  /**
   * Create tenant isolation RLS policy
   */
  private async createTenantIsolationPolicy(
    schema: string,
    table: string,
    tenantColumn: string,
    policyName: string
  ): Promise<void> {
    const escapedTable = `${this.escapeIdentifier(schema)}.${this.escapeIdentifier(table)}`;
    const escapedColumn = this.escapeIdentifier(tenantColumn);
    const escapedPolicy = this.escapeIdentifier(policyName);

    // Using current_setting for tenant context
    const query = `
      CREATE POLICY ${escapedPolicy} ON ${escapedTable}
      USING (${escapedColumn} = current_setting('app.current_tenant', true))
      WITH CHECK (${escapedColumn} = current_setting('app.current_tenant', true))
    `;

    await this.executeSql(query);
  }

  /**
   * Execute SQL query
   */
  private async executeSql(query: string): Promise<void> {
    const sql = this.db as any;

    if (typeof sql.execute === "function") {
      await sql.execute(query);
    } else if (typeof sql.run === "function") {
      await sql.run(query);
    } else {
      throw new Error("Database does not support direct SQL execution");
    }
  }

  /**
   * Execute query and return results
   */
  private async executeQuery(query: string): Promise<any[]> {
    const sql = this.db as any;

    if (typeof sql.execute === "function") {
      return await sql.execute(query);
    } else if (typeof sql.run === "function") {
      return await sql.run(query);
    } else {
      throw new Error("Database does not support direct SQL execution");
    }
  }

  /**
   * Escape SQL identifier (table name, column name, etc.)
   */
  private escapeIdentifier(ident: string): string {
    return ident.replace(/"/g, '""');
  }

  /**
   * Escape SQL literal (string value)
   */
  private escapeLiteral(literal: string): string {
    return literal.replace(/'/g, "''");
  }
}

/**
 * Create an RLS manager for a database
 *
 * @param db - Drizzle database instance
 * @param config - RLS configuration
 * @returns RLS manager instance
 */
export function createRLSManager(
  db: RLSDatabase,
  config?: RLSPolicyConfig
): RLSManager {
  return new RLSManager(db, config);
}
