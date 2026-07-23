import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AnalyticsQueryDto {
  @ApiProperty({
    required: false,
    default: 30,
    description: 'Size of the reporting window in days',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}

export class TimeSeriesPointDto {
  @ApiProperty({ example: '2026-07-01' })
  date!: string;

  @ApiProperty({ description: 'Revenue from delivered orders that day' })
  revenue!: number;

  @ApiProperty({ description: 'Orders placed that day' })
  orders!: number;
}

export class NamedTotalDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  revenue!: number;

  @ApiProperty()
  orders!: number;
}

export class AdminAnalyticsResponseDto {
  @ApiProperty({ type: [TimeSeriesPointDto] })
  series!: TimeSeriesPointDto[];

  @ApiProperty({ type: [NamedTotalDto] })
  topCategories!: NamedTotalDto[];

  @ApiProperty({ type: [NamedTotalDto] })
  topVendors!: NamedTotalDto[];

  @ApiProperty({ description: 'Days covered by the report' })
  days!: number;
}
