import { UserRoles } from 'src/generated/prisma/enums';
import { JwtTokenType } from '../enums/jwt.enum';

export class TokenPayload {
  sub!: string;
  email!: string;
  username!: string;
  role!: UserRoles;
  type!: JwtTokenType;
  jti!: string;
}
