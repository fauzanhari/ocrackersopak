'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [activePage, setActivePage] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>({});

  const showPage = (pageId: string) => {
    setActivePage(pageId);
    window.scrollTo(0, 0);
    setTimeout(() => observeElements(), 100);
  };

  const observeElements = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      el.classList.remove('revealed');
      observer.observe(el);
    });
  };

  useEffect(() => {
    // Fetch user status
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});

    // Fetch site settings
    fetch('/api/admin/settings')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.settings) {
          setSiteSettings(data.settings);
        }
      })
      .catch(() => {});

    observeElements();
  }, [activePage]);

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      setUser(null);
      window.location.reload();
    }
  };

  const switchAuth = (type: string) => {
    document.querySelectorAll('.auth-tab').forEach((tab) => tab.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach((form) => form.classList.remove('active'));
    document.querySelector(`.auth-tab[data-type="${type}"]`)?.classList.add('active');
    document.getElementById(`${type}Form`)?.classList.add('active');
  };

  const showNotification = (text: string) => {
    const notif = document.getElementById('notification');
    const notifText = document.getElementById('notifText');
    if (notif && notifText) {
      notifText.textContent = text;
      notif.style.display = 'block';
      setTimeout(() => { notif.style.display = 'none'; }, 3000);
    }
  };

  const toggleMobileMenu = () => {
    const navLinks = document.querySelector('.nav-links') as HTMLElement | null;
    if (!navLinks) return;
    if (navLinks.style.display === 'flex') {
      navLinks.style.display = 'none';
    } else {
      navLinks.style.display = 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '70px';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.background = 'rgba(26, 10, 5, 0.98)';
      navLinks.style.padding = '2rem';
      navLinks.style.gap = '1.5rem';
      navLinks.style.borderBottom = '1px solid rgba(232, 93, 4, 0.3)';
    }
  };

  return (
    <>
      {/* Navigation */}
      <nav>
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); showPage('home'); }}>
          <Image src="/logo.png" alt="Logo" width={40} height={40} style={{ height: 40, width: 'auto' }} />
          O-Crackers
        </a>
        <ul className="nav-links">
          <li><a href="#" className={activePage === 'home' ? 'active' : ''} onClick={(e) => { e.preventDefault(); showPage('home'); }}>Beranda</a></li>
          <li><a href="#" className={activePage === 'products' ? 'active' : ''} onClick={(e) => { e.preventDefault(); showPage('products'); }}>Produk</a></li>
          <li><a href="#" className={activePage === 'story' ? 'active' : ''} onClick={(e) => { e.preventDefault(); showPage('story'); }}>Cerita</a></li>
          <li><a href="#" className={activePage === 'flavor' ? 'active' : ''} onClick={(e) => { e.preventDefault(); showPage('flavor'); }}>Rasa</a></li>
          <li><a href="#" className={activePage === 'loyalty' ? 'active' : ''} onClick={(e) => { e.preventDefault(); showPage('loyalty'); }}>O-Points</a></li>
        </ul>
        <div className="nav-actions">
          {user ? (
            <>
              <span className="user-greeting" style={{ marginRight: '10px', fontSize: '0.85rem', color: 'var(--secondary)' }}>
                Halo, {user.name || user.email.split('@')[0]} ({user.tokenBalance} Poin)
              </span>
              {user.isAdmin && (
                <Link href="/admin" className="nav-cta" style={{ marginRight: '5px', background: 'linear-gradient(135deg, #d62828, #780000)' }}>
                  <i className="fas fa-user-shield"></i> Admin Panel
                </Link>
              )}
              {!user.isAdmin && (
                <Link href="/dashboard" className="nav-cta">
                  <i className="fas fa-chart-line"></i> Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="nav-cta nav-cta-outline" style={{ marginLeft: '5px' }}>
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-cta nav-cta-outline">
                <i className="fas fa-sign-in-alt"></i> Masuk
              </Link>
              <Link href="/register" className="nav-cta">
                <i className="fas fa-user-plus"></i> Daftar
              </Link>
            </>
          )}
        </div>
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          <i className="fas fa-bars"></i>
        </button>
      </nav>

      {/* Page 1: Landing Page */}
      <div id="home" className={`page ${activePage === 'home' ? 'active' : ''}`}>
        {/* Hero */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-text">
              <h3>{siteSettings.heroSubtitle || "Khas Lombok !!"}</h3>
              <h1>
                {siteSettings.heroTitle ? (
                  siteSettings.heroTitle.includes("Opak-Opak") ? (
                    <>
                      {siteSettings.heroTitle.split("Opak-Opak")[0]}
                      <span>Opak-Opak {siteSettings.heroTitle.split("Opak-Opak")[1]}</span>
                    </>
                  ) : (
                    siteSettings.heroTitle
                  )
                ) : (
                  <>O-Crackers <span>Opak-Opak Ambon</span></>
                )}
              </h1>
              <p>{siteSettings.heroDescription || "Rasakan sensasi renyahnya Opak-Opak Ambon dengan bumbu Sate Tanjung autentik khas Lombok. Camilan tradisional dengan sentuhan modern yang bikin nagih!"}</p>
              <div className="hero-badges">
                <div className="badge"><i className="fas fa-pepper-hot"></i> Rasa Autentik</div>
                <div className="badge"><i className="fas fa-leaf"></i> Bahan Alami</div>
                <div className="badge"><i className="fas fa-award"></i> Khas Lombok</div>
              </div>
              <div className="hero-cta">
                <a href="#" className="btn-primary" onClick={(e) => { e.preventDefault(); showPage('products'); }}>
                  <i className="fas fa-shopping-bag"></i> Beli Sekarang
                </a>
                <a href="#" className="btn-secondary" onClick={(e) => { e.preventDefault(); showPage('products'); }}>
                  <i className="fas fa-eye"></i> Lihat Produk
                </a>
                <a href="#" className="btn-secondary" onClick={(e) => { e.preventDefault(); showPage('loyalty'); }}>
                  <i className="fas fa-gift"></i> Kumpulkan Poin
                </a>
              </div>
            </div>
            <div className="hero-image">
              <Image src="/brndatnjng.png" alt="O-Crackers Sate Tanjung" width={600} height={500} style={{ maxWidth: '100%', height: 'auto' }} />
              <div className="floating-elements">
                <div className="float-item" style={{ width: 80, height: 80, top: '10%', left: '10%' }}></div>
                <div className="float-item" style={{ width: 40, height: 40, top: '60%', right: '10%', animationDelay: '1s' }}></div>
                <div className="float-item" style={{ width: 60, height: 60, bottom: '20%', left: '20%', animationDelay: '2s' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <div className="section-header scroll-reveal">
            <h2>Keunggulan O-Crackers</h2>
            <p>Mengapa O-Crackers menjadi pilihan camilan favorit banyak orang?</p>
          </div>
          <div className="features-grid">
            <div className="feature-card scroll-reveal">
              <div className="feature-icon"><i className="fas fa-fire-alt"></i></div>
              <h3>Rasa Autentik Sate Tanjung</h3>
              <p>Bumbu rahasia Sate Tanjung asli Lombok dengan perpaduan manis, pedas, dan gurih yang sempurna. Setiap gigitan membawa Anda ke Pulau Lombok.</p>
            </div>
            <div className="feature-card scroll-reveal">
              <div className="feature-icon"><i className="fas fa-seedling"></i></div>
              <h3>Bahan Baku Premium</h3>
              <p>Dibuat dari singkong pilihan berkualitas tinggi dengan proses pengolahan higienis. Tanpa pengawet buatan dan MSG berlebih.</p>
            </div>
            <div className="feature-card scroll-reveal">
              <div className="feature-icon"><i className="fas fa-hand-holding-heart"></i></div>
              <h3>Tradisi &amp; Inovasi</h3>
              <p>Menggabungkan resep tradisional Opak Ambon dengan inovasi rasa modern. Camilan yang cocok untuk semua kalangan dan moment.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Page 2: Products */}
      <div id="products" className={`page ${activePage === 'products' ? 'active' : ''}`}>
        <section className="products-section">
          <div className="product-showcase">
            <div className="product-image-main scroll-reveal">
              <Image src="/prdktnjng.png" alt="O-Crackers Sate Tanjung" width={500} height={300} style={{ maxWidth: '100%', borderRadius: 20, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }} />
            </div>
            <div className="product-info scroll-reveal">
              <h2>O-Crackers Opak-Ambon</h2>
              <span className="variant-tag">Varian: Sate Tanjung</span>
              <p>O-Crackers adalah camilan inovatif berbahan dasar Opak-Opak Ambon tradisional yang dipadukan dengan bumbu Sate Tanjung khas Lombok. Renyah, gurih, dan kaya rasa. Diproduksi dengan standar kualitas tinggi untuk memastikan setiap kemasan memberikan pengalaman terbaik.</p>
              <div className="product-meta">
                <div className="meta-item"><div className="value">75gr</div><div className="label">Berat Bersih</div></div>
                <div className="meta-item"><div className="value">Halal</div><div className="label">Sertifikasi</div></div>
                <div className="meta-item"><div className="value">Lombok</div><div className="label">Asal Produk</div></div>
              </div>
              <div className="buy-buttons">
                <a href="https://shopee.co.id" target="_blank" rel="noopener noreferrer" className="btn-shopee">
                  <i className="fas fa-shopping-bag"></i> Beli di Shopee
                </a>
                <a href="https://wa.me/6285739787067" target="_blank" rel="noopener noreferrer" className="btn-wa">
                  <i className="fab fa-whatsapp"></i> Pesan via WA
                </a>
              </div>
            </div>
          </div>
          <div className="section-header scroll-reveal">
            <h2>Pilihan Varian Rasa</h2>
            <p>Jelajahi berbagai varian rasa O-Crackers yang menggugah selera</p>
          </div>
          <div className="variants-grid">
            <div className="variant-card active scroll-reveal">
              <div className="variant-img">
                <Image src="/tjn.png" alt="Sate Tanjung" width={100} height={100} style={{ width: '30%', height: 'auto' }} />
              </div>
              <div className="variant-info">
                <h4>Sate Tanjung</h4>
                <p>Rasa andalan dengan bumbu sate khas Lombok yang legendaris. Manis, pedas, dan gurih.</p>
              </div>
            </div>
            <div className="variant-card scroll-reveal">
              <div className="variant-img">
                <Image src="/ori.png" alt="Original" width={120} height={120} style={{ width: '43%', height: 'auto' }} />
              </div>
              <div className="variant-info">
                <h4>Original</h4>
                <p>Rasa kriuk dan renyah dimulut.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Page 3: Story */}
      <div id="story" className={`page ${activePage === 'story' ? 'active' : ''}`}>
        <section className="story-section">
          <div className="story-hero scroll-reveal">
            <h2>Cerita O-Crackers</h2>
            <p>Dari Lombok, Untuk Indonesia</p>
          </div>
          <div className="story-content">
            <div className="story-text scroll-reveal">
              <h3>Awal Mula Brand</h3>
              <p>O-Crackers lahir dari kecintaan mendalam terhadap kuliner tradisional Lombok. Berawal dari ide sederhana untuk memperkenalkan kelezatan Opak-Opak Ambon kepada generasi modern, kami memadukan resep warisan dengan inovasi rasa yang relevan.</p>
              <p>Setiap kemasan O-Crackers dibuat dengan penuh dedikasi, menggunakan bahan-bahan pilihan dari petani lokal dan bumbu autentik yang meracik cita rasa khas Pulau Seribu Masjid ini.</p>
            </div>
            <div className="story-visual scroll-reveal">
              <i className="fas fa-utensils"></i>
              <h3>Visi Kami</h3>
              <p>Menjadi pelopor camilan inovatif khas Lombok yang sehat, berkelanjutan, dan berdaya saing global dengan mengangkat kearifan lokal Sasak sebagai identitas budaya.</p>
            </div>
          </div>
          <div className="story-content">
            <div className="story-visual scroll-reveal">
              <i className="fas fa-mosque"></i>
              <h3>Budaya Lombok</h3>
              <p>Lombok bukan hanya soal pantai dan gunung, tapi juga kekayaan kuliner yang mendalam dan penuh sejarah.</p>
            </div>
            <div className="story-text scroll-reveal">
              <h3>Warisan Kuliner Lombok</h3>
              <p>Lombok dikenal dengan kekayaan rempah dan tradisi kuliner yang kuat. Dari Sate Tanjung yang legendaris hingga Plecing Kangkung yang segar, setiap hidangan memiliki karakter unik.</p>
              <p>O-Crackers hadir sebagai jembatan antara tradisi dan modernitas, membawa cita rasa lokal dalam format camilan yang praktis dan digemari semua kalangan.</p>
            </div>
          </div>
          <div className="section-header scroll-reveal" style={{ marginTop: '4rem' }}>
            <h2>Nilai-Nilai Kami</h2>
          </div>
          <div className="culture-grid">
            <div className="culture-card scroll-reveal">
              <i className="fas fa-heart"></i>
              <h4>Cinta Lokal</h4>
              <p>Kami bangga menggunakan bahan-bahan dari petani dan produsen lokal Lombok untuk mendukung perekonomian daerah.</p>
            </div>
            <div className="culture-card scroll-reveal">
              <i className="fas fa-shield-alt"></i>
              <h4>Kualitas Terjamin</h4>
              <p>Proses produksi dengan standar keamanan pangan tinggi untuk memastikan setiap gigitan aman dan lezat.</p>
            </div>
            <div className="culture-card scroll-reveal">
              <i className="fas fa-recycle"></i>
              <h4>Ramah Lingkungan</h4>
              <p>proses produksi yang memperhatikan keberlanjutan lingkungan.</p>
            </div>
          </div>
          <div className="section-header scroll-reveal" style={{ marginTop: '4rem' }}>
            <h2>Mengenal Budaya Lombok bersama O-Crackers</h2>
          </div>
          <div className="culture-card scroll-reveal">
            <h4>Legenda Putri Mandalika (Bau Nyale)</h4>
            <p>Dahulu kala di Kerajaan Tonjang Beru, Lombok, hiduplah seorang putri bernama Mandalika yang kecantikannya tersohor hingga ke berbagai negeri. Banyak pangeran datang melamarnya, namun persaingan mereka justru mengancam kedamaian rakyat karena risiko perang antar-kerajaan yang besar. Menghadapi dilema tersebut, sang putri memilih untuk tidak memihak satu pun pangeran demi menjaga persatuan. Setelah bersemedi, ia mengumpulkan semua pelamar dan rakyatnya di Pantai Seger pada dini hari yang ditentukan. Di hadapan khalayak, Putri Mandalika menyatakan bahwa ia ditakdirkan untuk menjadi milik semua orang tanpa terkecuali, lalu ia segera menceburkan diri ke dalam gulungan ombak laut selatan. Rakyat yang mencoba menyelamatkannya tidak menemukan tubuh sang putri, melainkan munculnya ribuan cacing laut berwarna-warni yang dikenal sebagai Nyale. Sejak saat itu, masyarakat Sasak rutin mengadakan tradisi Bau Nyale setiap tahun sebagai bentuk penghormatan atas pengorbanan sang putri yang diyakini telah menjelma menjadi cacing-cacing tersebut untuk membawa kesejahteraan.</p>
          </div>
          <br />
          <div className="culture-card scroll-reveal">
            <h4>Tradisi Merarik (Kawin Culik):</h4>
            <p>Tradisi Merarik atau kawin culik adalah adat pernikahan suku Sasak di Lombok yang unik, di mana calon mempelai pria &ldquo;menculik&rdquo; calon mempelai wanita dari rumah orang tuanya tanpa sepengetahuan mereka. Proses ini dilakukan pada malam hari dengan kesepakatan rahasia antara kedua sejoli, sebagai bentuk pembuktian keberanian dan harga diri sang pria dalam memperjuangkan cintanya. Setelah berhasil membawa lari sang gadis ke rumah kerabat pihak pria, pihak lelaki wajib mengirim utusan ke rumah orang tua wanita dalam waktu 24 jam untuk memberi tahu bahwa putri mereka telah &ldquo;diamankan,&rdquo; yang dikenal dengan istilah nyelabar. Setelah proses penculikan dan pemberitahuan selesai, kedua belah pihak keluarga akan bertemu untuk merundingkan aji krama (mahar) dan biaya pernikahan melalui proses formal yang disebut sorong serah. Meskipun terdengar ekstrem bagi orang luar, bagi masyarakat Sasak, Merarik dianggap lebih terhormat daripada sekadar melamar secara biasa karena menunjukkan keseriusan dan kemandirian sang pria. Tradisi ini diakhiri dengan ritual Nyongkolan, yaitu arak-arakan meriah di mana pengantin berjalan bersama keluarga dan kerabat menuju rumah pengantin wanita diiringi musik tradisional Gamelan atau Gendang Beleq untuk memperkenalkan pasangan baru tersebut kepada masyarakat.</p>
          </div>
          <br />
          <div className="culture-card scroll-reveal">
            <h4>Peresean:</h4>
            <p>Peresean adalah tradisi pertarungan kejantanan masyarakat suku Sasak yang mempertemukan dua orang pria (disebut pepadu) dalam sebuah laga adu ketangkasan. Dalam duel ini, para pepadu dipersenjatai dengan sebilah rotan sebagai alat pemukul dan sebuah perisai kulit sapi tebal berbentuk persegi yang disebut ende. Pertarungan ini bukan didasari atas rasa dendam, melainkan sebagai ajang pembuktian keberanian, kekuatan, dan ketangguhan mental seorang pria Sasak. Tradisi ini memiliki akar sejarah yang kuat, di mana dahulu Peresean digunakan sebagai upacara sakral untuk memohon hujan kepada Yang Maha Kuasa (sholat istisqa secara adat) pada musim kemarau. Darah yang menetes dari luka para pepadu dianggap sebagai simbol pengorbanan yang akan membawa kesuburan bagi tanah. Saat ini, Peresean tetap lestari sebagai atraksi budaya yang meriah, diiringi oleh musik gamelan tradisional yang membakar semangat serta wasit (pepincat) yang memastikan sportivitas tetap terjaga di tengah riuh rendah sorak-sorai penonton.</p>
          </div>
          <br />
          <div className="culture-card scroll-reveal">
            <h4>Nyongkolan:</h4>
            <p>Nyongkolan adalah puncak dari rangkaian prosesi pernikahan adat Sasak, di mana pasangan pengantin diarak layaknya raja dan ratu dari rumah mempelai pria menuju rumah mempelai wanita. Tujuan utama dari tradisi ini adalah untuk mengumumkan secara resmi kepada masyarakat luas dan keluarga pihak wanita bahwa pasangan tersebut telah sah menjadi suami istri. Iring-iringan ini biasanya dilakukan dengan berjalan kaki dalam jarak tertentu, menciptakan suasana yang sangat meriah dan penuh kekeluargaan. Selama prosesi, pengantin mengenakan pakaian adat kebesaran Sasak yang sangat detail dan mewah, diiringi oleh rombongan keluarga serta kerabat yang juga berpakaian tradisional. Kemeriahan Nyongkolan semakin terasa dengan dentuman musik Gendang Beleq atau musik kecimol yang mengiringi langkah para peserta arak-arakan. Setelah sampai di rumah tujuan, acara ditutup dengan silaturahmi antar kedua keluarga besar, yang menandai berakhirnya seluruh rangkaian ritual pernikahan adat tersebut.</p>
          </div>
        </section>
      </div>

      {/* Page 4: Flavor */}
      <div id="flavor" className={`page ${activePage === 'flavor' ? 'active' : ''}`}>
        <section className="flavor-section">
          <div className="flavor-hero">
            <div className="flavor-text scroll-reveal">
              <h2>{siteSettings.flavorTitle || "Sate Tanjung"}</h2>
              <p className="subtitle">{siteSettings.flavorSubtitle || "Legenda Rasa dari Lombok"}</p>
              <p>{siteSettings.flavorDescription || "Sate Tanjung adalah ikon kuliner Lombok yang telah dikenal sejak puluhan tahun lalu. Berbeda dengan sate pada umumnya, Sate Tanjung memiliki ciri khas bumbu manis-pedas dengan sensasi gurih yang mendalam."}</p>
              <p>O-Crackers berhasil menangkap esensi rasa Sate Tanjung dalam setiap lembar Opak-Opak Ambon yang renyah. Perpaduan kecap manis, cabai, dan rempah rahasia menciptakan pengalaman kuliner yang tak terlupakan.</p>
            </div>
            <div className="flavor-profile scroll-reveal">
              <h3 style={{ marginBottom: '2rem', color: 'var(--cream)' }}>Profil Rasa</h3>
              {[
                { label: 'Manis', pct: 85 },
                { label: 'Pedas', pct: 70 },
                { label: 'Gurih', pct: 90 },
                { label: 'Renyah', pct: 95 },
                { label: 'Aroma', pct: 88 },
              ].map(({ label, pct }) => (
                <div className="flavor-bar" key={label}>
                  <label><span>{label}</span><span>{pct}%</span></label>
                  <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }}></div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="section-header scroll-reveal">
            <h2>Keunikan Sate Tanjung</h2>
            <p>Apa yang membuat rasa ini begitu istimewa?</p>
          </div>
          <div className="sate-features">
            <div className="sate-feature scroll-reveal">
              <i className="fas fa-mortar-pestle"></i>
              <h4>Bumbu Rahasia</h4>
              <p>Racikan rempah turun-temurun yang hanya dikenal oleh para penjual Sate Tanjung asli.</p>
            </div>
            <div className="sate-feature scroll-reveal">
              <i className="fas fa-fire"></i>
              <h4>Proses Pembuatan yang unik</h4>
              <p>Singkong diproses dengan teknik khusus untuk menghasilkan tekstur yang sempurna dan mampu menyerap bumbu dengan optimal.</p>
            </div>
            <div className="sate-feature scroll-reveal">
              <i className="fas fa-balance-scale"></i>
              <h4>Keseimbangan Sempurna</h4>
              <p>Perbandingan manis, pedas, dan gurih yang dijaga dengan presisi tinggi.</p>
            </div>
            <div className="sate-feature scroll-reveal">
              <i className="fas fa-history"></i>
              <h4>Warisan Sejarah</h4>
              <p>Rasa yang telah bertahan puluhan tahun dan menjadi identitas kuliner Lombok.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Page 5: Loyalty */}
      <div id="loyalty" className={`page ${activePage === 'loyalty' ? 'active' : ''}`}>
        <section className="loyalty-section">
          <div className="loyalty-hero scroll-reveal">
            <i className="fas fa-crown"></i>
            <h2>O-Points</h2>
            <p>Kumpulkan poin dari setiap pembelian O-Crackers dan tukarkan dengan reward menarik. Semakin banyak bertransaksi, semakin besar keuntungan Anda!</p>
          </div>
          <div className="section-header scroll-reveal">
            <h2>Cara Kerja</h2>
            <h3 style={{ color: 'var(--secondary)', fontWeight: 400 }}>Mudah dan Cepat</h3>
          </div>
          <div className="how-it-works">
            {[
              { n: 1, title: 'Beli Produk', desc: 'Beli O-Crackers di Shopee, Tokopedia, atau langsung via WhatsApp.' },
              { n: 2, title: 'Input Kode', desc: 'Masukkan kode unik yang tertera di dalam kemasan ke dashboard Anda.' },
              { n: 3, title: 'Kumpulkan Poin', desc: 'Setiap kode bernilai poin tertentu. Kumpulkan sebanyak-banyaknya!' },
              { n: 4, title: 'Tukar Reward', desc: 'Tukarkan poin Anda dengan produk gratis, merchandise, atau diskon spesial.' },
            ].map(({ n, title, desc }) => (
              <div className="step-card scroll-reveal" key={n}>
                <div className="step-number">{n}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
          <div className="section-header scroll-reveal">
            <h2>Reward Tersedia</h2>
            <p>Pilih reward favorit Anda</p>
          </div>
          <div className="rewards-grid">
            {[
              { icon: 'fa-box', name: 'O-Crackers Gratis', pts: '1000 O-Points' },
              { icon: 'fa-tshirt', name: 'Tote Bag Eksklusif', pts: '750 O-Points' },
              { icon: 'fa-tags', name: 'Diskon 50%', pts: '500 O-Points' },
              { icon: 'fa-gift', name: 'Paket Bundle Spesial', pts: '1.500 O-Points' },
              { icon: 'fa-plane', name: 'Trip ke Lombok', pts: '15.000 O-Points' },
            ].map(({ icon, name, pts }) => (
              <div className="reward-card scroll-reveal" key={name}>
                <div className="reward-icon"><i className={`fas ${icon}`}></i></div>
                <div className="reward-info"><h4>{name}</h4><p className="points">{pts}</p></div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            {user ? (
              user.isAdmin ? (
                <Link href="/admin" className="btn-primary">
                  <i className="fas fa-user-shield"></i> Ke Admin Panel
                </Link>
              ) : (
                <Link href="/dashboard" className="btn-primary">
                  <i className="fas fa-ticket-alt"></i> Tukar Poin Sekarang
                </Link>
              )
            ) : (
              <Link href="/register" className="btn-primary">
                <i className="fas fa-sign-in-alt"></i> Gabung Sekarang
              </Link>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-brand">
            <h3>O-Crackers</h3>
            <p>Opak-Opak Ambon Khas Lombok dengan cita rasa autentik Sate Tanjung. Camilan tradisional modern untuk semua kalangan.</p>
            <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
              <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)' }}></i> Jl. Mapreo Perumahan Mutiara Residence Blok C6
            </p>
          </div>
          <div className="footer-links">
            <h4>Menu</h4>
            <a onClick={() => showPage('home')}>Beranda</a>
            <a onClick={() => showPage('products')}>Produk</a>
            <a onClick={() => showPage('story')}>Cerita Brand</a>
            <a onClick={() => showPage('flavor')}>Varian Rasa</a>
          </div>
          <div className="footer-links">
            <h4>Layanan</h4>
            <a onClick={() => showPage('loyalty')}>O-Points</a>
            <Link href="/login">Akun Saya</Link>
            <a href="#">FAQ</a>
            <a href="#">Kontak Kami</a>
          </div>
          <div className="footer-links">
            <h4>Ikuti Kami</h4>
            <a href="#"><i className="fab fa-instagram"></i> @ocrackers</a>
            <a href="#"><i className="fab fa-tiktok"></i> @ocrackers</a>
            <a href="#"><i className="fab fa-facebook"></i> O-Crackers</a>
            <a href="#"><i className="fab fa-youtube"></i> O-Crackers TV</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>2026 O-Crackers. All rights reserved.</p>
        </div>
      </footer>

      {/* Notification */}
      <div id="notification" style={{ display: 'none', position: 'fixed', top: 100, right: 20, background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', padding: '1rem 2rem', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 9999 }}>
        <i className="fas fa-check-circle"></i> <span id="notifText"></span>
      </div>
    </>
  );
}
