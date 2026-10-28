import { useForm } from 'react-hook-form'
import { ArrowLeft, KeyRound, ShieldCheck, ShoppingBag } from 'lucide-react'

function LoginPage({ audience }) {
  const isAdmin = audience === 'admin'
  const { register, handleSubmit, formState: { errors } } = useForm()

  function handleLogin(formValues) {
    // TODO (MANUAL): Implement the login flow yourself.
    // Expected input: the email and password entered in this form.
    // Expected output: later, submit credentials to the backend and handle its response.
    void formValues
  }

  const alternateLogin = isAdmin
    ? { label: 'Cashier login', href: '/login' }
    : { label: 'Admin login', href: '/admin/login' }

  return (
    <main className="login-page">
      <section className="login-aside" aria-label="Bahug Nawung Coffe POS">
        <a className="login-brand" href="/" aria-label="Back to POS home">
          <span className="brand-mark"><ShoppingBag size={19} /></span>
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
            <span>Sign-in interface preview</span>
          </div>
        </div>

        <span className="login-aside-footer">A better day at the counter.</span>
        <div className="login-decoration" aria-hidden="true">
          <span className="login-decoration-ring ring-large" />
          <span className="login-decoration-ring ring-small" />
          <span className="login-decoration-mark"><ShoppingBag size={42} /></span>
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
            <span className="eyebrow">{isAdmin ? 'ADMINISTRATOR ACCESS' : 'TEAM MEMBER ACCESS'}</span>
            <h2 id="login-title">{isAdmin ? 'Admin sign in' : 'Welcome back'}</h2>
            <p>{isAdmin
              ? 'Sign in to manage your store workspace.'
              : 'Sign in to continue to the cashier workspace.'}</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit(handleLogin)} noValidate>
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@store.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email', { required: 'Enter your email address.' })}
              />
              {errors.email && <span className="field-error" id="email-error" role="alert">{errors.email.message}</span>}
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
                  autoComplete={isAdmin ? 'current-password' : 'current-password'}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password', { required: 'Enter your password.' })}
                />
              </div>
              {errors.password && <span className="field-error" id="password-error" role="alert">{errors.password.message}</span>}
            </div>

            <button className="submit-login" type="submit">Continue</button>
            <p className="form-preview-note">This form is a visual preview. Sign-in is not connected yet.</p>
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
