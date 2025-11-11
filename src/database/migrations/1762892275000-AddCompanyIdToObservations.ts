import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddCompanyIdToObservations1762892275000 implements MigrationInterface {
    name = 'AddCompanyIdToObservations1762892275000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar columna company_id a la tabla observations
        await queryRunner.addColumn('observations', new TableColumn({
            name: 'companyId',
            type: 'int',
            isNullable: true, // Temporalmente nullable para migrar datos existentes
        }));

        // Crear índice para mejorar el rendimiento de las consultas por tenant
        await queryRunner.query(`CREATE INDEX \`IDX_observations_companyId\` ON \`observations\` (\`companyId\`)`);

        // Si hay datos existentes, necesitarías asignarlos a una company por defecto
        // Por ahora, los dejamos como NULL. En producción, deberías migrar los datos.
        // Ejemplo: await queryRunner.query(`UPDATE observations SET companyId = 1 WHERE companyId IS NULL`);

        // Hacer la columna NOT NULL después de migrar datos (si aplica)
        // await queryRunner.changeColumn('observations', 'companyId', new TableColumn({
        //     name: 'companyId',
        //     type: 'int',
        //     isNullable: false,
        // }));

        // Crear foreign key constraint
        await queryRunner.createForeignKey('observations', new TableForeignKey({
            columnNames: ['companyId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'companies',
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Obtener la foreign key para eliminarla
        const table = await queryRunner.getTable('observations');
        const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('companyId') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('observations', foreignKey);
        }

        // Eliminar índice
        await queryRunner.query(`DROP INDEX \`IDX_observations_companyId\` ON \`observations\``);

        // Eliminar columna
        await queryRunner.dropColumn('observations', 'companyId');
    }
}

