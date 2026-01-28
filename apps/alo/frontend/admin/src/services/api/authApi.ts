import { createApiClient } from './index';

// Auth API - handles users, establishments, delivery-men, service providers
const authApi = createApiClient('/api/auth');

export default authApi;
