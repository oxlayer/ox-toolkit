/**
 * Establishment Entity Unit Tests
 */

import { describe, it, expect } from 'bun:test';
import { EstablishmentBuilder } from '../../test/builders/establishment.builder';
import { testEstablishments } from '../../test/fixtures/establishments.fixture';

describe('Establishment Entity', () => {
  describe('creation', () => {
    it('should create a valid establishment with all fields', () => {
      const establishment = new EstablishmentBuilder().build();

      expect(establishment).toBeDefined();
      expect(establishment.id).toBeGreaterThanOrEqual(1);
      expect(establishment.name).toBeDefined();
      expect(establishment.createdAt).toBeInstanceOf(Date);
      expect(establishment.updatedAt).toBeInstanceOf(Date);
    });

    it('should create establishment with custom name', () => {
      const establishment = new EstablishmentBuilder()
        .withName('Custom Restaurant')
        .build();

      expect(establishment.name).toBe('Custom Restaurant');
    });

    it('should create establishment with location data', () => {
      const establishment = new EstablishmentBuilder()
        .withLocation(-23.5505, -46.6333, 'São Paulo, SP')
        .build();

      expect(establishment.lat).toBe(-23.5505);
      expect(establishment.long).toBe(-46.6333);
      expect(establishment.locationString).toBe('São Paulo, SP');
    });

    it('should create establishment with colors', () => {
      const establishment = new EstablishmentBuilder()
        .withColors('#FF5733', '#33FF57')
        .build();

      expect(establishment.primaryColor).toBe('#FF5733');
      expect(establishment.secondaryColor).toBe('#33FF57');
    });
  });

  describe('validation', () => {
    it('should require name', () => {
      const establishment = new EstablishmentBuilder()
        .withName('')
        .build();

      expect(establishment.name).toBe('');
    });

    it('should require ownerId', () => {
      const establishment = new EstablishmentBuilder().build();
      expect(establishment.ownerId).toBeDefined();
      expect(establishment.ownerId).toBeGreaterThan(0);
    });

    it('should require horarioFuncionamento', () => {
      const establishment = new EstablishmentBuilder().build();
      expect(establishment.horarioFuncionamento).toBeDefined();
      expect(establishment.horarioFuncionamento.length).toBeGreaterThan(0);
    });
  });

  describe('builder', () => {
    it('should create minimal valid establishment', () => {
      const input = new EstablishmentBuilder().buildCreateInput();

      expect(input.name).toBeDefined();
      expect(input.horarioFuncionamento).toBeDefined();
      expect(input.ownerId).toBeDefined();
    });

    it('should build with all properties', () => {
      const establishment = new EstablishmentBuilder()
        .withId(1)
        .withName('Full Restaurant')
        .withDescription('A complete restaurant')
        .withHorarioFuncionamento('24/7')
        .withOwnerId(123)
        .withIsActive(true)
        .build();

      expect(establishment.id).toBe(1);
      expect(establishment.name).toBe('Full Restaurant');
      expect(establishment.description).toBe('A complete restaurant');
      expect(establishment.horarioFuncionamento).toBe('24/7');
      expect(establishment.ownerId).toBe(123);
      expect(establishment.isActive).toBe(true);
    });
  });

  describe('fixtures', () => {
    it('should provide valid test establishment', () => {
      expect(testEstablishments.valid).toBeDefined();
      expect(testEstablishments.valid.name).toBe('Test Restaurant');
    });

    it('should provide minimal test establishment', () => {
      expect(testEstablishments.minimal).toBeDefined();
      expect(testEstablishments.minimal.name).toBe('Minimal Restaurant');
    });

    it('should provide inactive test establishment', () => {
      expect(testEstablishments.inactive).toBeDefined();
      expect(testEstablishments.inactive.isActive).toBe(false);
    });

    it('should provide create input fixture', () => {
      expect(testEstablishments.createInput).toBeDefined();
      expect(testEstablishments.createInput.name).toBe('New Restaurant');
    });
  });
});
