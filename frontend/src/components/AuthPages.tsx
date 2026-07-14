import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { saveProfile } from '../services/api';

interface SignUpProps {
  onNavigateToLogin: () => void;
  onSignUpSuccess: (userId: string, email: string, firstName: string, lastName: string) => void;
  onClose: () => void;
  onGoogleClick: () => void;
}

export const SignUpPage: React.FC<SignUpProps> = ({ onNavigateToLogin, onSignUpSuccess, onClose, onGoogleClick }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) {
      newErrors.firstName = 'First Name is mandatory.';
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    
    // Password validation: 8+ characters, uppercase, lowercase, number, special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (!passwordRegex.test(password)) {
      newErrors.password = 'Must be 8+ characters, including uppercase, lowercase, number, and special character.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!agree) {
      newErrors.agree = 'You must agree to the Terms & Privacy Policy.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user data returned.');

      // Save user profile to backend or Supabase direct fallback
      try {
        await saveProfile({
          id: data.user.id,
          first_name: firstName,
          last_name: lastName || null,
          email: email,
          newsletter_enabled: false,
          preferred_topics: '',
          theme: 'dark'
        });
      } catch (err) {
        console.warn('Failed to sync profile with database repository.');
      }

      onSignUpSuccess(data.user.id, email, firstName, lastName);
    } catch (err: any) {
      setErrors({ global: err.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', position: 'relative', padding: '20px', cursor: 'pointer' }}
    >
      <div className="subtle-grid"></div>
      <div className="landing-glow-1"></div>
      
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', maxWidth: '450px', width: '100%', padding: '40px', background: 'var(--panel-bg)', animation: 'slideUp 0.3s ease-out', cursor: 'default' }}
      >
        <button className="modal-close" onClick={onClose} style={{ top: '20px', right: '20px' }}>&times;</button>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>Create Your Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Start receiving whitelisted daily briefings.</p>
        </div>

        {errors.global && (
          <div className="article-card" style={{ borderLeft: '3px solid var(--strategic)', padding: '10px 14px', marginBottom: '20px', background: 'rgba(255,90,95,0.05)' }}>
            <p style={{ color: 'var(--strategic)', fontSize: '12px', margin: 0 }}>{errors.global}</p>
          </div>
        )}

        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="auth-input-group" style={{ marginBottom: 0 }}>
              <label className="auth-label">First Name *</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Abhi"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && <span style={{ color: 'var(--strategic)', fontSize: '10px' }}>{errors.firstName}</span>}
            </div>

            <div className="auth-input-group" style={{ marginBottom: 0 }}>
              <label className="auth-label">Last Name</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Nallana"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-input-group" style={{ marginBottom: 0 }}>
            <label className="auth-label">Email Address *</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span style={{ color: 'var(--strategic)', fontSize: '10px' }}>{errors.email}</span>}
          </div>

          <div className="auth-input-group" style={{ marginBottom: 0 }}>
            <label className="auth-label">Password *</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <span style={{ color: 'var(--strategic)', fontSize: '10px', display: 'block', marginTop: '4px', lineHeight: '1.3' }}>{errors.password}</span>}
          </div>

          <div className="auth-input-group" style={{ marginBottom: 0 }}>
            <label className="auth-label">Confirm Password *</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && <span style={{ color: 'var(--strategic)', fontSize: '10px' }}>{errors.confirmPassword}</span>}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              I agree to the Terms & Privacy Policy
            </span>
          </label>
          {errors.agree && <span style={{ color: 'var(--strategic)', fontSize: '10px' }}>{errors.agree}</span>}

          <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <button className="btn-outline" onClick={onGoogleClick} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px' }}>
          <span>🌐</span> Continue with Google
        </button>

        <div className="auth-footer" style={{ marginTop: '24px' }}>
          Already have an account?{' '}
          <span className="auth-toggle-link" onClick={onNavigateToLogin}>
            Login
          </span>
        </div>
      </div>
    </div>
  );
};

interface LoginProps {
  onNavigateToSignUp: () => void;
  onLoginSuccess: (userId: string, email: string) => void;
  onClose: () => void;
  onGoogleClick: () => void;
}

export const LoginPage: React.FC<LoginProps> = ({ onNavigateToSignUp, onLoginSuccess, onClose, onGoogleClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user data returned.');

      onLoginSuccess(data.user.id, email);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', position: 'relative', padding: '20px', cursor: 'pointer' }}
    >
      <div className="subtle-grid"></div>
      <div className="landing-glow-1"></div>

      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', maxWidth: '420px', width: '100%', padding: '40px', background: 'var(--panel-bg)', animation: 'slideUp 0.3s ease-out', cursor: 'default' }}
      >
        <button className="modal-close" onClick={onClose} style={{ top: '20px', right: '20px' }}>&times;</button>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>Sign In to OpsiAI</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Access your technical intelligence reports.</p>
        </div>

        {error && (
          <div className="article-card" style={{ borderLeft: '3px solid var(--strategic)', padding: '10px 14px', marginBottom: '20px', background: 'rgba(255,90,95,0.05)' }}>
            <p style={{ color: 'var(--strategic)', fontSize: '12px', margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="auth-input-group" style={{ marginBottom: 0 }}>
            <label className="auth-label">Email Address</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
              <span style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>Forgot Password?</span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                style={{ paddingRight: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Remember Me
            </span>
          </label>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Login'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <button className="btn-outline" onClick={onGoogleClick} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px' }}>
          <span>🌐</span> Continue with Google
        </button>

        <div className="auth-footer" style={{ marginTop: '24px' }}>
          Don't have an account?{' '}
          <span className="auth-toggle-link" onClick={onNavigateToSignUp}>
            Sign Up
          </span>
        </div>
      </div>
    </div>
  );
};
