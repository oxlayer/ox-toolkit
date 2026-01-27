/**
 * Establishment Builder
 *
 * Fluent builder for creating test establishment data.
 */

import type { Establishment } from '../../domain/establishment.js';

type EstablishmentData = Omit<Establishment, 'id' | 'createdAt' | 'updatedAt'>;

export class EstablishmentBuilder {
  private data: Partial<EstablishmentData> = {
    name: 'Test Restaurant',
    description: 'A test establishment',
    horarioFuncionamento: 'Mon-Fri 9AM-10PM',
    ownerId: 1,
    isActive: true,
  };

  withId(id: number): this {
    this.data.id = id;
    return this;
  }

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  withHorarioFuncionamento(horario: string): this {
    this.data.horarioFuncionamento = horario;
    return this;
  }

  withOwnerId(ownerId: number): this {
    this.data.ownerId = ownerId;
    return this;
  }

  withEstablishmentTypeId(typeId: number): this {
    this.data.establishmentTypeId = typeId;
    return this;
  }

  withImage(image: string): this {
    this.data.image = image;
    return this;
  }

  withColors(primary: string, secondary?: string): this {
    this.data.primaryColor = primary;
    if (secondary) {
      this.data.secondaryColor = secondary;
    }
    return this;
  }

  withLocation(lat: number, long: number, locationString?: string): this {
    this.data.lat = lat;
    this.data.long = long;
    if (locationString) {
      this.data.locationString = locationString;
    }
    return this;
  }

  withMaxDistanceDelivery(maxDistance: number): this {
    this.data.maxDistanceDelivery = maxDistance;
    return this;
  }

  withContact(whatsapp?: string, instagram?: string, website?: string): this {
    if (whatsapp) this.data.whatsapp = whatsapp;
    if (instagram) this.data.instagram = instagram;
    if (website) this.data.website = website;
    return this;
  }

  withGoogleBusinessUrl(url: string): this {
    this.data.googleBusinessUrl = url;
    return this;
  }

  withOpenData(data: Record<string, unknown>): this {
    this.data.openData = data;
    return this;
  }

  withIsActive(isActive: boolean): this {
    this.data.isActive = isActive;
    return this;
  }

  build(): Establishment {
    const now = new Date();
    return {
      id: this.data.id || 1,
      ...this.data,
      createdAt: now,
      updatedAt: now,
    } as Establishment;
  }

  buildCreateInput(): Omit<EstablishmentData, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> & { ownerId: number } {
    return {
      name: this.data.name!,
      horarioFuncionamento: this.data.horarioFuncionamento!,
      description: this.data.description,
      ownerId: this.data.ownerId!,
      image: this.data.image,
      primaryColor: this.data.primaryColor,
      secondaryColor: this.data.secondaryColor,
      lat: this.data.lat,
      long: this.data.long,
      locationString: this.data.locationString,
      maxDistanceDelivery: this.data.maxDistanceDelivery,
      establishmentTypeId: this.data.establishmentTypeId,
      whatsapp: this.data.whatsapp,
      instagram: this.data.instagram,
      website: this.data.website,
      googleBusinessUrl: this.data.googleBusinessUrl,
    };
  }
}
