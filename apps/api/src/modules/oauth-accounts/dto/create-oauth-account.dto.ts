import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { OAuthProvider } from "src/generated/prisma/enums";

export class CreateOauthAccountDto {
  @IsNotEmpty()
  @IsString()
  user_id!: string;

  @IsNotEmpty()
  @IsEnum(OAuthProvider)
  provider!: OAuthProvider;

  @IsNotEmpty()
  @IsString()
  provider_id!: string;
}
