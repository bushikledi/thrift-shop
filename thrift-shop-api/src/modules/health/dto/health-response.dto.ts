import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  timestamp!: string;

  @ApiPropertyOptional({ example: 123.45 })
  uptime?: number;

  @ApiPropertyOptional({ example: 'development' })
  environment?: string;

  @ApiPropertyOptional({ example: 'connected' })
  database?: string;

  @ApiPropertyOptional({ example: 'connected' })
  redis?: string;

  @ApiPropertyOptional({ example: 'connected' })
  s3?: string;
}
