import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useRegisterMutation } from '../store/apiSlice/practikalApi';
import { setUser } from '../store/slices/authSlice';
import { User, UserRole, Rank } from '../types';
import { Shield, Eye, EyeOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

function rtkErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const o = err as Record<string, unknown>;
  if (o.data && typeof o.data === 'object') {
    const m = (o.data as Record<string, unknown>).message;
    if (typeof m === 'string' && m) return m;
  }
  if (typeof o.message === 'string' && o.message) return o.message;
  return '';
}

const BRAND = 'Practikal';

function rankFromLevel(level: string | undefined): User['rank'] {
  const ladder: Rank[] = ['beginner', 'medior', 'senior', 'professional', 'specialist', 'master', 'legend'];
  const cur = (level && ladder.includes(level as Rank) ? level : 'beginner') as Rank;
  const idx = ladder.indexOf(cur);
  const next = idx >= 0 && idx < ladder.length - 1 ? ladder[idx + 1] : cur;
  return {
    current: cur,
    next,
    progress: 0,
    nextRankPoints: 100,
  };
}

function Login() {
  const dispatch = useDispatch();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();

  const [isLogin, setIsLogin] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const busy = isLoggingIn || isRegistering;

  useEffect(() => {
    document.title = isLogin ? `Sign in · ${BRAND}` : `Create account · ${BRAND}`;
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!isLogin) {
        await register({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim().replace(/\s+/g, ''),
          password: password.trim(),
          email: email.trim() || undefined,
        }).unwrap();

        toast.success(
          'Account created. A platform administrator must activate your account before you can sign in.',
        );
        setIsLogin(true);
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        return;
      }

      const result = await login({
        phone_number: phoneNumber.trim().replace(/\s+/g, ''),
        password: password.trim(),
      }).unwrap();

      if (!result?.token) {
        const pending =
          typeof result?.message === 'string'
            ? result.message
            : 'This account is not active yet. Wait for a platform administrator to approve your registration.';
        toast.error(pending);
        return;
      }

      const { token, user, permissions } = result;

      let mappedRole: UserRole = 'user';
      if (user.user_type === 'SUPERADMIN') {
        mappedRole = 'superadmin';
      } else if (['ORG_ADMIN', 'UNIT_ADMIN', 'DEPT_ADMIN'].includes(user.user_type)) {
        mappedRole = 'admin';
      }

      const levelStr = user.gamification_level || 'beginner';
      const mappedUser: User = {
        id: user.user_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email || '',
        organization: user.Organization?.name || 'Practikal',
        level: levelStr,
        xp: typeof user.gamification_xp === 'number' ? user.gamification_xp : 0,
        xpToNextLevel:
          typeof user.gamification_xp_to_next === 'number' ? user.gamification_xp_to_next : 1000,
        reputation: typeof user.gamification_reputation === 'number' ? user.gamification_reputation : 0,
        achievements: [],
        completedChallenges: [],
        streak: typeof user.gamification_streak === 'number' ? user.gamification_streak : 0,
        rank: rankFromLevel(user.gamification_level),
        role: mappedRole,
        orgId: user.org_id,
        deptId: user.dept_id || undefined,
        unitId: user.unit_id || undefined,
        user_type: user.user_type,
        permissions: permissions || [],
      };

      localStorage.setItem('practikal-token', token);
      localStorage.setItem('practikal-user', JSON.stringify(mappedUser));
      dispatch(setUser(mappedUser));
      toast.success('Signed in successfully.');
    } catch (error) {
      console.error('Authentication error:', error);
      const msg = rtkErrorMessage(error);
      toast.error(
        msg ||
          (isLogin
            ? 'Sign-in failed. Use the phone number on file and the correct password.'
            : 'Registration failed. Check your details and try again.'),
      );
    }
  };

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden font-sans text-login-ink motion-safe:animate-fade-in lg:flex-row">
      {/* Hero: desktop/tablet only — hidden on small screens so the form fits the viewport */}
      <section
        className="relative hidden min-h-0 flex-1 flex-col overflow-hidden isolate lg:flex lg:min-w-0"
        aria-label="Product overview"
      >
        <div
          className="absolute inset-0 bg-gray-900 bg-[url('/login-hero.webp')] bg-cover bg-center bg-no-repeat scale-105 motion-safe:lg:scale-100"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/25 sm:from-slate-950/95 sm:via-slate-900/55 sm:to-slate-800/20"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-transparent to-transparent mix-blend-soft-light" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.35] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(52,211,153,0.35),transparent)]"
          aria-hidden
        />

        <div className="relative z-10 flex flex-1 flex-col justify-between px-6 py-10 sm:px-10 sm:py-12 lg:px-12 xl:px-14 lg:py-14 w-full min-h-0">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90 backdrop-blur-md w-fit">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" strokeWidth={2} aria-hidden />
              {isLogin ? 'Secure sign-in' : 'Register — approval required'}
            </p>
          </div>

          <h2 className="mt-10 lg:mt-14 font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-semibold text-white leading-[1.12] tracking-tight text-balance drop-shadow-sm max-w-2xl">
            Build a culture that{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-teal-200">
              spots risk early
            </span>
            —and responds with confidence.
          </h2>
        </div>
      </section>

      {/* Form: fills viewport on mobile; with hero on lg+. Single column scroll on small screens only if content exceeds height. */}
      <section className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-zinc-100 lg:order-2 lg:max-h-full lg:overflow-hidden lg:border-l lg:border-zinc-200/80 motion-safe:animate-fade-in-up motion-safe:delay-75">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-start px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:justify-center sm:px-8 sm:py-10 lg:max-h-full lg:px-10 lg:py-14 lg:pb-14">
          <div className="rounded-2xl bg-white/90 p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] ring-1 ring-zinc-200/90 backdrop-blur-sm sm:p-8 lg:p-9">
            <div className="mb-5 flex items-start gap-3 sm:mb-8 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-900/20 sm:h-12 sm:w-12">
                <Shield className="h-[22px] w-[22px] sm:h-6 sm:w-6" strokeWidth={1.5} aria-hidden />
              </div>
              <div className="min-w-0 pt-0.5">
                <h1 className="font-serif text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.65rem]">
                  {isLogin ? 'Sign in' : 'Create account'}
                </h1>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-first" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      First name
                    </label>
                    <input
                      id="reg-first"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-emerald-500/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-last" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Last name
                    </label>
                    <input
                      id="reg-last"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-emerald-500/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              )}

              {!isLogin && (
                <div>
                  <label htmlFor="reg-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Email <span className="font-normal normal-case text-zinc-400">(optional)</span>
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@organization.com"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-emerald-500/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    autoComplete="email"
                  />
                </div>
              )}

              <div>
                <label htmlFor="login-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Phone number
                </label>
                <input
                  id="login-phone"
                  type="text"
                  inputMode="numeric"
                  autoComplete={isLogin ? 'username' : 'tel'}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09XXXXXXXX · 10 digits"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-emerald-500/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isLogin ? '••••••••' : 'Minimum 6 characters'}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 py-2.5 pl-3.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-emerald-500/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    minLength={isLogin ? undefined : 6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={1.75} aria-hidden /> : <Eye size={18} strokeWidth={1.75} aria-hidden />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <p className="text-center text-xs leading-relaxed text-zinc-500">
                  Forgot your password?{' '}
                  <span className="text-zinc-600">Ask your organization administrator.</span>
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:from-emerald-500 hover:to-teal-600 disabled:pointer-events-none disabled:opacity-55"
              >
                {busy ? (isLogin ? 'Signing in…' : 'Submitting…') : isLogin ? 'Sign in' : 'Request account'}
              </button>
            </form>

            <div className="mt-5 border-t border-zinc-100 pt-4 text-center text-sm text-zinc-600 sm:mt-8 sm:pt-6">
              {isLogin ? (
                <>
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setPassword('');
                    }}
                    className="font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setPassword('');
                    }}
                    className="font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
