import React, { useState, useEffect } from 'react';
import { db } from './db';
import { PS4_LIBRARY } from './library';
import { 
  Search, Gamepad2, Landmark, Trash2, ShieldCheck, Edit3, 
  Truck, Activity, Eye, Code, Percent, Wrench, TrendingUp
} from 'lucide-react';

export default function App() {
  const [authStatus, setAuthStatus] = useState(() => localStorage.getItem('axon_auth') || 'logged-out');
  const [passInput, setPassInput] = useState('');
  const [activeTab, setActiveTab] = useState('Games');
  
  // UPDATED SCHEMA: Added progress, lastService, and marketValue
  const [formData, setFormData] = useState({
    title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', 
    status: 'Paid', progress: '0', lastService: new Date().toISOString().split('T')[0], marketValue: ''
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
    } catch (err) { console.error("Sync Error:", err); } finally { setLoading(false); }
  };

  useEffect(() => { if (authStatus !== 'logged-out') loadCloudData(); }, [authStatus]);

  // LOGIC: SEARCH & AUTO-FILL
  const libraryResults = PS4_LIBRARY.filter(item => {
    if (!searchTerm) return false;
    const matches = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return activeTab === 'Games' ? (matches && !item.type) : (matches && item.type);
  }).slice(0, 5);

  const selectItem = (item) => {
    setFormData({ ...formData, [activeTab === 'Games' ? 'title' : 'name']: item.title, studio: item.studio });
    setSearchTerm('');
  };

  const calc = (item) => (parseFloat(item.price) || 0) + (parseFloat(item.delivery) || 0);

  // LOGIC: SORTING (SHIPPING FIRST)
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
      const payload = { 
        ...formData, 
        price: Number(formData.price) || 0, 
        delivery: Number(formData.delivery) || 0,
        progress: Number(formData.progress) || 0 
      };
      activeTab === 'Games' ? await db.games.add(payload) : await db.hardware.add(payload);
      resetForm();
      loadCloudData();
    } catch (err) { alert("Save Error"); }
  };

  const resetForm = () => {
    setFormData({ title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', progress: '0', lastService: new Date().toISOString().split('T')[0], marketValue: '' });
    setEditingId(null);
  };

  if (authStatus === 'logged-out') {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard}>
          <div style={styles.logoBox}><Gamepad2 size={40} color="#fff" /></div>
          <h1 style={styles.logoText}>AXON <span style={styles.proBadge}>GATEWAY</span></h1>
          <p style={styles.creatorTag}>Senior Engineer Shifanth Jasim</p>
          <form onSubmit={(e) => { e.preventDefault(); if(passInput === '1234') setAuthStatus('admin'); }} style={{marginTop:'20px'}}>
            <input type="password" style={styles.input} placeholder="Architect Code" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button type="submit" style={styles.submitBtn}>Unlock Admin Access</button>
          </form>
          <button onClick={() => setAuthStatus('guest')} style={styles.guestBtn}>Enter as Guest</button>
        </div>
      </div>
    );
  }

  const groupedData = getGroupedData();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logoBox}><Gamepad2 size={24} color="#fff" /></div>
            <div>
              <h1 style={styles.logoText}>GameVault <span style={styles.proBadge}>PRO</span></h1>
              <p style={styles.creatorTag}>SYSTEM ARCHITECT: <span style={{color: '#0f172a'}}>SENIOR SOFTWARE ENGINEER SHIFANTH JASIM</span></p>
            </div>
          </div>
          <button onClick={() => {setAuthStatus('logged-out'); localStorage.removeItem('axon_auth');}} style={styles.logoutBtn}>Logout</button>
        </header>

        <div style={styles.mainLayout}>
          {/* CONTROL PANEL */}
          <section>
            {authStatus === 'admin' ? (
              <div style={styles.card}>
                <div style={styles.tabHeader}>
                  <button onClick={() => setActiveTab('Games')} style={activeTab === 'Games' ? styles.activeTab : styles.tab}>Software</button>
                  <button onClick={() => setActiveTab('Hardware')} style={activeTab === 'Hardware' ? styles.activeTab : styles.tab}>Hardware</button>
                </div>
                
                <div style={styles.searchWrapper}>
                  <div style={styles.searchBar}><Search size={14} color="#94a3b8" /><input style={styles.searchInput} placeholder="Auto-fill..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                  {searchTerm && libraryResults.length > 0 && (
                    <div style={styles.scrollDropdown}>
                      {libraryResults.map((item, i) => (
                        <div key={i} style={styles.dropdownItem} onClick={() => selectItem(item)}><b>{item.title}</b></div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                  <input style={styles.input} placeholder="Title" value={activeTab === 'Games' ? formData.title : formData.name} onChange={e => setFormData({...formData, [activeTab === 'Games'?'title':'name']: e.target.value})} />
                  
                  {/* PROGRESS & MARKET INPUTS */}
                  <div style={styles.row}>
                    <div style={{flex:1}}><label style={styles.label}>{activeTab === 'Games' ? 'Progress %' : 'Market Value'}</label>
                    <input style={styles.input} type="number" value={activeTab === 'Games' ? formData.progress : formData.marketValue} onChange={e => setFormData({...formData, [activeTab === 'Games' ? 'progress' : 'marketValue']: e.target.value})} /></div>
                    <div style={{flex:1}}><label style={styles.label}>Price (LKR)</label>
                    <input style={styles.input} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                  </div>

                  <button type="submit" style={styles.submitBtn}>{editingId ? 'Update' : 'Add Asset'}</button>
                </form>
              </div>
            ) : (
              <div style={styles.guestCard}>
                <ShieldCheck size={32} color="#10b981" />
                <h3 style={{margin:'10px 0'}}>Observer Mode</h3>
                <p style={{fontSize:'12px', color:'#64748b'}}>Viewing Shifanth Jasim's Engineering Portfolio</p>
              </div>
            )}
          </section>

          {/* VAULT VIEW */}
          <section>
            <div style={styles.tableCard}>
                {Object.keys(groupedData).map(maker => (
                  <div key={maker}>
                    <div style={styles.makerHeader}>{maker}</div>
                    {groupedData[maker].map(item => (
                      <div key={item.id || item._id} style={styles.tableRow}>
                        <div style={styles.gameInfo}>
                          <div style={{...styles.avatar, backgroundColor: item.status==='Shipping'?'#dbeafe':'#f1f5f9'}}>{item.status==='Shipping'?<Truck size={14} color="#3b82f6"/>:(item.title||item.name).charAt(0)}</div>
                          <div>
                            <b>{item.title || item.name}</b><br/>
                            {/* CAMPAIGN PROGRESS BAR */}
                            {activeTab === 'Games' && item.status === 'Paid' && (
                              <div style={styles.progressTrack}><div style={{...styles.progressFill, width: `${item.progress || 0}%`}}></div></div>
                            )}
                            <small style={{color:item.status==='Shipping'?'#3b82f6':'#64748b'}}>{item.status}</small>
                          </div>
                        </div>
                        <div style={styles.priceArea}>
                          <div style={{textAlign:'right'}}>
                            <div style={styles.priceText}>Rs. {calc(item).toLocaleString()}</div>
                            {/* RESALE PREDICTOR INDICATOR */}
                            {item.marketValue && <small style={{color:'#10b981', fontSize:'10px'}}>Market: Rs. {Number(item.marketValue).toLocaleString()}</small>}
                          </div>
                          {authStatus==='admin' && <Edit3 size={14} style={{cursor:'pointer', color:'#cbd5e1'}} onClick={()=>{setEditingId(item.id); setFormData(item); window.scrollTo(0,0);}}/>}
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

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '15px', fontFamily: '"Inter", sans-serif' },
  content: { maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' },
  brand: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoBox: { backgroundColor: '#0f172a', padding: '10px', borderRadius: '12px' },
  logoText: { fontSize: '22px', fontWeight: '900', margin: 0 },
  creatorTag: { fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' },
  mainLayout: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  label: { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display:'block' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', boxSizing: 'border-box', marginBottom: '10px' },
  row: { display: 'flex', gap: '10px' },
  submitBtn: { width: '100%', backgroundColor: '#0f172a', color: '#fff', padding: '15px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', border: 'none' },
  tableCard: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  makerHeader: { backgroundColor: '#f8fafc', padding: '12px 20px', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },
  tableRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  gameInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' },
  progressTrack: { width: '80px', height: '4px', backgroundColor: '#f1f5f9', borderRadius: '10px', marginTop: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10b981' },
  priceArea: { display: 'flex', alignItems: 'center', gap: '15px' },
  priceText: { fontWeight: '800', fontSize: '14px' },
  loginOverlay: { height: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' },
  loginCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '32px', textAlign: 'center', width: '380px' },
  proBadge: { fontSize: '9px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '5px' },
  guestBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginTop: '10px', fontWeight: '600' },
  logoutBtn: { padding: '8px 15px', borderRadius: '10px', border: '1px solid #fee2e2', color: '#ef4444', background: '#fff', fontSize: '11px', fontWeight: '700', alignSelf: 'flex-start' },
  searchWrapper: { position: 'relative', marginBottom: '10px' },
  searchBar: { display:'flex', alignItems:'center', gap:'8px', backgroundColor:'#f8fafc', padding:'10px', borderRadius:'10px', border:'1px solid #e2e8f0' },
  searchInput: { border:'none', background:'none', outline:'none', fontSize:'14px', width:'100%' },
  scrollDropdown: { position: 'absolute', top: '45px', width: '100%', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', zIndex: 10, maxHeight: '150px', overflowY: 'auto' },
  dropdownItem: { padding: '10px', fontSize: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },
  guestCard: { textAlign: 'center', padding: '30px', backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }
};

if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
  styles.mainLayout.display = 'grid';
  styles.mainLayout.gridTemplateColumns = '350px 1fr';
  styles.header.flexDirection = 'row';
  styles.header.justifyContent = 'space-between';
}