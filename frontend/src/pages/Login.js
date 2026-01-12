import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config'; // Import the cloud URL
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Use API_URL instead of localhost
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      
      if(localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      
      navigate('/');
    } catch (err) {
       if (err.response && err.response.data && err.response.data.error) {
         alert(err.response.data.error);
       } else {
         alert("Login failed. Check your network.");
       }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p>Enter your details to access your finance.</p>
        
        <form onSubmit={handleLogin} className="auth-form">
          <input 
            type="email" className="auth-input" placeholder="Email Address" 
            value={email} onChange={(e) => setEmail(e.target.value)} required 
          />
          <input 
            type="password" className="auth-input" placeholder="Password" 
            value={password} onChange={(e) => setPassword(e.target.value)} required 
          />
          <button type="submit" className="auth-btn">Sign In</button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
export default Login;