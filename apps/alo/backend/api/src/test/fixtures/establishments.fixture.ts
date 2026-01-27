/**
 * Establishment Fixtures
 *
 * Pre-defined test data for establishments.
 */

import type { Establishment } from '../../domain/establishment.js';

export const testEstablishments = {
  valid: {
    id: 1,
    name: 'Test Restaurant',
    description: 'A test restaurant',
    horarioFuncionamento: 'Mon-Fri 9AM-10PM',
    ownerId: 1,
    establishmentTypeId: 1,
    image: 'https://example.com/image.jpg',
    primaryColor: '#FF5733',
    secondaryColor: '#33FF57',
    lat: -23.5505,
    long: -46.6333,
    locationString: 'São Paulo, SP',
    maxDistanceDelivery: 5000,
    whatsapp: '+5511999999999',
    instagram: '@testrestaurant',
    website: 'https://testrestaurant.com',
    googleBusinessUrl: 'https://business.google.com/test',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Establishment,

  minimal: {
    id: 2,
    name: 'Minimal Restaurant',
    description: '',
    horarioFuncionamento: '9AM-9PM',
    ownerId: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Establishment,

  withLocation: {
    id: 3,
    name: 'Located Restaurant',
    description: 'A restaurant with location data',
    horarioFuncionamento: 'Mon-Sun 10AM-11PM',
    ownerId: 2,
    lat: -23.5615,
    long: -46.6565,
    locationString: 'Pinheiros, São Paulo, SP',
    maxDistanceDelivery: 3000,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Establishment,

  inactive: {
    id: 4,
    name: 'Inactive Restaurant',
    description: 'A deactivated restaurant',
    horarioFuncionamento: 'Mon-Fri 9AM-5PM',
    ownerId: 1,
    isActive: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Establishment,

  createInput: {
    name: 'New Restaurant',
    horarioFuncionamento: 'Tue-Sun 12PM-10PM',
    description: 'A brand new restaurant',
    ownerId: 1,
    primaryColor: '#FF5733',
    secondaryColor: '#33FF57',
  },

  updateInput: {
    name: 'Updated Restaurant',
    description: 'Updated description',
    maxDistanceDelivery: 8000,
  },
};

export const testEstablishmentsList = [
  testEstablishments.valid,
  testEstablishments.minimal,
  testEstablishments.withLocation,
];
