# Unit Test — Auth Module

Tài liệu mô tả chi tiết các test case đã được viết cho **Auth Module** (`AuthService`).

> Xem hướng dẫn tổng quan về cách viết unit test tại [`docs/unit-testing-guide.md`](../../docs/unit-testing-guide.md).

---

## Mục lục

1. [Tổng quan kiến trúc module](#1-tổng-quan-kiến-trúc-module)
2. [Thiết lập mock](#2-thiết-lập-mock)
3. [Ghi chú kỹ thuật — argon2 & Jest hoisting](#3-ghi-chú-kỹ-thuật--argon2--jest-hoisting)
4. [AuthService — auth.service.spec.ts](#4-authservice)
5. [Coverage hiện tại](#5-coverage-hiện-tại)
6. [Hướng dẫn mở rộng test](#6-hướng-dẫn-mở-rộng-test)

---

## 1. Tổng quan kiến trúc module

```
src/modules/auth/
├── auth.module.ts
├── auth.service.ts           ← business logic: login, signup, token, OAuth
├── auth.service.spec.ts      ← unit test cho service (file này)
├── auth.controller.ts        ← HTTP handler
└── dto/
    ├── request/
    │   ├── login.dto.ts
    │   ├── sign-up.dto.ts
    │   ├── verify-email.dto.ts
    │   ├── forget-password.dto.ts
    │   └── reset-password.dto.ts
    └── respone/
        ├── login-respone.dto.ts
        └── refresh-token-respone.dto.ts
```

**Luồng xử lý (Local Auth):**

```
POST /auth/login → AuthController.login() → AuthService.login()
                 → UsersService.findByEmail() → argon2.verify()
                 → generateToken() × 2 (access + refresh)
```

**Luồng xử lý (Google OAuth):**

```
GET /auth/google-redirect → GoogleOAuthGuard → GoogleStrategy.validate()
                          → AuthService.googleLogin()
                          → UsersService.create() (nếu chưa có)
                          → OauthService.createOauthAccount()
```

**Dependencies của AuthService:**

| Dependency         | Vai trò                                        |
| ------------------ | ---------------------------------------------- |
| `UsersService`     | Tìm / tạo user                                 |
| `JwtService`       | Ký access/refresh token                        |
| `RedisService`     | Cache verify token, reset token, blacklist jti |
| `MailerService`    | Gửi email xác thực và reset mật khẩu           |
| `OauthService`     | Tạo / tìm OAuth account                        |
| `jwtConfiguration` | Config token expiry                            |

---

## 2. Thiết lập mock

Tất cả dependencies được mock bằng plain object với `jest.fn()`:

```typescript
const mockUsersService = { findByEmail, findOne, create, update };
const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
};
const mockRedisService = { setCache, getCache, delCache };
const mockMailService = { sendUserConfirmation, sendResetPassword };
const mockOauthService = { createOauthAccount, findOauthAccount };
const mockJwtConfig = {
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresIn: '30d',
};
```

`jwtConfiguration.KEY` được cung cấp qua `useValue`:

```typescript
{ provide: jwtConfiguration.KEY, useValue: mockJwtConfig }
```

`jest.clearAllMocks()` được gọi trong `afterEach` để reset call count sau mỗi test.

---

## 3. Ghi chú kỹ thuật — argon2 & Jest hoisting

> [!IMPORTANT]
> `jest.mock()` được Jest **hoist** lên đầu file trước khi bất kỳ biến nào được khai báo. Do đó, factory callback **không thể tham chiếu biến** được khai báo ở module scope.

**Vấn đề:** Nếu viết như sau, Jest sẽ throw `ReferenceError: Cannot access 'mockVerify' before initialization`:

```typescript
// ❌ SAI — biến bị hoist trước khi khai báo
const mockVerify = jest.fn();
jest.mock('argon2', () => ({ verify: mockVerify })); // lỗi!
```

**Giải pháp:** Tạo `impl` object **bên trong** factory, sau đó lấy lại reference qua `require()`:

```typescript
// ✅ ĐÚNG — factory tự chứa, dùng closure
jest.mock('argon2', () => {
  const impl = { verify: jest.fn(), hash: jest.fn() };
  return { ...impl, __esModule: true, default: impl };
});

// Lấy lại mock function để dùng trong test
const argon2Mocked = require('argon2') as {
  verify: jest.Mock;
  hash: jest.Mock;
};
```

`default: impl` bắt buộc phải trỏ cùng object với top-level để cả `import argon2 from 'argon2'` (trong service) lẫn `require('argon2')` (trong test) đều nhận cùng `jest.fn()` instance.

---

## 4. AuthService

File: `src/modules/auth/auth.service.spec.ts` — **22 test cases**

---

### 4.1 `initialization`

| #   | Test case           | Mô tả                                                        |
| --- | ------------------- | ------------------------------------------------------------ |
| 1   | `should be defined` | NestJS inject đủ dependencies và khởi tạo service thành công |

---

### 4.2 `login(body: LoginDto)`

Xử lý đăng nhập bằng email/password. Trả về `access_token` + `refresh_token`.

**Luồng kiểm tra:**

1. Tìm user theo email
2. Kiểm tra `is_active`, `password` tồn tại
3. Xác thực password bằng `argon2.verify()`
4. Kiểm tra `is_verified`
5. Gọi `manageUserToken()` → ký 2 token song song

| #   | Test case                                                       | Loại       | Mô tả                                                                                              |
| --- | --------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| 1   | `should return tokens on successful login`                      | Happy path | Email + password đúng, user active & verified → trả về object có `access_token` và `refresh_token` |
| 2   | `should throw UnauthorizedException if user is not found`       | Error path | `findByEmail` trả về `null` → throw `INVALID_CREDENTIALS` (không tiết lộ "user không tồn tại")     |
| 3   | `should throw UnauthorizedException if user has no password`    | Error path | `user.password = null` (tài khoản OAuth) → throw `INVALID_CREDENTIALS`                             |
| 4   | `should throw ForbiddenException if user is banned`             | Error path | `user.is_active = false` → throw `USER_BANNED` (403 thay vì 401)                                   |
| 5   | `should throw UnauthorizedException if password does not match` | Error path | `argon2.verify` trả về `false` → throw `INVALID_CREDENTIALS`                                       |
| 6   | `should throw UnauthorizedException if email is not verified`   | Error path | `user.is_verified = false` → throw `EMAIL_NOT_VERIFIED`                                            |

---

### 4.3 `signUp(body: SignUpDto)`

Đăng ký tài khoản mới. Gửi email xác thực sau khi tạo.

**Luồng:**

1. Kiểm tra email chưa tồn tại
2. `argon2.hash()` password
3. `usersService.create()` — tạo user
4. `redis.setCache('verify_email:{uuid}', userId, 15)` — TTL 15 phút
5. `mailService.sendUserConfirmation()` — gửi mail

| #   | Test case                                                           | Loại       | Mô tả                                                                                                       |
| --- | ------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| 7   | `should register user, cache token, send email, and return message` | Happy path | Kiểm tra toàn bộ luồng: user được tạo, Redis được set với key `verify_email:mock-uuid-token`, mail được gửi |
| 8   | `should throw ForbiddenException if email is already in use`        | Error path | `findByEmail` trả về user → throw `EMAIL_ALREADY_IN_USE`, `usersService.create` không được gọi              |

---

### 4.4 `verifyEmail(payload: VerifyEmailDto)`

Xác thực email từ link được gửi trong mail.

| #   | Test case                                                         | Loại       | Mô tả                                                                                    |
| --- | ----------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| 9   | `should verify email and return success message`                  | Happy path | Redis có `userId` → cập nhật `is_verified=true` → xóa cache key → trả về success message |
| 10  | `should throw BadRequestException if token is not found in cache` | Error path | Redis trả về `null` (token hết hạn) → throw `INVALID_TOKEN`                              |

---

### 4.5 `refreshToken(userPayload: TokenPayload)`

Tạo access token mới từ refresh token payload (đã qua `RefreshTokenGuard`).

| #   | Test case                          | Loại       | Mô tả                                                                              |
| --- | ---------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| 11  | `should return a new access_token` | Happy path | Payload hợp lệ → `jwtService.signAsync` được gọi 1 lần → trả về `{ access_token }` |

---

### 4.6 `logout(jti: string)`

Đưa jti của refresh token vào blacklist Redis.

| #   | Test case                                 | Loại       | Mô tả                                                                                  |
| --- | ----------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| 12  | `should blacklist the token jti in Redis` | Happy path | `redis.setCache('blacklist:{jti}', 'true', 43200)` — TTL = 30 ngày (30 × 24 × 60 phút) |

---

### 4.7 `forgetPassword(body: ForgetPasswordDto)`

Gửi email reset mật khẩu. Luôn trả về cùng message dù user có tồn tại hay không.

| #   | Test case                                                      | Loại       | Mô tả                                                                                                    |
| --- | -------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| 13  | `should cache reset token and send reset email if user exists` | Happy path | User tồn tại → `redis.setCache('reset_password:{uuid}', userId, 15)` → gửi mail                          |
| 14  | `should return same message even if user does not exist`       | Security   | User không tồn tại → trả về cùng message, `sendResetPassword` **không** được gọi — tránh enumerate email |

---

### 4.8 `resetPassword(body: ResetPasswordDto)`

Đặt lại mật khẩu từ token reset.

| #   | Test case                                                      | Loại       | Mô tả                                                                                 |
| --- | -------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| 15  | `should reset password and delete cache token`                 | Happy path | Token hợp lệ → `argon2.hash()` mật khẩu mới → `usersService.update()` → xóa Redis key |
| 16  | `should throw BadRequestException if reset token is not found` | Error path | Redis trả về `null` → throw `INVALID_OR_EXPIRED_TOKEN`                                |

---

### 4.9 `isTokenABlacklisted(jti: string)`

Kiểm tra xem jti đã bị blacklist chưa (dùng trong `JwtStrategy`).

| #   | Test case                                         | Loại       | Mô tả                                 |
| --- | ------------------------------------------------- | ---------- | ------------------------------------- |
| 17  | `should return true if token is blacklisted`      | Happy path | Redis trả về `'true'` → return `true` |
| 18  | `should return false if token is not blacklisted` | Happy path | Redis trả về `null` → return `false`  |

---

### 4.10 `googleLogin(req: { user: GoogleUser })`

Đăng nhập / đăng ký bằng Google OAuth.

**Luồng:**

1. Kiểm tra `req.user` tồn tại
2. Tìm user theo email
3. Nếu chưa có: tạo user → tạo OAuth account
4. Nếu đã có: kiểm tra OAuth link → tạo nếu chưa có / conflict nếu provider_id khác
5. Cache user → ký token

| #   | Test case                                                                             | Loại       | Mô tả                                                                                                |
| --- | ------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| 19  | `should create new user and oauth account if user does not exist`                     | Happy path | `findByEmail` trả về `null` → `usersService.create()` + `oauthService.createOauthAccount()` được gọi |
| 20  | `should link google account if user exists but has no oauth account`                  | Happy path | User có nhưng chưa link → `oauthService.findOauthAccount` trả về `null` → tạo oauth link             |
| 21  | `should not create oauth account if already linked with same provider_id`             | Happy path | OAuth account tồn tại với đúng `provider_id` → `createOauthAccount` **không** được gọi               |
| 22  | `should throw ConflictException if google account is linked to different provider_id` | Error path | OAuth account tồn tại nhưng `provider_id` khác → throw `GOOGLE_ACCOUNT_CONFLICT`                     |
| 23  | `should throw NotFoundException if google user is missing from request`               | Error path | `req.user = null` → throw `NO_GOOGLE_USER`                                                           |

---

## 5. Coverage hiện tại

```
Test Suites: 1 passed
Tests:       22 passed, 0 failed
```

Chạy lệnh sau để xem coverage chi tiết:

```bash
cd apps/api
pnpm run test --testPathPattern="auth.service" --coverage \
  --collectCoverageFrom="**/modules/auth/auth.service.ts"
```

---

## 6. Hướng dẫn mở rộng test

### Thêm test khi argon2.hash gặp lỗi

```typescript
it('should propagate error if argon2 hashing fails', async () => {
  mockUsersService.findByEmail.mockResolvedValue(null);
  argon2Mocked.hash.mockRejectedValue(new Error('hashing error'));

  await expect(service.signUp(signUpDto)).rejects.toThrow('hashing error');
});
```

### Thêm test khi mail service thất bại (không ảnh hưởng response)

```typescript
it('should still return message even if mail sending fails', async () => {
  mockUsersService.findByEmail.mockResolvedValue(null);
  mockUsersService.create.mockResolvedValue({ ...mockActiveUser });
  argon2Mocked.hash.mockResolvedValue('hashed');
  mockMailService.sendUserConfirmation.mockRejectedValue(
    new Error('SMTP error'),
  );

  // Nếu service có try/catch → vẫn return message
  // Nếu không có → test này sẽ fail và nhắc cần thêm error handling
  await expect(service.signUp(signUpDto)).rejects.toThrow('SMTP error');
});
```

---

_Tài liệu cập nhật lần cuối: **2026-03-04**. Cập nhật khi thêm hoặc thay đổi test case._
