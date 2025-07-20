import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class CreateTenantInput {
  @Field()
  @IsString()
  name!: string;

  @Field(() => [String])
  @IsArray()
  supportedLocales!: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  defaultLocale?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deploymentStack?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isIsolated?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  appVersion?: string;
}