import React, { useState, useEffect } from 'react';
import { db } from './db';
import { PS4_LIBRARY } from './library';
import { 
  Search, Gamepad2, Landmark, Trash2, 
  Lock, User, Archive, Download, ShieldCheck, Edit3
} from 'lucide-react';

export default function App() {
  // --- AUTH & CORE STATE ---
  const [authStatus, setAuthStatus] = useState('logged-out'); 
  const [passInput, setPassInput] = useState('');
  const [activeTab, setActiveTab] = useState('Games');
  const [formData, setFormData] = useState({
    title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', date: new Date().toISOString().split('T')[0]
  });
  
  // --- RESTORED: SEARCH & EDIT STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [games, setGames] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCloudData = async () => {
    try {
      setLoading(true);
      const [gData, hData] = await Promise.all([db.games.toArray(), db.hardware.toArray()]);
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

  // --- RESTORED: NaN PROOF CALCULATION ---
  const calculateTotal = (item) => {
    const p = parseFloat(item.price) || 0;
    const d = parseFloat(item.delivery) || 0;
    return p + d;
  };

  const gameSpend = games.reduce((acc, g) => acc + calculateTotal(g), 0);
  const hardwareSpend = hardware.reduce((acc, h) => acc + calculateTotal(h), 0);
  const grandTotal = gameSpend + hardwareSpend;

  // --- RESTORED: LIBRARY AUTO-SHOW LOGIC ---
  const libraryResults = PS4_LIBRARY.filter(item => {
    const matches = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return activeTab === 'Games' ? (matches && !item.type) : (matches && item.type);
  }).slice(0, 8);

  const selectItem = (item) => {
    if (activeTab === 'Games') {
      setFormData({ ...formData, title: item.title, studio: item.studio });
    } else {
      setFormData({ ...formData, name: item.title, studio: item.studio, type: item.type });
    }
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
      
      // If editing, you would typically call a PUT/UPDATE route here
      activeTab === 'Games' ? await db.games.add(dataToSave) : await db.hardware.add(dataToSave);
      
      resetForm();
      loadCloudData();
    } catch (err) { alert("Cloud Save Error"); }
  };

  const resetForm = () => {
    setFormData({ title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', date: new Date().toISOString().split('T')[0] });
    setEditingId(null);
    setSearchTerm('');
  };

  const handleEdit = (item) => {
    setEditingId(item.id || item._id);
    setFormData(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- RENDER LOGIC ---
  if (authStatus === 'logged-out') {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard}>
          <div style={styles.logoBox}><Gamepad2 size={40} color="#fff" /></div>
          <h1 style={styles.logoText}>AXON <span style={styles.proBadge}>GATEWAY</span></h1>
          <form onSubmit={(e) => { e.preventDefault(); if(passInput === '1234') setAuthStatus('admin'); }} style={{width:'100%', marginTop:'25px'}}>
            <input type="password" style={styles.input} placeholder="Access Code" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button type="submit" style={styles.submitBtn}>Unlock Admin Access</button>
          </form>
          <div style={styles.divider}><span>OR</span></div>
          <button onClick={() => setAuthStatus('guest')} style={styles.guestBtn}><User size={16} /> Guest View</button>
        </div>
      </div>
    );
  }

  const groupedData = (activeTab === 'Games' ? games : hardware).reduce((groups, item) => {
    const maker = item.studio || 'Other';
    if (!groups[maker]) groups[maker] = [];
    groups[maker].push(item);
    return groups;
  }, {});

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logoBox}><Gamepad2 size={26} color="#fff" /></div>
            <h1 style={styles.logoText}>GameVault <span style={styles.proBadge}>PRO</span></h1>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.grandTotalCard}>
                <p style={styles.statLabel}>Vault Valuation</p>
                <h2 style={styles.statValue}>Rs. {grandTotal.toLocaleString()}</h2>
            </div>
            <button onClick={() => setAuthStatus('logged-out')} style={styles.logoutBtn}>Logout</button>
          </div>
        </header>

        <div style={styles.mainLayout}>
          <section>
            {authStatus === 'admin' ? (
              <div style={styles.card}>
                <div style={styles.tabHeader}>
                  <button onClick={() => {setActiveTab('Games'); resetForm();}} style={activeTab === 'Games' ? styles.activeTab : styles.tab}>Software</button>
                  <button onClick={() => {setActiveTab('Hardware'); resetForm();}} style={activeTab === 'Hardware' ? styles.activeTab : styles.tab}>Hardware</button>
                </div>

                {/* RESTORED: LIBRARY DROPDOWN */}
                {!editingId && (
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
                )}

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
                  <button type="submit" style={styles.submitBtn}>{editingId ? 'Update' : `Add ${activeTab}`}</button>
                  {editingId && <button onClick={resetForm} style={styles.cancelBtn}>Cancel</button>}
                </form>
              </div>
            ) : (
              <div style={styles.guestNotice}><ShieldCheck size={40} color="#10b981" /><h3>Guest Mode</h3></div>
            )}
          </section>

          <section>
            <div style={styles.tableCard}>
                {Object.keys(groupedData).map(maker => (
                  <div key={maker}>
                    <div style={styles.makerHeader}>{maker}</div>
                    {groupedData[maker].map(item => (
                      <div key={item.id || item._id} style={styles.tableRow}>
                        <div style={styles.gameInfo}>
                            <div style={styles.avatar}>{(item.title || item.name).charAt(0)}</div>
                            <div><b>{item.title || item.name}</b><br/><small>{item.status}</small></div>
                        </div>
                        <div style={styles.priceArea}>
                            <div style={styles.priceText}>Rs. {calculateTotal(item).toLocaleString()}</div>
                            {authStatus === 'admin' && (
                                <div style={styles.actions}>
                                    <button onClick={() => handleEdit(item)} style={styles.editBtn}><Edit3 size={14}/></button>
                                    <button style={styles.delBtn}><Trash2 size={14}/></button>
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

// --- STYLING (Responsive + NaN Proof) ---
const styles = {
  loginOverlay: { height: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' },
  loginCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '32px', width: '100%', maxWidth: '380px', textAlign: 'center' },
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '15px', fontFamily: '"Inter", sans-serif' },
  content: { maxWidth: '1100px', margin: '0 auto' },
  header: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' },
  headerRight: { display: 'flex', flexDirection: 'column', gap: '15px' },
  brand: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoBox: { backgroundColor: '#0f172a', padding: '12px', borderRadius: '15px', display: 'inline-block' },
  logoText: { fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-1px' },
  proBadge: { fontSize: '9px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '5px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', boxSizing: 'border-box', marginBottom:'10px' },
  submitBtn: { width: '100%', backgroundColor: '#0f172a', color: '#fff', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' },
  cancelBtn: { width: '100%', backgroundColor: '#f1f5f9', color: '#64748b', padding: '10px', borderRadius: '12px', border: 'none', marginTop:'5px', cursor:'pointer' },
  guestBtn: { width: '100%', backgroundColor: '#f8fafc', color: '#475569', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  logoutBtn: { backgroundColor: '#fff', color: '#ef4444', padding: '8px 15px', borderRadius: '10px', border: '1px solid #fee2e2', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
  divider: { margin: '20px 0', color: '#cbd5e1', fontSize: '10px', fontWeight: '800' },
  mainLayout: { display: 'flex', flexDirection: 'column', gap: '25px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  tabHeader: { display: 'flex', gap: '5px', marginBottom: '20px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  tab: { flex: 1, padding: '10px', border: 'none', backgroundColor: 'transparent', fontSize: '13px', fontWeight: '600', cursor:'pointer' },
  activeTab: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  searchWrapper: { position: 'relative', marginBottom: '15px' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', width: '100%', fontSize: '14px' },
  scrollDropdown: { position: 'absolute', top: '55px', width: '100%', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', zIndex: 100 },
  dropdownItem: { padding: '12px', fontSize: '12px', borderBottom: '1px solid #f1f5f9', cursor:'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '5px' },
  row: { display: 'flex', gap: '10px' },
  tableCard: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  makerHeader: { backgroundColor: '#f8fafc', padding: '10px 20px', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },
  tableRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #f1f5f9' },
  gameInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '32px', height: '32px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' },
  priceArea: { display: 'flex', alignItems: 'center', gap: '15px' },
  priceText: { fontSize: '15px', fontWeight: '800', color: '#1e293b' },
  actions: { display: 'flex', gap: '10px' },
  editBtn: { border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#cbd5e1' },
  delBtn: { border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#fee2e2' },
  grandTotalCard: { backgroundColor: '#fff', padding: '15px 20px', borderRadius: '20px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' },
  statValue: { color: '#10b981', margin: '5px 0', fontSize: '24px', fontWeight: '900' },
  statLabel: { fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', margin: 0, fontWeight: '800' },
  guestNotice: { backgroundColor: '#fff', padding: '30px', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }
};

if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
  styles.header.flexDirection = 'row';
  styles.header.justifyContent = 'space-between';
  styles.headerRight.flexDirection = 'row';
  styles.headerRight.alignItems = 'center';
  styles.grandTotalCard.width = '350px';
  styles.grandTotalCard.textAlign = 'right';
  styles.mainLayout.display = 'grid';
  styles.mainLayout.gridTemplateColumns = '350px 1fr';
}