import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  message!: string;
}
