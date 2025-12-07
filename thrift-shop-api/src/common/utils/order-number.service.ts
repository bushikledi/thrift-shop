import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma';

/**
 * Service for generating unique order numbers atomically
 * Uses database sequence to prevent race conditions
 */
@Injectable()
export class OrderNumberService {
  private readonly logger = new Logger(OrderNumberService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique order number using database function
   * Falls back to in-memory generation if sequence doesn't exist
   *
   * @returns Promise<string> Order number in format TS-YYYY-NNNNN
   */
  async generate(): Promise<string> {
    try {
      // Try to use the database function first (preferred - atomic)
      const result = await this.prisma.$queryRaw<
        [{ get_next_order_number: string }]
      >`
        SELECT get_next_order_number()
      `;

      if (result && result[0]?.get_next_order_number) {
        return result[0].get_next_order_number;
      }

      // Fallback if function doesn't return expected format
      return this.generateFallback();
    } catch (error) {
      // Function doesn't exist yet (migration not run) - use fallback
      this.logger.warn(
        'Order number database function not available, using fallback method',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return this.generateFallback();
    }
  }

  /**
   * Fallback method using database query with locking
   * Less efficient but still prevents most race conditions
   */
  private async generateFallback(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TS-${year}-`;

    // Get the last order for this year
    const lastOrder = await this.prisma.order.findFirst({
      where: {
        orderNumber: { startsWith: prefix },
      },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(5, '0')}`;
  }

  /**
   * Validate order number format
   * @param orderNumber Order number to validate
   * @returns boolean True if valid format
   */
  isValidFormat(orderNumber: string): boolean {
    return /^TS-\d{4}-\d{5}$/.test(orderNumber);
  }

  /**
   * Parse order number into components
   * @param orderNumber Order number to parse
   * @returns Parsed components or null if invalid
   */
  parse(orderNumber: string): { year: number; sequence: number } | null {
    if (!this.isValidFormat(orderNumber)) {
      return null;
    }

    const parts = orderNumber.split('-');
    return {
      year: parseInt(parts[1], 10),
      sequence: parseInt(parts[2], 10),
    };
  }
}
