import React, { useState, useEffect } from 'react';
import { db } from './db';
import { PS4_LIBRARY } from './library';
import { 
  Search, Gamepad2, Landmark, Trash2, ShieldCheck, Edit3, 
  Truck, Activity, Eye, Code, Percent, Globe, Clock, Plus
} from 'lucide-react';

export default function App() {
  // --- 1. PERSISTENT AUTHENTICATION ENGINE ---
  const [authStatus, setAuthStatus] = useState(() => localStorage.getItem('axon_auth') || 'logged-out');
  const [passInput, setPassInput] = useState('');
  
  // --- 2. CORE DATA & UI STATES ---
  const [activeTab, setActiveTab] = useState('Games');
  const [formData, setFormData] = useState({
    title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', 
    status: 'Paid', progress: '0', marketValue: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [games, setGames] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync auth status to browser memory
  useEffect(() => { localStorage.setItem('axon_auth', authStatus); }, [authStatus]);

  const loadCloudData = async () => {
    try {
      setLoading(true);
      const [gData, hData] = await Promise.all([db.games.toArray(), db.hardware.toArray()]);
      setGames(gData || []);
      setHardware(hData || []);
    } catch (err) { console.error("AXON Sync Error:", err); } finally { setLoading(false); }
  };

  useEffect(() => { if (authStatus !== 'logged-out') loadCloudData(); }, [authStatus]);

  // --- 3. LOGIC: AUTO-FILL SEARCH ENGINE ---
  const libraryResults = PS4_LIBRARY.filter(item => {
    if (!searchTerm) return false;
    const matches = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return activeTab === 'Games' ? (matches && !item.type) : (matches && item.type);
  }).slice(0, 8);

  const selectItem = (item) => {
    if (activeTab === 'Games') setFormData({ ...formData, title: item.title, studio: item.studio });
    else setFormData({ ...formData, name: item.title, studio: item.studio, type: item.type });
    setSearchTerm('');
  };

  // --- 4. LOGIC: NaN-PROOF ANALYTICS ---
  const calc = (item) => (parseFloat(item.price) || 0) + (parseFloat(item.delivery) || 0);

  const stats = {
    games: games.reduce((acc, g) => acc + calc(g), 0),
    hardware: hardware.reduce((acc, h) => acc + calc(h), 0),
    shipped: [...games, ...hardware].filter(i => i.status === 'Shipping').reduce((acc, i) => acc + calc(i), 0),
    totalCount: games.length + hardware.length
  };

  // --- 5. LOGIC: CATEGORIZATION & SHIPPING PRIORITY ---
  const getGroupedData = () => {
    const items = activeTab === 'Games' ? games : hardware;
    const sorted = [...items].sort((a, b) => {
      const priority = { 'Shipping': 1, 'Pending': 2, 'Paid': 3 };
      return (priority[a.status] || 4) - (priority[b.status] || 4);
    });
    return sorted.reduce((groups, item) => {
      const maker = item.studio || 'Other';
      if (!groups[maker]) groups[maker] = [];
      groups[maker].push(item);
      return groups;
    }, {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authStatus !== 'admin') return;
    try {
      const payload = { ...formData, price: Number(formData.price) || 0, delivery: Number(formData.delivery) || 0, progress: Number(formData.progress) || 0 };
      if (editingId) {
        activeTab === 'Games' ? await db.games.update(editingId, payload) : await db.hardware.update(editingId, payload);
      } else {
        activeTab === 'Games' ? await db.games.add(payload) : await db.hardware.add(payload);
      }
      resetForm();
      loadCloudData();
    } catch (err) { alert("Save Error"); }
  };

  const resetForm = () => {
    setFormData({ title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', progress: '0', marketValue: '' });
    setEditingId(null);
    setSearchTerm('');
  };

  // --- 6. RENDER: LOGIN GATEWAY ---
  if (authStatus === 'logged-out') {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard}>
          <div style={styles.logoBox}><Gamepad2 size={40} color="#fff" /></div>
          <h1 style={styles.logoText}>AXON <span style={styles.proBadge}>GATEWAY</span></h1>
          <p style={styles.creatorTag}>Senior Engineer Shifanth Jasim</p>
          <form onSubmit={(e) => { e.preventDefault(); if(passInput === '1234') setAuthStatus('admin'); }} style={{marginTop:'25px'}}>
            <input type="password" style={styles.input} placeholder="Architect Code" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button type="submit" style={styles.submitBtn}>Unlock Admin Access</button>
          </form>
          <div style={styles.divider}><span>OR</span></div>
          <button onClick={() => setAuthStatus('guest')} style={styles.guestBtn}><User size={16} /> Enter as Guest</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        
        {/* --- HEADER --- */}
        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logoBox}><Gamepad2 size={24} color="#fff" /></div>
            <div>
              <h1 style={styles.logoText}>GameVault <span style={styles.proBadge}>PRO</span></h1>
              <p style={styles.creatorTag}>SYSTEM ARCHITECT: <span style={{color: '#0f172a'}}>SENIOR SOFTWARE ENGINEER SHIFANTH JASIM</span></p>
            </div>
          </div>
          
          <div style={styles.analyticsGrid}>
            <div style={styles.statBox}><span style={styles.statLabel}>Grand Total</span><h2 style={{...styles.statValue, color:'#10b981'}}>Rs. {(stats.games+stats.hardware).toLocaleString()}</h2></div>
            <div style={styles.statBox}><span style={styles.statLabel}>Inventory</span><p style={styles.statDetail}>Games: Rs. {stats.games.toLocaleString()}</p><p style={styles.statDetail}>HW: Rs. {stats.hardware.toLocaleString()}</p></div>
            <div style={styles.statBox}><span style={styles.statLabel}>Logistics</span><p style={{...styles.statDetail, color:'#3b82f6'}}>Shipped Amt: Rs. {stats.shipped.toLocaleString()}</p></div>
          </div>
          <button onClick={() => {setAuthStatus('logged-out'); localStorage.removeItem('axon_auth');}} style={styles.logoutBtn}>Logout</button>
        </header>

        <div style={styles.mainLayout}>
          
          <section>
            {authStatus === 'admin' ? (
              <div style={styles.card}>
                <div style={styles.tabHeader}>
                  <button onClick={() => {setActiveTab('Games'); resetForm();}} style={activeTab === 'Games' ? styles.activeTab : styles.tab}>Software</button>
                  <button onClick={() => {setActiveTab('Hardware'); resetForm();}} style={activeTab === 'Hardware' ? styles.activeTab : styles.tab}>Hardware</button>
                </div>
                
                <div style={styles.searchWrapper}>
                  <div style={styles.searchBar}><Search size={14} color="#94a3b8" /><input style={styles.searchInput} placeholder="Auto-fill from Library..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                  {searchTerm && libraryResults.length > 0 && (
                    <div style={styles.scrollDropdown}>
                      {libraryResults.map((item, i) => (
                        <div key={i} style={styles.dropdownItem} onClick={() => selectItem(item)}><b>{item.title}</b><br/><small>{item.studio}</small></div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                  <input style={styles.input} placeholder="Title" value={activeTab === 'Games' ? formData.title : formData.name} onChange={e => setFormData({...formData, [activeTab === 'Games'?'title':'name']: e.target.value})} />
                  <div style={styles.row}>
                    <input style={styles.input} placeholder="Price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    <input style={styles.input} placeholder="Ship" type="number" value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} />
                  </div>
                  <div style={styles.row}>
                    <input style={styles.input} placeholder="Progress %" type="number" value={formData.progress} onChange={e => setFormData({...formData, progress: e.target.value})} />
                    <select style={styles.input} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="Paid">Received</option><option value="Shipping">Shipping</option><option value="Pending">Wishlist</option></select>
                  </div>
                  <button type="submit" style={styles.submitBtn}>{editingId ? 'Update Asset' : `Add ${activeTab}`}</button>
                  {editingId && <button onClick={resetForm} style={styles.cancelBtn}>Cancel</button>}
                </form>
              </div>
            ) : (
              <div style={styles.guestCard}>
                <div style={styles.guestIconBox}><ShieldCheck size={32} color="#10b981" /></div>
                <h3 style={styles.guestTitle}>Observer Dashboard</h3>
                <p style={styles.guestText}>Live synchronization of Shifanth Jasim's collection.</p>
                <div style={styles.guestMetrics}>
                   <div style={styles.metricItem}><Activity size={14}/> <span>Verified: {stats.totalCount} Units</span></div>
                   <div style={styles.metricItem}><Code size={14}/> <span>Senior Software Engineer</span></div>
                </div>
              </div>
            )}
          </section>

          <section>
            <div style={styles.tableCard}>
                {Object.keys(getGroupedData()).map(maker => (
                  <div key={maker}>
                    <div style={styles.makerHeader}><Landmark size={12}/> {maker}</div>
                    {getGroupedData()[maker].map(item => (
                      <div key={item.id || item._id} style={styles.tableRow}>
                        <div style={styles.gameInfo}>
                          <div style={{...styles.avatar, backgroundColor: item.status==='Shipping'?'#dbeafe':'#f1f5f9'}}>{item.status==='Shipping'?<Truck size={14} color="#3b82f6"/>:(item.title||item.name).charAt(0)}</div>
                          <div>
                            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                <b>{item.title || item.name}</b>
                                {activeTab === 'Games' && <span style={styles.marketTag}><Globe size={10}/> Intel</span>}
                            </div>
                            {activeTab === 'Games' && item.status === 'Paid' && (
                              <div style={styles.progressTrack}><div style={{...styles.progressFill, width: `${item.progress || 0}%`}}></div></div>
                            )}
                            <small style={{color:item.status==='Shipping'?'#3b82f6':'#64748b', fontWeight:'700'}}>{item.status}</small>
                          </div>
                        </div>
                        <div style={styles.priceArea}>
                          <b>Rs. {calc(item).toLocaleString()}</b>
                          {authStatus==='admin' && <Edit3 size={14} style={{cursor:'pointer', color:'#cbd5e1'}} onClick={()=>{setEditingId(item.id || item._id); setFormData(item); window.scrollTo(0,0);}}/>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// --- MASTER STYLES ---
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '15px', fontFamily: '"Inter", sans-serif' },
  content: { maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' },
  brand: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoBox: { backgroundColor: '#0f172a', padding: '10px', borderRadius: '12px', display: 'inline-block' },
  logoText: { fontSize: '22px', fontWeight: '900', margin: 0 },
  proBadge: { fontSize: '9px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '5px' },
  creatorTag: { fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginTop: '4px', fontWeight: '700' },
  analyticsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' },
  statBox: { backgroundColor: '#fff', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  statLabel: { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  statValue: { fontSize: '24px', fontWeight: '900', margin: '5px 0' },
  statDetail: { fontSize: '11px', fontWeight: '700', color: '#475569', margin: '2px 0' },
  mainLayout: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', position: 'sticky', top: '20px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', boxSizing: 'border-box', marginBottom: '10px' },
  submitBtn: { width: '100%', backgroundColor: '#0f172a', color: '#fff', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' },
  cancelBtn: { width: '100%', background: '#f1f5f9', color: '#64748b', padding: '10px', borderRadius: '12px', border: 'none', marginTop: '5px', cursor: 'pointer' },
  tabHeader: { display: 'flex', gap: '5px', marginBottom: '15px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '10px' },
  tab: { flex: 1, padding: '10px', border: 'none', background: 'none', fontSize: '12px', fontWeight: '600', cursor:'pointer' },
  activeTab: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#fff', borderRadius: '8px', fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  tableCard: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  makerHeader: { backgroundColor: '#f8fafc', padding: '12px 20px', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', display:'flex', alignItems:'center', gap:'8px' },
  tableRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  gameInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' },
  progressTrack: { width: '80px', height: '4px', backgroundColor: '#f1f5f9', borderRadius: '10px', marginTop: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10b981' },
  marketTag: { backgroundColor: '#f0fdf4', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' },
  priceArea: { display: 'flex', alignItems: 'center', gap: '15px' },
  loginOverlay: { height: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' },
  loginCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '32px', width: '100%', maxWidth: '380px', textAlign: 'center' },
  guestCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '28px', border: '1px solid #e2e8f0', textAlign: 'center' },
  guestIconBox: { backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '20px', display: 'inline-block', marginBottom: '15px' },
  guestTitle: { fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: '0 0 10px 0' },
  guestText: { fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: '0 0 20px 0' },
  guestMetrics: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' },
  metricItem: { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontSize:'12px', fontWeight:'700', color:'#475569', backgroundColor:'#f8fafc', padding:'8px', borderRadius:'10px' },
  searchWrapper: { position: 'relative', marginBottom: '15px' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', width: '100%', fontSize: '14px' },
  scrollDropdown: { position: 'absolute', top: '55px', width: '100%', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', zIndex: 100 },
  dropdownItem: { padding: '12px', fontSize: '12px', borderBottom: '1px solid #f1f5f9', cursor:'pointer' },
  row: { display:'flex', gap:'10px' },
  logoutBtn: { padding: '8px 15px', borderRadius: '10px', border: '1px solid #fee2e2', color: '#ef4444', background: '#fff', fontSize: '11px', fontWeight: '700', cursor:'pointer' },
  divider: { margin: '20px 0', color: '#cbd5e1', fontSize: '10px', fontWeight: '800' },
  guestBtn: { width: '100%', marginTop: '10px', padding: '12px', border: 'none', background: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer' }
};

if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
  styles.analyticsGrid.gridTemplateColumns = 'repeat(3, 1fr)';
  styles.mainLayout.display = 'grid';
  styles.mainLayout.gridTemplateColumns = '350px 1fr';
  styles.header.flexDirection = 'row';
  styles.header.justifyContent = 'space-between';
}