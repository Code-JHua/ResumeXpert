import React, { useState, useContext } from 'react'
import {authStyles as styles} from '../assets/dummystyle';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../utils/helper.js';
import { API_PATHS } from '../utils/apiPaths.js';
import axiosInstance from '../utils/axiosInstance.js';
import { Input } from '../components/Inputs.jsx';
import { useTranslation } from 'react-i18next';



const SignUp = ({ setCurrentPage }) => {

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState(null);
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName) {
      setError(t('auth.signup.errors.nameRequired'));
      return;
    }
    if (!validateEmail(email)) {
      setError(t('auth.signup.errors.invalidEmail'));
      return;
    }
    if (!password) {
      setError(t('auth.signup.errors.passwordRequired'));
      return;
    }
    setError('');
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        name: fullName,
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
      setError(error.response?.data?.message || t('auth.signup.errors.default'));
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.headerWrapper}>
        <h3 className={styles.signupTitle}>{t('auth.signup.title')}</h3>
        <p className={styles.signupSubtitle}>{t('auth.signup.subtitle')}</p>
      </div>

      {/* form */}
      <form onSubmit={handleSubmit} className={styles.signupForm}>
        <Input
          value={fullName}
          onChange={({ target }) => setFullName(target.value)}
          label={t('auth.signup.fullName')}
          placeholder={t('auth.signup.fullNamePlaceholder')}
          type="text" />

        <Input
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          label={t('auth.signup.email')}
          placeholder={t('auth.signup.emailPlaceholder')}
          type="email" />
        <Input
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          label={t('auth.signup.password')}
          placeholder={t('auth.signup.passwordPlaceholder')}
          type="password" />

        {error && <div className={styles.errorMessage}>{error}</div>}
        <button type="submit" className={styles.signupSubmit}>{t('auth.signup.submit')}</button>

        {/* footer */}
        <p className={styles.switchText}>
          {t('auth.signup.hasAccount')}{' '}
          <button onClick={() => setCurrentPage('login')}
            type="button" className={styles.signupSwitchButton}>
              {t('auth.signup.signInLink')}
          </button>
        </p>
      </form>
    </div>
  )
}

export default SignUp