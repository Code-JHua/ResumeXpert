import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/UserContext.jsx'
import axiosInstance from '../utils/axiosInstance.js';
import { API_PATHS } from '../utils/apiPaths.js';
import { validateEmail } from '../utils/helper.js';
import { authStyles as styles } from '../assets/dummystyle';
import { Input } from '../components/Inputs.jsx';
import { useTranslation } from 'react-i18next';

const Login = ({ setCurrentPage }) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError(t('auth.login.errors.invalidEmail'));
      return;
    }
    if (!password) {
      setError(t('auth.login.errors.passwordRequired'));
      return;
    }
    setError('');
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      })
      const { token } = response.data
      if (token) {
        localStorage.setItem('token', token);
        updateUser(response.data);
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || t('auth.login.errors.default'));
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerWrapper}>
        <h3 className={styles.title}>{t('auth.login.title')}</h3>
        <p className={styles.subtitle}>
          {t('auth.login.subtitle')}
        </p>
      </div>

      {/* form */}
      <form onSubmit={handleLogin} className={styles.form}>
        <Input
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          label={t('auth.login.email')}
          placeholder={t('auth.login.emailPlaceholder')}
          type="email" />
        <Input
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          label={t('auth.login.password')}
          placeholder={t('auth.login.passwordPlaceholder')}
          type="password" />

        {error && <div className={styles.errorMessage}>{error}</div>}

        <button type="submit" className={styles.submitButton}>{t('auth.login.submit')}</button>

        <p className={styles.switchText}>
          {t('auth.login.noAccount')}{' '}
          <button type='button'
            className={styles.switchButton}
            onClick={() => setCurrentPage('signup')}>
            {t('auth.login.signUpLink')}
          </button>
        </p>
      </form>
    </div>
  )
}

export default Login