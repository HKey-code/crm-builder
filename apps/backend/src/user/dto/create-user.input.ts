import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';

export enum UserType {
  HUMAN = 'HUMAN',
  AI = 'AI',
  SERVICE = 'SERVICE',
}

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  PENDING = 'pending',
}

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isSystemUser?: boolean;

  @Field(() => UserType, { nullable: true })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @Field(() => UserStatus, { nullable: true })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
