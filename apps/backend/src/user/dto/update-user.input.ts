import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';
import { IsOptional, IsString, IsArray } from 'class-validator';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  spokenLanguages?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  roleId?: string;
}
