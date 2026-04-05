import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Trash2,
  X,
  Sliders,
  ChevronRight,
  User,
  GraduationCap,
  Heart,
  Zap,
  ImageOff,
  UserX,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Constants & Helpers ---
const PDD_NUMBERS = [1, 6, 10, 12, 13, 14, 15, 25];

const ChattingSVG = () => (
  <svg viewBox="0 0 120 80" width="120" height="80" className="chatting-svg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--accent-primary)" />
        <stop offset="100%" stopColor="var(--accent-secondary)" />
      </linearGradient>
    </defs>
    {/* Left Figure */}
    <motion.g
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <rect
        x="25"
        y="35"
        width="24"
        height="24"
        rx="12"
        fill="url(#logoGrad)"
        opacity="0.6"
      />
      <circle cx="37" cy="22" r="9" fill="url(#logoGrad)" />
    </motion.g>
    {/* Right Figure */}
    <motion.g
      animate={{ y: [0, -6, 0] }}
      transition={{
        duration: 3.5,
        repeat: Infinity,
        delay: 0.5,
        ease: "easeInOut",
      }}
    >
      <rect
        x="75"
        y="35"
        width="24"
        height="24"
        rx="12"
        fill="url(#logoGrad)"
        opacity="0.4"
      />
      <circle cx="87" cy="22" r="9" fill="url(#logoGrad)" opacity="0.8" />
    </motion.g>
    {/* Minimal Chat Line */}
    <motion.path
      d="M50 25 Q60 15 70 25"
      stroke="var(--accent-primary)"
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [0, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  </svg>
);

const PhotoCollage = ({ photos }) => {
  const displayPhotos =
    photos.length > 0 ? [...photos, ...photos, ...photos].slice(0, 25) : [];

  return (
    <div className="photo-collage-container">
      <div className="collage-overlay" />
      {displayPhotos.map((p, i) => {
        const rotate = (i * 137.5) % 40 - 20; // Scattered rotation
        const scale = 0.8 + ((i * 7) % 5) * 0.1;
        const top = (i * 23) % 90;
        const left = (i * 37) % 90;

        return (
          <motion.div
            key={`${p.id}-${i}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 0.5,
              scale,
              rotate,
              top: `${top}%`,
              left: `${left}%`,
            }}
            transition={{ duration: 2, delay: i * 0.05 }}
            className="collage-item-abstract"
          >
            <img src={p.url} alt="" className="collage-img-abstract" />
          </motion.div>
        );
      })}
    </div>
  );
};

const LoadingToast = ({ show, message }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: -20, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: -20, x: 20 }}
        className="loading-toastglass"
      >
        <div className="spinner"></div>
        <span>{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

const PDDLogo = () => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className="pdd-logo-container"
  >
    <ChattingSVG />
  </motion.div>
);

const EmptyState = ({ message, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="empty-state glass"
  >
    {Icon && <Icon size={48} className="empty-icon" />}
    <p>{message || "No data found."}</p>
  </motion.div>
);

// --- Main App Component ---
function App() {
  // UI States
  const [view, setView] = useState("gallery");
  const [showSplash, setShowSplash] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [adminTab, setAdminTab] = useState("photos");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [visitor, setVisitor] = useState({ name: "", photo: null });
  const [loading, setLoading] = useState(true);

  // Data States
  const [photos, setPhotos] = useState([]);
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState("");
  const [editCaption, setEditCaption] = useState("");

  // Scroll Locking
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Data Actions
  const [newPhoto, setNewPhoto] = useState({
    class: "XI-F2",
    caption: "",
    url: "",
  });
  const [newStudent, setNewStudent] = useState({
    name: "",
    attendance_no: "",
    gender: "cowok",
    photo_url: "",
    is_teacher: false,
  });

  // Data Actions
  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPhotos(data);
    setLoading(false);
  };

  const fetchStudents = async () => {
    // Try 'students' first, then 'participants' as fallback
    let { data, error } = await supabase
      .from("students")
      .select("*")
      .order("is_teacher", { ascending: false })
      .order("attendance_no", { ascending: true });

    if (error && error.code === "PGRST116") {
      // PGRST116 is often table not found
      console.log("Table students not found, trying participants...");
      const fallback = await supabase
        .from("participants")
        .select("*")
        .order("is_teacher", { ascending: false })
        .order("attendance_no", { ascending: true });
      data = fallback.data;
      error = fallback.error;
    }

    if (data) setStudents(data);
    if (error) console.error("Error fetching students:", error);
  };

  useEffect(() => {
    const savedVisitor = localStorage.getItem("gallery_visitor");
    if (savedVisitor) setVisitor(JSON.parse(savedVisitor));
    fetchPhotos();
    fetchStudents();
  }, []);

  const handlePhotoSubmit = async (e) => {
    e.preventDefault();
    if (!newPhoto.url) return alert("Pilih foto dulu!");
    setLoading(true);
    try {
      const fileName = `gallery/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
      const base64Data = newPhoto.url.split(",")[1];
      const binaryData = Uint8Array.from(atob(base64Data), (c) =>
        c.charCodeAt(0),
      );
      await supabase.storage
        .from("class-photos")
        .upload(fileName, binaryData, { contentType: "image/png" });
      const { data: publicUrlData } = supabase.storage
        .from("class-photos")
        .getPublicUrl(fileName);
      await supabase.from("photos").insert([
        {
          url: publicUrlData.publicUrl,
          caption: newPhoto.caption,
          class: newPhoto.class,
          storage_path: fileName,
        },
      ]);
      setNewPhoto({ url: "", caption: "", class: "XI-F2" });
      fetchPhotos();
      alert("Berhasil upload!");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePhotoDetails = async (id, newClass, newCaption) => {
    setLoading(true);
    const { error } = await supabase
      .from("photos")
      .update({ class: newClass, caption: newCaption })
      .eq("id", id);
    if (error) alert(error.message);
    else {
      setEditingId(null);
      fetchPhotos();
    }
    setLoading(false);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      let photo_url = newStudent.photo_url;
      if (newStudent.photo_url && newStudent.photo_url.startsWith("data:")) {
        const fileName = `student-${Date.now()}.png`;
        const base64Data = newStudent.photo_url.split(",")[1];
        const binaryData = Uint8Array.from(atob(base64Data), (c) =>
          c.charCodeAt(0),
        );
        const { error: uploadError } = await supabase.storage
          .from("class-photos")
          .upload(fileName, binaryData, { contentType: "image/png" });
        if (uploadError) throw uploadError;
        photo_url = supabase.storage.from("class-photos").getPublicUrl(fileName)
          .data.publicUrl;
      }

      const tableToUse = (await supabase.from("students").select("id").limit(1))
        .error
        ? "participants"
        : "students";

      const { error: insertError } = await supabase.from(tableToUse).insert([
        {
          name: newStudent.name,
          attendance_no: parseInt(newStudent.attendance_no) || 0,
          gender: newStudent.gender,
          photo_url,
          is_teacher: newStudent.is_teacher,
        },
      ]);

      if (insertError) throw insertError;

      setNewStudent({
        name: "",
        attendance_no: "",
        gender: "cowok",
        photo_url: "",
        is_teacher: false,
      });
      await fetchStudents();
      alert("Data siswa disimpan!");
    } catch (err) {
      console.error("Error saving student:", err);
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (id, path) => {
    if (!confirm("Hapus foto ini?")) return;
    await supabase.storage.from("class-photos").remove([path]);
    await supabase.from("photos").delete().eq("id", id);
    fetchPhotos();
  };

  const deleteStudent = async (id, photoUrl) => {
    if (!confirm("Hapus siswa ini?")) return;
    try {
      if (photoUrl && photoUrl.includes("supabase.co/storage")) {
        const path = photoUrl.split("/class-photos/")[1];
        if (path) await supabase.storage.from("class-photos").remove([path]);
      }
      const tableToUse = (await supabase.from("students").select("id").limit(1))
        .error
        ? "participants"
        : "students";
      await supabase.from(tableToUse).delete().eq("id", id);
      fetchStudents();
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gallery_visitor");
    setVisitor({ name: "", photo: null });
  };

  // Background Image for Splash/Landing
  const [bgImage, setBgImage] = useState("");
  useEffect(() => {
    if (photos.length > 0) {
      const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
      setBgImage(randomPhoto.url);
    }
  }, [photos]);

  if (showSplash)
    return (
      <InitialSplash onComplete={() => setShowSplash(false)} photos={photos} />
    );
  if (!visitor.name)
    return (
      <LandingPage
        onEnter={(v) => {
          setVisitor(v);
          localStorage.setItem("gallery_visitor", JSON.stringify(v));
        }}
        photos={photos}
      />
    );

  return (
    <div className="app-container">
      <LoadingToast show={loading} message="Sedang memproses data..." />
      <nav>
        <div className="container nav-content">
          <div className="brand" onClick={() => setView("gallery")}>
            TWELVETWO
          </div>
          <div className="nav-desktop">
            <button className="nav-link" onClick={() => setView("gallery")}>
              Gallery
            </button>
            <button
              className="nav-link"
              onClick={() =>
                isAdmin ? setView("admin") : setIsLoginModalOpen(true)
              }
            >
              Admin
            </button>
            <button className="nav-link logout" onClick={handleLogout}>
              Selesai
            </button>
          </div>
          <div className="nav-mobile">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="camera-menu-btn"
              onClick={() => {
                setIsFlashing(true);
                setTimeout(() => setIsFlashing(false), 150);
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              <Camera size={24} />
              <span className="pdd-label">PDD</span>
            </motion.button>
          </div>
        </div>
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="menu-backdrop"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="pdd-sidebar glass"
              >
                <div className="sidebar-header">
                  <PDDLogo />
                  <button
                    className="close-sidebar"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="sidebar-links">
                  <button
                    onClick={() => {
                      setView("gallery");
                      setIsMenuOpen(false);
                    }}
                  >
                    Gallery
                  </button>
                  <button
                    onClick={() => {
                      isAdmin ? setView("admin") : setIsLoginModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    Admin Panel
                  </button>
                  <div className="sidebar-footer">
                    <button
                      className="logout-btn-sidebar"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

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
        {view === "admin" ? (
          <div className="fade-in admin-container">
            <div className="admin-grid">
              <div className="glass glass-card">
                <div className="admin-tabs">
                  <button
                    className={`tab-btn ${adminTab === "photos" ? "active" : ""}`}
                    onClick={() => setAdminTab("photos")}
                  >
                    Photos
                  </button>
                  <button
                    className={`tab-btn ${adminTab === "students" ? "active" : ""}`}
                    onClick={() => setAdminTab("students")}
                  >
                    Presensi
                  </button>
                </div>
                {adminTab === "photos" ? (
                  <form onSubmit={handlePhotoSubmit} className="admin-form">
                    <div className="form-group">
                      <label>Kategori</label>
                      <select
                        className="form-input"
                        value={newPhoto.class}
                        onChange={(e) =>
                          setNewPhoto({ ...newPhoto, class: e.target.value })
                        }
                      >
                        <option value="XI-F2">XI-F2</option>
                        <option value="XII-F2">XII-F2</option>
                        <option value="Aib">Aib</option>
                        <option value="Penghargaan">Penghargaan</option>
                        <option value="Video">Video</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Caption</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newPhoto.caption}
                        onChange={(e) =>
                          setNewPhoto({ ...newPhoto, caption: e.target.value })
                        }
                        placeholder="Keterangan..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Foto</label>
                      <label
                        className="photo-preview-block glass"
                        htmlFor="photo-upload"
                      >
                        {newPhoto.url ? (
                          <>
                            <img src={newPhoto.url} alt="Preview" />
                            <button
                              type="button"
                              className="remove-preview"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setNewPhoto({ ...newPhoto, url: "" });
                              }}
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <div className="upload-placeholder">
                            <Camera size={32} />
                            <span>Klik untuk pilih foto</span>
                          </div>
                        )}
                      </label>
                      <input
                        type="file"
                        id="photo-upload"
                        className="hidden-input"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () =>
                              setNewPhoto({ ...newPhoto, url: reader.result });
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full"
                    >
                      {loading ? (
                        <span className="btn-loading">
                          <span className="spinner"></span> Mengunggah...
                        </span>
                      ) : (
                        "Upload Foto"
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleStudentSubmit} className="admin-form">
                    <div className="form-group">
                      <label>Nama Siswa</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newStudent.name}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, name: e.target.value })
                        }
                        placeholder="Nama Lengkap"
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>No. Absen</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newStudent.attendance_no}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              attendance_no: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Style</label>
                        <select
                          className="form-input"
                          value={newStudent.gender}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              gender: e.target.value,
                            })
                          }
                        >
                          <option value="cowok">Cool (Cowo)</option>
                          <option value="cewek">Cute (Cewe)</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group checkbox-group">
                      <input
                        type="checkbox"
                        id="isTeacher"
                        checked={newStudent.is_teacher}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            is_teacher: e.target.checked,
                          })
                        }
                      />
                      <label htmlFor="isTeacher">Wali Kelas?</label>
                    </div>
                    <div className="form-group">
                      <label>Foto Profile</label>
                      <label
                        className="photo-preview-block glass"
                        htmlFor="student-photo-upload"
                      >
                        {newStudent.photo_url ? (
                          <>
                            <img src={newStudent.photo_url} alt="Preview" />
                            <button
                              type="button"
                              className="remove-preview"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setNewStudent({ ...newStudent, photo_url: "" });
                              }}
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <div className="upload-placeholder">
                            <Camera size={32} />
                            <span>Klik untuk pilih foto profile</span>
                          </div>
                        )}
                      </label>
                      <input
                        type="file"
                        id="student-photo-upload"
                        className="hidden-input"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () =>
                              setNewStudent({
                                ...newStudent,
                                photo_url: reader.result,
                              });
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full"
                    >
                      {loading ? (
                        <span className="btn-loading">
                          <span className="spinner"></span> Menyimpan...
                        </span>
                      ) : (
                        "Simpan Data"
                      )}
                    </button>
                  </form>
                )}
              </div>

              <div className="glass glass-card">
                <h3>
                  {adminTab === "photos" ? "Daftar Foto" : "Daftar Presensi"}
                </h3>
                <div className="admin-list-wrap">
                  {adminTab === "photos" ? (
                    photos.length > 0 ? (
                      <div className="admin-list">
                        {photos.map((p) => (
                          <div key={p.id} className="admin-item glass">
                            <img src={p.url} alt="" />
                            <div className="item-info">
                              {editingId === p.id ? (
                                <div className="edit-details-wrap">
                                  <input
                                    type="text"
                                    className="form-input mini-input"
                                    value={editCaption}
                                    onChange={(e) =>
                                      setEditCaption(e.target.value)
                                    }
                                    placeholder="Edit Caption..."
                                  />
                                  <div className="edit-category-wrap">
                                    <select
                                      className="form-input mini-select"
                                      value={editCategory}
                                      onChange={(e) =>
                                        setEditCategory(e.target.value)
                                      }
                                    >
                                      <option value="XI-F2">XI-F2</option>
                                      <option value="XII-F2">XII-F2</option>
                                      <option value="Aib">Aib</option>
                                      <option value="Penghargaan">
                                        Penghargaan
                                      </option>
                                      <option value="Video">Video</option>
                                    </select>
                                    <button
                                      className="save-btn"
                                      onClick={() =>
                                        updatePhotoDetails(
                                          p.id,
                                          editCategory,
                                          editCaption,
                                        )
                                      }
                                    >
                                      <ChevronRight size={16} />
                                    </button>
                                    <button
                                      className="cancel-btn"
                                      onClick={() => setEditingId(null)}
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p>{p.caption}</p>
                                  <div className="category-row">
                                    <small>{p.class}</small>
                                    <button
                                      className="edit-mini-btn"
                                      onClick={() => {
                                        setEditingId(p.id);
                                        setEditCategory(p.class);
                                        setEditCaption(p.caption);
                                      }}
                                    >
                                      <Sliders size={12} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => deletePhoto(p.id, p.storage_path)}
                              className="delete-btn"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        message="Belum ada foto gallery."
                        icon={ImageOff}
                      />
                    )
                  ) : students.length > 0 ? (
                    <div className="admin-list">
                      {students.map((s) => (
                        <div key={s.id} className="admin-item glass">
                          <div className="student-avatar-mini">
                            {s.photo_url ? (
                              <img src={s.photo_url} alt="" />
                            ) : s.is_teacher ? (
                              "🎓"
                            ) : (
                              s.attendance_no
                            )}
                          </div>
                          <div className="item-info">
                            <p>{s.name}</p>
                            <small
                              className={
                                s.gender === "cewek" ? "text-pink" : "text-blue"
                              }
                            >
                              {s.gender}
                            </small>
                          </div>
                          <button
                            onClick={() => deleteStudent(s.id, s.photo_url)}
                            className="delete-btn"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      message="Belum ada data presensi."
                      icon={UserX}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            <header className="gallery-header">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                Our Precious Memories
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-muted"
              >
                Welcome, {visitor.name}. Exploring memories in high fidelity.
              </motion.p>

              <div className="filter-system">
                <div className="filter-header">
                  <button
                    className={`hud-toggle glass ${isFilterExpanded ? "active" : ""}`}
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  >
                    <Sliders size={18} /> <span>HUD FILTER</span>
                  </button>
                </div>
                <AnimatePresence>
                  {isFilterExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      className="filter-bar glass"
                    >
                      {[
                        "All",
                        "XI-F2",
                        "XII-F2",
                        "Aib",
                        "Presensi",
                        "Penghargaan",
                        "Video",
                      ].map((f) => (
                        <button
                          key={f}
                          className={`filter-btn ${filter === f ? "active" : ""}`}
                          onClick={() => {
                            setFilter(f);
                            setIsFilterExpanded(false);
                          }}
                        >
                          {f}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </header>

            {loading ? (
              <div className="loading-state">
                <PhotoCollage photos={photos} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  Syncing Cloud...
                </div>
              </div>
            ) : filter === "Presensi" ? (
              students.length > 0 ? (
                <PresensiSection students={students} />
              ) : (
                <EmptyState
                  message="Belum ada data presensi yang terdaftar."
                  icon={UserX}
                />
              )
            ) : photos.filter((p) =>
                filter === "All" ? p.class !== "Aib" : p.class === filter
              ).length > 0 ? (
              <div className="gallery-grid">
                {photos
                  .filter((p) =>
                    filter === "All" ? p.class !== "Aib" : p.class === filter
                  )
                  .map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} />
                  ))}
              </div>
            ) : (
              <EmptyState
                message="Belum ada memori di kategori ini."
                icon={ImageOff}
              />
            )}
          </div>
        )}
      </main>

      {isLoginModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsLoginModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ textShadow: "0 0 20px rgba(124, 58, 237, 0.5)" }}>
              Admin Restricted
            </h3>
            <p
              className="text-muted"
              style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}
            >
              Secure decryption required
            </p>
            <input
              type="password"
              placeholder="Passcode"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                document.getElementById("login-enter").click()
              }
            />
            <div className="modal-btns">
              <button
                className="glass"
                onClick={() => setIsLoginModalOpen(false)}
              >
                Cancel
              </button>
              <button
                id="login-enter"
                className="btn-primary"
                onClick={() => {
                  const expected = import.meta.env.VITE_ADMIN_PASSWORD || "122";
                  if (password === expected) {
                    setIsAdmin(true);
                    setIsLoginModalOpen(false);
                    setView("admin");
                  } else {
                    alert(
                      `Wrong code! (Hint: Pastikan server di-restart jika baru mengubah .env)`,
                    );
                  }
                }}
              >
                Enter
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// --- Sub-Components ---
function PresensiSection({ students }) {
  const teacher = students.find((s) => s.is_teacher);
  const pupils = students.filter((s) => !s.is_teacher);
  return (
    <div className="presensi-section">
      {teacher && (
        <div className="teacher-section">
          <h2 className="section-title">Wali Kelas</h2>
          <div className="teacher-card-wrap">
            <StudentCard student={teacher} />
          </div>
        </div>
      )}
      <div className="pupils-section">
        <h2 className="section-title">Daftar Siswa</h2>
        <div className="student-grid">
          {pupils.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
          {Array.from({ length: Math.max(0, 35 - pupils.length) }).map(
            (_, i) => (
              <div key={`empty-${i}`} className="student-card empty glass">
                <div className="s-avatar">?</div>
                <div className="s-name">Absen #{pupils.length + i + 1}</div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

const StudentCard = React.memo(({ student }) => {
  const isCute = student.gender === "cewek";
  const isPDD = PDD_NUMBERS.includes(Number(student.attendance_no));

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={`student-card ${isCute ? "card-cute" : "card-cool"} ${isPDD ? "has-pdd" : ""}`}
    >
      <div className="s-photo">
        {student.photo_url ? (
          <img src={student.photo_url} alt="" loading="lazy" />
        ) : (
          <div className="s-placeholder">
            {student.is_teacher ? <GraduationCap /> : student.attendance_no}
          </div>
        )}
        {isPDD && (
          <div className="pdd-badge">
            <Zap size={10} fill="currentColor" />
            <span>PDD</span>
          </div>
        )}
      </div>
      <div className="s-details">
        {!student.is_teacher && (
          <span className="s-no">#{student.attendance_no}</span>
        )}
        <h4 className="s-name-text">{student.name}</h4>
        <div className="s-type">
          {isCute ? (
            <Heart size={12} fill="#f472b6" />
          ) : (
            <Zap size={12} fill="#60a5fa" />
          )}
          {isCute ? "Pretty" : "Cool"}
        </div>
      </div>
    </motion.div>
  );
});

function PhotoCard({ photo }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="photo-card glass"
    >
      <img src={photo.url} alt="" loading="lazy" />
      <div className="photo-meta">
        <p>{photo.caption}</p>
        <span className="tag">{photo.class}</span>
      </div>
    </motion.div>
  );
}

function InitialSplash({ onComplete, photos }) {
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setProg((p) => (p < 100 ? p + 2 : p)), 30);
    const end = setTimeout(onComplete, 3500);
    return () => {
      clearInterval(timer);
      clearTimeout(end);
    };
  }, [onComplete]);
  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      className="splash"
    >
      <PhotoCollage photos={photos} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <PDDLogo />
      </motion.div>
      <div className="loader-container-refined">
        <motion.div
          className="loader-fill-refined"
          initial={{ width: 0 }}
          animate={{ width: `${prog}%` }}
          transition={{ ease: "linear" }}
        />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="splash-sub-refined"
      >
        CRAFTING YOUR LEGACY
      </motion.p>
    </motion.div>
  );
}

function LandingPage({ onEnter, photos }) {
  const [name, setName] = useState("");
  return (
    <div className="landing">
      <PhotoCollage photos={photos} />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="landing-card glass"
      >
        <PDDLogo />
        <h1>TwelveTwo</h1>
        <p>Enter your name to explore the archive.</p>
        <div style={{ marginBottom: "1.5rem" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Identity"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name && onEnter({ name })}
          />
        </div>
        <button
          className="btn-primary w-full"
          onClick={() => name && onEnter({ name })}
        >
          Discover Archive
        </button>
      </motion.div>
    </div>
  );
}

export default App;
