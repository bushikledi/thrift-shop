import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';

/**
 * Buffers product view counts in memory and flushes them on an interval.
 *
 * Incrementing viewCount directly on every product read makes each read a
 * write, which contends on the row and churns the WAL under load. Coalescing
 * views per product turns a burst of reads into a single increment per product
 * per flush window. The buffer is best-effort: a process crash loses at most
 * one window of counts, which is an acceptable trade for a view counter.
 */
@Injectable()
export class ViewCountService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ViewCountService.name);
  private readonly pending = new Map<string, number>();
  private timer: NodeJS.Timeout | null = null;

  private static readonly FLUSH_INTERVAL_MS = 15_000;

  constructor(private prisma: PrismaService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.flush();
    }, ViewCountService.FLUSH_INTERVAL_MS);
    // Do not keep the event loop (or a test runner) alive for this timer.
    this.timer.unref?.();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // Flush whatever is buffered so a graceful shutdown does not lose counts.
    await this.flush();
  }

  /** Records a view without touching the database. */
  record(productId: string): void {
    this.pending.set(productId, (this.pending.get(productId) ?? 0) + 1);
  }

  /** Writes buffered counts to the database and clears the buffer. */
  async flush(): Promise<void> {
    if (this.pending.size === 0) {
      return;
    }

    // Snapshot and clear first so reads during the flush accumulate into the
    // next window rather than being lost.
    const batch = [...this.pending.entries()];
    this.pending.clear();

    try {
      await this.prisma.$transaction(
        batch.map(([id, count]) =>
          this.prisma.product.update({
            where: { id },
            data: { viewCount: { increment: count } },
          }),
        ),
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Failed to flush ${batch.length} view counts: ${message}`,
      );
    }
  }
}
