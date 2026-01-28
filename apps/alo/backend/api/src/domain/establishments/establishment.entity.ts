/**
 * Establishment Domain Entity
 */

import { CrudEntityTemplate } from '@oxlayer/snippets/domain';
import type { Establishment } from '@/db/schema';

export type BusinessType = 'me' | 'mei' | null;

export interface EstablishmentProps {
  id: number;
  name: string;
  horarioFuncionamento: string;
  description: string;
  ownerId: number;
  image: string;
  primaryColor: string;
  secondaryColor: string;
  lat: number | null;
  long: number | null;
  locationString: string | null;
  maxDistanceDelivery: number | null;
  establishmentTypeId: number | null;
  website: string | null;
  whatsapp: string | null;
  instagram: string | null;
  googleBusinessUrl: string | null;
  openData: Record<string, unknown>;
  // Onboarding fields
  logo: string | null;
  legalName: string | null; // Razão social
  businessType: BusinessType;
  // Address fields
  zipCode: string | null; // CEP
  address: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEstablishmentInput {
  name: string;
  horarioFuncionamento: string;
  description: string;
  ownerId: number;
  image?: string;
  primaryColor?: string;
  secondaryColor?: string;
  lat?: number;
  long?: number;
  locationString?: string;
  maxDistanceDelivery?: number;
  establishmentTypeId?: number;
  website?: string;
  whatsapp?: string;
  instagram?: string;
  googleBusinessUrl?: string;
  openData?: Record<string, unknown>;
  // Onboarding fields
  logo?: string;
  legalName?: string;
  businessType?: BusinessType;
  zipCode?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface UpdateEstablishmentInput {
  name?: string;
  horarioFuncionamento?: string;
  description?: string;
  image?: string;
  primaryColor?: string;
  secondaryColor?: string;
  lat?: number;
  long?: number;
  locationString?: string;
  maxDistanceDelivery?: number;
  establishmentTypeId?: number;
  website?: string;
  whatsapp?: string;
  instagram?: string;
  googleBusinessUrl?: string;
  openData?: Record<string, unknown>;
  // Onboarding fields
  logo?: string;
  legalName?: string;
  businessType?: BusinessType;
  zipCode?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

/**
 * Establishment Domain Entity
 */
export class EstablishmentEntity extends CrudEntityTemplate<number> {
  private props: EstablishmentProps;

  private constructor(props: EstablishmentProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get id(): number { return this.props.id; }
  get name(): string { return this.props.name; }
  get horarioFuncionamento(): string { return this.props.horarioFuncionamento; }
  get description(): string { return this.props.description; }
  get ownerId(): number { return this.props.ownerId; }
  get image(): string { return this.props.image; }
  get primaryColor(): string { return this.props.primaryColor; }
  get secondaryColor(): string { return this.props.secondaryColor; }
  get lat(): number | null { return this.props.lat; }
  get long(): number | null { return this.props.long; }
  get locationString(): string | null { return this.props.locationString; }
  get maxDistanceDelivery(): number | null { return this.props.maxDistanceDelivery; }
  get establishmentTypeId(): number | null { return this.props.establishmentTypeId; }
  get website(): string | null { return this.props.website; }
  get whatsapp(): string | null { return this.props.whatsapp; }
  get instagram(): string | null { return this.props.instagram; }
  get googleBusinessUrl(): string | null { return this.props.googleBusinessUrl; }
  get openData(): Record<string, unknown> { return this.props.openData; }
  // Onboarding getters
  get logo(): string | null { return this.props.logo; }
  get legalName(): string | null { return this.props.legalName; }
  get businessType(): BusinessType { return this.props.businessType; }
  get zipCode(): string | null { return this.props.zipCode; }
  get address(): string | null { return this.props.address; }
  get addressNumber(): string | null { return this.props.addressNumber; }
  get addressComplement(): string | null { return this.props.addressComplement; }
  get neighborhood(): string | null { return this.props.neighborhood; }
  get city(): string | null { return this.props.city; }
  get state(): string | null { return this.props.state; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Setters for onboarding
  set logo(value: string | null) { this.props.logo = value; this.touch(); }
  set legalName(value: string | null) { this.props.legalName = value; this.touch(); }
  set businessType(value: BusinessType) { this.props.businessType = value; this.touch(); }
  set zipCode(value: string | null) { this.props.zipCode = value; this.touch(); }
  set address(value: string | null) { this.props.address = value; this.touch(); }
  set addressNumber(value: string | null) { this.props.addressNumber = value; this.touch(); }
  set addressComplement(value: string | null) { this.props.addressComplement = value; this.touch(); }
  set neighborhood(value: string | null) { this.props.neighborhood = value; this.touch(); }
  set city(value: string | null) { this.props.city = value; this.touch(); }
  set state(value: string | null) { this.props.state = value; this.touch(); }

  // Business methods
  updateLocation(lat: number, long: number, locationString: string): void {
    this.props.lat = lat;
    this.props.long = long;
    this.props.locationString = locationString;
    this.touch();
  }

  updateContactInfo(whatsapp?: string, instagram?: string, website?: string): void {
    if (whatsapp !== undefined) this.props.whatsapp = whatsapp;
    if (instagram !== undefined) this.props.instagram = instagram;
    if (website !== undefined) this.props.website = website;
    this.touch();
  }

  updateAddress(address: {
    zipCode?: string;
    address?: string;
    addressNumber?: string;
    addressComplement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  }): void {
    if (address.zipCode !== undefined) this.props.zipCode = address.zipCode;
    if (address.address !== undefined) this.props.address = address.address;
    if (address.addressNumber !== undefined) this.props.addressNumber = address.addressNumber;
    if (address.addressComplement !== undefined) this.props.addressComplement = address.addressComplement;
    if (address.neighborhood !== undefined) this.props.neighborhood = address.neighborhood;
    if (address.city !== undefined) this.props.city = address.city;
    if (address.state !== undefined) this.props.state = address.state;
    this.touch();
  }

  hasDeliveryCapability(): boolean {
    return this.props.maxDistanceDelivery !== null && this.props.maxDistanceDelivery > 0;
  }

  // Factory method
  static create(input: CreateEstablishmentInput): EstablishmentEntity {
    return new EstablishmentEntity({
      id: 0, // Will be set by database
      name: input.name.trim(),
      horarioFuncionamento: input.horarioFuncionamento.trim(),
      description: input.description.trim(),
      ownerId: input.ownerId,
      image: input.image ?? '',
      primaryColor: input.primaryColor ?? '#000000',
      secondaryColor: input.secondaryColor ?? '#000000',
      lat: input.lat ?? null,
      long: input.long ?? null,
      locationString: input.locationString?.trim() ?? null,
      maxDistanceDelivery: input.maxDistanceDelivery ?? null,
      establishmentTypeId: input.establishmentTypeId ?? null,
      website: input.website?.trim() ?? null,
      whatsapp: input.whatsapp?.trim() ?? null,
      instagram: input.instagram?.trim() ?? null,
      googleBusinessUrl: input.googleBusinessUrl?.trim() ?? null,
      openData: input.openData ?? {},
      // Onboarding fields
      logo: input.logo ?? null,
      legalName: input.legalName ?? null,
      businessType: input.businessType ?? null,
      zipCode: input.zipCode ?? null,
      address: input.address ?? null,
      addressNumber: input.addressNumber ?? null,
      addressComplement: input.addressComplement ?? null,
      neighborhood: input.neighborhood ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Persistence conversion
  static fromPersistence(data: Establishment): EstablishmentEntity {
    return new EstablishmentEntity({
      id: data.id,
      name: data.name,
      horarioFuncionamento: data.horarioFuncionamento,
      description: data.description,
      ownerId: data.owner_id,
      image: data.image,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      lat: data.lat ? Number(data.lat) : null,
      long: data.long ? Number(data.long) : null,
      locationString: data.location_string,
      maxDistanceDelivery: data.max_distance_delivery,
      establishmentTypeId: data.establishment_type_id,
      website: data.website,
      whatsapp: data.whatsapp,
      instagram: data.instagram,
      googleBusinessUrl: data.google_business_url,
      openData: (data.open_data as Record<string, unknown>) ?? {},
      // Onboarding fields
      logo: data.logo,
      legalName: data.legal_name,
      businessType: data.business_type as BusinessType,
      zipCode: data.zip_code,
      address: data.address,
      addressNumber: data.address_number,
      addressComplement: data.address_complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  toPersistence(): Partial<Establishment> {
    return {
      id: this.props.id,
      name: this.props.name,
      horario_funcionamento: this.props.horarioFuncionamento,
      description: this.props.description,
      owner_id: this.props.ownerId,
      image: this.props.image,
      primary_color: this.props.primaryColor,
      secondary_color: this.props.secondaryColor,
      lat: this.props.lat,
      long: this.props.long,
      location_string: this.props.locationString,
      max_distance_delivery: this.props.maxDistanceDelivery,
      establishment_type_id: this.props.establishmentTypeId,
      website: this.props.website,
      whatsapp: this.props.whatsapp,
      instagram: this.props.instagram,
      google_business_url: this.props.googleBusinessUrl,
      open_data: this.props.openData as any,
      // Onboarding fields
      logo: this.props.logo,
      legal_name: this.props.legalName,
      business_type: this.props.businessType,
      zip_code: this.props.zipCode,
      address: this.props.address,
      address_number: this.props.addressNumber,
      address_complement: this.props.addressComplement,
      neighborhood: this.props.neighborhood,
      city: this.props.city,
      state: this.props.state,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }
}
