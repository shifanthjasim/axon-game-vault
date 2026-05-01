import React, { useState, useEffect } from 'react';
import { db } from './db';
import { PS4_LIBRARY } from './library';
import { 
  Search, Gamepad2, Landmark, Trash2, 
  Lock, User, Archive, ShieldCheck, Edit3, Truck, Activity, Eye, Code
} from 'lucide-react';

export default function App() {
  // --- PERSISTENT AUTHENTICATION ---[cite: 1]
  const [authStatus, setAuthStatus] = useState(() => localStorage.getItem('axon_auth') || 'logged-out');
  const [passInput, setPassInput] = useState('');
  
  // --- CORE DATA STATES ---[cite: 1]
  const [activeTab, setActiveTab] = useState('Games');
  const [formData, setFormData] = useState({
    title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [games, setGames] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { localStorage.setItem('axon_auth', authStatus); }, [authStatus]);

  const loadCloudData = async () => {
    try {
      setLoading(true);
      const [gData, hData] = await Promise.all([db.games.toArray(), db.hardware.toArray()]);
      setGames(gData || []);
      setHardware(hData || []);
    } catch (err) { console.error("Cloud Error:", err); } finally { setLoading(false); }
  };

  useEffect(() => { if (authStatus !== 'logged-out') loadCloudData(); }, [authStatus]);

  // --- LOGIC: AUTO-FILL SEARCH ENGINE ---[cite: 1]
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

  // --- LOGIC: NaN-PROOF ANALYTICS ---[cite: 1]
  const calc = (item) => (parseFloat(item.price) || 0) + (parseFloat(item.delivery) || 0);

  const stats = {
    games: games.reduce((acc, g) => acc + calc(g), 0),
    hardware: hardware.reduce((acc, h) => acc + calc(h), 0),
    shipped: [...games, ...hardware].filter(i => i.status === 'Shipping').reduce((acc, i) => acc + calc(i), 0),
    totalCount: games.length + hardware.length
  };

  // --- LOGIC: CATEGORIZATION & SHIPPING PRIORITY ---[cite: 1]
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
      const payload = { ...formData, price: Number(formData.price) || 0, delivery: Number(formData.delivery) || 0 };
      activeTab === 'Games' ? await db.games.add(payload) : await db.hardware.add(payload);
      setFormData({ title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid' });
      setEditingId(null);
      loadCloudData();
    } catch (err) { alert("Save Error"); }
  };

  // --- LOGIN GATEWAY ---[cite: 1]
  if (authStatus === 'logged-out') {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard}>
          <div style={styles.logoBox}><Gamepad2 size={40} color="#fff" /></div>
          <h1 style={styles.logoText}>AXON <span style={styles.proBadge}>GATEWAY</span></h1>
          <p style={styles.creatorTag}>Designed by Shifanth Jasim</p>
          <form onSubmit={(e) => { e.preventDefault(); if(passInput === '1234') setAuthStatus('admin'); }} style={{marginTop:'25px'}}>
            <input type="password" style={styles.input} placeholder="Architect Code" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button type="submit" style={styles.submitBtn}>Unlock Admin Access</button>
          </form>
          <div style={styles.divider}><span>OR</span></div>
          <button onClick={() => setAuthStatus('guest')} style={styles.guestBtn}><User size={16} /> Enter as Guest (Read-Only)</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        
        {/* --- HEADER (Featuring Shifanth Jasim) ---[cite: 1] */}
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
            <div style={styles.statBox}><span style={styles.statLabel}>Status</span><p style={{...styles.statDetail, color:'#3b82f6'}}>Shipping: Rs. {stats.shipped.toLocaleString()}</p></div>
          </div>
          <button onClick={() => {setAuthStatus('logged-out'); localStorage.removeItem('axon_auth');}} style={styles.logoutBtn}>Logout</button>
        </header>

        <div style={styles.mainLayout}>
          
          {/* --- LEFT: CONTROL PANEL / GUEST DASHBOARD ---[cite: 1] */}
          <section>
            {authStatus === 'admin' ? (
              <div style={styles.card}>
                <div style={styles.tabHeader}>
                  <button onClick={() => {setActiveTab('Games'); setEditingId(null);}} style={activeTab === 'Games' ? styles.activeTab : styles.tab}>Software</button>
                  <button onClick={() => {setActiveTab('Hardware'); setEditingId(null);}} style={activeTab === 'Hardware' ? styles.activeTab : styles.tab}>Hardware</button>
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
                  <div style={styles.row}><input style={styles.input} placeholder="Price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /><input style={styles.input} placeholder="Ship" type="number" value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} /></div>
                  <select style={styles.input} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="Paid">Received</option><option value="Shipping">Shipping</option><option value="Pending">Wishlist</option></select>
                  <button type="submit" style={styles.submitBtn}>{editingId ? 'Update Asset' : `Add ${activeTab}`}</button>
                </form>
              </div>
            ) : (
              /* --- REFINED GUEST DASHBOARD WITH CREATOR CREDIT ---[cite: 1] */
              <div style={styles.guestCard}>
                <div style={styles.guestIconBox}><ShieldCheck size={32} color="#10b981" /></div>
                <h3 style={styles.guestTitle}>Observer Dashboard</h3>
                <p style={styles.guestText}>Live synchronization of <b>Shifanth Jasim's</b> verified digital asset collection.[cite: 1]</p>
                
                <div style={styles.guestMetrics}>
                   <div style={styles.metricItem}><Activity size={14}/> <span>Verified: {stats.totalCount} Units</span></div>
                   <div style={styles.metricItem}><Code size={14}/> <span>Architect: Shifanth Jasim</span></div>
                   <div style={styles.metricItem}><Eye size={14}/> <span>Status: Read-Only</span></div>
                </div>

                <div style={styles.guestNotice}>
                  <Lock size={12} style={{marginRight:'5px'}}/> Modifications Restricted
                </div>
              </div>
            )}
          </section>

          {/* --- RIGHT: VAULT VIEW ---[cite: 1] */}
          <section>
            <div style={styles.sectionHeader}><Archive size={14}/> {activeTab.toUpperCase()} DATASET</div>
            <div style={styles.tableCard}>
                {Object.keys(getGroupedData()).length === 0 ? <div style={styles.empty}>Vault Empty</div> : 
                  Object.keys(getGroupedData()).map(maker => (
                    <div key={maker}>
                      <div style={styles.makerHeader}><Landmark size={12}/> {maker}</div>
                      {getGroupedData()[maker].map(item => (
                        <div key={item.id || item._id} style={styles.tableRow}>
                          <div style={styles.gameInfo}>
                            <div style={{...styles.avatar, backgroundColor: item.status==='Shipping'?'#dbeafe':'#f1f5f9'}}>{item.status==='Shipping'?<Truck size={14} color="#3b82f6"/>:(item.title||item.name).charAt(0)}</div>
                            <div><b>{item.title || item.name}</b><br/><small style={{color:item.status==='Shipping'?'#3b82f6':'#64748b', fontWeight:'700'}}>{item.status}</small></div>
                          </div>
                          <div style={styles.priceArea}><b>Rs. {calc(item).toLocaleString()}</b>{authStatus==='admin'&&<Edit3 size={14} style={{cursor:'pointer', color:'#cbd5e1'}} onClick={()=>{setEditingId(item.id); setFormData(item); window.scrollTo(0,0);}}/>}</div>
                        </div>
                      ))}
                    </div>
                  ))
                }
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- STYLES (Optimized for iPhone 14 & MacBook Pro) ---[cite: 1]
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '15px', fontFamily: '"Inter", sans-serif' },
  content: { maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' },
  analyticsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' },
  statBox: { backgroundColor: '#fff', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  statLabel: { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  statValue: { fontSize: '24px', fontWeight: '900', margin: '5px 0' },
  statDetail: { fontSize: '11px', fontWeight: '700', color: '#475569', margin: '2px 0' },
  loginOverlay: { height: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' },
  loginCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '32px', width: '100%', maxWidth: '380px', textAlign: 'center' },
  logoBox: { backgroundColor: '#0f172a', padding: '10px', borderRadius: '12px', display: 'inline-block' },
  logoText: { fontSize: '22px', fontWeight: '900', margin: '10px 0' },
  proBadge: { fontSize: '9px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '5px' },
  creatorTag: { fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginTop: '4px', fontWeight: '700' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', boxSizing: 'border-box', marginBottom: '10px' },
  submitBtn: { width: '100%', backgroundColor: '#0f172a', color: '#fff', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' },
  guestBtn: { width: '100%', marginTop: '10px', padding: '12px', border: 'none', background: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer' },
  mainLayout: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', position:'sticky', top:'20px' },
  guestCard: { backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter:'blur(10px)', padding: '30px', borderRadius: '28px', border: '1px solid #e2e8f0', textAlign: 'center' },
  guestIconBox: { backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '20px', display: 'inline-block', marginBottom: '15px' },
  guestTitle: { fontSize: '18px', fontWeight: '900', color: '#1e293b', margin: '0 0 10px 0' },
  guestText: { fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: '0 0 20px 0' },
  guestMetrics: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' },
  metricItem: { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontSize:'12px', fontWeight:'700', color:'#475569', backgroundColor:'#f8fafc', padding:'8px', borderRadius:'10px' },
  guestNotice: { fontSize:'10px', fontWeight:'800', color:'#94a3b8', textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center' },
  tabHeader: { display: 'flex', gap: '5px', marginBottom: '15px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '10px' },
  tab: { flex: 1, padding: '10px', border: 'none', background: 'none', fontSize: '12px', fontWeight: '600', cursor:'pointer' },
  activeTab: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#fff', borderRadius: '8px', fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  tableCard: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  makerHeader: { backgroundColor: '#f8fafc', padding: '12px 20px', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', display:'flex', alignItems:'center', gap:'8px' },
  tableRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  gameInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' },
  priceArea: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoutBtn: { padding: '8px 15px', borderRadius: '10px', border: '1px solid #fee2e2', color: '#ef4444', background: '#fff', fontSize: '11px', fontWeight: '700', cursor:'pointer' },
  searchWrapper: { position: 'relative', marginBottom: '15px' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', width: '100%', fontSize: '14px' },
  scrollDropdown: { position: 'absolute', top: '55px', width: '100%', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', zIndex: 100 },
  dropdownItem: { padding: '12px', fontSize: '12px', borderBottom: '1px solid #f1f5f9', cursor:'pointer' },
  form: { display:'flex', flexDirection:'column' },
  row: { display:'flex', gap:'10px' },
  sectionHeader: { fontSize: '10px', fontWeight: '900', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' },
  empty: { padding: '40px', textAlign: 'center', color: '#94a3b8' }
};

if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
  styles.analyticsGrid.gridTemplateColumns = 'repeat(3, 1fr)';
  styles.mainLayout.display = 'grid';
  styles.mainLayout.gridTemplateColumns = '350px 1fr';
  styles.header.flexDirection = 'row';
  styles.header.justifyContent = 'space-between';
}