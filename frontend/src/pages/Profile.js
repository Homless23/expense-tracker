import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config'; // Import Cloud URL
import './Auth.css'; 
import './Home.css'; 

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '', 
    newPassword: '' 
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const fetchUser = async () => {
      try {
        const res = await axios.post(`${API_URL}/api/auth/getuser`, {}, {
          headers: { 'auth-token': token }
        });
        setFormData({
            name: res.data.name,
            email: res.data.email,
            avatar: res.data.avatar || '',
            newPassword: ''
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMsg(null);
    const token = localStorage.getItem('token');
    
    const payload = {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar
    };
    if(formData.newPassword) payload.password = formData.newPassword;

    try {
      await axios.put(`${API_URL}/api/auth/update`, payload, {
        headers: { 'auth-token': token }
      });
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setFormData({ ...formData, newPassword: '' }); 
    } catch (err) {
      setMsg({ type: 'error', text: 'Error updating profile.' });
    }
  };

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading Profile...</div>;

  return (
    <div className="home-container" style={{minHeight:'100vh', background:'var(--bg)'}}>
      <nav className="navbar">
        <Link to="/" className="nav-brand" style={{textDecoration:'none'}}>
             ← Back to Dashboard
        </Link>
      </nav>

      <div className="auth-container" style={{height:'auto', padding:'50px 0'}}>
        <div className="auth-card" style={{maxWidth:'500px'}}>
          <div style={{display:'flex', justifyContent:'center', marginBottom:'20px'}}>
            <div style={{
                width:'100px', height:'100px', borderRadius:'50%', 
                background: formData.avatar ? `url(${formData.avatar}) center/cover` : 'var(--primary)',
                color:'white', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'3rem', border:'3px solid var(--card-bg)', boxShadow:'var(--shadow)'
            }}>
                {!formData.avatar && formData.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <h2>Edit Profile</h2>
          {msg && <p style={{color: msg.type === 'success' ? '#00b894' : '#ff7675'}}>{msg.text}</p>}
          
          <form onSubmit={handleUpdate} className="auth-form" style={{textAlign:'left'}}>
            <label style={{fontSize:'0.9rem', fontWeight:'600'}}>Full Name</label>
            <input type="text" className="auth-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />

            <label style={{fontSize:'0.9rem', fontWeight:'600', marginTop:'10px'}}>Email Address</label>
            <input type="email" className="auth-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />

             <label style={{fontSize:'0.9rem', fontWeight:'600', marginTop:'10px'}}>Profile Picture URL (Optional)</label>
             <input type="url" className="auth-input" value={formData.avatar} onChange={e => setFormData({...formData, avatar: e.target.value})} />
            <p style={{fontSize:'0.8rem', color:'var(--text-secondary)', margin:'5px 0 15px'}}>Paste an image link from Imgur, etc.</p>

            <hr style={{border:'none', borderBottom:'1px solid var(--border)', margin:'20px 0'}} />
            
            <label style={{fontSize:'0.9rem', fontWeight:'600'}}>New Password (Optional)</label>
            <input type="password" className="auth-input" placeholder="Leave blank to keep current" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} />

            <button type="submit" className="auth-btn" style={{marginTop:'20px'}}>Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default Profile;