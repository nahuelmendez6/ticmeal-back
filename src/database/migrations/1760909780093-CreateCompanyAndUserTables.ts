import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyAndUserTables1760909780093
  implements MigrationInterface
{
  name = 'CreateCompanyAndUserTables1760909780093';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`companies\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`taxId\` varchar(255) NOT NULL, \`industryType\` varchar(255) NOT NULL, \`contactEmail\` varchar(255) NULL, \`address\` varchar(255) NULL, \`state\` varchar(255) NULL, \`postalCode\` varchar(255) NULL, \`country\` varchar(255) NULL, \`numberOfCanteens\` int NULL, \`canteenCapacity\` int NULL, \`status\` varchar(255) NOT NULL DEFAULT 'active', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_3dacbb3eb4f095e29372ff8e13\` (\`name\`), UNIQUE INDEX \`IDX_80b0c13a459e3185848ce63365\` (\`taxId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`pin_hash\` varchar(255) NULL, \`password\` varchar(255) NULL, \`firsName\` varchar(255) NULL, \`lastName\` varchar(255) NULL, \`role\` enum ('super_admin', 'company_admin', 'diner') NOT NULL DEFAULT 'diner', \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`companyId\` int NULL, UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_6f9395c9037632a31107c8a9e58\` FOREIGN KEY (\`companyId\`) REFERENCES \`companies\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_6f9395c9037632a31107c8a9e58\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_80b0c13a459e3185848ce63365\` ON \`companies\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_3dacbb3eb4f095e29372ff8e13\` ON \`companies\``,
    );
    await queryRunner.query(`DROP TABLE \`companies\``);
  }
}
