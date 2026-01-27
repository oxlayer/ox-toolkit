export interface ScalarConfig {
  /**
   * Title of the API documentation
   */
  title?: string;

  /**
   * Description of the API
   */
  description?: string;

  /**
   * API version
   */
  version?: string;

  /**
   * URL to the OpenAPI specification
   */
  specUrl?: string;

  /**
   * Path for the Scalar documentation UI
   */
  path?: string;

  /**
   * Theme configuration
   */
  theme?: 'light' | 'dark' | 'purple';

  /**
   * CDN URL for Scalar
   */
  cdnUrl?: string;
}

export interface OpenAPISpecConfig {
  /**
   * Enable multi-tenancy features in documentation
   * @default false
   */
  tenancyEnabled?: boolean;
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
    version: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths?: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  tags?: Array<{
    name: string;
    description?: string;
    externalDocs?: {
      description?: string;
      url: string;
    };
  }>;
}
