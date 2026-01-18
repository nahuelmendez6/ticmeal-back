import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { TenantGuard } from 'src/common/guards/tenant-guard';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { WasteService } from '../services/waste.service';
import { CreateWasteLogDto } from '../dto/create-waste-log.dto';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { User } from 'src/modules/users/entities/user.entity';

@ApiTags('Waste Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('waste')
export class WasteController {
  constructor(private readonly wasteService: WasteService) {}

  @Post()
  @Roles('company_admin', 'kitchen_admin')
  @ApiOperation({ summary: 'Register a new waste log' })
  @ApiResponse({
    status: 201,
    description: 'The waste log has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({
    status: 404,
    description: 'Ingredient or MenuItem not found.',
  })
  create(
    @Body() createWasteLogDto: CreateWasteLogDto,
    @Tenant() companyId: number,
    @CurrentUser() user: User,
  ) {
    return this.wasteService.createWasteLog(
      createWasteLogDto,
      companyId,
      user.id,
    );
  }

  @Get()
  @Roles('company_admin', 'kitchen_admin')
  @ApiOperation({ summary: 'Get all waste logs for the tenant' })
  findAll(@Tenant() companyId: number) {
    return this.wasteService.findAllForTenant(companyId);
  }
}
