import { Module } from '@nestjs/common';
import { Customer360Service } from './customer360.service';
import { Customer360Resolver } from './customer360.resolver';
import { SharedModule } from '../shared.module';

@Module({
  imports: [SharedModule],
  providers: [Customer360Service, Customer360Resolver],
  exports: [Customer360Service],
})
export class Customer360Module {} 