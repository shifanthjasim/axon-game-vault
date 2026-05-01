import React, { useState, useEffect, useCallback } from 'react';
import { db } from './db';
import { PS4_LIBRARY } from './library';
import { 
  Search, Gamepad2, Landmark, Trash2, ShieldCheck, Edit3, 
  Truck, Activity, Eye, Code, Globe, Plus, Lock, Calendar, 
  TrendingUp, TrendingDown, BarChart3, Layers, Box
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

  useEffect(() => { localStorage.setItem('axon_auth', authStatus); }, [authStatus]);

  const loadCloudData = useCallback(async () => {
    try {
      const [gData, hData] = await Promise.all([db.games.toArray(), db.hardware.toArray()]);
      setGames(gData || []);
      setHardware(hData || []);
    } catch (err) { console.error("Cloud Sync Error:", err); }
  }, []);

  useEffect(() => { if (authStatus !== 'logged-out') loadCloudData(); }, [authStatus, loadCloudData]);

  const selectItem = (item) => {
    setFormData({ 
      ...formData, 
      [activeTab === 'Games'?'title':'name']: item.title, 
      studio: item.studio 
    });
    setSearchTerm('');
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this asset?")) return;
    if (activeTab === 'Games') setGames(prev => prev.filter(g => (g.id || g._id) !== id));
    else setHardware(prev => prev.filter(h => (h.id || h._id) !== id));
    setTimeout(async () => {
      try {
        activeTab === 'Games' ? await db.games.delete(id) : await db.hardware.delete(id);
      } catch (err) { loadCloudData(); }
    }, 0);
  };

  const getManualEst = (title) => {
    const item = PS4_LIBRARY.find(i => i.title === title);
    return item ? (item.estPrice || 0) : 0;
  };

  const baseVal = (i) => parseFloat(i.price) || 0;
  const shipVal = (i) => parseFloat(i.delivery) || 0;
  const totalVal = (i) => baseVal(i) + shipVal(i);

  const stats = {
    totalValue: [...games, ...hardware].reduce((acc, i) => acc + totalVal(i), 0),
    shippedValue: [...games, ...hardware].filter(i => i.status === 'Shipping').reduce((acc, i) => acc + totalVal(i), 0),
    totalCount: games.length + hardware.length,
    gameCount: games.filter(g => g.status === 'Paid').length,
    wishlistCount: games.filter(g => g.status === 'Pending').length,
    shippingCount: games.filter(g => g.status === 'Shipping').length,
    marketYield: games.reduce((acc, g) => {
      const marketPrice = getManualEst(g.title);
      if (marketPrice === 0) return acc;
      return acc + (marketPrice - totalVal(g));
    }, 0)
  };

  const getGroupedData = () => {
    const items = activeTab === 'Games' ? games : hardware;
    const sorted = [...items].sort((a, b) => {
      const p = { 'Shipping': 1, 'Pending': 2, 'Paid': 3 };
      return (p[a.status] || 4) - (p[b.status] || 4);
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
          <div style={styles.loginLogoBox}><Box size={40} color="#60a5fa" /></div>
          <h1 style={styles.bloombergLogo}>AXON TERMINAL</h1>
          <p style={styles.creatorTag}>ACCESS LEVEL: SENIOR ENGINEER</p>
          <form onSubmit={(e) => { e.preventDefault(); if(passInput === '1234') setAuthStatus('admin'); }} style={{marginTop:'30px'}}>
            <input type="password" style={styles.bloomInput} placeholder="AUTH_KEY" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button type="submit" style={styles.bloomSubmit}>INITIALIZE SYSTEM</button>
          </form>
          <button onClick={() => setAuthStatus('guest')} style={styles.guestBtn}>CONTINUE AS OBSERVER</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <div style={styles.brandSection}>
            <div style={styles.logoBox}><BarChart3 size={20} color="#fff" /></div>
            <div>
              <h1 style={styles.logoText}>GAMEVAULT <span style={styles.proBadge}>PRO-LEVEL</span></h1>
              <p style={styles.creatorTag}>TERMINAL ARCHITECT: SHIFANTH JASIM</p>
            </div>
          </div>
          
          <div style={styles.analyticsGrid}>
            <div style={styles.bloomStatBox}>
              <span style={styles.bloomLabel}>TOTAL_PORTFOLIO_VALUE</span>
              <h2 style={styles.bloomValue}>LKR {stats.totalValue.toLocaleString()}</h2>
              <div style={styles.yieldRow}>
                {stats.marketYield >= 0 ? <TrendingUp size={12} color="#10b981"/> : <TrendingDown size={12} color="#ef4444"/>}
                <span style={{color: stats.marketYield >= 0 ? '#10b981' : '#ef4444', fontWeight: '800'}}>
                    {stats.marketYield >= 0 ? '+' : ''}{stats.marketYield.toLocaleString()} YIELD
                </span>
              </div>
            </div>
            
            <div style={styles.bloomStatBox}>
              <span style={styles.bloomLabel}>INVENTORY_INDEX</span>
              <div style={styles.indexGrid}>
                <div style={styles.indexItem}><span style={styles.miniLabel}>OWNED</span><b>{stats.gameCount}</b></div>
                <div style={styles.indexItem}><span style={styles.miniLabel}>LOGISTICS</span><b>{stats.shippingCount}</b></div>
                <div style={styles.indexItem}><span style={styles.miniLabel}>PENDING</span><b>{stats.wishlistCount}</b></div>
              </div>
            </div>
          </div>
          <button onClick={() => {setAuthStatus('logged-out'); localStorage.removeItem('axon_auth');}} style={styles.bloomLogout}>DISCONNECT</button>
        </header>

        <div style={styles.mainLayout}>
          <section>
            {authStatus === 'admin' ? (
              <div style={styles.bloomCard}>
                <div style={styles.tabHeader}>
                  <button onClick={() => setActiveTab('Games')} style={activeTab === 'Games' ? styles.bloomTabActive : styles.bloomTab}>SOFTWARE_ASSETS</button>
                  <button onClick={() => setActiveTab('Hardware')} style={activeTab === 'Hardware' ? styles.bloomTabActive : styles.bloomTab}>HARDWARE_ASSETS</button>
                </div>
                <div style={styles.searchWrapper}>
                    <input style={styles.bloomInput} placeholder="SEARCH_DATABASE..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    {searchTerm && PS4_LIBRARY.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 && (
                        <div style={styles.bloomDropdown}>{PS4_LIBRARY.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0,5).map((item, i) => (<div key={i} style={styles.bloomDropDownItem} onClick={() => selectItem(item)}>{item.title}</div>))}</div>
                    )}
                </div>
                <form onSubmit={handleSubmit} style={styles.form}>
                  <input style={styles.bloomInput} placeholder="ASSET_TITLE" value={activeTab === 'Games' ? formData.title : formData.name} onChange={e => setFormData({...formData, [activeTab === 'Games'?'title':'name']: e.target.value})} />
                  <div style={styles.row}>
                    <div style={{flex:1}}><label style={styles.miniLabel}>UNIT_PRICE</label><input style={styles.bloomInput} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                    <div style={{flex:1}}><label style={styles.miniLabel}>LOGISTICS</label><input style={styles.bloomInput} type="number" value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} /></div>
                  </div>
                  <select style={styles.bloomInput} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="Paid">RECEIVED</option><option value="Shipping">IN_TRANSIT</option><option value="Pending">WISHLIST</option></select>
                  <button type="submit" style={styles.bloomSubmit}>{editingId ? 'EXECUTE_UPDATE' : 'COMMIT_TO_CLOUD'}</button>
                </form>
              </div>
            ) : (
              <div style={styles.guestCard}>
                <ShieldCheck size={24} color="#10b981" />
                <h3 style={styles.guestTitle}>READ_ONLY_MODE</h3>
                <div style={styles.guestMetrics}>
                   <div style={styles.metricItem}>VERIFIED_ASSETS: {stats.totalCount}</div>
                   <div style={styles.metricItem}>SYSTEM_ARCHITECT: SHIFANTH JASIM</div>
                </div>
              </div>
            )}
          </section>

          <section>
            <div style={styles.bloomTable}>
                {Object.keys(getGroupedData()).map(maker => (
                  <div key={maker}>
                    <div style={styles.bloomMakerHeader}>{maker} // ASSET_GROUP</div>
                    {getGroupedData()[maker].map(item => (
                      <div key={item.id || item._id} style={styles.bloomRow}>
                        <div style={styles.assetCell}>
                          <div style={styles.statusIndicator} />
                          <div>
                            <div style={styles.titleFlex}>
                                <b style={{fontSize:'13px'}}>{(item.title || item.name).toUpperCase()}</b>
                                {getManualEst(item.title || item.name) > 0 && (
                                  <span style={{...styles.bloomYieldTag, color: (getManualEst(item.title || item.name) - totalVal(item)) >= 0 ? '#10b981' : '#ef4444'}}>
                                    [MARKET: {getManualEst(item.title || item.name).toLocaleString()}]
                                  </span>
                                )}
                            </div>
                            <code style={styles.bloomCode}>COST_BASIS: {baseVal(item).toLocaleString()} | LOG: {shipVal(item).toLocaleString()}</code>
                          </div>
                        </div>
                        <div style={styles.priceCell}>
                           <b style={{fontSize:'14px', color:'#1e293b'}}>LKR {totalVal(item).toLocaleString()}</b>
                           <span style={{...styles.statusTag, color: item.status==='Shipping'?'#3b82f6':item.status==='Pending'?'#f59e0b':'#64748b'}}>{item.status.toUpperCase()}</span>
                        </div>
                        {authStatus==='admin' && (
                            <div style={styles.actionCell}>
                                <Edit3 size={14} style={{cursor:'pointer', color:'#94a3b8'}} onClick={()=>{setEditingId(item.id || item._id); setFormData(item);}}/>
                                <Trash2 size={14} style={{cursor:'pointer', color:'#fca5a5'}} onClick={()=>handleDelete(item.id || item._id)}/>
                            </div>
                        )}
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
  container: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', padding: '20px', boxSizing: 'border-box' },
  content: { maxWidth: '1300px', margin: '0 auto' },
  header: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #1e293b', paddingBottom: '20px' },
  
  brandSection: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoBox: { backgroundColor: '#3b82f6', padding: '8px', borderRadius: '4px' },
  logoText: { fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '1px' },
  creatorTag: { fontSize: '9px', color: '#94a3b8', fontWeight: '800', letterSpacing: '1px' },
  
  analyticsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  bloomStatBox: { backgroundColor: '#1e293b', padding: '15px', borderLeft: '3px solid #3b82f6' },
  bloomLabel: { fontSize: '10px', color: '#64748b', fontWeight: '900' },
  bloomValue: { fontSize: '24px', fontWeight: '900', margin: '5px 0', color: '#fff' },
  yieldRow: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' },
  
  indexGrid: { display: 'flex', gap: '20px', marginTop: '10px' },
  indexItem: { display: 'flex', flexDirection: 'column' },
  miniLabel: { fontSize: '8px', color: '#64748b', fontWeight: '900' },
  
  mainLayout: { display: 'flex', flexDirection: 'column', gap: '30px' },
  bloomCard: { backgroundColor: '#1e293b', padding: '20px' },
  bloomInput: { width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '12px', marginBottom: '10px', borderRadius: '2px' },
  bloomSubmit: { width: '100%', backgroundColor: '#3b82f6', color: '#fff', padding: '12px', border: 'none', fontWeight: '900', fontSize: '12px', cursor: 'pointer', letterSpacing: '1px' },
  
  bloomTable: { backgroundColor: '#fff', color: '#1e293b', borderRadius: '4px', overflow: 'hidden' },
  bloomMakerHeader: { backgroundColor: '#f1f5f9', padding: '8px 15px', fontSize: '10px', fontWeight: '900', color: '#475569', borderBottom: '1px solid #e2e8f0' },
  bloomRow: { display: 'flex', padding: '12px 15px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', transition: 'background 0.2s' },
  assetCell: { flex: 1, display: 'flex', alignItems: 'center', gap: '12px' },
  statusIndicator: { width: '4px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '2px' },
  bloomCode: { fontSize: '10px', color: '#64748b', display: 'block', marginTop: '2px' },
  bloomYieldTag: { fontSize: '10px', fontWeight: '900', marginLeft: '8px' },
  priceCell: { width: '150px', textAlign: 'right', display: 'flex', flexDirection: 'column' },
  actionCell: { display: 'flex', gap: '15px', paddingLeft: '20px' },
  statusTag: { fontSize: '9px', fontWeight: '900' },

  loginOverlay: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  loginCard: { width: '320px', textAlign: 'center' },
  bloombergLogo: { fontSize: '24px', fontWeight: '900', color: '#fff', margin: '15px 0 5px 0' },
  bloomLogout: { backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', fontSize: '10px', fontWeight: '900', padding: '8px 15px', cursor: 'pointer' },
  
  tabHeader: { display: 'flex', gap: '2px', marginBottom: '15px' },
  bloomTab: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#0f172a', color: '#475569', fontSize: '10px', fontWeight: '900', cursor: 'pointer' },
  bloomTabActive: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#334155', color: '#fff', fontSize: '10px', fontWeight: '900' },
  
  searchWrapper: { position: 'relative' },
  bloomDropdown: { position: 'absolute', top: '40px', width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', zIndex: 10 },
  bloomDropDownItem: { padding: '10px', fontSize: '11px', borderBottom: '1px solid #334155', cursor: 'pointer', color: '#94a3b8' },
  proBadge: { backgroundColor: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '2px', fontSize: '9px' },
  row: { display: 'flex', gap: '10px' }
};

if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
  styles.mainLayout.display = 'grid';
  styles.mainLayout.gridTemplateColumns = '380px 1fr';
  styles.header.flexDirection = 'row';
  styles.header.justifyContent = 'space-between';
  styles.header.alignItems = 'center';
}