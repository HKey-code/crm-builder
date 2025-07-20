import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, IsArray } from 'class-validator';

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

  @Field()
  @IsString()
  roleId!: string;

  @Field()
  @IsString()
  tenantId!: string;
}
