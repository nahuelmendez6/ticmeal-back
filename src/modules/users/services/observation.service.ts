import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantAwareRepository } from 'src/common/repository/tenant-aware.repository';
import { Repository, DeepPartial, Like } from 'typeorm';
import { Observation } from '../entities/observation.entity';

@Injectable()
export class ObservationService {
    constructor(
        @InjectRepository(Observation)
        private readonly observationRepo: Repository<Observation>,
    ) {}

    async getAllObservations(): Promise<Observation[]> {
        return this.observationRepo.find();
    }
}