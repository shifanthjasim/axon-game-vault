import React, { useState } from 'react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
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
  const [editingId, setEditingId] = useState(null);

  // --- DATA HOOKS ---
  const games = useLiveQuery(() => db.games.toArray()) || [];
  const hardware = useLiveQuery(() => db.hardware.toArray()) || [];

  // --- DATA EXPORT SYSTEM (TXT BACKUP) ---
  const exportToText = async () => {
    const gamesData = await db.games.toArray();
    const hardwareData = await db.hardware.toArray();
    
    const backup = {
      exportDate: new Date().toLocaleString(),
      architect: "Shifanth Jasim",
      summary: {
        totalGames: gamesData.length,
        totalHardware: hardwareData.length
      },
      data: {
        games: gamesData,
        hardware: hardwareData
      }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AXON_Backup_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- FINANCIAL ANALYTICS ---
  const gameSpend = games
    .filter(g => g.status === 'Paid' || g.status === 'Shipping')
    .reduce((acc, g) => acc + Number(g.price || 0) + Number(g.delivery || 0), 0);

  const hardwareSpend = hardware
    .filter(h => h.status === 'Paid' || h.status === 'Shipping')
    .reduce((acc, h) => acc + Number(h.price || 0) + Number(h.delivery || 0), 0);

  const pendingSpend = [
    ...games.filter(g => g.status === 'Pending'),
    ...hardware.filter(h => h.status === 'Pending')
  ].reduce((acc, i) => acc + Number(i.price || 0) + Number(i.delivery || 0), 0);

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

  // --- GROUPING ---
  const groupedVaultGames = games.filter(g => g.status === 'Paid').reduce((groups, game) => {
    const maker = game.studio || 'Other';
    if (!groups[maker]) groups[maker] = [];
    groups[maker].push(game);
    return groups;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'Games') {
        if (!formData.title || !formData.price) return;
        editingId ? await db.games.update(editingId, formData) : await db.games.add(formData);
    } else {
        if (!formData.name || !formData.price) return;
        editingId ? await db.hardware.update(editingId, formData) : await db.hardware.add(formData);
    }
    setFormData({ title: '', studio: '', name: '', type: 'Console', price: '', delivery: '0', status: 'Paid', date: new Date().toISOString().split('T')[0] });
    setEditingId(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        
        {/* --- PROFESSIONAL HEADER --- */}
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
          
          {/* --- LEFT: STICKY FORM PANEL --- */}
          <section>
            <div style={styles.card}>
              <div style={styles.tabHeader}>
                <button onClick={() => {setActiveTab('Games'); setSearchTerm('');}} style={activeTab === 'Games' ? styles.activeTab : styles.tab}>Software</button>
                <button onClick={() => {setActiveTab('Hardware'); setSearchTerm('');}} style={activeTab === 'Hardware' ? styles.activeTab : styles.tab}>Hardware</button>
              </div>

              {!editingId && (
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
              )}

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
                    <div style={styles.field}>
                      <label style={styles.label}>Type</label>
                      <select style={styles.input} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="Console">Console / Workstation</option>
                        <option value="Accessory">Peripheral / Accessory</option>
                      </select>
                    </div>
                  </>
                )}
                
                <div style={styles.row}>
                  <div style={styles.field}><label style={styles.label}>Unit Price</label><input style={styles.input} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                  <div style={styles.field}><label style={styles.label}>Shipping</label><input style={styles.input} type="number" value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} /></div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Logistics Status</label>
                  <select style={styles.input} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Shipping">Paid (Currently Shipping)</option>
                      <option value="Paid">Received (In Hand)</option>
                      <option value="Pending">Wishlist (Future Asset)</option>
                  </select>
                </div>

                <button type="submit" style={styles.submitBtn}>{editingId ? 'Update Asset' : `Add ${activeTab}`}</button>
                {editingId && <button onClick={() => setEditingId(null)} style={styles.cancelBtn}>Cancel</button>}
              </form>
            </div>
          </section>

          {/* --- RIGHT: INVENTORY VIEW --- */}
          <section style={styles.inventoryScroll}>
            <div style={styles.sectionHeader}><Archive size={16}/> SOFTWARE VAULT</div>
            <div style={{...styles.tableCard, borderTop: '4px solid #10b981'}}>
                {Object.keys(groupedVaultGames).length === 0 ? <div style={styles.empty}>No entries found.</div> : 
                  Object.keys(groupedVaultGames).map(maker => (
                    <div key={maker}>
                      <div style={styles.makerHeader}><Landmark size={12} /> {maker}</div>
                      {groupedVaultGames[maker].map(g => (
                        <GameRow key={g.id} game={g} onEdit={() => {setActiveTab('Games'); setEditingId(g.id); setFormData(g);}} />
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

// UI ROW COMPONENTS
function GameRow({ game, onEdit }) {
  const total = Number(game.price || 0) + Number(game.delivery || 0);
  return (
    <div style={styles.tableRow}>
      <div style={styles.gameInfo}>
        <div style={styles.avatar}>G</div>
        <div><b>{game.title}</b><br/><small style={{color:'#64748b'}}>{game.studio}</small></div>
      </div>
      <div style={styles.priceArea}>
        <div style={{textAlign:'right'}}>
            <div style={styles.priceText}>Rs. {total.toLocaleString()}</div>
            <div style={{...styles.statusLabel, color: game.status === 'Shipping' ? '#3b82f6' : '#94a3b8'}}>{game.status}</div>
        </div>
        <div style={styles.actions}>
            <button onClick={onEdit} style={styles.editBtn}><Edit3 size={14}/></button>
            <button onClick={() => db.games.delete(game.id)} style={styles.delBtn}><Trash2 size={14}/></button>
        </div>
      </div>
    </div>
  );
}

// STYLING SYSTEM
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '40px 20px', fontFamily: '"Inter", sans-serif' },
  content: { maxWidth: '1150px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' },
  headerRight: { display: 'flex', alignItems: 'flex-start', gap: '20px' },
  brand: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoBox: { backgroundColor: '#0f172a', padding: '12px', borderRadius: '15px' },
  logoText: { fontSize: '24px', fontWeight: '900', letterSpacing: '-1px', margin: 0 },
  creatorTag: { fontSize: '10px', color: '#64748b', marginTop: '4px', letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 },
  proBadge: { fontSize: '10px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '6px' },
  grandTotalCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', textAlign: 'right', minWidth: '320px' },
  statLabel: { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', margin: 0 },
  statValue: { fontSize: '26px', fontWeight: '900', color: '#10b981', margin: 0 },
  miniStatsRow: { display: 'flex', justifyContent: 'flex-end', gap: '15px' },
  miniStatBox: { display: 'flex', flexDirection: 'column' },
  miniStatLabel: { fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  miniStatValue: { fontSize: '13px', fontWeight: '700', color: '#1e293b' },
  backupBtn: { backgroundColor: '#f1f5f9', color: '#64748b', padding: '10px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' },
  mainLayout: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: '35px' },
  card: { backgroundColor: '#fff', padding: '28px', borderRadius: '28px', border: '1px solid #e2e8f0', position: 'sticky', top: '20px' },
  tabHeader: { display: 'flex', gap: '8px', marginBottom: '25px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '14px' },
  tab: { flex: 1, padding: '10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderRadius: '10px', fontSize: '13px', fontWeight: '600' },
  activeTab: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#fff', cursor: 'pointer', borderRadius: '10px', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  searchWrapper: { position: 'relative', marginBottom: '15px' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '12px 18px', borderRadius: '14px', border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', width: '100%', fontSize: '13px' },
  scrollDropdown: { position: 'absolute', top: '55px', width: '100%', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', zIndex: 100 },
  dropdownItem: { padding: '12px 18px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  input: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fcfcfd' },
  row: { display: 'flex', gap: '12px', alignItems: 'flex-end' },
  submitBtn: { backgroundColor: '#0f172a', color: '#fff', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer', marginTop: '10px' },
  cancelBtn: { backgroundColor: '#f1f5f9', color: '#64748b', padding: '12px', borderRadius: '12px', border: 'none', marginTop: '5px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px', color: '#1e293b' },
  tableCard: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  makerHeader: { backgroundColor: '#f8fafc', padding: '8px 25px', fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' },
  tableRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 25px', borderBottom: '1px solid #f1f5f9' },
  gameInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  avatar: { width: '32px', height: '32px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' },
  priceArea: { display: 'flex', alignItems: 'center', gap: '20px' },
  priceText: { fontSize: '15px', fontWeight: '800', color: '#0f172a' },
  statusLabel: { fontSize: '9px', textTransform: 'uppercase', fontWeight: '700' },
  actions: { display: 'flex', gap: '8px' },
  editBtn: { border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#cbd5e1' },
  delBtn: { border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#fee2e2' },
  empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }
};