import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Shift } from 'src/modules/shift/entities/shift.entity';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Shift])],
  providers: [TasksService],
})
export class TasksModule {}
