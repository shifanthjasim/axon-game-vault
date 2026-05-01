import React, { useState, useEffect } from 'react';
import { db } from './db';
import { PS4_LIBRARY } from './library';
import { 
  Search, Gamepad2, Landmark, Trash2, ShieldCheck, Edit3, 
  Truck, Activity, Eye, Code, Globe, Plus, DollarSign
} from 'lucide-react';

export default function App() {
  const [authStatus, setAuthStatus] = useState(() => localStorage.getItem('axon_auth') || 'logged-out');
  const [passInput, setPassInput] = useState('');
  const [activeTab, setActiveTab] = useState('Games');
  const [formData, setFormData] = useState({
    title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [games, setGames] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [marketIntel, setMarketIntel] = useState({});

  useEffect(() => { localStorage.setItem('axon_auth', authStatus); }, [authStatus]);

  const loadCloudData = async () => {
    try {
      const [gData, hData] = await Promise.all([db.games.toArray(), db.hardware.toArray()]);
      setGames(gData || []);
      setHardware(hData || []);
      // Auto-trigger market scan[cite: 2]
      gData.forEach(game => fetchLiveMarket(game.title));
    } catch (err) { console.error("Cloud Error:", err); }
  };

  useEffect(() => { if (authStatus !== 'logged-out') loadCloudData(); }, [authStatus]);

  const fetchLiveMarket = async (title) => {
    if (!title || marketIntel[title]) return; 
    try {
      const response = await fetch(`http://localhost:5001/api/market-intel?title=${encodeURIComponent(title)}`);
      const data = await response.json();
      setMarketIntel(prev => ({ ...prev, [title]: data }));
    } catch (err) { console.warn("Backend 5001 unreachable from Vercel[cite: 2]"); }
  };

  const selectItem = (item) => {
    setFormData({ ...formData, [activeTab === 'Games'?'title':'name']: item.title, studio: item.studio });
    setSearchTerm('');
    fetchLiveMarket(item.title);
  };

  // --- REPAIRED: OPTIMISTIC DELETE[cite: 2] ---
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this asset?")) return;
    
    // UI feedback first[cite: 2]
    if (activeTab === 'Games') setGames(prev => prev.filter(g => g.id !== id));
    else setHardware(prev => prev.filter(h => h.id !== id));

    try {
      activeTab === 'Games' ? await db.games.delete(id) : await db.hardware.delete(id);
    } catch (err) {
      loadCloudData(); // Revert on failure[cite: 2]
    }
  };

  const baseVal = (i) => parseFloat(i.price) || 0;
  const shipVal = (i) => parseFloat(i.delivery) || 0;
  const totalVal = (i) => baseVal(i) + shipVal(i);

  const stats = {
    games: games.reduce((acc, g) => acc + totalVal(g), 0),
    hardware: hardware.reduce((acc, h) => acc + totalVal(h), 0),
    shipped: [...games, ...hardware].filter(i => i.status === 'Shipping').reduce((acc, i) => acc + totalVal(i), 0),
  };

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
      if (editingId) {
        activeTab === 'Games' ? await db.games.update(editingId, payload) : await db.hardware.update(editingId, payload);
      } else {
        activeTab === 'Games' ? await db.games.add(payload) : await db.hardware.add(payload);
      }
      setFormData({ title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid' });
      setEditingId(null);
      loadCloudData();
    } catch (err) { alert("Save Error"); }
  };

  if (authStatus === 'logged-out') {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard}>
          <div style={styles.logoBox}><Gamepad2 size={40} color="#fff" /></div>
          <h1 style={styles.logoText}>AXON <span style={styles.proBadge}>GATEWAY</span></h1>
          <p style={styles.creatorTag}>Senior Engineer Shifanth Jasim</p>
          <form onSubmit={(e) => { e.preventDefault(); if(passInput === '1234') setAuthStatus('admin'); }} style={{marginTop:'25px'}}>
            <input type="password" style={styles.input} placeholder="Architect Code" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button type="submit" style={styles.submitBtn}>Unlock System</button>
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
          <div style={styles.analyticsGrid}>
            <div style={styles.statBox}><span style={styles.statLabel}>Grand Total</span><h2 style={{...styles.statValue, color:'#10b981'}}>Rs. {(stats.games+stats.hardware).toLocaleString()}</h2></div>
            <div style={styles.statBox}><span style={styles.statLabel}>Logistics</span><p style={{...styles.statDetail, color:'#3b82f6'}}>Shipped: Rs. {stats.shipped.toLocaleString()}</p></div>
          </div>
          <button onClick={() => {setAuthStatus('logged-out'); localStorage.removeItem('axon_auth');}} style={styles.logoutBtn}>Logout</button>
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
                  <div style={styles.searchBar}><Search size={14} color="#94a3b8" /><input style={styles.searchInput} placeholder="Auto-fill..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                  {searchTerm && PS4_LIBRARY.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 && (
                    <div style={styles.scrollDropdown}>{PS4_LIBRARY.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0,8).map((item, i) => (<div key={i} style={styles.dropdownItem} onClick={() => selectItem(item)}><b>{item.title}</b></div>))}</div>
                  )}
                </div>
                <form onSubmit={handleSubmit} style={styles.form}>
                  <input style={styles.input} placeholder="Title" value={activeTab === 'Games' ? formData.title : formData.name} onChange={e => setFormData({...formData, [activeTab === 'Games'?'title':'name']: e.target.value})} />
                  <div style={styles.row}>
                    <div style={{flex:1}}><label style={styles.miniLabel}>Price</label><input style={styles.input} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                    <div style={{flex:1}}><label style={styles.miniLabel}>Delivery</label><input style={styles.input} type="number" value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} /></div>
                  </div>
                  <select style={styles.input} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="Paid">Received</option><option value="Shipping">Shipping</option><option value="Pending">Wishlist</option></select>
                  <button type="submit" style={styles.submitBtn}>{editingId ? 'Update Asset' : 'Add to Cloud'}</button>
                </form>
              </div>
            ) : <div style={styles.guestCard}><ShieldCheck size={32} color="#10b981"/><p>Guest Dashboard</p></div>}
          </section>

          <section>
            <div style={styles.tableCard}>
                {Object.keys(groupedData).map(maker => (
                  <div key={maker}>
                    <div style={styles.makerHeader}><Landmark size={12}/> {maker}</div>
                    {groupedData[maker].map(item => (
                      <div key={item.id || item._id} style={styles.tableRow}>
                        <div style={styles.gameInfo}>
                          <div style={{...styles.avatar, backgroundColor: item.status==='Shipping'?'#dbeafe':'#f1f5f9'}}>{item.status==='Shipping'?<Truck size={14} color="#3b82f6"/>:(item.title||item.name).charAt(0)}</div>
                          <div>
                            <div style={styles.titleFlex}>
                                <b>{item.title || item.name}</b>
                                {activeTab === 'Games' && marketIntel[item.title] && (
                                  <span style={styles.marketTag}><Globe size={10}/> Market Intel: Rs. {marketIntel[item.title].amount.toLocaleString()}</span>
                                )}
                            </div>
                            <small style={styles.costBreakdown}>Base: {baseVal(item).toLocaleString()} + Del: {shipVal(item).toLocaleString()}</small>
                          </div>
                        </div>
                        <div style={styles.priceArea}>
                          <div style={styles.priceAlign}>
                             <b style={{fontSize:'14px'}}>Rs. {totalVal(item).toLocaleString()}</b>
                             <span style={{...styles.statusTag, color: item.status==='Shipping'?'#3b82f6':item.status==='Pending'?'#f59e0b':'#64748b'}}>{item.status}</span>
                          </div>
                          {authStatus==='admin' && (
                            <div style={{display:'flex', gap:'12px'}}>
                                <Edit3 size={15} style={{cursor:'pointer', color:'#cbd5e1'}} onClick={()=>{setEditingId(item.id || item._id); setFormData(item); window.scrollTo(0,0);}}/>
                                <Trash2 size={15} style={{cursor:'pointer', color:'#fca5a5'}} onClick={()=>handleDelete(item.id || item._id)}/>
                            </div>
                          )}
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
  logoBox: { backgroundColor: '#0f172a', padding: '10px', borderRadius: '12px', display: 'inline-block' },
  logoText: { fontSize: '22px', fontWeight: '900', margin: 0 },
  creatorTag: { fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginTop: '4px', fontWeight: '700' },
  analyticsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' },
  statBox: { backgroundColor: '#fff', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  statLabel: { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  statValue: { fontSize: '22px', fontWeight: '900', margin: '5px 0' },
  statDetail: { fontSize: '11px', fontWeight: '700', color: '#475569', margin: '2px 0' },
  mainLayout: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  miniLabel: { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display:'block' },
  input: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', boxSizing: 'border-box', marginBottom: '10px' },
  submitBtn: { width: '100%', backgroundColor: '#0f172a', color: '#fff', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' },
  tableCard: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  makerHeader: { backgroundColor: '#f8fafc', padding: '12px 20px', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', display:'flex', alignItems:'center', gap:'8px' },
  tableRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  gameInfo: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  titleFlex: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  costBreakdown: { fontSize: '10px', color: '#94a3b8', fontWeight: '600' },
  avatar: { width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' },
  marketTag: { backgroundColor: '#f0fdf4', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' },
  priceArea: { display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'right' },
  priceAlign: { display: 'flex', flexDirection: 'column' },
  statusTag: { fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' },
  loginOverlay: { height: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' },
  loginCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '32px', width: '100%', maxWidth: '380px', textAlign: 'center' },
  logoutBtn: { padding: '8px 15px', borderRadius: '10px', border: '1px solid #fee2e2', color: '#ef4444', background: '#fff', fontSize: '11px', fontWeight: '700', cursor:'pointer' },
  searchWrapper: { position: 'relative', marginBottom: '15px' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', width: '100%', fontSize: '14px' },
  scrollDropdown: { position: 'absolute', top: '55px', width: '100%', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', zIndex: 100 },
  dropdownItem: { padding: '12px', fontSize: '12px', borderBottom: '1px solid #f1f5f9', cursor:'pointer' },
  tabHeader: { display: 'flex', gap: '5px', marginBottom: '15px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '10px' },
  tab: { flex: 1, padding: '10px', border: 'none', background: 'none', fontSize: '12px', fontWeight: '600', cursor:'pointer' },
  activeTab: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#fff', borderRadius: '8px', fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  guestBtn: { background: 'none', border: 'none', color: '#64748b', marginTop: '10px', fontWeight: '600', cursor: 'pointer' },
  row: { display: 'flex', gap: '10px' },
  guestCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', textAlign: 'center' },
  proBadge: { fontSize: '9px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '5px' }
};

if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
  styles.analyticsGrid.gridTemplateColumns = 'repeat(2, 1fr)';
  styles.mainLayout.display = 'grid';
  styles.mainLayout.gridTemplateColumns = '350px 1fr';
  styles.header.flexDirection = 'row';
  styles.header.justifyContent = 'space-between';
}