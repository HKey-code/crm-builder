import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Role } from '../../role/entities/role.entity';

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

  @Field(() => Role)
  role!: Role;

  @Field(() => String)
  tenantId!: string;
}
