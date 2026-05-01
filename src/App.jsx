import React, { useState, useEffect } from 'react';
import { db } from './db';
import { PS4_LIBRARY } from './library';
import { 
  Search, Gamepad2, Landmark, Trash2, 
  Lock, User, Archive, Download, ShieldCheck, Edit3
} from 'lucide-react';

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [authStatus, setAuthStatus] = useState('logged-out'); // 'logged-out', 'admin', 'guest'
  const [passInput, setPassInput] = useState('');

  // --- CORE APP STATE ---
  const [activeTab, setActiveTab] = useState('Games');
  const [formData, setFormData] = useState({
    title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', date: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [games, setGames] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- CLOUD SYNC ENGINE ---
  const loadCloudData = async () => {
    try {
      setLoading(true);
      const [gData, hData] = await Promise.all([
        db.games.toArray(),
        db.hardware.toArray()
      ]);
      setGames(gData || []);
      setHardware(hData || []);
    } catch (err) {
      console.error("AXON Cloud Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus !== 'logged-out') loadCloudData();
  }, [authStatus]);

  // --- LOGIN LOGIC ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === '1234') { 
      setAuthStatus('admin');
    } else {
      alert("Unauthorized Access Attempt");
    }
  };

  // --- FINANCIAL ANALYTICS ---
  const gameSpend = games.reduce((acc, g) => acc + Number(g.price || 0) + Number(g.delivery || 0), 0);
  const hardwareSpend = hardware.reduce((acc, h) => acc + Number(h.price || 0) + Number(h.delivery || 0), 0);
  const grandTotal = gameSpend + hardwareSpend;

  // --- VAULT LOGIC ---
  const currentInventory = activeTab === 'Games' ? games : hardware;
  const groupedData = currentInventory.reduce((groups, item) => {
    const maker = item.studio || 'Other';
    if (!groups[maker]) groups[maker] = [];
    groups[maker].push(item);
    return groups;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authStatus !== 'admin') return;
    try {
      if (activeTab === 'Games') {
        await db.games.add(formData);
      } else {
        await db.hardware.add(formData);
      }
      setFormData({ title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', date: new Date().toISOString().split('T')[0] });
      loadCloudData();
    } catch (err) {
      alert("Cloud Save Error");
    }
  };

  // --- RENDER: LOGIN GATEWAY ---
  if (authStatus === 'logged-out') {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard}>
          <div style={styles.logoBox}><Gamepad2 size={40} color="#fff" /></div>
          <h1 style={styles.logoText}>AXON <span style={styles.proBadge}>GATEWAY</span></h1>
          <p style={styles.creatorTag}>System Architect: Shifanth Jasim</p>
          
          <form onSubmit={handleLogin} style={{width:'100%', marginTop:'25px'}}>
            <label style={styles.label}>Access Code</label>
            <input 
              type="password" 
              style={styles.input} 
              placeholder="••••" 
              value={passInput} 
              onChange={e => setPassInput(e.target.value)} 
            />
            <button type="submit" style={styles.submitBtn}>Unlock Admin Access</button>
          </form>

          <div style={styles.divider}><span>SECURE GUEST ACCESS</span></div>
          
          <button onClick={() => setAuthStatus('guest')} style={styles.guestBtn}>
            <User size={16} /> View Collection (Read-Only)
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={styles.loading}>Decrypting Cloud Vault...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        
        {/* --- DYNAMIC HEADER --- */}
        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logoBox}><Gamepad2 size={26} color="#fff" /></div>
            <div>
              <h1 style={styles.logoText}>GameVault <span style={styles.proBadge}>PRO</span></h1>
              <p style={styles.creatorTag}>MODE: {authStatus.toUpperCase()}</p>
            </div>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.grandTotalCard}>
                <p style={styles.statLabel}>Vault Valuation</p>
                <h2 style={styles.statValue}>Rs. {grandTotal.toLocaleString()}</h2>
                <div style={styles.miniStatsRow}>
                  <span>Games: Rs. {gameSpend.toLocaleString()}</span>
                  <span>Hardware: Rs. {hardwareSpend.toLocaleString()}</span>
                </div>
            </div>
            <button onClick={() => setAuthStatus('logged-out')} style={styles.logoutBtn}>Logout</button>
          </div>
        </header>

        <div style={styles.mainLayout}>
          
          {/* --- LEFT: CONTROL PANEL --- */}
          <section>
            {authStatus === 'admin' ? (
              <div style={styles.card}>
                <div style={styles.tabHeader}>
                  <button onClick={() => setActiveTab('Games')} style={activeTab === 'Games' ? styles.activeTab : styles.tab}>Software</button>
                  <button onClick={() => setActiveTab('Hardware')} style={activeTab === 'Hardware' ? styles.activeTab : styles.tab}>Hardware</button>
                </div>
                <form onSubmit={handleSubmit} style={styles.form}>
                  <input style={styles.input} placeholder="Title / Name" value={activeTab === 'Games' ? formData.title : formData.name} onChange={e => setFormData({...formData, [activeTab === 'Games' ? 'title' : 'name']: e.target.value})} />
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
            ) : (
              <div style={styles.guestNotice}>
                <ShieldCheck size={40} color="#10b981" />
                <h3>Guest Mode Active</h3>
                <p>Viewing authorized collection only.</p>
              </div>
            )}
          </section>

          {/* --- RIGHT: VAULT VIEW --- */}
          <section>
            <div style={styles.sectionHeader}><Archive size={14}/> {activeTab.toUpperCase()} DATASET</div>
            <div style={styles.tableCard}>
                {Object.keys(groupedData).length === 0 ? <div style={styles.empty}>Vault Empty</div> : 
                  Object.keys(groupedData).map(maker => (
                    <div key={maker}>
                      <div style={styles.makerHeader}>{maker}</div>
                      {groupedData[maker].map(item => (
                        <div key={item.id} style={styles.tableRow}>
                          <div style={styles.gameInfo}>
                            <div style={styles.avatar}>{(item.title || item.name).charAt(0)}</div>
                            <div>
                                <b style={{fontSize:'14px'}}>{item.title || item.name}</b><br/>
                                <small style={{color:'#64748b', fontSize:'11px'}}>{item.status}</small>
                            </div>
                          </div>
                          <div style={styles.priceText}>Rs. {(Number(item.price) + Number(item.delivery)).toLocaleString()}</div>
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

// --- RESPONSIVE STYLING SYSTEM ---
const styles = {
  loginOverlay: { height: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' },
  loginCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '32px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '15px', fontFamily: '"Inter", sans-serif' },
  content: { maxWidth: '1100px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '100px', color: '#64748b', fontWeight: '600' },
  header: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' },
  headerRight: { display: 'flex', flexDirection: 'column', gap: '15px' },
  brand: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoBox: { backgroundColor: '#0f172a', padding: '12px', borderRadius: '15px', display: 'inline-block' },
  logoText: { fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-1px' },
  proBadge: { fontSize: '9px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '5px' },
  creatorTag: { fontSize: '10px', color: '#64748b', textTransform: 'uppercase', margin: '4px 0', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', boxSizing: 'border-box' },
  submitBtn: { width: '100%', backgroundColor: '#0f172a', color: '#fff', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' },
  guestBtn: { width: '100%', backgroundColor: '#f8fafc', color: '#475569', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  logoutBtn: { backgroundColor: '#fff', color: '#ef4444', padding: '10px 20px', borderRadius: '10px', border: '1px solid #fee2e2', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  divider: { margin: '20px 0', color: '#cbd5e1', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' },
  mainLayout: { display: 'flex', flexDirection: 'column', gap: '25px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  tabHeader: { display: 'flex', gap: '5px', marginBottom: '20px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  tab: { flex: 1, padding: '10px', border: 'none', backgroundColor: 'transparent', fontSize: '13px', fontWeight: '600' },
  activeTab: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: { display: 'flex', gap: '10px' },
  tableCard: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  makerHeader: { backgroundColor: '#f8fafc', padding: '10px 20px', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },
  tableRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #f1f5f9' },
  gameInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '32px', height: '32px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' },
  priceText: { fontSize: '15px', fontWeight: '800', color: '#1e293b' },
  grandTotalCard: { backgroundColor: '#fff', padding: '15px 20px', borderRadius: '20px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' },
  statValue: { color: '#10b981', margin: '5px 0', fontSize: '24px', fontWeight: '900' },
  statLabel: { fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', margin: 0, fontWeight: '800' },
  miniStatsRow: { display: 'flex', gap: '15px', fontSize: '10px', color: '#64748b', fontWeight: '600' },
  guestNotice: { backgroundColor: '#fff', padding: '30px', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0' },
  sectionHeader: { fontSize: '10px', fontWeight: '900', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' },
  empty: { padding: '40px', textAlign: 'center', color: '#94a3b8' }
};

// --- DESKTOP REFINEMENT (Laptop View) ---
if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
  styles.header.flexDirection = 'row';
  styles.header.justifyContent = 'space-between';
  styles.headerRight.flexDirection = 'row';
  styles.headerRight.alignItems = 'center';
  styles.grandTotalCard.width = '350px';
  styles.grandTotalCard.textAlign = 'right';
  styles.miniStatsRow.justifyContent = 'flex-end';
  styles.mainLayout.display = 'grid';
  styles.mainLayout.gridTemplateColumns = '350px 1fr';
}