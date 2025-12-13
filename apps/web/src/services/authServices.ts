// src/services/authService.ts
import { api, useMock } from '@/lib/axios';

export const authService = {
  login: async (email: string, pass: string) => {
    // Logic giả lập:
    // Nếu email là "fail@test.com" -> Gọi Mock Fail
    if (email.includes('fail')) {
      return api.post('/auth/login', { email, pass }, useMock('Fail'));
    }

    // Nếu email là "bad@test.com" -> Gọi Mock Validation
    if (email.includes('bad')) {
      return api.post('/auth/login', { email, pass }, useMock('Validation'));
    }

    // Còn lại -> Gọi Mock Success mặc định
    return api.post('/auth/login', { email, pass });
  }
};