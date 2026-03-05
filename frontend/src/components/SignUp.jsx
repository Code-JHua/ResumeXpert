import React, { useState, useContext } from 'react'
import {authStyles as styles} from '../assets/dummystyle';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../utils/helper.js';
import { API_PATHS } from '../utils/apiPaths.js';
import axiosInstance from '../utils/axiosInstance.js';
import { Input } from '../components/Inputs.jsx';



const SignUp = ({ setCurrentPage }) => {

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState(null);
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName) {
      setError('Please enter your FullName');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter valid Email');
      return;
    }
    if (!password) {
      setError('Please enter your Password');
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
      setError(error.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.headerWrapper}>
        <h3 className={styles.signupTitle}>Create Account</h3>
        <p className={styles.signupSubtitle}>Join thousands of professionals today</p>
      </div>

      {/* form */}
      <form onSubmit={handleSubmit} className={styles.signupForm}>
        <Input
          value={fullName}
          onChange={({ target }) => setFullName(target.value)}
          label="Full Name"
          placeholder="John Doe"
          type="text" />

        <Input
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          label="Email"
          placeholder="example@example.com"
          type="email" />
        <Input
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          label="Password"
          placeholder="8 characters or more"
          type="password" />

        {error && <div className={styles.errorMessage}>{error}</div>}
        <button type="submit" className={styles.signupSubmit}>Create Account</button>

        {/* footer */}
        <p className={styles.switchText}>
          Already have an account?{' '}
          <button onClick={() => setCurrentPage('login')}
            type="button" className={styles.signupSwitchButton}>
              Sign In
          </button>
        </p>
      </form>
    </div>
  )
}

export default SignUp