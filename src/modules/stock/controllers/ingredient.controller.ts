import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { IngredientService } from '../services/ingredient.service';
import { CreateIngredientDto } from '../dto/create-ingredient.dto';
import { UpdateIngredientDto } from '../dto/update-ingredient.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import { Ingredient } from '../entities/ingredient.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ingredients')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  /**
   * Crea un nuevo ingrediente.
   * Accesible solo para administradores de la empresa y de cocina.
   */
  @Post()
  @Roles('company_admin', 'kitchen_admin')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createIngredientDto: CreateIngredientDto,
    @Tenant() tenantId: number,
    @Req() req: any,
  ): Promise<Ingredient> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    const { id: userId } = req.user;
    return this.ingredientService.create(createIngredientDto, tenantId, userId);
  }

  /**
   * Obtiene todos los ingredientes del tenant.
   * Accesible para administradores de la empresa y de cocina.
   */
  @Get()
  @Roles('company_admin', 'kitchen_admin')
  async findAll(@Tenant() tenantId: number): Promise<Ingredient[]> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.ingredientService.findAllForTenant(tenantId);
  }

  /**
   * Obtiene un ingrediente específico por ID, validando que pertenezca al tenant.
   * Accesible para administradores de la empresa y de cocina.
   */
  @Get(':id')
  @Roles('company_admin', 'kitchen_admin')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
  ): Promise<Ingredient> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    return this.ingredientService.findOneForTenant(id, tenantId);
  }

  /**
   * Actualiza un ingrediente, validando que pertenezca al tenant.
   * Accesible solo para administradores de la empresa y de cocina.
   */
  @Patch(':id')
  @Roles('company_admin', 'kitchen_admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIngredientDto: UpdateIngredientDto,
    @Tenant() tenantId: number,
    @Req() req: any,
  ): Promise<Ingredient> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    const { id: userId } = req.user;
    return this.ingredientService.update(
      id,
      updateIngredientDto,
      tenantId,
      userId,
    );
  }

  /**
   * Elimina un ingrediente, validando que pertenezca al tenant.
   * Accesible solo para administradores de la empresa y de cocina.
   */
  @Delete(':id')
  @Roles('company_admin', 'kitchen_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Tenant() tenantId: number,
  ): Promise<{ message: string }> {
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant.');
    }
    await this.ingredientService.remove(id, tenantId);
    return { message: `Ingrediente con ID ${id} eliminado correctamente.` };
  }
}
