import React, { useState, useEffect } from 'react';
import { db } from './db';
import { PS4_LIBRARY } from './library';
import { 
  Search, Gamepad2, Landmark, Trash2, 
  Lock, User, Archive, Download, ShieldCheck, Edit3, Truck, Clock
} from 'lucide-react';

export default function App() {
  // --- PERSISTENT AUTHENTICATION STATE ---
  const [authStatus, setAuthStatus] = useState(() => {
    // Check local storage on initial load to stay logged in
    return localStorage.getItem('axon_auth') || 'logged-out';
  });
  
  const [passInput, setPassInput] = useState('');
  const [activeTab, setActiveTab] = useState('Games');
  const [formData, setFormData] = useState({
    title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', date: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [games, setGames] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync Auth to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('axon_auth', authStatus);
  }, [authStatus]);

  const loadCloudData = async () => {
    try {
      setLoading(true);
      const [gData, hData] = await Promise.all([db.games.toArray(), db.hardware.toArray()]);
      setGames(gData || []);
      setHardware(hData || []);
    } catch (err) { console.error("Cloud Error:", err); } finally { setLoading(false); }
  };

  useEffect(() => { 
    if (authStatus !== 'logged-out') loadCloudData(); 
  }, [authStatus]);

  // --- LOGIN HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === '1234') {
      setAuthStatus('admin');
    } else {
      alert("Unauthorized Architect Password");
    }
  };

  const handleLogout = () => {
    setAuthStatus('logged-out');
    localStorage.removeItem('axon_auth'); // Clear persistence on logout
  };

  // --- ANALYTICS & CALCULATION ---
  const calc = (item) => (parseFloat(item.price) || 0) + (parseFloat(item.delivery) || 0);
  
  const stats = {
    games: games.reduce((acc, g) => acc + calc(g), 0),
    hardware: hardware.reduce((acc, h) => acc + calc(h), 0),
    shipped: [...games, ...hardware].filter(i => i.status === 'Shipping').reduce((acc, i) => acc + calc(i), 0),
    received: [...games, ...hardware].filter(i => i.status === 'Paid').reduce((acc, i) => acc + calc(i), 0)
  };
  const grandTotal = stats.games + stats.hardware;

  // --- SEARCH & AUTO-FILL ---[cite: 1]
  const libraryResults = PS4_LIBRARY.filter(item => {
    const matches = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return activeTab === 'Games' ? (matches && !item.type) : (matches && item.type);
  }).slice(0, 8);

  const selectItem = (item) => {
    if (activeTab === 'Games') setFormData({ ...formData, title: item.title, studio: item.studio });
    else setFormData({ ...formData, name: item.title, studio: item.studio, type: item.type });
    setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authStatus !== 'admin') return;
    try {
      const dataToSave = { 
        ...formData, 
        price: Number(formData.price) || 0, 
        delivery: Number(formData.delivery) || 0 
      };
      activeTab === 'Games' ? await db.games.add(dataToSave) : await db.hardware.add(dataToSave);
      setFormData({ title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', date: new Date().toISOString().split('T')[0] });
      loadCloudData();
    } catch (err) { alert("Save Error"); }
  };

  // --- RENDER: LOGIN ---[cite: 1]
  if (authStatus === 'logged-out') {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard}>
          <div style={styles.logoBox}><Gamepad2 size={40} color="#fff" /></div>
          <h1 style={styles.logoText}>AXON <span style={styles.proBadge}>PRO</span></h1>
          <form onSubmit={handleLogin} style={{width:'100%', marginTop:'20px'}}>
            <input type="password" style={styles.input} placeholder="Architect Code" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button type="submit" style={styles.submitBtn}>Unlock System</button>
          </form>
          <div style={styles.divider}><span>OR</span></div>
          <button onClick={() => setAuthStatus('guest')} style={styles.guestBtn}>Enter as Guest</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logoBox}><Gamepad2 size={26} color="#fff" /></div>
            <h1 style={styles.logoText}>GameVault <span style={styles.proBadge}>PRO</span></h1>
          </div>
          
          <div style={styles.analyticsGrid}>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Grand Total</span>
              <h2 style={{...styles.statValue, color: '#10b981'}}>Rs. {grandTotal.toLocaleString()}</h2>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Inventory Breakdown</span>
              <p style={styles.statDetail}>Games: Rs. {stats.games.toLocaleString()}</p>
              <p style={styles.statDetail}>Hardware: Rs. {stats.hardware.toLocaleString()}</p>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Shipping Status</span>
              <p style={{...styles.statDetail, color: '#3b82f6'}}>In Transit: Rs. {stats.shipped.toLocaleString()}</p>
              <p style={styles.statDetail}>Received: Rs. {stats.received.toLocaleString()}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </header>

        <div style={styles.mainLayout}>
          <section>
            {authStatus === 'admin' ? (
              <div style={styles.card}>
                <div style={styles.tabHeader}>
                  <button onClick={() => setActiveTab('Games')} style={activeTab === 'Games' ? styles.activeTab : styles.tab}>Software</button>
                  <button onClick={() => setActiveTab('Hardware')} style={activeTab === 'Hardware' ? styles.activeTab : styles.tab}>Hardware</button>
                </div>

                <div style={styles.searchWrapper}>
                    <div style={styles.searchBar}>
                      <Search size={14} color="#94a3b8" />
                      <input style={styles.searchInput} placeholder="Auto-fill from Library..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    {searchTerm && libraryResults.length > 0 && (
                      <div style={styles.scrollDropdown}>
                        {libraryResults.map((item, i) => (
                          <div key={i} style={styles.dropdownItem} onClick={() => selectItem(item)}>
                            <b>{item.title}</b><br/><small>{item.studio}</small>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                  <input style={styles.input} placeholder="Asset Title" value={activeTab === 'Games' ? formData.title : formData.name} onChange={e => setFormData({...formData, [activeTab === 'Games' ? 'title' : 'name']: e.target.value})} />
                  <div style={styles.row}>
                    <input style={styles.input} placeholder="Price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    <input style={styles.input} placeholder="Ship" type="number" value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} />
                  </div>
                  <select style={styles.input} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Paid">Received</option>
                      <option value="Shipping">Shipping</option>
                      <option value="Pending">Wishlist</option>
                  </select>
                  <button type="submit" style={styles.submitBtn}>Add to Cloud</button>
                </form>
              </div>
            ) : <div style={styles.guestNotice}><ShieldCheck size={40} color="#10b981" /><h3>Guest View Mode</h3><p>Cloud Assets Synchronized</p></div>}
          </section>

          <section>
            <div style={styles.tableCard}>
                {(activeTab === 'Games' ? games : hardware).map(item => (
                  <div key={item.id || item._id} style={styles.tableRow}>
                    <div style={styles.gameInfo}>
                      <div style={styles.avatar}>{(item.title || item.name).charAt(0)}</div>
                      <div>
                        <b>{item.title || item.name}</b><br/>
                        <small style={{color: item.status === 'Shipping' ? '#3b82f6' : '#64748b'}}>{item.status}</small>
                      </div>
                    </div>
                    <div style={styles.priceArea}>
                        <b>Rs. {calc(item).toLocaleString()}</b>
                        {authStatus === 'admin' && <Edit3 size={14} style={{cursor:'pointer', color:'#cbd5e1'}} onClick={() => {setEditingId(item.id); setFormData(item); window.scrollTo(0,0);}}/>}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- RESPONSIVE STYLES ---[cite: 1]
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '15px', fontFamily: '"Inter", sans-serif' },
  content: { maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' },
  analyticsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' },
  statBox: { backgroundColor: '#fff', padding: '15px', borderRadius: '18px', border: '1px solid #e2e8f0' },
  statLabel: { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  statValue: { fontSize: '22px', fontWeight: '900', margin: '5px 0' },
  statDetail: { fontSize: '11px', fontWeight: '700', color: '#475569', margin: '2px 0' },
  loginOverlay: { height: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' },
  loginCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '30px', textAlign: 'center', width: '100%', maxWidth: '350px' },
  logoBox: { backgroundColor: '#0f172a', padding: '10px', borderRadius: '12px', display: 'inline-block' },
  logoText: { fontSize: '22px', fontWeight: '900', margin: '10px 0' },
  proBadge: { fontSize: '9px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '5px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', boxSizing: 'border-box', marginBottom: '10px' },
  submitBtn: { width: '100%', backgroundColor: '#0f172a', color: '#fff', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' },
  guestBtn: { width: '100%', backgroundColor: '#f8fafc', color: '#475569', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: '600', cursor: 'pointer' },
  divider: { margin: '20px 0', color: '#cbd5e1', fontSize: '10px', fontWeight: '800' },
  mainLayout: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  tabHeader: { display: 'flex', gap: '5px', marginBottom: '15px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '10px' },
  tab: { flex: 1, padding: '10px', border: 'none', background: 'none', fontSize: '12px', fontWeight: '600' },
  activeTab: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#fff', borderRadius: '8px', fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  tableCard: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  gameInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '32px', height: '32px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' },
  priceArea: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoutBtn: { padding: '8px 15px', borderRadius: '10px', border: '1px solid #fee2e2', color: '#ef4444', background: '#fff', fontSize: '11px', fontWeight: '700' },
  searchWrapper: { position: 'relative', marginBottom: '15px' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', width: '100%', fontSize: '14px' },
  scrollDropdown: { position: 'absolute', top: '55px', width: '100%', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', zIndex: 100 },
  dropdownItem: { padding: '12px', fontSize: '12px', borderBottom: '1px solid #f1f5f9', cursor:'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '5px' },
  row: { display: 'flex', gap: '10px' },
  guestNotice: { backgroundColor: '#fff', padding: '40px', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }
};

if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
  styles.analyticsGrid.gridTemplateColumns = 'repeat(3, 1fr)';
  styles.mainLayout.display = 'grid';
  styles.mainLayout.gridTemplateColumns = '350px 1fr';
  styles.header.flexDirection = 'row';
  styles.header.justifyContent = 'space-between';
}