import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewQueryDto,
  ReviewResponseDto,
  ReviewListResponseDto,
} from './dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { JwtAuthGuard } from '../auth/guards';
import { Public, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../generated/prisma/client';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all reviews with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of reviews',
    type: ReviewListResponseDto,
  })
  async findAll(@Query() query: ReviewQueryDto) {
    return this.reviewsService.findAll(query);
  }

  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'Get reviews for a product' })
  @ApiResponse({
    status: 200,
    description: 'Product reviews with stats',
    type: ReviewListResponseDto,
  })
  async getProductReviews(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.getProductReviews(
      productId,
      page || 1,
      limit || 10,
    );
  }

  @Public()
  @Get('vendor/:vendorId')
  @ApiOperation({ summary: 'Get reviews for a vendor' })
  @ApiResponse({
    status: 200,
    description: 'Vendor reviews',
    type: ReviewListResponseDto,
  })
  async getVendorReviews(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.getVendorReviews(
      vendorId,
      page || 1,
      limit || 10,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reviews' })
  @ApiResponse({
    status: 200,
    description: 'User reviews',
    type: ReviewListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getUserReviews(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.getUserReviews(userId, page || 1, limit || 10);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({
    status: 200,
    description: 'Review details',
    type: ReviewResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Review not found',
    type: ErrorResponseDto,
  })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({
    status: 201,
    description: 'Review created',
    type: ReviewResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Already reviewed',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({
    status: 200,
    description: 'Review updated',
    type: ReviewResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Not your review',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Review not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted' })
  @ApiForbiddenResponse({
    description: 'Not your review',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Review not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reviewsService.delete(
      id,
      user.id,
      user.role === UserRole.ADMIN,
    );
  }
}
