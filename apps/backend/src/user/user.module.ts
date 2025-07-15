import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserResolver } from './user.resolver';
import { PrismaService } from '../prisma.service';
import { Role } from './entities/role.enum';
import { registerEnumType } from '@nestjs/graphql';

// Register the enum BEFORE the module is defined
registerEnumType(Role, {
  name: 'Role', // This name will appear in the GraphQL schema
});

@Module({
  providers: [UserService, UserResolver, PrismaService],
  controllers: [UserController],
})
export class UserModule {}
