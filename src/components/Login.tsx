import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react';

const BRAND = 'Practikal';

const CAROUSEL_SLIDES = [
  {
    caption: `${BRAND} covers everything from phishing to password security.`,
  },
  {
    caption: 'Short, practical lessons your team can finish in minutes—not hours.',
  },
  {
    caption: 'Track progress, assignments, and readiness from one place.',
  },
  {
    caption: 'Built for awareness training that actually sticks.',
  },
];

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [slide, setSlide] = useState(0);
  const { login, register } = useAuth();

  useEffect(() => {
    document.title = BRAND;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, organization);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const nextSlide = () => setSlide((s) => (s + 1) % CAROUSEL_SLIDES.length);
  const prevSlide = () => setSlide((s) => (s - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans text-login-ink motion-safe:animate-fade-in">
      {/* Left: marketing + hero (reference layout) */}
      <section className="order-2 lg:order-1 flex flex-1 flex-col bg-white px-6 py-10 sm:px-10 lg:px-14 lg:py-12 lg:max-w-[50vw] motion-safe:animate-fade-in-up motion-safe:delay-150">
        <div className="flex flex-1 flex-col items-center justify-center max-w-lg mx-auto w-full">
          <div
            className="w-full max-w-md aspect-[5/4] rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-8 bg-gray-50 bg-[url('/login-hero.png')] bg-[length:200%_auto] bg-[position:left_center] bg-no-repeat"
            role="img"
            aria-label="Security awareness illustration"
          />

          <p
            key={slide}
            className="font-serif text-center text-lg sm:text-xl text-login-ink/90 leading-snug max-w-md px-2 motion-safe:animate-fade-in"
          >
            {CAROUSEL_SLIDES[slide].caption}
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={prevSlide}
              className="w-11 h-11 rounded-full bg-login-sageDark text-white flex items-center justify-center hover:bg-login-ink transition-colors shadow-sm tap-highlight"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="flex gap-2">
              {CAROUSEL_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === slide ? 'w-8 bg-login-sageDark' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === slide}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={nextSlide}
              className="w-11 h-11 rounded-full bg-login-mint border-2 border-login-sageDark/40 text-login-sageDark flex items-center justify-center hover:bg-login-sage/30 transition-colors tap-highlight"
              aria-label="Next slide"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </section>

      {/* Right: form on dark panel */}
      <section className="order-1 lg:order-2 flex flex-1 flex-col bg-black text-white px-6 py-10 sm:px-12 lg:px-16 lg:py-14 lg:max-w-[50vw] motion-safe:animate-fade-in-up motion-safe:delay-75">
        <div className="flex flex-1 flex-col justify-center max-w-md mx-auto w-full">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 shadow-sm border border-white/20 flex items-center justify-center motion-safe:animate-fade-in-up">
              <Shield className="text-lime-300" size={26} strokeWidth={1.5} aria-hidden />
            </div>
          </div>

          <h1
            key={isLogin ? 'signin' : 'signup'}
            className="font-serif text-3xl sm:text-4xl font-semibold text-center text-white mb-10 motion-safe:animate-fade-in-up"
          >
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="login-name" className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    id="login-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-full border-0 bg-white px-6 py-3.5 text-login-ink shadow-sm ring-1 ring-black/5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-login-sageDark/50"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="login-org" className="block text-sm font-medium text-gray-300 mb-2">
                    Organization
                  </label>
                  <input
                    id="login-org"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Company or team name"
                    className="w-full rounded-full border-0 bg-white px-6 py-3.5 text-login-ink shadow-sm ring-1 ring-black/5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-login-sageDark/50"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Where we send you emails"
                className="w-full rounded-full border-0 bg-white px-6 py-3.5 text-login-ink shadow-sm ring-1 ring-black/5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-login-sageDark/50"
                required
              />
            </div>

            <div>
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  className="text-sm font-medium text-lime-300 hover:text-lime-200 underline-offset-2 hover:underline"
                  onClick={() => alert('Password reset is not wired in the demo build.')}
                >
                  Forgot password?
                </button>
              </div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="The secret key to enter your account"
                className="w-full rounded-full border-0 bg-white px-6 py-3.5 text-login-ink shadow-sm ring-1 ring-black/5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-login-sageDark/50"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-login-sage py-4 text-base font-semibold text-white shadow-sm hover:bg-login-sageDark transition-colors mt-2 tap-highlight"
            >
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-white/15" />
            </div>
            <span className="relative bg-black px-4 text-sm text-gray-500">or</span>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-full border-2 border-white/20 bg-white py-3.5 text-sm font-medium text-login-ink hover:bg-gray-100 transition-colors tap-highlight"
              onClick={() => alert('Microsoft sign-in is not configured in this demo.')}
            >
              <MicrosoftIcon className="shrink-0" />
              Sign in with Microsoft
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-full border-2 border-white/20 bg-white py-3.5 text-sm font-medium text-login-ink hover:bg-gray-100 transition-colors tap-highlight"
              onClick={() => alert('Google sign-in is not configured in this demo.')}
            >
              <GoogleIcon className="shrink-0" />
              Sign in with Google
            </button>
          </div>

          <p className="mt-10 text-center text-sm text-gray-400">
            {isLogin ? (
              <>
                Are you new here?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="font-medium text-violet-400 hover:text-violet-300 underline underline-offset-2"
                >
                  Create an account here!
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="font-medium text-violet-400 hover:text-violet-300 underline underline-offset-2"
                >
                  Sign in here!
                </button>
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 21 21" aria-hidden>
      <path fill="#f25022" d="M1 1h9v9H1z" />
      <path fill="#00a4ef" d="M11 1h9v9h-9z" />
      <path fill="#7fba00" d="M1 11h9v9H1z" />
      <path fill="#ffb900" d="M11 11h9v9h-9z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default Login;
