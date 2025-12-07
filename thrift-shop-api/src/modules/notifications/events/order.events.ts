// Order Event Payloads

export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly buyerId: string | null,
    public readonly buyerEmail: string,
    public readonly vendorId: string,
    public readonly vendorEmail: string,
    public readonly total: number,
    public readonly items: Array<{
      productTitle: string;
      quantity: number;
      price: number;
    }>,
  ) {}
}

export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly buyerId: string | null,
    public readonly buyerEmail: string,
    public readonly vendorId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly trackingNumber?: string,
  ) {}
}

export class OrderCancelledEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly buyerId: string | null,
    public readonly buyerEmail: string,
    public readonly vendorId: string,
    public readonly vendorEmail: string,
    public readonly reason?: string,
  ) {}
}
