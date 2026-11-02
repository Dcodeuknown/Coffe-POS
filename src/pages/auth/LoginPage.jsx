import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeft, KeyRound, ShieldCheck, ShoppingBag } from 'lucide-react'

function LoginPage({ audience }) {
  const isAdmin = audience === 'admin'
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  async function handleLogin(formValues) {
    setLoginError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formValues.username,
          password: formValues.password,
          audience: isAdmin ? 'admin' : 'cashier',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        setLoginError(errorData?.detail || 'Username or password is incorrect.')
        return
      }

      const data = await response.json()

      // Keep the token for this browser tab so later API calls can authenticate.
      sessionStorage.setItem('access_token', data.access_token)

      // Open the workspace selected on the login page.
      window.location.assign(isAdmin ? '/admin' : '/cashier')
    } catch {
      setLoginError('Could not reach the API. Check that Uvicorn is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const alternateLogin = isAdmin
    ? { label: 'Cashier login', href: '/login' }
    : { label: 'Admin login', href: '/admin/login' }

  return (
    <main className="login-page">
      <section className="login-aside" aria-label="Bahug Nawung Coffe POS">
        <a className="login-brand" href="/" aria-label="Back to POS home">
          <span className="brand-mark">
            <ShoppingBag size={19} />
          </span>
          <span className="brand-copy">
            <span className="brand-name">Bahug Nawung Coffe POS</span>
            <span className="brand-caption">Point of sale</span>
          </span>
        </a>

        <div className="login-aside-content">
          <span className="login-aside-kicker">BAHUG NAWUNGS POS</span>
          <h1>Good work starts with a clear view.</h1>
          <p>A thoughtful workspace for the people who keep your store moving.</p>
          <div className="login-aside-note">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>Sign in to your workspace</span>
          </div>
        </div>

        <span className="login-aside-footer">A better day at the counter.</span>
        <div className="login-decoration" aria-hidden="true">
          <span className="login-decoration-ring ring-large" />
          <span className="login-decoration-ring ring-small" />
          <span className="login-decoration-mark">
            <ShoppingBag size={42} />
          </span>
        </div>
      </section>

      <section className="login-content" aria-labelledby="login-title">
        <div className="login-form-wrap">
          <a className="back-home" href="/">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Back to home</span>
          </a>

          <div className="login-heading">
            <span className="login-role-icon" aria-hidden="true">
              {isAdmin ? <ShieldCheck size={20} /> : <ShoppingBag size={20} />}
            </span>
            <span className="eyebrow">
              {isAdmin ? 'ADMINISTRATOR ACCESS' : 'TEAM MEMBER ACCESS'}
            </span>
            <h2 id="login-title">{isAdmin ? 'Admin sign in' : 'Welcome back'}</h2>
            <p>
              {isAdmin
                ? 'Sign in to manage your store workspace.'
                : 'Sign in to continue to the cashier workspace.'}
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit(handleLogin)}
            noValidate
          >
            <div className="form-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? 'username-error' : undefined}
                {...register('username', {
                  required: 'Enter your username.',
                })}
              />
              {errors.username && (
                <span className="field-error" id="username-error" role="alert">
                  {errors.username.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <div className="field-label-row">
                <label htmlFor="password">Password</label>
                <span className="password-hint">Keep your password private</span>
              </div>
              <div className="password-input-wrap">
                <KeyRound size={16} aria-hidden="true" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password', {
                    required: 'Enter your password.',
                  })}
                />
              </div>
              {errors.password && (
                <span className="field-error" id="password-error" role="alert">
                  {errors.password.message}
                </span>
              )}
            </div>

            {loginError && (
              <p className="field-error" role="alert">
                {loginError}
              </p>
            )}

            <button
              className="submit-login"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? '  in…' : 'Continue'}
            </button>
          </form>

          <div className="login-switch">
            <span>{isAdmin ? 'Working at the counter?' : 'Managing the store?'}</span>
            <a href={alternateLogin.href}>{alternateLogin.label}</a>
          </div>

          <div className="login-footer-note">
            <span className="status-dot" aria-hidden="true" />
            Development preview
          </div>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
