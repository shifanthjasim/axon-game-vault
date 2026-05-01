import React, { useState, useEffect } from 'react';
import { db } from './db';
import { PS4_LIBRARY } from './library';
import { 
  Search, Gamepad2, Landmark, Trash2, 
  Truck, Edit3, Archive, ShoppingCart, 
  Clock, Monitor, Headphones, Download
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('Games');
  const [formData, setFormData] = useState({
    title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', date: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- CLOUD DATA STATES ---
  const [games, setGames] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- INITIAL DATA FETCH ---
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
      console.error("Cloud Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCloudData();
  }, []);

  // --- DATA EXPORT SYSTEM ---
  const exportToText = () => {
    const backup = {
      exportDate: new Date().toLocaleString(),
      architect: "Shifanth Jasim",
      summary: { totalGames: games.length, totalHardware: hardware.length },
      data: { games, hardware }
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AXON_Backup_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- ANALYTICS (Includes All Statuses) ---
  const gameSpend = games.reduce((acc, g) => acc + Number(g.price || 0) + Number(g.delivery || 0), 0);
  const hardwareSpend = hardware.reduce((acc, h) => acc + Number(h.price || 0) + Number(h.delivery || 0), 0);
  const grandTotal = gameSpend + hardwareSpend;

  // --- SEARCH ENGINE ---
  const libraryResults = PS4_LIBRARY.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'Games') return matchesSearch && !item.type;
    return matchesSearch && item.type;
  }).slice(0, 15);

  const selectItem = (item) => {
    if (activeTab === 'Games') {
      setFormData({ ...formData, title: item.title, studio: item.studio });
    } else {
      setFormData({ ...formData, name: item.title, studio: item.studio, type: item.type });
    }
    setSearchTerm('');
  };

  // --- VAULT GROUPING ---
  const currentInventory = activeTab === 'Games' ? games : hardware;
  const groupedData = currentInventory.reduce((groups, item) => {
    const maker = item.studio || 'Other';
    if (!groups[maker]) groups[maker] = [];
    groups[maker].push(item);
    return groups;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'Games') {
        if (!formData.title || !formData.price) return;
        await db.games.add(formData);
      } else {
        if (!formData.name || !formData.price) return;
        await db.hardware.add(formData);
      }
      setFormData({ title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', date: new Date().toISOString().split('T')[0] });
      loadCloudData();
    } catch (err) {
      alert("Cloud Save Failed");
    }
  };

  if (loading) return <div style={styles.loading}>Initializing AXON Cloud...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        
        {/* --- HEADER --- */}
        <header style={styles.header}>
          <div style={styles.brand}>
            <div style={styles.logoBox}><Gamepad2 size={26} color="#fff" /></div>
            <div>
              <h1 style={styles.logoText}>GameVault <span style={styles.proBadge}>PRO</span></h1>
              <p style={styles.creatorTag}>System Architect: <span style={{color: '#0f172a', fontWeight: '700'}}>Senior Engineer Shifanth Jasim</span></p>
            </div>
          </div>

          <div style={styles.headerRight}>
            <button onClick={exportToText} style={styles.backupBtn}>
              <Download size={14} /> Backup Data (.txt)
            </button>
            <div style={styles.grandTotalCard}>
              <div style={{borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px'}}>
                  <p style={styles.statLabel}>Grand Total Investment</p>
                  <h2 style={styles.statValue}>Rs. {grandTotal.toLocaleString()}</h2>
              </div>
              <div style={styles.miniStatsRow}>
                  <div style={styles.miniStatBox}>
                      <span style={styles.miniStatLabel}>Games</span>
                      <span style={styles.miniStatValue}>Rs. {gameSpend.toLocaleString()}</span>
                  </div>
                  <div style={styles.miniStatBox}>
                      <span style={styles.miniStatLabel}>Hardware</span>
                      <span style={styles.miniStatValue}>Rs. {hardwareSpend.toLocaleString()}</span>
                  </div>
              </div>
            </div>
          </div>
        </header>

        <div style={styles.mainLayout}>
          
          {/* --- LEFT: FORM --- */}
          <section>
            <div style={styles.card}>
              <div style={styles.tabHeader}>
                <button onClick={() => setActiveTab('Games')} style={activeTab === 'Games' ? styles.activeTab : styles.tab}>Software</button>
                <button onClick={() => setActiveTab('Hardware')} style={activeTab === 'Hardware' ? styles.activeTab : styles.tab}>Hardware</button>
              </div>

              <div style={styles.searchWrapper}>
                <div style={styles.searchBar}>
                  <Search size={14} color="#94a3b8" />
                  <input style={styles.searchInput} placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                {activeTab === 'Games' ? (
                  <>
                    <div style={styles.field}><label style={styles.label}>Title</label><input style={styles.input} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                    <div style={styles.field}><label style={styles.label}>Studio</label><input style={styles.input} value={formData.studio} onChange={e => setFormData({...formData, studio: e.target.value})} /></div>
                  </>
                ) : (
                  <>
                    <div style={styles.field}><label style={styles.label}>Hardware Name</label><input style={styles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                    <div style={styles.field}><label style={styles.label}>Manufacturer</label><input style={styles.input} value={formData.studio} onChange={e => setFormData({...formData, studio: e.target.value})} /></div>
                  </>
                )}
                
                <div style={styles.row}>
                  <div style={styles.field}><label style={styles.label}>Unit Price</label><input style={styles.input} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                  <div style={styles.field}><label style={styles.label}>Shipping</label><input style={styles.input} type="number" value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} /></div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Logistics Status</label>
                  <select style={styles.input} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Shipping">Paid (Shipping)</option>
                      <option value="Paid">Received (In Hand)</option>
                      <option value="Pending">Wishlist</option>
                  </select>
                </div>

                <button type="submit" style={styles.submitBtn}>{`Add ${activeTab}`}</button>
              </form>
            </div>
          </section>

          {/* --- RIGHT: VAULT --- */}
          <section>
            <div style={styles.sectionHeader}><Archive size={16}/> {activeTab.toUpperCase()} VAULT</div>
            <div style={{...styles.tableCard, borderTop: activeTab === 'Games' ? '4px solid #10b981' : '4px solid #3b82f6'}}>
                {Object.keys(groupedData).length === 0 ? <div style={styles.empty}>No entries found.</div> : 
                  Object.keys(groupedData).map(maker => (
                    <div key={maker}>
                      <div style={styles.makerHeader}><Landmark size={12} /> {maker}</div>
                      {groupedData[maker].map(item => (
                        <div key={item.id} style={styles.tableRow}>
                          <div style={styles.gameInfo}>
                            <div style={styles.avatar}>{(item.title || item.name).charAt(0)}</div>
                            <div><b>{item.title || item.name}</b><br/><small>{item.studio}</small></div>
                          </div>
                          <div style={styles.priceArea}>
                            <div style={{textAlign:'right'}}>
                                <div style={styles.priceText}>Rs. {(Number(item.price) + Number(item.delivery)).toLocaleString()}</div>
                                <div style={{...styles.statusLabel, color: item.status === 'Shipping' ? '#3b82f6' : '#94a3b8'}}>{item.status}</div>
                            </div>
                          </div>
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

// --- RESPONSIVE MOBILE-FIRST STYLES ---
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '15px', fontFamily: '"Inter", sans-serif' },
  content: { maxWidth: '1150px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '100px', color: '#64748b', fontSize: '14px', fontWeight: '600' },
  header: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' },
  headerRight: { display: 'flex', flexDirection: 'column', gap: '15px' },
  brand: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoBox: { backgroundColor: '#0f172a', padding: '12px', borderRadius: '15px' },
  logoText: { fontSize: '24px', fontWeight: '900', letterSpacing: '-1px', margin: 0 },
  creatorTag: { fontSize: '10px', color: '#64748b', marginTop: '4px', textTransform: 'uppercase', margin: 0 },
  proBadge: { fontSize: '10px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '6px' },
  grandTotalCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' },
  statLabel: { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', margin: 0 },
  statValue: { fontSize: '28px', fontWeight: '900', color: '#10b981', margin: 0 },
  miniStatsRow: { display: 'flex', justifyContent: 'flex-start', gap: '20px', marginTop: '10px' },
  miniStatBox: { display: 'flex', flexDirection: 'column' },
  miniStatLabel: { fontSize: '9px', fontWeight: '800', color: '#94a3b8' },
  miniStatValue: { fontSize: '14px', fontWeight: '700', color: '#1e293b' },
  backupBtn: { backgroundColor: '#fff', color: '#64748b', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' },
  mainLayout: { display: 'flex', flexDirection: 'column', gap: '25px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  tabHeader: { display: 'flex', gap: '6px', marginBottom: '20px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '12px' },
  tab: { flex: 1, padding: '10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '600' },
  activeTab: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#fff', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  searchWrapper: { position: 'relative', marginBottom: '15px' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', width: '100%', fontSize: '16px' },
  scrollDropdown: { position: 'absolute', top: '55px', width: '100%', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', zIndex: 100 },
  dropdownItem: { padding: '12px', fontSize: '12px', borderBottom: '1px solid #f1f5f9' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  input: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '10px' },
  submitBtn: { backgroundColor: '#0f172a', color: '#fff', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#1e293b', marginBottom: '15px' },
  tableCard: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' },
  makerHeader: { backgroundColor: '#f8fafc', padding: '10px 20px', fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  tableRow: { display: 'flex', flexDirection: 'column', padding: '15px 20px', borderBottom: '1px solid #f1f5f9', gap: '10px' },
  gameInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  avatar: { width: '35px', height: '35px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' },
  priceArea: { display: 'flex', justifyContent: 'flex-end' },
  priceText: { fontSize: '16px', fontWeight: '800', color: '#0f172a' },
  statusLabel: { fontSize: '9px', textTransform: 'uppercase', fontWeight: '700' },
  empty: { padding: '40px', textAlign: 'center', color: '#94a3b8' }
};

// --- DESKTOP OVERRIDES ---
if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
  styles.header.flexDirection = 'row';
  styles.header.justifyContent = 'space-between';
  styles.headerRight.flexDirection = 'row';
  styles.headerRight.alignItems = 'flex-start';
  styles.grandTotalCard.width = '320px';
  styles.grandTotalCard.textAlign = 'right';
  styles.miniStatsRow.justifyContent = 'flex-end';
  styles.mainLayout.display = 'grid';
  styles.mainLayout.gridTemplateColumns = '380px 1fr';
  styles.tableRow.flexDirection = 'row';
  styles.tableRow.justifyContent = 'space-between';
}