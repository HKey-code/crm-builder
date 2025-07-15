import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { Role } from '../entities/role.enum';  // Adjust path if needed

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
  preferredLanguage?: string;

  @Field(() => [String])
  @IsArray()
  spokenLanguages!: string[];

  @Field(() => Role)
  @IsEnum(Role)
  role!: Role;

  @Field()
  @IsString()
  tenantId!: string;
}
