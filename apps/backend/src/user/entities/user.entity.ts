import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String, { nullable: true })
  name!: string | null;

  @Field(() => String, { nullable: true })
  preferredLanguage?: string | null;

  @Field(() => [String])
  spokenLanguages!: string[];

  @Field(() => String)
  role!: string;

  @Field(() => String)
  tenantId!: string;
}
