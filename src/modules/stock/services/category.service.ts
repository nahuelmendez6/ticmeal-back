import { 
  Injectable, 
  BadRequestException, 
  NotFoundException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm'; 
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto'; 
// Se eliminan las referencias a BaseTenantEntity y TenantAwareRepository
// para evitar conflictos de tipado, ya que Category es una excepción al patrón estricto.

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  /**
   * Crea una nueva categoría personalizada para la empresa.
   * Sigue la estructura 'create' del template.
   */
  async create(createDto: CreateCategoryDto, companyId: string): Promise<Category> {
    const newCategory = this.categoryRepo.create({
      ...createDto,
      companyId: companyId, // Asignar el companyId del tenant para hacerlo personalizado
    });
    
    return this.categoryRepo.save(newCategory);
  }

  /**
   * Obtiene todas las categorías disponibles para una empresa (Globales + Personalizadas).
   */
  async findAllAvailableForTenant(companyId: string): Promise<Category[]> {
    return this.categoryRepo.find({
      where: [
        { companyId: IsNull() },
        { companyId: companyId },
      ],
      order: {
        name: 'ASC',
      },
    });
  }

  /**
   * Busca una categoría por ID verificando que pertenezca al tenant O sea global.
   */
  async findOneForTenant(id: string, companyId: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
        where: [
            { id: id, companyId: companyId },
            { id: id, companyId: IsNull() } 
        ],
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada o sin permisos (no es global ni propia)');
    }
    
    return category;
  }
  
  /**
   * Verifica si una categoría (por ID) existe y está disponible para la empresa.
   */
  async validateCategoryAvailability(categoryId: string, companyId: string): Promise<Category> {
      return this.findOneForTenant(categoryId, companyId);
  }

  /**
   * Actualiza una categoría, asegurando que solo se modifiquen las PROPIAS de la empresa.
   * -> Usa TypeORM directo para el filtro estricto.
   */
  async update(id: string, updateDto: UpdateCategoryDto, companyId: string): Promise<Category> {
      // 1. Intentamos encontrar la categoría PERSONALIZADA por ID y companyId (filtro estricto)
      const categoryToUpdate = await this.categoryRepo.findOne({
          where: { id, companyId }, 
      });

      if (!categoryToUpdate) {
          // Si no se encuentra con el filtro estricto, verificamos si existe como global
          const existsGlobally = await this.categoryRepo.findOne({ where: { id, companyId: IsNull() } });
          if (existsGlobally) {
              // Si es global, el usuario no tiene permiso para modificarla
              throw new ForbiddenException(
                  `No tienes permiso para modificar la categoría global "${existsGlobally.name}".`,
              );
          }
          // Si no existe en absoluto (propia ni global)
          throw new NotFoundException(`Categoría con ID ${id} no encontrada.`);
      }
      
      // 2. Aplicar las actualizaciones
      Object.assign(categoryToUpdate, updateDto);
      
      return this.categoryRepo.save(categoryToUpdate);
  }
  
  /**
   * Elimina una categoría, asegurando que solo se puedan eliminar las PROPIAS de la empresa.
   * -> Usa TypeORM directo para el filtro estricto.
   */
  async remove(id: string, companyId: string): Promise<boolean> {
      // 1. Intentamos eliminar la categoría PERSONALIZADA por ID y companyId (filtro estricto)
      const result = await this.categoryRepo.delete({ id, companyId });

      if (result.affected === 0) {
          // 2. Si la eliminación no afectó filas, verificamos si es una categoría global
          const existsGlobally = await this.categoryRepo.findOne({ where: { id, companyId: IsNull() } });
          
          if (existsGlobally) {
              throw new ForbiddenException('No tienes permiso para eliminar esta categoría global.');
          }
          
          // 3. Si simplemente no existe para este tenant, es NotFound
          throw new NotFoundException(`Categoría con ID ${id} no encontrada en su alcance.`);
      }
      
      return true;
  }
}