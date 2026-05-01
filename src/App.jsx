import React, { useState, useEffect } from 'react';
import { db } from './db';
import { PS4_LIBRARY } from './library';
import { 
  Search, Gamepad2, Landmark, Trash2, 
  Lock, User, Archive, Download, ShieldCheck, Edit3, Truck, Clock
} from 'lucide-react';

export default function App() {
  // --- PERSISTENT AUTHENTICATION ---
  const [authStatus, setAuthStatus] = useState(() => {
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

  // --- ANALYTICS & SORTING LOGIC ---
  const calc = (item) => (parseFloat(item.price) || 0) + (parseFloat(item.delivery) || 0);
  
  const stats = {
    games: games.reduce((acc, g) => acc + calc(g), 0),
    hardware: hardware.reduce((acc, h) => acc + calc(h), 0),
    shipped: [...games, ...hardware].filter(i => i.status === 'Shipping').reduce((acc, i) => acc + calc(i), 0),
    received: [...games, ...hardware].filter(i => i.status === 'Paid').reduce((acc, i) => acc + calc(i), 0)
  };

  // --- CATEGORIZATION & STATUS PRIORITY ---
  const getGroupedData = () => {
    const items = activeTab === 'Games' ? games : hardware;
    
    // Sort logic: Shipping/Pending first, then Paid
    const sortedItems = [...items].sort((a, b) => {
      const priority = { 'Shipping': 1, 'Pending': 2, 'Paid': 3 };
      return (priority[a.status] || 4) - (priority[b.status] || 4);
    });

    return sortedItems.reduce((groups, item) => {
      const maker = item.studio || 'Other';
      if (!groups[maker]) groups[maker] = [];
      groups[maker].push(item);
      return groups;
    }, {});
  };

  const groupedData = getGroupedData();

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

  if (authStatus === 'logged-out') {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard}>
          <div style={styles.logoBox}><Gamepad2 size={40} color="#fff" /></div>
          <h1 style={styles.logoText}>AXON <span style={styles.proBadge}>PRO</span></h1>
          <form onSubmit={(e) => { e.preventDefault(); if(passInput === '1234') setAuthStatus('admin'); }} style={{width:'100%', marginTop:'20px'}}>
            <input type="password" style={styles.input} placeholder="Architect Code" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button type="submit" style={styles.submitBtn}>Unlock System</button>
          </form>
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
              <h2 style={{...styles.statValue, color: '#10b981'}}>Rs. {(stats.games + stats.hardware).toLocaleString()}</h2>
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
            ) : <div style={styles.guestNotice}>Guest Mode Active</div>}
          </section>

          <section>
            <div style={styles.tableCard}>
                {Object.keys(groupedData).map(maker => (
                  <div key={maker}>
                    <div style={styles.makerHeader}><Landmark size={12}/> {maker}</div>
                    {groupedData[maker].map(item => (
                      <div key={item.id || item._id} style={styles.tableRow}>
                        <div style={styles.gameInfo}>
                          <div style={{...styles.avatar, backgroundColor: item.status === 'Shipping' ? '#dbeafe' : '#f1f5f9'}}>
                            {item.status === 'Shipping' ? <Truck size={14} color="#3b82f6"/> : (item.title || item.name).charAt(0)}
                          </div>
                          <div>
                            <b>{item.title || item.name}</b><br/>
                            <small style={{color: item.status === 'Shipping' ? '#3b82f6' : '#64748b', fontWeight:'700'}}>{item.status}</small>
                          </div>
                        </div>
                        <div style={styles.priceArea}>
                            <b>Rs. {calc(item).toLocaleString()}</b>
                            {authStatus === 'admin' && <Edit3 size={14} style={{cursor:'pointer', color:'#cbd5e1'}} onClick={() => {setEditingId(item.id); setFormData(item); window.scrollTo(0,0);}}/>}
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

// --- STYLES (Includes Multi-View Desktop & iPhone 14 Optimization) ---[cite: 1]
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '15px', fontFamily: '"Inter", sans-serif' },
  content: { maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' },
  analyticsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '12px' },
  statBox: { backgroundColor: '#fff', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  statLabel: { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  statValue: { fontSize: '24px', fontWeight: '900', margin: '5px 0' },
  statDetail: { fontSize: '11px', fontWeight: '700', color: '#475569', margin: '2px 0' },
  loginOverlay: { height: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' },
  loginCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '30px', textAlign: 'center', width: '100%', maxWidth: '350px' },
  logoBox: { backgroundColor: '#0f172a', padding: '10px', borderRadius: '12px', display: 'inline-block' },
  logoText: { fontSize: '22px', fontWeight: '900', margin: '10px 0' },
  proBadge: { fontSize: '9px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '5px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', boxSizing: 'border-box', marginBottom: '10px' },
  submitBtn: { width: '100%', backgroundColor: '#0f172a', color: '#fff', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' },
  guestBtn: { width: '100%', marginTop: '10px', padding: '12px', border: 'none', background: 'none', color: '#64748b', fontWeight: '600' },
  divider: { margin: '20px 0', color: '#cbd5e1', fontSize: '10px', fontWeight: '800' },
  mainLayout: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  tabHeader: { display: 'flex', gap: '5px', marginBottom: '15px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '10px' },
  tab: { flex: 1, padding: '10px', border: 'none', background: 'none', fontSize: '12px', fontWeight: '600' },
  activeTab: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#fff', borderRadius: '8px', fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  tableCard: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  makerHeader: { backgroundColor: '#f8fafc', padding: '12px 20px', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', display:'flex', alignItems:'center', gap:'8px' },
  tableRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  gameInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' },
  priceArea: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoutBtn: { padding: '8px 15px', borderRadius: '10px', border: '1px solid #fee2e2', color: '#ef4444', background: '#fff', fontSize: '11px', fontWeight: '700' },
  guestNotice: { backgroundColor: '#fff', padding: '30px', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0', color:'#64748b', fontWeight:'700' },
  form: { display:'flex', flexDirection:'column' },
  row: { display:'flex', gap:'10px' }
};

if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
  styles.analyticsGrid.gridTemplateColumns = 'repeat(3, 1fr)';
  styles.mainLayout.display = 'grid';
  styles.mainLayout.gridTemplateColumns = '350px 1fr';
  styles.header.flexDirection = 'row';
  styles.header.justifyContent = 'space-between';
}