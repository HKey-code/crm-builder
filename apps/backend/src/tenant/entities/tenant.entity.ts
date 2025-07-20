import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Tenant {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => [String])
  supportedLocales!: string[];

  @Field()
  defaultLocale!: string;

  @Field({ nullable: true })
  deploymentStack?: string;

  @Field()
  isIsolated!: boolean;

  @Field({ nullable: true })
  appVersion?: string;

  @Field()
  createdAt!: Date;
}