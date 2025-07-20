import { Field, InputType, ObjectType, ID, Float, Int } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsString, IsNumber, IsBoolean, IsDate } from 'class-validator';

@InputType()
export class Customer360Input {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}

@ObjectType()
export class ContactDto {
  @Field(() => ID)
  id!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  department?: string;

  @Field()
  isPrimary!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class OpportunityDto {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => Float)
  amount!: number;

  @Field()
  stage!: string;

  @Field(() => Int)
  probability!: number;

  @Field({ nullable: true })
  expectedCloseDate?: Date;

  @Field({ nullable: true })
  actualCloseDate?: Date;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class CaseDto {
  @Field(() => ID)
  id!: string;

  @Field()
  caseNumber!: string;

  @Field()
  subject!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  priority!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  assignedTo?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field({ nullable: true })
  resolvedAt?: Date;
}

@ObjectType()
export class MarketingCampaignDto {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  type!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field(() => Float, { nullable: true })
  budget?: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class PortalActivityDto {
  @Field(() => ID)
  id!: string;

  @Field()
  activityType!: string;

  @Field()
  description!: string;

  @Field({ nullable: true })
  metadata?: any;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  userAgent?: string;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class Customer360Dto {
  @Field(() => ID)
  id!: string;

  @Field()
  fullName!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  department?: string;

  @Field(() => [OpportunityDto])
  opportunities!: OpportunityDto[];

  @Field(() => [CaseDto])
  cases!: CaseDto[];

  @Field(() => [MarketingCampaignDto])
  marketingCampaigns!: MarketingCampaignDto[];

  @Field(() => [PortalActivityDto])
  portalActivity!: PortalActivityDto[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class ModuleLicenseDto {
  @Field(() => ID)
  id!: string;

  @Field()
  moduleName!: string;

  @Field()
  isActive!: boolean;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field({ nullable: true })
  features?: any;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
} 