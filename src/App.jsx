import { useState, useEffect } from 'react'
import { Camera, Shield, LogOut, Trash2, Plus, Image as ImageIcon, X, Filter, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [view, setView] = useState('landing') // 'landing', 'intro', 'gallery', 'admin'
  const [isAdmin, setIsAdmin] = useState(false)
  const [photos, setPhotos] = useState([])
  const [filter, setFilter] = useState('All')
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [visitor, setVisitor] = useState({ name: '', photo: null })

  useEffect(() => {
    const savedPhotos = localStorage.getItem('class_gallery_photos')
    if (savedPhotos) {
      setPhotos(JSON.parse(savedPhotos))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('class_gallery_photos', JSON.stringify(photos))
  }, [photos])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === 'admin123') {
      setIsAdmin(true)
      setIsLoginModalOpen(false)
      setView('admin')
      setPassword('')
    } else {
      alert('Password salah!')
    }
  }

  const startIntro = () => {
    if (!visitor.name) return alert('Mohon isi nama Anda di buku reservasi!')
    setView('intro')
  }

  const addPhoto = (newPhoto) => {
    setPhotos([newPhoto, ...photos])
  }

  const deletePhoto = (id) => {
    if (confirm('Hapus foto ini?')) {
      setPhotos(photos.filter(p => p.id !== id))
    }
  }

  const filteredPhotos = filter === 'All' 
    ? photos 
    : photos.filter(p => p.class === filter)

  return (
    <div className="app-wrapper">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <LandingPage visitor={visitor} setVisitor={setVisitor} onConfirm={startIntro} setIsLoginModalOpen={setIsLoginModalOpen} />
        )}

        {view === 'intro' && (
          <IntroSequence photos={photos} onComplete={() => setView('gallery')} />
        )}

        {(view === 'gallery' || view === 'admin') && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            key="main-content"
          >
            <nav>
              <div className="container nav-content">
                <div className="brand" onClick={() => setView('gallery')} style={{cursor: 'pointer'}}>
                  TWELVETWO
                </div>
                <div className="nav-links" style={{display: 'flex', gap: '1rem'}}>
                  <button className="btn btn-outline" onClick={() => setView('gallery')}>
                    Gallery
                  </button>
                  {isAdmin ? (
                    <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                      <button className="btn btn-primary" onClick={() => setView('admin')}>
                        Admin Panel
                      </button>
                      <button className="btn btn-outline" onClick={() => setIsAdmin(false)}>
                        <LogOut size={18} />
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-outline" onClick={() => setIsLoginModalOpen(true)}>
                      <Shield size={18} /> Admin
                    </button>
                  )}
                </div>
              </div>
            </nav>

            <main className="container">
              {view === 'gallery' ? (
                <section className="fade-in">
                  <header className="gallery-header">
                    <motion.h1 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Our Precious Memories
                    </motion.h1>
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      style={{color: 'var(--text-muted)'}}
                    >
                      Selamat datang, {visitor.name}. Nikmati momen terbaik kami.
                    </motion.p>
                    
                    <div className="filter-group">
                      {['All', 'XI-F2', 'XII-F2'].map(f => (
                        <button 
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </header>

                  <div className="grid">
                    <AnimatePresence>
                      {filteredPhotos.map((photo) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          key={photo.id} 
                          className="photo-card glass"
                        >
                          <img src={photo.url} alt={photo.caption} />
                          <div className="photo-info">
                            <span style={{fontSize: '0.8rem', color: 'var(--accent)'}}>{photo.class}</span>
                            <p style={{fontWeight: '600'}}>{photo.caption}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  {filteredPhotos.length === 0 && (
                    <div style={{textAlign: 'center', padding: '4rem', color: 'var(--text-muted)'}}>
                      <ImageIcon size={48} style={{marginBottom: '1rem', opacity: 0.5}} />
                      <p>Belum ada foto. Unggah sekarang melalui panel admin!</p>
                    </div>
                  )}
                </section>
              ) : (
                <AdminPanel addPhoto={addPhoto} photos={photos} deletePhoto={deletePhoto} />
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <motion.div 
              initial={{scale: 0.9, opacity: 0}}
              animate={{scale: 1, opacity: 1}}
              className="glass glass-card" 
              style={{width: '90%', maxWidth: '400px'}}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
                <h3>Admin Login</h3>
                <button onClick={() => setIsLoginModalOpen(false)} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}>
                  <X />
                </button>
              </div>
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan sandi..."
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
                  Unlock Panel
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LandingPage({ visitor, setVisitor, onConfirm, setIsLoginModalOpen }) {
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setVisitor({ ...visitor, photo: reader.result })
      reader.readAsDataURL(file)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="landing-page"
    >
      <div className="book-container">
        <div className="book-content">
          <h2 className="book-title">Buku Reservasi Kelas</h2>
          <div className="attendance-grid">
            <div className="form-group">
              <label style={{color: '#5d4037', fontWeight: '600'}}>Nama Lengkap / Absen</label>
              <input 
                type="text" 
                className="attendance-input" 
                placeholder="Tulis namamu di sini..."
                value={visitor.name}
                onChange={(e) => setVisitor({...visitor, name: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label style={{color: '#5d4037', fontWeight: '600'}}>Foto Profil (Opsional)</label>
              <div className="attendance-photo-upload" onClick={() => document.getElementById('visitorPhoto').click()}>
                {visitor.photo ? (
                  <img src={visitor.photo} alt="visitor" />
                ) : (
                  <>
                    <Camera size={32} color="#5d4037" style={{opacity: 0.5}} />
                    <p style={{color: '#5d4037', fontSize: '0.8rem', marginTop: '0.5rem'}}>Klik untuk pas foto</p>
                  </>
                )}
                <input type="file" id="visitorPhoto" hidden onChange={handlePhotoUpload} accept="image/*" />
              </div>
            </div>

            <button className="checkmark-btn" onClick={onConfirm}>
              <Check size={32} />
            </button>
            <p style={{textAlign: 'center', fontSize: '0.8rem', color: '#888'}}>Klik centang untuk masuk ke memory twelvetwo</p>
          </div>
          
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            style={{
              position: 'absolute', bottom: '1rem', right: '1rem', 
              background: 'none', border: 'none', color: '#ddd', cursor: 'pointer'
            }}
          >
            <Shield size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function IntroSequence({ photos, onComplete }) {
  const [progress, setProgress] = useState(0)

  // Use photos for the background "wall". If empty, show nothing or placeholders.
  // We duplicate photos to ensure the wall is full.
  const wallPhotos = [...photos, ...photos, ...photos, ...photos].slice(0, 40)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 800)
          return 100
        }
        return prev + 1.5
      })
    }, 40)
    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="intro-container"
    >
      <div className="intro-photo-wall">
        {wallPhotos.map((p, i) => (
          <img key={i} src={p.url} className="intro-photo-item" alt="" />
        ))}
      </div>

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="intro-glass-card"
      >
        <div className="intro-logo">TWELVETWO</div>
        <div className="progress-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p style={{marginTop: '1.5rem', fontSize: '0.8rem', letterSpacing: '0.3rem', color: 'var(--text-muted)'}}>
          PREPARING YOUR MEMORIES
        </p>
      </motion.div>
    </motion.div>
  )
}

function AdminPanel({ addPhoto, photos, deletePhoto }) {
  const [newPhoto, setNewPhoto] = useState({ class: 'XI-F2', caption: '', url: '' })
  const [dragging, setDragging] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newPhoto.url || !newPhoto.caption) return alert('Isi semua field!')
    addPhoto({ ...newPhoto, id: Date.now() })
    setNewPhoto({ class: 'XI-F2', caption: '', url: '' })
    alert('Foto berhasil diunggah!')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewPhoto({ ...newPhoto, url: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="fade-in" style={{padding: '4rem 0'}}>
      <div className="admin-grid">
        {/* Upload Form */}
        <div className="glass glass-card" style={{height: 'fit-content'}}>
          <h3 style={{marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Plus size={20} /> Unggah Foto Baru
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Pilih Kelas</label>
              <select 
                className="form-input"
                value={newPhoto.class}
                onChange={e => setNewPhoto({...newPhoto, class: e.target.value})}
              >
                <option value="XI-F2">XI-F2</option>
                <option value="XII-F2">XII-F2</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Keterangan / Caption</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="Contoh: Makrab seru"
                value={newPhoto.caption}
                onChange={e => setNewPhoto({...newPhoto, caption: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Foto</label>
              <div 
                className={`admin-photo-upload ${dragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  const file = e.dataTransfer.files[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onloadend = () => setNewPhoto({...newPhoto, url: reader.result})
                    reader.readAsDataURL(file)
                  }
                }}
                onClick={() => document.getElementById('fileInput').click()}
              >

                {newPhoto.url ? (
                  <img src={newPhoto.url} style={{width: '100%', borderRadius: '0.5rem'}} />
                ) : (
                  <>
                    <Camera size={32} style={{opacity: 0.5, marginBottom: '0.5rem'}} />
                    <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                      Klik atau seret foto ke sini
                    </p>
                  </>
                )}
                <input 
                  type="file" 
                  id="fileInput" 
                  hidden 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
              Upload Memory
            </button>
          </form>
        </div>

        {/* Management List */}
        <div className="glass glass-card">
          <h3 style={{marginBottom: '1.5rem'}}>Kelola Foto ({photos.length})</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {photos.map(p => (
              <div key={p.id} className="glass" style={{display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '0.5rem'}}>
                <img src={p.url} style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px'}} />
                <div style={{flex: 1}}>
                  <p style={{fontWeight: '500', fontSize: '0.9rem'}}>{p.caption}</p>
                  <p style={{fontSize: '0.75rem', color: 'var(--accent)'}}>{p.class}</p>
                </div>
                <button 
                  onClick={() => deletePhoto(p.id)}
                  className="btn btn-outline" 
                  style={{padding: '0.5rem', color: '#ef4444'}}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {photos.length === 0 && (
              <p style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>Belum ada data.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
