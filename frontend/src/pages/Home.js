import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_URL } from '../config'; // Import Cloud URL
import './Home.css';

// Chart Imports
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend);

const getCategoryIcon = (cat) => {
  const map = {
    'Food': '🍔', 'Transport': '🚗', 'Entertainment': '🎬', 
    'Bills': '💡', 'Health': '💊', 'Shopping': '🛍️', 'Other': '📦'
  };
  return map[cat] || '📦';
};

function Home() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  const [form, setForm] = useState({ 
    title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] 
  });

  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [editId, setEditId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const fetchData = async () => {
      try {
        const config = { headers: { 'auth-token': token } };
        // Use API_URL everywhere
        const [expRes, catRes, userRes] = await Promise.all([
            axios.get(`${API_URL}/api/expenses`, config),
            axios.get(`${API_URL}/api/categories`, config),
            axios.post(`${API_URL}/api/auth/getuser`, {}, config)
        ]);
        setExpenses(expRes.data);
        setCategories(catRes.data);
        setUser(userRes.data);
        setLoading(false);
      } catch (err) { console.error(err); }
    };
    fetchData();

    function handleClickOutside(event) {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setIsMenuOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, [navigate]);

  const getFilteredExpenses = () => {
    let filtered = expenses;
    if (timeRange !== 'all') {
        const now = new Date();
        const pastDate = new Date();
        if (timeRange === '7days') pastDate.setDate(now.getDate() - 7);
        if (timeRange === '30days') pastDate.setDate(now.getDate() - 30);
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= pastDate && itemDate <= now;
        });
    }
    if (searchQuery) {
        filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    return filtered;
  };

  const filteredExpenses = getFilteredExpenses();

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Expense Report", 14, 22);
    doc.setFontSize(11); doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["Date", "Item", "Category", "Amount"];
    const tableRows = [];

    filteredExpenses.forEach(item => {
        const rowData = [ new Date(item.date).toLocaleDateString(), item.title, item.category, `$${item.amount}` ];
        tableRows.push(rowData);
    });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 40, theme: 'grid', styles: { fontSize: 10 }, headStyles: { fillColor: [108, 92, 231] } });
    doc.save("expenses.pdf");
  };

  const totalSpent = filteredExpenses.reduce((acc, item) => acc + item.amount, 0);
  const categoryTotals = filteredExpenses.reduce((acc, item) => {
    const cat = item.category || 'Other';
    acc[cat] = (acc[cat] || 0) + item.amount;
    return acc;
  }, {});

  const getCategorySpent = (cat) => filteredExpenses.filter(e => e.category === cat).reduce((a, b) => a + b.amount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const endpoint = editId ? `${API_URL}/api/expenses/${editId}` : `${API_URL}/api/expenses/add`;
    const method = editId ? axios.put : axios.post;

    try {
      const res = await method(endpoint, form, { headers: { 'auth-token': token } });
      if (editId) {
        setExpenses(expenses.map(ex => ex._id === editId ? res.data : ex));
        setEditId(null);
      } else {
        setExpenses([res.data, ...expenses]);
      }
      setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] });
    } catch (err) { 
        console.error("Expense Error:", err);
        if (err.response && err.response.data && err.response.data.errors) {
            alert(err.response.data.errors[0].msg);
        } else {
            alert("Action failed. Check console for details.");
        }
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/expenses/${id}`, { headers: { 'auth-token': localStorage.getItem('token') } });
      setExpenses(expenses.filter(item => item._id !== id));
    } catch (err) { console.error(err); }
  };

  const handleSetBudget = async (id, val) => {
    try {
        await axios.put(`${API_URL}/api/categories/${id}`, { budget: val }, { headers: { 'auth-token': localStorage.getItem('token') } });
        setCategories(categories.map(c => c._id === id ? { ...c, budget: val } : c));
    } catch(e) {}
  };

  const addNewCategory = async () => {
      if(!newCat) return;
      try {
        const res = await axios.post(`${API_URL}/api/categories/add`, { name: newCat }, { headers: { 'auth-token': localStorage.getItem('token') } });
        setCategories([...categories, res.data]);
        setForm({...form, category: newCat});
        setNewCat(''); setIsCreatingCat(false);
      } catch(e) {}
  };

  const allCategories = ["Food", "Transport", "Entertainment", "Bills", "Health", "Shopping", ...categories.map(c => c.name)];

  return (
    <div className="home-container">
      <nav className="navbar">
        <Link to="/" className="nav-brand" style={{textDecoration:'none'}}>✨ ExpenseTracker</Link>
        <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
            <button onClick={() => setDarkMode(!darkMode)} style={{background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer'}}>{darkMode ? '☀️' : '🌙'}</button>
            <div className="menu-container" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{background:'none', border:'none', cursor:'pointer', padding:'0'}}>
                    {user && user.avatar ? (
                        <img src={user.avatar} alt="Profile" style={{width:'40px', height:'40px', borderRadius:'50%', objectFit:'cover', border:'2px solid var(--primary)'}} />
                    ) : ( <div style={{width:'40px', height:'40px', borderRadius:'50%', background:'var(--primary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'1.2rem'}}>{user ? user.name.charAt(0).toUpperCase() : '👤'}</div> )}
                </button>
                {isMenuOpen && (
                    <div className="dropdown-menu" style={{top:'110%'}}>
                        <Link to="/profile" className="dropdown-item" style={{textDecoration:'none', color:'var(--text-main)', marginBottom:'5px'}}>👤 My Profile</Link>
                        <div style={{height:'1px', background:'var(--border)', margin:'5px 0'}}></div>
                        <button className="dropdown-item logout" onClick={() => {localStorage.removeItem('token'); navigate('/login')}}>🚪 Log Out</button>
                    </div>
                )}
            </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="controls-column">
            <div className="ui-card balance-card">
                <h3>Total Spent</h3>
                <h1>${totalSpent.toLocaleString()}</h1>
                <p style={{fontSize:'0.8rem', opacity:0.8, color:'white', marginTop:'5px'}}>{timeRange === 'all' ? 'All Time' : timeRange === '7days' ? 'Last 7 Days' : 'Last 30 Days'}</p>
            </div>
            <div className="ui-card">
                <div className="expense-form-header">
                    <h3>{editId ? 'Edit Transaction' : 'New Transaction'}</h3>
                    <button onClick={() => setIsCreatingCat(!isCreatingCat)} style={{border:'none', background:'none', color:'var(--primary)', cursor:'pointer', fontSize:'0.85rem'}}>{isCreatingCat ? 'Cancel' : '+ Category'}</button>
                </div>
                {isCreatingCat && (
                    <div style={{display:'flex', gap:'10px', marginBottom:'1rem'}}>
                        <input className="modern-input" placeholder="Category Name" value={newCat} onChange={e => setNewCat(e.target.value)} />
                        <button onClick={addNewCategory} style={{background:'var(--primary)', color:'white', border:'none', borderRadius:'8px', padding:'0 1rem', cursor:'pointer'}}>✓</button>
                    </div>
                )}
                <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'0.8rem'}}>
                    <input className="modern-input" placeholder="What did you buy?" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                    <div className="form-row">
                        <input type="number" className="modern-input" placeholder="$$$" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                        <input type="date" className="modern-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                    </div>
                    <select className="modern-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{allCategories.map((c, i) => <option key={i} value={c}>{c}</option>)}</select>
                    <button type="submit" className="primary-btn">{editId ? 'Save Changes' : 'Add Expense'}</button>
                    {editId && <button type="button" onClick={() => { setEditId(null); setForm({title:'', amount:'', category:'Food', date: new Date().toISOString().split('T')[0]}) }} style={{width:'100%', background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', marginTop:'10px'}}>Cancel</button>}
                </form>
            </div>
        </div>

        <div className="center-column">
            <div className="ui-card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                    <h3 style={{marginBottom:0}}>Analysis</h3>
                    <select className="modern-input" style={{width:'auto', padding:'5px 10px', fontSize:'0.85rem'}} value={timeRange} onChange={(e) => setTimeRange(e.target.value)}><option value="all">All Time</option><option value="30days">Last 30 Days</option><option value="7days">Last 7 Days</option></select>
                </div>
                {filteredExpenses.length > 0 ? (
                    <div className="chart-wrapper"><Doughnut data={{labels: Object.keys(categoryTotals), datasets: [{data: Object.values(categoryTotals), backgroundColor: ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#d63031', '#0984e3'], borderWidth: 0}]}} options={{maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 15 } } }, cutout: '75%'}} /></div>
                ) : <p style={{textAlign:'center', color:'var(--text-secondary)', padding:'2rem'}}>No data for this period.</p>}
            </div>
            {categories.length > 0 && (
                <div className="ui-card">
                    <h3 style={{marginBottom:'1rem'}}>Budgets</h3>
                    {categories.map(cat => {
                        const spent = getCategorySpent(cat.name);
                        const limit = cat.budget || 0;
                        const isOver = limit > 0 && spent > limit;
                        const pct = limit > 0 ? Math.min((spent/limit)*100, 100) : 0;
                        return (
                            <div key={cat._id} className="budget-item">
                                <span style={{fontWeight:'600', width:'25%'}}>{cat.name}</span>
                                <div className="budget-bar-bg"><div className="budget-bar-fill" style={{width: `${pct}%`, background: isOver ? '#ff7675' : '#00b894'}}></div></div>
                                <div style={{display:'flex', flexDirection:'column', alignItems:'end', width:'60px'}}>
                                    <span style={{fontSize:'0.75rem', color: isOver ? '#ff7675' : 'var(--text-secondary)'}}>${spent}</span>
                                    <input type="number" className="budget-input-mini" placeholder="Limit" defaultValue={limit > 0 ? limit : ''} onBlur={(e) => handleSetBudget(cat._id, e.target.value)} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>

        <div className="history-column">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                <h3 style={{margin:0}}>History</h3>
                <button onClick={downloadPDF} style={{background: 'var(--input-bg)', border: '1px solid var(--border)', color:'var(--text-main)', padding:'5px 10px', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600'}}>📄 Export PDF</button>
            </div>
            <input className="modern-input" placeholder="🔍 Search transactions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{marginBottom:'1rem', padding:'0.8rem'}} />
            {filteredExpenses.length === 0 ? (
                <div className="ui-card" style={{textAlign:'center', color:'var(--text-secondary)'}}><p style={{fontSize:'2rem'}}>🍃</p><p>No transactions found.</p></div>
            ) : (
                <div className="transaction-list">
                    {filteredExpenses.map(item => (
                        <div key={item._id} className="transaction-card">
                            <div style={{display:'flex', alignItems:'center'}}>
                                <div className="t-icon">{getCategoryIcon(item.category || 'Other')}</div>
                                <div><span className="t-title">{item.title}</span><div className="t-meta">{item.category} • {item.date ? new Date(item.date).toLocaleDateString() : 'No Date'}</div></div>
                            </div>
                            <div style={{display:'flex', alignItems:'center'}}>
                                <span className="t-amount">-${item.amount}</span>
                                <div className="actions">
                                    <button className="icon-btn" onClick={() => { setEditId(item._id); const dateVal = item.date ? new Date(item.date).toISOString().split('T')[0] : ''; setForm({title: item.title, amount: item.amount, category: item.category, date: dateVal}); window.scrollTo({top: 0, behavior:'smooth'}); }}>✏️</button>
                                    <button className="icon-btn" onClick={() => deleteExpense(item._id)}>🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
export default Home;