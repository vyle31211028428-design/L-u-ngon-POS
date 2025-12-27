# Authentication & Routing System

## Overview
Hệ thống xác thực thực tế với PIN-based login + Role-based routing + Customer table access

## Architecture

### 1. Authentication Flow

```
┌─────────────────┐
│  User Access    │
└────────┬────────┘
         │
    ┌────┴────────────────────────────┐
    │                                 │
    ▼                                 ▼
┌──────────────┐               ┌──────────────┐
│ /ban/:table  │               │ /login       │
│ (No Auth)    │               │ (Public)     │
└──────────────┘               └──────┬───────┘
                                      │
                              ┌───────▼───────┐
                              │ Enter PIN     │
                              │ Rate Limit    │
                              │ Check DB      │
                              └───────┬───────┘
                                      │
                           ┌──────────┴──────────┐
                           │                     │
                           ▼                     ▼
                      ┌────────┐          ┌──────────┐
                      │ Success│          │ Error    │
                      │ Login  │          │ Lock Acc │
                      └───┬────┘          └──────────┘
                          │
                ┌─────────┬┴──────────┬─────────┐
                │         │          │         │
                ▼         ▼          ▼         ▼
            ┌─────┐ ┌──────┐ ┌────────┐ ┌──────┐
            │Admin│ │Cashier│ │Kitchen │ │Staff │
            └─────┘ └──────┘ └────────┘ └──────┘
```

### 2. Route Structure

#### Public Routes
- `/login` - Login page (PIN input)
- `/ban/:tableId` - Customer order interface (no auth)
- `/table/:tableId` - Alternative customer URL

#### Protected Routes (Require Authentication)
- `/` - Home page (redirects to role-specific page)
- `/admin` - Admin dashboard (ADMIN only)
- `/kitchen` - Kitchen display (KITCHEN only)
- `/cashier` - Cashier view (CASHIER only)
- `/staff` - Staff view (STAFF only)

### 3. Authentication Components

#### AuthContext.tsx
```typescript
interface AuthContextType {
  user: AuthUser | null;                // { id, name, role, pinCode }
  isAuthenticated: boolean;              // user !== null
  isLoading: boolean;                    // API call in progress
  error: string | null;                  // Error message
  loginAttempts: number;                 // Failed attempts count
  isLocked: boolean;                     // Account locked flag
  lockUntil: number | null;              // Lock timestamp (ms)

  login(pinCode: string): Promise<void>; // Authenticate user
  logout(): void;                        // Clear user session
  clearError(): void;                    // Clear error message
}
```

**Features:**
- ✅ PIN-based authentication (query employees table)
- ✅ Rate limiting: 5 failed attempts = 15 minute lockout
- ✅ Session persistence (localStorage)
- ✅ Role-based user object
- ✅ Lockout countdown timer

#### LoginView.tsx
```typescript
- PIN input field (masked by default)
- Show/hide PIN toggle
- Attempt counter display
- Lockout countdown (if locked)
- Error message display
- Auto-redirect to role page on success
```

**Rate Limiting UI:**
- ❌ Failed attempt 1-4: Show "N more attempts remaining"
- ❌ Failed attempt 5: "Account locked for 15 minutes"
- ⏱️ During lockout: Show countdown timer
- ✅ After 15 min: Auto-unlock & reset attempts

#### ProtectedRoute.tsx
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: Role[];  // Optional: restrict to specific roles
}
```

**Behavior:**
1. Check if user is authenticated
2. If not → Redirect to `/login`
3. If requiredRoles specified → Verify user.role
4. If role mismatch → Redirect to `/login`
5. If authenticated + role OK → Render children

#### CustomerRoute.tsx
- Wrapper for public customer routes
- No authentication required
- No special logic (just renders children)

### 4. Data Flow

#### Login Process
```
User enters PIN
       ↓
[PIN Input Validation]
  - Format check: >=4 digits
  - Length check: not empty
       ↓
[Rate Limit Check]
  - Check if account locked
  - Check attempt count
       ↓
[Database Query]
  SELECT * FROM employees
  WHERE pin_code = ?
  AND status = 'ACTIVE'
       ↓
┌──────────────┬──────────────┐
│              │              │
▼              ▼              ▼
Found       Not Found    Error
│              │          │
│              │    ┌─────┴──────┐
│              │    │            │
│     ┌────────┘    │     Retry  │
│     │      ┌──────┘            │
▼     ▼      ▼                   ▼
Success  +Attempt     +Attempts  Throw Error
Save       Lock(5)   Lock(5)     Lockout
User      if 5+      if 5+       if 5+
Store
Session
```

#### Session Storage
```javascript
// localStorage
{
  "lau_ngon_auth": {
    "id": "uuid",
    "name": "Nguyễn Văn A",
    "role": "ADMIN",
    "pinCode": "1234"
  },
  "lau_ngon_auth_attempts": "2",
  "lau_ngon_auth_lockUntil": "1703697600000"  // timestamp if locked
}
```

### 5. Rate Limiting Strategy

#### Brute Force Protection
- **Max Attempts:** 5 failed attempts
- **Lockout Duration:** 15 minutes (900 seconds)
- **Storage:** localStorage (client-side)
- **Reset:** Automatic after lockout expires OR on successful login

#### Attempted Attacks
1. **PIN Guessing:**
   - If PIN is 4 digits: 10,000 possible combinations
   - At 5 attempts per 15 min: 20 attempts per hour
   - Protection: ✅ Effective for 4-digit codes

2. **Session Hijacking:**
   - Sessions stored in localStorage (vulnerable to XSS)
   - Mitigation: Validate PIN on every sensitive operation (future)

3. **Offline Cracking:**
   - PIN stored in plain text in localStorage
   - Mitigation: This is acceptable for POS terminals (single physical device)

#### Future Enhancements
- Backend rate limiting (IP-based)
- JWT tokens with expiration
- Session invalidation on logout across all tabs
- PIN hashing in database
- Activity logging

## Usage Examples

### 1. Login User
```typescript
const { login, error, loginAttempts } = useAuth();

const handleLogin = async (pin: string) => {
  try {
    await login(pin);  // Throws on error
    // Redirect happens automatically
  } catch (err) {
    console.error('Login failed:', err);
    // Show error to user
  }
};
```

### 2. Protect Admin Route
```typescript
<ProtectedRoute requiredRoles={['ADMIN']}>
  <AdminView />
</ProtectedRoute>
```

### 3. Access Current User
```typescript
const { user, logout } = useAuth();

if (!user) return <div>Not logged in</div>;

return (
  <div>
    Welcome, {user.name} ({user.role})
    <button onClick={logout}>Logout</button>
  </div>
);
```

### 4. Customer Table Route
```typescript
// URL: http://localhost:5173/ban/table-1
// No auth needed - direct to order interface

<ProtectedRoute>
  <TableView />  {/* Uses tableId from URL param */}
</ProtectedRoute>
```

## Security Considerations

### Current Implementation (MVP)
- ✅ PIN-based auth (4+ digits)
- ✅ Client-side rate limiting
- ✅ Session storage (localStorage)
- ✅ Role-based routing
- ✅ Account lockout (15 min)
- ✅ Customer access without auth

### Production Recommendations
- 🔒 Backend rate limiting (IP + account)
- 🔒 HTTPS only for all requests
- 🔒 JWT tokens with expiration
- 🔒 PIN hashing (bcrypt) in database
- 🔒 Activity logging & audit trail
- 🔒 Session validation on critical operations
- 🔒 Implement CSRF protection
- 🔒 Add 2FA for admin accounts
- 🔒 Regular penetration testing

## Testing

### Manual Test Cases

**Test 1: Successful Login**
1. Go to `/login`
2. Enter valid PIN (e.g., "1234")
3. Click "Đăng nhập"
4. Should redirect to `/admin` (or role-specific page)
5. User should be in AuthContext

**Test 2: Invalid PIN**
1. Go to `/login`
2. Enter invalid PIN (e.g., "0000")
3. Should show: "Mã PIN không chính xác. Còn 4 lần thử"
4. Attempts counter increments

**Test 3: Account Lockout**
1. Enter wrong PIN 5 times
2. Should show: "Tài khoản bị khóa. Vui lòng thử lại sau 15 phút"
3. Input disabled, submit button disabled
4. Countdown timer visible
5. After 15 seconds (in dev), unlock automatically

**Test 4: Protected Route**
1. Clear localStorage
2. Try to access `/admin`
3. Should redirect to `/login`

**Test 5: Customer Table Access**
1. Go to `/ban/table-1` without authentication
2. Should show TableView (order interface)
3. No login required

**Test 6: Session Persistence**
1. Login successfully
2. Refresh page
3. Should still be logged in
4. User info should be in AuthContext

**Test 7: Logout**
1. Click logout button
2. Redirect to `/login`
3. localStorage cleared
4. Next page reload should show login

## Configuration

### Environment Variables (Optional)
None required - all config in AuthContext defaults:

```typescript
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;  // 15 minutes
```

### Customization
Edit AuthContext.tsx constants:
```typescript
// Change max attempts
const MAX_LOGIN_ATTEMPTS = 3;  // More strict

// Change lockout duration
const LOCKOUT_DURATION = 30 * 60 * 1000;  // 30 minutes
```

## Troubleshooting

### Issue: "Not authenticated" error on protected route
**Solution:** Check localStorage for corrupted data
```javascript
localStorage.removeItem('lau_ngon_auth');
location.reload();
```

### Issue: Lockout timer not showing
**Solution:** Verify browser has JavaScript enabled and supports localStorage

### Issue: PIN not accepting input
**Solution:** Clear browser cache and refresh

## Migration Notes (from RoleSelection)

### Old System
- RoleSelection component → manual role selection
- Single MainApp component → role-based rendering

### New System
- AuthContext → authentication state
- LoginView → PIN-based login
- ProtectedRoute → role-based access control
- App Router → URL-based routing

### Data Migration
No database changes needed:
- Existing employees table with pin_code ✅
- Existing role enum ✅
- Existing status field ✅

## Related Files

- [AuthContext.tsx](context/AuthContext.tsx)
- [LoginView.tsx](views/LoginView.tsx)
- [ProtectedRoute.tsx](components/ProtectedRoute.tsx)
- [CustomerRoute.tsx](components/CustomerRoute.tsx)
- [App.tsx](App.tsx)
- [HomePage.tsx](views/HomePage.tsx)
- [TableView.tsx](views/TableView.tsx)

## Next Steps

1. ✅ Implement authentication system
2. ⏳ Test all login scenarios
3. ⏳ Enable real-time employee list sync
4. ⏳ Add backend rate limiting
5. ⏳ Implement PIN hashing
6. ⏳ Add session validation endpoints
