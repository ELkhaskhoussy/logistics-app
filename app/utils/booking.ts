export interface ParcelDTO {
  type: string;
  description: string;
  weightKg: number;
  dimensions: string;
}

export interface RecipientDTO {
  fullName: string;
  phoneNumber: string;
  tunisiaAddress: string;
}

export interface BookingDTO {
  senderId: number;
  tripId: string;
  parcels: ParcelDTO[];
  recipient: RecipientDTO;
}