import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserResolver } from './user.resolver';
import { SharedModule } from '../shared.module';

@Module({
  imports: [SharedModule],
  providers: [UserService, UserResolver],
  controllers: [UserController],
})
export class UserModule {}
