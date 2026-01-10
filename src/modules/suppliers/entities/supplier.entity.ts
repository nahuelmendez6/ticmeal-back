import { Entity, Column, OneToMany } from 'typeorm';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';
import { PurchaseOrder } from 'src/modules/purchases/entities/purchase-order.entity';

@Entity('suppliers')
export class Supplier extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @OneToMany(() => PurchaseOrder, (po) => po.supplier)
  purchaseOrders: PurchaseOrder[];
}
