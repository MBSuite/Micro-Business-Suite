# Authentication System Rules
## มาตรฐานบังคับ

### ❌ FORBIDDEN (ห้ามใช้เด็ดขาด)
1. **next-auth library** - ทุก version (v4, v5, beta)
2. **./middleware.ts** - ห้ามสร้าง/ใช้
3. **next-auth/react** - ห้าม import (useSession, signIn, signOut)
4. **useSession() hook** - ห้ามใช้ใน component ใดๆ

### ✅ MANDATORY (ต้องใช้เท่านั้น)
1. **./proxy.ts** - สำหรับ route protection เท่านั้น
2. **Custom JWT** ด้วย `jose` library (ไม่ใช่ jsonwebtoken)
3. **bcryptjs** - สำหรับ password hashing
4. **Cookie**: `session-token` (`httpOnly`, `sameSite=lax`, `secure` in production)
5. **JWT secret**: set `NEXTAUTH_SECRET`; current auth code also accepts `AUTH_SECRET` as a fallback. Never use a hard-coded or development fallback.

### 📁 PROTECTED FILES
ห้ามแก้ไขไฟล์เหล่านี้โดยไม่ได้รับอนุญาต:
- `lib/auth.ts`
- `proxy.ts`
- `app/api/login/route.ts`
- `app/api/logout/route.ts`
- `components/Providers.tsx`

### 🌐 PUBLIC PATHS (ไม่ต้อง login)
- /login
- /register
- /api/login
- /api/logout
- /api/auth/*

รายการ public หมายถึง `proxy.ts` ไม่บังคับ session ก่อนส่งคำขอต่อเท่านั้น ไม่ได้ยกเว้นการตรวจสิทธิ์ใน route handler; endpoint ที่ต้องใช้ตัวตนต้องตรวจ session หรือ service credential เอง

### 🔐 AUTH FLOW
1. Login page → POST /api/login
2. API ตรวจสอบ password ด้วย bcrypt
3. สร้าง JWT ด้วย jose (หมดอายุ 1 วัน)
4. ตั้งค่า cookie "session-token"
5. `proxy.ts` ตรวจสอบ JWT สำหรับ route ที่ต้อง login
6. หน้าเว็บที่ไม่มี session หรือ token ไม่ถูกต้อง → redirect ไป `/login`; API ที่ไม่มี session ตอบ `401` แบบ JSON
7. Logout → POST `/api/logout` เพื่อลบ cookie

### ⚠️ SSO STATUS
SSO ยังมีข้อค้นพบระดับสูงใน [AUDIT.md](./AUDIT.md): ฝั่งออก token ยังไม่จำกัด audience ด้วย allowlist และหน้า login ยังรับ redirect จาก URL ก่อนส่ง token กลับไป ห้ามถือว่า SSO ข้ามแอปพร้อมใช้งานอย่างปลอดภัยหรือผ่าน production acceptance จนกว่าจะแก้และทดสอบครบ

### 📝 CLIENT COMPONENT PATTERN
```tsx
// ✅ ถูกต้อง: รับ userRole จาก Server Component
export default function MyComponent({ userRole }: { userRole?: string }) {
  // ใช้ userRole ได้เลย
}

// ❌ ผิด: ห้ามใช้ useSession
const { data: session } = useSession(); // BANNED!
```

### 🚪 LOGOUT PATTERN
```tsx
// ✅ ถูกต้อง
<button onClick={async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
}}>
  Logout
</button>
```

---
**Created**: 2024-04-17
**Status**: Required project authentication rules; update this document when the implementation contract changes.
