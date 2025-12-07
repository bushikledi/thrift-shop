import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { CreateMediaDto, MediaQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { MediaOwnerType } from '../../generated/prisma/client';
import { MediaResponseDto } from '../products/dto/product-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all media' })
  @ApiResponse({
    status: 200,
    description: 'List of media',
    type: [MediaResponseDto],
  })
  findAll(@Query() query: MediaQueryDto) {
    return this.mediaService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media by ID' })
  @ApiResponse({
    status: 200,
    description: 'Media details',
    type: MediaResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Media not found',
    type: ErrorResponseDto,
  })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.findById(id);
  }

  @Get('owner/:ownerType/:ownerId')
  @ApiOperation({ summary: 'Get media by owner' })
  @ApiResponse({
    status: 200,
    description: 'List of media',
    type: [MediaResponseDto],
  })
  findByOwner(
    @Param('ownerType', new ParseEnumPipe(MediaOwnerType))
    ownerType: MediaOwnerType,
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
  ) {
    return this.mediaService.findByOwner(ownerType, ownerId);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 201,
    description: 'Media uploaded',
    type: MediaResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid file',
    type: ErrorResponseDto,
  })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMediaDto,
  ) {
    return this.mediaService.create(
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      dto,
    );
  }

  @Post('upload/multiple')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiResponse({
    status: 201,
    description: 'Media uploaded',
    type: [MediaResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid files',
    type: ErrorResponseDto,
  })
  uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateMediaDto,
  ) {
    return this.mediaService.createMany(
      files.map((file) => ({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      })),
      dto,
    );
  }

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a presigned URL for direct upload' })
  @ApiResponse({ status: 201, description: 'Presigned URL generated' })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  getUploadUrl(
    @Body() dto: CreateMediaDto,
    @Body('filename') filename: string,
  ) {
    return this.mediaService.getUploadUrl(dto, filename);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete media' })
  @ApiResponse({ status: 204, description: 'Media deleted' })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Media not found',
    type: ErrorResponseDto,
  })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.delete(id);
  }
}
