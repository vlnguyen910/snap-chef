import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/common/redis/redis.service';
import { MailerService } from '../mail/mail.service';
import { OauthService } from '../oauth-accounts/oauth.service';
import { jwtConfiguration } from 'src/config';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthProvider, UserRoles } from 'src/generated/prisma/client';
import { ErrorMessages } from 'src/common/constants';

// ─── Mock argon2 ────────────────────────────────────────────────────────────
// argon2 is a native addon module. jest.mock() factory is HOISTED to the top
// of the file by Babel/ts-jest. We create a single `impl` object so that the
// top-level export and the `default` export (used by the service's default
// import) both reference the SAME jest.fn() instances, meaning calls to
// argon2.verify() in the service are controlled by argon2Mocked.verify.
jest.mock('argon2', () => {
  const impl = { verify: jest.fn(), hash: jest.fn() };
  return { ...impl, __esModule: true, default: impl };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const argon2Mocked = require('argon2') as { verify: jest.Mock; hash: jest.Mock };

// ─── Mock uuid ───────────────────────────────────────────────────────────────
// Đảm bảo token/jti luôn là giá trị cố định để dễ assert
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-token'),
}));

// ─── Mock Data ──────────────────────────────────────────────────────────────
const mockActiveUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashed-password',
  is_active: true,
  is_verified: true,
  role: UserRoles.USER,
};

const mockBannedUser = { ...mockActiveUser, is_active: false };
const mockUnverifiedUser = { ...mockActiveUser, is_verified: false };
const mockOAuthUser = { ...mockActiveUser, password: null };

// ─── Mock Dependencies ──────────────────────────────────────────────────────
const mockUsersService = {
  findByEmail: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
};

const mockRedisService = {
  setCache: jest.fn(),
  getCache: jest.fn(),
  delCache: jest.fn(),
};

const mockMailService = {
  sendUserConfirmation: jest.fn(),
  sendResetPassword: jest.fn(),
};

const mockOauthService = {
  createOauthAccount: jest.fn(),
  findOauthAccount: jest.fn(),
};

const mockJwtConfig = {
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresIn: '30d',
};

// ─── Test Suite ──────────────────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: MailerService, useValue: mockMailService },
        { provide: OauthService, useValue: mockOauthService },
        {
          provide: jwtConfiguration.KEY,
          useValue: mockJwtConfig,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 1: Khởi tạo
  // ──────────────────────────────────────────────────────────────────────────
  describe('initialization', () => {
    /**
     * Kiểm tra cơ bản: NestJS đã inject đầy đủ dependencies và tạo được service.
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 2: login()
  // Xử lý đăng nhập bằng email/password. Trả về access_token và refresh_token.
  // ──────────────────────────────────────────────────────────────────────────
  describe('login()', () => {
    const loginDto = { email: 'test@example.com', password: 'correct-password' };

    beforeEach(() => {
      mockUsersService.findByEmail.mockResolvedValue(mockActiveUser);
      argon2Mocked.verify.mockResolvedValue(true);
    });

    /**
     * Happy path: email và password đúng, user active và đã verified.
     * Phải trả về object có access_token và refresh_token.
     */
    it('should return tokens on successful login', async () => {
      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    /**
     * Tấn công bảo mật: user không tồn tại trong DB.
     * Trả về UnauthorizedException (không tiết lộ "user không tồn tại").
     */
    it('should throw UnauthorizedException if user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS),
      );
    });

    /**
     * Tài khoản OAuth: user đăng ký qua Google nên không có password.
     * Không thể đăng nhập bằng form → UnauthorizedException.
     */
    it('should throw UnauthorizedException if user has no password (OAuth user)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockOAuthUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS),
      );
    });

    /**
     * Tài khoản bị ban: is_active = false.
     * Trả về ForbiddenException (403) thay vì 401.
     */
    it('should throw ForbiddenException if user is banned', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockBannedUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        new ForbiddenException(ErrorMessages.USER_BANNED),
      );
    });

    /**
     * Sai mật khẩu: argon2.verify trả về false.
     */
    it('should throw UnauthorizedException if password does not match', async () => {
      argon2Mocked.verify.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS),
      );
    });

    /**
     * Email chưa được xác thực.
     * Phải yêu cầu user verify email trước khi được đăng nhập.
     */
    it('should throw UnauthorizedException if email is not verified', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUnverifiedUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.EMAIL_NOT_VERIFIED),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 3: signUp()
  // Đăng ký tài khoản mới, gửi email xác thực.
  // ──────────────────────────────────────────────────────────────────────────
  describe('signUp()', () => {
    const signUpDto = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'plain-password',
      avatar_url: 'https://example.com/avatar.jpg',
    };

    beforeEach(() => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({ ...mockActiveUser, id: 'new-user-id' });
      argon2Mocked.hash.mockResolvedValue('hashed-password');

      mockRedisService.setCache.mockResolvedValue(undefined);
      mockMailService.sendUserConfirmation.mockResolvedValue(undefined);
    });

    /**
     * Happy path: email chưa tồn tại, đăng ký thành công.
     * - Hash password
     * - Tạo user
     * - Cache verification token vào Redis (TTL 15 phút)
     * - Gửi email xác thực
     * - Trả về message thành công
     */
    it('should register user, cache token, send email, and return message', async () => {
      const result = await service.signUp(signUpDto);

      expect(result).toEqual({ message: 'Check your mail to get otp code' });
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
      expect(mockRedisService.setCache).toHaveBeenCalledWith(
        'verify_email:mock-uuid-token',
        'new-user-id',
        15,
      );
      expect(mockMailService.sendUserConfirmation).toHaveBeenCalledTimes(1);
    });

    /**
     * Email đã được dùng: findByEmail trả về user.
     * Trả về ForbiddenException để tránh đăng ký trùng.
     */
    it('should throw ForbiddenException if email is already in use', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockActiveUser);

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        new ForbiddenException(ErrorMessages.EMAIL_ALREADY_IN_USE),
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 4: verifyEmail()
  // Xác thực email qua token được gửi về mail.
  // ──────────────────────────────────────────────────────────────────────────
  describe('verifyEmail()', () => {
    const verifyDto = { token: 'valid-token' };

    beforeEach(() => {
      mockRedisService.getCache.mockResolvedValue('user-uuid-1');
      mockUsersService.update.mockResolvedValue({ ...mockActiveUser, is_verified: true });
      mockRedisService.delCache.mockResolvedValue(undefined);
    });

    /**
     * Happy path: token tồn tại trong Redis → cập nhật is_verified=true
     * và xóa key khỏi cache.
     */
    it('should verify email and return success message', async () => {
      const result = await service.verifyEmail(verifyDto);

      expect(result).toEqual({ message: 'Your email has been verified' });
      expect(mockUsersService.update).toHaveBeenCalledWith(
        'user-uuid-1',
        'user-uuid-1',
        { is_verified: true },
      );
      expect(mockRedisService.delCache).toHaveBeenCalledWith('verify_email:valid-token');
    });

    /**
     * Token hết hạn hoặc không hợp lệ: Redis không tìm thấy userId.
     * Trả về BadRequestException.
     */
    it('should throw BadRequestException if token is not found in cache', async () => {
      mockRedisService.getCache.mockResolvedValue(null);

      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(
        new BadRequestException(ErrorMessages.INVALID_TOKEN),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 5: refreshToken()
  // Tạo access token mới từ refresh token payload.
  // ──────────────────────────────────────────────────────────────────────────
  describe('refreshToken()', () => {
    const mockPayload = {
      sub: 'user-uuid-1',
      jti: 'jti-uuid',
      username: 'testuser',
      email: 'test@example.com',
      role: UserRoles.USER,
      is_verified: true,
      type: 'refresh' as any,
    };

    /**
     * Từ payload hợp lệ, ký một access token mới.
     * Trả về object { access_token }.
     */
    it('should return a new access_token', async () => {
      const result = await service.refreshToken(mockPayload);

      expect(result).toHaveProperty('access_token');
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 6: logout()
  // Đưa jti của refresh token vào blacklist trên Redis.
  // ──────────────────────────────────────────────────────────────────────────
  describe('logout()', () => {
    /**
     * Khi logout, jti của token được lưu vào Redis với key "blacklist:{jti}".
     * TTL = 30 ngày (30 * 24 * 60 phút).
     */
    it('should blacklist the token jti in Redis', async () => {
      await service.logout('some-jti');

      expect(mockRedisService.setCache).toHaveBeenCalledWith(
        'blacklist:some-jti',
        'true',
        30 * 24 * 60,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 7: forgetPassword()
  // Gửi email reset mật khẩu nếu user tồn tại.
  // ──────────────────────────────────────────────────────────────────────────
  describe('forgetPassword()', () => {
    beforeEach(() => {
      mockRedisService.setCache.mockResolvedValue(undefined);
      mockMailService.sendResetPassword.mockResolvedValue(undefined);
    });

    /**
     * Happy path: user tồn tại → cache reset token → gửi email.
     */
    it('should cache reset token and send reset email if user exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockActiveUser);

      const result = await service.forgetPassword({ email: 'test@example.com' });

      expect(result.message).toBeDefined();
      expect(mockRedisService.setCache).toHaveBeenCalledWith(
        'reset_password:mock-uuid-token',
        mockActiveUser.id,
        15,
      );
      expect(mockMailService.sendResetPassword).toHaveBeenCalledTimes(1);
    });

    /**
     * Bảo mật: user không tồn tại vẫn trả về cùng message.
     * Tránh lộ thông tin "email này có trong hệ thống hay không".
     */
    it('should return same message even if user does not exist (security)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgetPassword({ email: 'ghost@example.com' });

      expect(result.message).toBeDefined();
      expect(mockMailService.sendResetPassword).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 8: resetPassword()
  // Đặt lại mật khẩu từ token reset.
  // ──────────────────────────────────────────────────────────────────────────
  describe('resetPassword()', () => {
    beforeEach(() => {
      mockRedisService.getCache.mockResolvedValue('user-uuid-1');
      argon2Mocked.hash.mockResolvedValue('new-hashed-password');

      mockUsersService.update.mockResolvedValue({ ...mockActiveUser });
      mockRedisService.delCache.mockResolvedValue(undefined);
    });

    /**
     * Happy path: token hợp lệ → hash password mới → cập nhật DB → xóa token khỏi Redis.
     */
    it('should reset password and delete cache token', async () => {
      const result = await service.resetPassword({
        token: 'valid-reset-token',
        password: 'new-password',
      });

      expect(result).toEqual({ message: 'Password has been reset successfully' });
      expect(mockUsersService.update).toHaveBeenCalledWith(
        'user-uuid-1',
        'user-uuid-1',
        { password: 'new-hashed-password' },
      );
      expect(mockRedisService.delCache).toHaveBeenCalledWith(
        'reset_password:valid-reset-token',
      );
    });

    /**
     * Token không hợp lệ hoặc đã hết hạn: Redis trả về null.
     * Trả về BadRequestException.
     */
    it('should throw BadRequestException if reset token is not found', async () => {
      mockRedisService.getCache.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'expired-token', password: 'new-pass' }),
      ).rejects.toThrow(new BadRequestException(ErrorMessages.INVALID_OR_EXPIRED_TOKEN));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 9: isTokenABlacklisted()
  // Kiểm tra jti có bị revoke không.
  // ──────────────────────────────────────────────────────────────────────────
  describe('isTokenABlacklisted()', () => {
    /**
     * jti có trong Redis blacklist → trả về true.
     */
    it('should return true if token is blacklisted', async () => {
      mockRedisService.getCache.mockResolvedValue('true');

      const result = await service.isTokenABlacklisted('some-jti');

      expect(result).toBe(true);
    });

    /**
     * jti không có trong Redis → trả về false (token hợp lệ).
     */
    it('should return false if token is not blacklisted', async () => {
      mockRedisService.getCache.mockResolvedValue(null);

      const result = await service.isTokenABlacklisted('some-jti');

      expect(result).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 10: googleLogin()
  // Đăng nhập/đăng ký bằng Google OAuth.
  // ──────────────────────────────────────────────────────────────────────────
  describe('googleLogin()', () => {
    const mockGoogleUser = {
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      picture: 'https://example.com/pic.jpg',
      provider_id: 'google-provider-id-1',
    };

    beforeEach(() => {
      mockRedisService.setCache.mockResolvedValue(undefined);
    });

    /**
     * User chưa đăng ký: tạo user mới + tạo OAuth account.
     */
    it('should create new user and oauth account if user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({ ...mockActiveUser, id: 'new-google-user' });
      mockOauthService.createOauthAccount.mockResolvedValue(undefined);

      const result = await service.googleLogin({ user: mockGoogleUser });

      expect(result).toHaveProperty('access_token');
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
      expect(mockOauthService.createOauthAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: OAuthProvider.GOOGLE,
          provider_id: mockGoogleUser.provider_id,
        }),
      );
    });

    /**
     * User đã tồn tại nhưng chưa link Google: tạo OAuth account mới cho user.
     */
    it('should link google account if user exists but has no oauth account', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockActiveUser);
      mockOauthService.findOauthAccount.mockResolvedValue(null);
      mockOauthService.createOauthAccount.mockResolvedValue(undefined);

      await service.googleLogin({ user: mockGoogleUser });

      expect(mockOauthService.createOauthAccount).toHaveBeenCalledTimes(1);
    });

    /**
     * User đã link Google với cùng provider_id: không làm gì thêm, chỉ login.
     */
    it('should not create oauth account if already linked with same provider_id', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockActiveUser);
      mockOauthService.findOauthAccount.mockResolvedValue({
        provider_id: mockGoogleUser.provider_id,
      });

      await service.googleLogin({ user: mockGoogleUser });

      expect(mockOauthService.createOauthAccount).not.toHaveBeenCalled();
    });

    /**
     * User đã link Google với account khác (provider_id không match).
     * Trả về ConflictException để bảo vệ tài khoản.
     */
    it('should throw ConflictException if google account is linked to a different provider_id', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockActiveUser);
      mockOauthService.findOauthAccount.mockResolvedValue({
        provider_id: 'different-google-id',
      });

      await expect(service.googleLogin({ user: mockGoogleUser })).rejects.toThrow(
        new ConflictException(ErrorMessages.GOOGLE_ACCOUNT_CONFLICT),
      );
    });

    /**
     * Google không trả về user (req.user = null/undefined).
     * Trả về NotFoundException.
     */
    it('should throw NotFoundException if google user is missing from request', async () => {
      await expect(service.googleLogin({ user: null as any })).rejects.toThrow(
        new NotFoundException(ErrorMessages.NO_GOOGLE_USER),
      );
    });
  });
});
