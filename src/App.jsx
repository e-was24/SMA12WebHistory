import { useState, useEffect } from 'react'
import { Camera, Shield, LogOut, Trash2, Plus, Image as ImageIcon, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { PDDLogo } from './components/PDDLogo'


// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const playShutterSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const now = audioCtx.currentTime
    
    // 1. Mirror Flip (Low 'thud')
    const mirror = audioCtx.createOscillator()
    const mirrorGain = audioCtx.createGain()
    mirror.type = 'sine'
    mirror.frequency.setValueAtTime(100, now)
    mirror.frequency.exponentialRampToValueAtTime(40, now + 0.05)
    mirrorGain.gain.setValueAtTime(0.2, now)
    mirrorGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
    mirror.connect(mirrorGain)
    mirrorGain.connect(audioCtx.destination)
    
    // 2. Main Shutter Curtain (Crispy 'clack')
    const bufferSize = audioCtx.sampleRate * 0.08
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize / 4))
    }
    const noise = audioCtx.createBufferSource()
    noise.buffer = buffer
    const filter = audioCtx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 3000
    noise.connect(filter)
    filter.connect(audioCtx.destination)
    
    // 3. Mechanical 'Metallic' ring
    const ring = audioCtx.createOscillator()
    const ringGain = audioCtx.createGain()
    ring.type = 'triangle'
    ring.frequency.setValueAtTime(800, now)
    ringGain.gain.setValueAtTime(0.1, now)
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
    ring.connect(ringGain)
    ringGain.connect(audioCtx.destination)

    // Fire sequence
    mirror.start(now)
    noise.start(now + 0.01)
    ring.start(now + 0.01)
    
    mirror.stop(now + 0.05)
    noise.stop(now + 0.1)
    ring.stop(now + 0.04)
  } catch (e) { console.warn(e) }
}


function App() {
  const [view, setView] = useState('landing') // 'landing', 'intro', 'gallery', 'admin'
  const [showSplash, setShowSplash] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)



  const [photos, setPhotos] = useState([])
  const [filter, setFilter] = useState('All')
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [visitor, setVisitor] = useState({ name: '', photo: null })
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // Fetch photos from Supabase
  const fetchPhotos = async () => {
    setLoading(true)
    setFetchError(null)
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setPhotos(data)
    if (error) {
      console.error('Error fetching photos:', error)
      setFetchError(error.message)
    }
    setLoading(false)
  }


  useEffect(() => {
    // Restore visitor session
    const savedVisitor = localStorage.getItem('twelvetwo_visitor')
    if (savedVisitor) {
      setVisitor(JSON.parse(savedVisitor))
      setView('gallery') // Auto-skip to gallery
    }

    if (supabaseUrl && supabaseAnonKey) {
      fetchPhotos()
      // ... (subscription logic)

      const subscription = supabase
        .channel('public:photos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => {
          fetchPhotos()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [])

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
    localStorage.setItem('twelvetwo_visitor', JSON.stringify(visitor))
    setView('intro')
  }

  const handleLogout = () => {
    if (confirm('Anda yakin ingin keluar dari galeri?')) {
      localStorage.removeItem('twelvetwo_visitor')
      setVisitor({ name: '', photo: null })
      setView('landing')
    }
  }
// ... (rest of the functions)


  // Optimized image compression
  const compressImage = (base64, maxWidth = 1200) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = base64
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8)) // 0.8 quality
      }
    })
  }

  // Helper to convert base64 to File
  const base64ToFile = (base64, filename) => {
    const arr = base64.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  const addPhoto = async (newPhotoData) => {
    try {
      setLoading(true)
      
      // 0. Compress Image before upload
      const compressedBase64 = await compressImage(newPhotoData.url)
      const file = base64ToFile(compressedBase64, `${Date.now()}.jpg`)

      // Check size limit (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Ukuran foto terlalu besar. Silakan kompres foto Anda.')
      }
      
      // 1. Upload to Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('class-photos')
        .upload(`gallery/${file.name}`, file, {
          contentType: 'image/jpeg'
        })

      if (storageError) throw storageError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('class-photos')
        .getPublicUrl(`gallery/${file.name}`)

      // 3. Insert into Database
      const { error: dbError } = await supabase
        .from('photos')
        .insert([{
          url: publicUrl,
          caption: newPhotoData.caption,
          class: newPhotoData.class,
          storage_path: `gallery/${file.name}`
        }])

      if (dbError) throw dbError

      alert('Foto berhasil diunggah ke Cloud!')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Gagal unggah: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const deletePhoto = async (id, storagePath) => {
    if (!confirm('Hapus foto ini secara permanen dari Cloud?')) return

    try {
      setLoading(true)
      // 1. Delete from Database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      // 2. Delete from Storage
      if (storagePath) {
        await supabase.storage
          .from('class-photos')
          .remove([storagePath])
      }

      alert('Foto terhapus!')
    } catch (error) {
      alert('Gagal hapus: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredPhotos = filter === 'All' 
    ? photos 
    : photos.filter(p => p.class === filter)

  // Redirect if keys are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#030712', color: 'white', padding: '2rem'}}>
        <div>
          <h2 style={{color: '#f59e0b', marginBottom: '1rem'}}>Konfigurasi Diperlukan</h2>
          <p>Silakan isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di file `.env` Anda.</p>
          <p style={{marginTop: '1rem', fontSize: '0.8rem', opacity: 0.6}}>Hubungi pengembang untuk bantuan.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-wrapper">
      <AnimatePresence mode="wait">
        {showSplash && (
          <InitialSplash key="splash" onComplete={() => setShowSplash(false)} />
        )}

        {!showSplash && view === 'landing' && (
          <LandingPage visitor={visitor} setVisitor={setVisitor} onConfirm={startIntro} setIsLoginModalOpen={setIsLoginModalOpen} />
        )}
// ... (rest of the conditions)


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
                
                {/* Desktop Navigation */}
                <div className="nav-desktop">
                  <button className="btn-link" onClick={() => setView('gallery')}>Gallery</button>
                  {isAdmin ? (
                    <button className="btn-link" onClick={() => setView('admin')}>Admin</button>
                  ) : (
                    <button className="btn-link" onClick={() => setIsLoginModalOpen(true)}>Admin</button>
                  )}
                  <button className="btn-link logout" onClick={handleLogout}>Selesai</button>
                </div>

                {/* Mobile Navigation (PDD Menu) */}
                <div className="nav-mobile">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    className="camera-menu-btn"
                    onClick={() => {
                      setIsFlashing(true)
                      setTimeout(() => setIsFlashing(false), 150)
                      setIsMenuOpen(!isMenuOpen)
                    }}
                  >
                    <Camera size={24} />
                    <span className="pdd-label">PDD</span>
                  </motion.button>
                </div>
              </div>

              {/* PDD Menu Overlay (Mobile Only) */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="pdd-menu-overlay glass"
                  >
                    <div className="menu-links">
                      <button onClick={() => { setView('gallery'); setIsMenuOpen(false); }}>Gallery</button>
                      
                      {isAdmin ? (
                        <button onClick={() => { setView('admin'); setIsMenuOpen(false); }}>Admin Panel</button>
                      ) : (
                        <button onClick={() => { setIsLoginModalOpen(true); setIsMenuOpen(false); }}>Admin Login</button>
                      )}
                      
                      <button className="logout-btn" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Selesai</button>
                      
                      <button className="close-menu-btn" onClick={() => setIsMenuOpen(false)}>
                        <X size={20} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </nav>

            {/* Flash Effect Overlay */}
            <AnimatePresence>
              {isFlashing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flash-overlay"
                />
              )}
            </AnimatePresence>



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
                      Selamat datang, {visitor.name}. Kenangan ini tersimpan di Cloud.
                    </motion.p>
                    
                    <div className="mode-selector-wrapper">
                      <div className="mode-selector glass">
                        {['All', 'XI-F2', 'XII-F2', 'Anggota', 'Penghargaan', 'Video'].map(f => (
                          <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`mode-btn ${filter === f ? 'active' : ''}`}
                          >
                            {filter === f && (
                              <motion.div 
                                layoutId="mode-bg"
                                className="mode-bg"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                            <span className="mode-text">{f}</span>
                          </button>
                        ))}
                      </div>
                    </div>



                    {fetchError && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid #ef4444', 
                        padding: '1rem', 
                        borderRadius: '0.5rem', 
                        marginBottom: '2rem',
                        color: '#ef4444',
                        textAlign: 'center'
                      }}>
                        <p><strong>Error Terdeteksi:</strong> {fetchError}</p>
                        <p style={{fontSize: '0.8rem', marginTop: '0.5rem'}}>Coba cek SQL Policies atau Redploy di Vercel.</p>
                      </div>
                    )}
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
                  
                  {filteredPhotos.length === 0 && !loading && (
                    <div style={{textAlign: 'center', padding: '4rem', color: 'var(--text-muted)'}}>
                      <ImageIcon size={48} style={{marginBottom: '1rem', opacity: 0.5}} />
                      <p>Belum ada foto di Cloud. Hubungi admin untuk mengunggah!</p>
                    </div>
                  )}
                </section>
              ) : (
                <AdminPanel addPhoto={addPhoto} photos={photos} deletePhoto={deletePhoto} loading={loading} />
              )}
            </main>
            <footer style={{
              textAlign: 'center', 
              padding: '2rem', 
              opacity: 0.4, 
              fontSize: '0.7rem', 
              letterSpacing: '0.1rem',
              textTransform: 'uppercase'
            }}>
              created by elan
            </footer>
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
      if (file.size > 10 * 1024 * 1024) return alert('File terlalu besar! Maksimal 10MB.')
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
          <div className="book-spread">
            {/* Left Page */}
            <div className="attendance-grid">
              <div className="form-group">
                <label className="attendance-label">Nama Lengkap / Absen</label>
                <input 
                  type="text" 
                  className="attendance-input" 
                  placeholder="Tulis namamu di sini..."
                  value={visitor.name}
                  onChange={(e) => setVisitor({...visitor, name: e.target.value})}
                />
              </div>
              <p style={{fontSize: '0.9rem', color: '#8d6e63', fontStyle: 'italic', marginTop: '1rem'}}>
                "Setiap nama punya cerita, setiap cerita punya kenangan."
              </p>
            </div>

            {/* Right Page */}
            <div className="attendance-grid">
              <div className="form-group">
                <label className="attendance-label">Foto Profil (Opsional)</label>
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
              <p style={{textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '1rem'}}>Tanda tangani untuk masuk</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            style={{
              position: 'absolute', bottom: '1rem', right: '1rem', 
              background: 'none', border: 'none', color: 'rgba(0,0,0,0.1)', cursor: 'pointer'
            }}
          >
            <Shield size={16} />
          </button>
          <div style={{
            position: 'absolute', bottom: '1.5rem', left: '0', right: '0', 
            textAlign: 'center', opacity: 0.2, fontSize: '0.6rem', letterSpacing: '0.1rem'
          }}>
            created by elan
          </div>
        </div>
      </div>
    </motion.div>

  )
}

function IntroSequence({ photos, onComplete }) {
  const [progress, setProgress] = useState(0)
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
          <img key={`${p.id}-${i}`} src={p.url} className="intro-photo-item" alt="" />
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

function AdminPanel({ addPhoto, photos, deletePhoto, loading }) {
  const [newPhoto, setNewPhoto] = useState({ class: 'XI-F2', caption: '', url: '' })
  const [dragging, setDragging] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newPhoto.url || !newPhoto.caption) return alert('Isi semua field!')
    await addPhoto(newPhoto)
    setNewPhoto({ class: 'XI-F2', caption: '', url: '' })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) return alert('File terlalu besar! Maksimal 10MB.')
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
            <Plus size={20} /> Unggah Foto Baru Cloud
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Pilih Kategori</label>
              <select 
                className="form-input"
                value={newPhoto.class}
                onChange={e => setNewPhoto({...newPhoto, class: e.target.value})}
              >
                <option value="XI-F2">XI-F2</option>
                <option value="XII-F2">XII-F2</option>
                <option value="Anggota">Anggota</option>
                <option value="Penghargaan">Penghargaan</option>
                <option value="Video">Video</option>
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
                    if (file.size > 10 * 1024 * 1024) return alert('File terlalu besar! Maksimal 10MB.')
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

            <button type="submit" disabled={loading} className="btn btn-primary" style={{width: '100%'}}>
              {loading ? 'Mengunggah...' : 'Upload to Cloud'}
            </button>
          </form>
        </div>

        {/* Management List */}
        <div className="glass glass-card">
          <h3 style={{marginBottom: '1.5rem'}}>Kelola Foto Cloud ({photos.length})</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {photos.map(p => (
              <div key={p.id} className="glass" style={{display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '0.5rem'}}>
                <img src={p.url} style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px'}} />
                <div style={{flex: 1}}>
                  <p style={{fontWeight: '500', fontSize: '0.9rem'}}>{p.caption}</p>
                  <p style={{fontSize: '0.75rem', color: 'var(--accent)'}}>{p.class}</p>
                </div>
                <button 
                  disabled={loading}
                  onClick={() => deletePhoto(p.id, p.storage_path)}
                  className="btn btn-outline" 
                  style={{padding: '0.5rem', color: '#ef4444'}}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {photos.length === 0 && !loading && (
              <p style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>Belum ada data di cloud.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InitialSplash({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000)
    const soundTimer = setTimeout(playShutterSound, 1800) // Trigger with flash
    return () => {
      clearTimeout(timer)
      clearTimeout(soundTimer)
    }
  }, [onComplete])



  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="splash-screen"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <PDDLogo />
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="splash-text"
      >
        <p className="splash-credit">Dibuat oleh PDD Dan</p>
        <h1 className="splash-brand">Dipersembahkan oleh TWELVETWO</h1>
      </motion.div>
    </motion.div>
  )
}

export default App

