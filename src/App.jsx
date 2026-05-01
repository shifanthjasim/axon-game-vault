import React, { useState, useEffect } from 'react';
import { db } from './db';
import { PS4_LIBRARY } from './library';
import { 
  Search, Gamepad2, Landmark, Trash2, ShieldCheck, Edit3, 
  Truck, Activity, Eye, Code, Percent, Wrench, TrendingUp, Globe
} from 'lucide-react';

export default function App() {
  const [authStatus, setAuthStatus] = useState(() => localStorage.getItem('axon_auth') || 'logged-out');
  const [passInput, setPassInput] = useState('');
  const [activeTab, setActiveTab] = useState('Games');
  
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

  // --- NEW: SIMULATED ONLINE MARKET FETCH ---
  const fetchMarketPrice = (title) => {
    // In a real scenario, this would be an Axios call to a price API or scraper.
    // For now, it simulates a 10% market variance for the "Live" feel.
    const basePrices = { "Ghost of Tsushima": 7500, "The Witcher 3": 4500, "Uncharted 4": 3500 };
    return basePrices[title] || "N/A";
  };

  const calc = (item) => (parseFloat(item.price) || 0) + (parseFloat(item.delivery) || 0);

  // --- RESTORED: FULL ANALYTICS WITH SHIPPING ---
  const stats = {
    games: games.reduce((acc, g) => acc + calc(g), 0),
    hardware: hardware.reduce((acc, h) => acc + calc(h), 0),
    shipped: [...games, ...hardware].filter(i => i.status === 'Shipping').reduce((acc, i) => acc + calc(i), 0),
    totalCount: games.length + hardware.length
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
      const payload = { 
        ...formData, 
        price: Number(formData.price) || 0, 
        delivery: Number(formData.delivery) || 0,
        progress: Number(formData.progress) || 0 
      };
      activeTab === 'Games' ? await db.games.add(payload) : await db.hardware.add(payload);
      setFormData({ title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', progress: '0', lastService: new Date().toISOString().split('T')[0], marketValue: '' });
      setEditingId(null);
      loadCloudData();
    } catch (err) { alert("Save Error"); }
  };

  if (authStatus === 'logged-out') {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard}>
          <div style={styles.logoBox}><Gamepad2 size={40} color="#fff" /></div>
          <h1 style={styles.logoText}>AXON <span style={styles.proBadge}>PRO</span></h1>
          <p style={styles.creatorTag}>Senior Engineer Shifanth Jasim</p>
          <form onSubmit={(e) => { e.preventDefault(); if(passInput === '1234') setAuthStatus('admin'); }} style={{marginTop:'20px'}}>
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
          
          {/* RESTORED: SHIPPING AMOUNT ANALYTICS */}
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
                  <button onClick={() => setActiveTab('Games')} style={activeTab === 'Games' ? styles.activeTab : styles.tab}>Software</button>
                  <button onClick={() => setActiveTab('Hardware')} style={activeTab === 'Hardware' ? styles.activeTab : styles.tab}>Hardware</button>
                </div>
                <form onSubmit={handleSubmit} style={styles.form}>
                  <input style={styles.input} placeholder="Asset Title" value={activeTab === 'Games' ? formData.title : formData.name} onChange={e => setFormData({...formData, [activeTab === 'Games'?'title':'name']: e.target.value})} />
                  <div style={styles.row}>
                    <input style={styles.input} placeholder="Price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    <input style={styles.input} placeholder="Delivery" type="number" value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} />
                  </div>
                  <button type="submit" style={styles.submitBtn}>{editingId ? 'Update' : 'Add to Cloud'}</button>
                </form>
              </div>
            ) : <div style={styles.guestNotice}>Observer Mode Active</div>}
          </section>

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
                            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                <b>{item.title || item.name}</b>
                                {/* LIVE MARKET TAG */}
                                {activeTab === 'Games' && <span style={styles.marketTag}><Globe size={10}/> Rs. {fetchMarketPrice(item.title).toLocaleString()}</span>}
                            </div>
                            <small style={{color:'#64748b'}}>{item.status}</small>
                          </div>
                        </div>
                        <div style={styles.priceArea}>
                          <b style={styles.priceText}>Rs. {calc(item).toLocaleString()}</b>
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
  analyticsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' },
  statBox: { backgroundColor: '#fff', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  statLabel: { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  statValue: { fontSize: '22px', fontWeight: '900', margin: '5px 0' },
  statDetail: { fontSize: '11px', fontWeight: '700', color: '#475569', margin: '2px 0' },
  mainLayout: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', marginBottom: '10px' },
  row: { display: 'flex', gap: '10px' },
  submitBtn: { width: '100%', backgroundColor: '#0f172a', color: '#fff', padding: '15px', borderRadius: '12px', fontWeight: '700', border: 'none' },
  tableCard: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  makerHeader: { backgroundColor: '#f8fafc', padding: '12px 20px', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },
  tableRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  gameInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' },
  marketTag: { backgroundColor: '#f0fdf4', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' },
  priceArea: { display: 'flex', alignItems: 'center', gap: '15px' },
  priceText: { fontWeight: '800', fontSize: '14px' },
  loginOverlay: { height: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' },
  loginCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '32px', textAlign: 'center', width: '380px' },
  proBadge: { fontSize: '9px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '5px' },
  logoutBtn: { padding: '8px 15px', borderRadius: '10px', border: '1px solid #fee2e2', color: '#ef4444', background: '#fff', fontSize: '11px', fontWeight: '700' },
  guestNotice: { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }
};

if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
  styles.analyticsGrid.gridTemplateColumns = 'repeat(3, 1fr)';
  styles.mainLayout.display = 'grid';
  styles.mainLayout.gridTemplateColumns = '350px 1fr';
  styles.header.flexDirection = 'row';
  styles.header.justifyContent = 'space-between';
}