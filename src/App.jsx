import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Trash2, Menu, X, ChevronLeft, ChevronRight, ChevronDown, Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './index.css';

function App() {
  const [images, setImages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [activePage, setActivePage] = useState('gallery');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const fileInputRef = useRef(null);
  const languageMenuRef = useRef(null);
  const topNavRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            url: reader.result,
            title: file.name
          }
        ]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const handleDelete = (idToRemove, e) => {
    e.stopPropagation();
    setImages(images.filter(img => img.id !== idToRemove));
    if (images[selectedIndex]?.id === idToRemove) {
      setSelectedIndex(null);
    }
  };

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsLanguageMenuOpen(false);
  };

  const languageOptions = [
    { code: 'en', label: t('languageEnglish') },
    { code: 'ml', label: t('languageMalayalam') },
    { code: 'hi', label: t('languageHindi') }
  ];

  const currentLanguage = i18n.resolvedLanguage || i18n.language || 'en';

  const sendToWhatsApp = () => {
    const phoneNumber = '9605006565';
    const name = document.getElementById('userName')?.value?.trim() || '';
    const email = document.getElementById('userEmail')?.value?.trim() || '';
    const project = document.getElementById('userProject')?.value?.trim() || '';

    if (name === '' || project === '') {
      alert('Please fill in your name and project details.');
      return;
    }

    const message = [
      'Hello Aji Construction!',
      '',
      '*New Project Inquiry*',
      '--------------------------',
      `*Name:* ${name}`,
      `*Email:* ${email}`,
      `*Project Details:* ${project}`
    ].join('\n');

    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    const newWindow = window.open(whatsappURL, '_blank');
    newWindow?.focus();
  };

  // Handle keyboard navigation for the lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handleNext, handlePrev]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setIsLanguageMenuOpen(false);
      }
      if (isNavOpen && topNavRef.current && !topNavRef.current.contains(event.target)) {
        setIsNavOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsLanguageMenuOpen(false);
        setIsNavOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNavOpen]);

  useEffect(() => {
    setIsNavOpen(false);
  }, [activePage]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const clearNav = () => {
      if (mq.matches) setIsNavOpen(false);
    };
    mq.addEventListener('change', clearNav);
    return () => mq.removeEventListener('change', clearNav);
  }, []);

  useEffect(() => {
    if (isNavOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isNavOpen]);

  const go = (page) => (e) => {
    e.preventDefault();
    setActivePage(page);
    setIsNavOpen(false);
  };

  return (
    <div className="app-container">
      <nav className="top-nav" ref={topNavRef} aria-label="Main">
        <div className="nav-brand">{t('navBrand')}</div>
        <div className="nav-center">{t('navTagline')}</div>
        <div
          className={`nav-links ${isNavOpen ? 'is-open' : ''}`}
          id="primary-navigation"
        >
          <a href="#" onClick={go('home')} className={activePage === 'home' ? 'active' : ''}>{t('navHome')}</a>
          <a href="#" onClick={go('about')} className={activePage === 'about' ? 'active' : ''}>{t('navAbout')}</a>
          <a href="#" onClick={go('gallery')} className={activePage === 'gallery' ? 'active' : ''}>{t('navGallery')}</a>
          <a href="#" onClick={go('contact')} className={activePage === 'contact' ? 'active' : ''}>{t('navContact')}</a>
        </div>
        <div className="nav-right">
          <div className="nav-controls">
            <div className="language-control" ref={languageMenuRef}>
              <Languages size={16} aria-hidden="true" />
              <span className="language-label">{t('languageLabel')}</span>
              <button
                type="button"
                className="language-trigger"
                aria-haspopup="menu"
                aria-expanded={isLanguageMenuOpen}
                onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
              >
                <span>{languageOptions.find((option) => option.code === currentLanguage)?.label || t('languageEnglish')}</span>
                <ChevronDown size={14} className={`language-arrow ${isLanguageMenuOpen ? 'open' : ''}`} aria-hidden="true" />
              </button>

              {isLanguageMenuOpen && (
                <div className="language-menu" role="menu" aria-label={t('languageLabel')}>
                  {languageOptions.map((option) => {
                    const isActive = option.code === currentLanguage;
                    return (
                      <button
                        key={option.code}
                        type="button"
                        className={`language-option ${isActive ? 'active' : ''}`}
                        role="menuitemradio"
                        aria-checked={isActive}
                        onClick={() => handleLanguageChange(option.code)}
                      >
                        <span>{option.label}</span>
                        {isActive && <Check size={14} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="menu-btn"
            aria-label={isNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isNavOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsNavOpen((prev) => !prev)}
          >
            {isNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {activePage === 'gallery' ? (
        <>
          <header className="page-header">
            <div className="header-left">
              <span className="pill">{t('ourProjects')}</span>
              <h1>{t('projectGallery')}</h1>
            </div>
            <div className="header-right">
              <p>{t('galleryIntro')}</p>
              <div className="upload-container">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="upload-input"
                />
                <button className="upload-btn" onClick={handleUploadClick}>
                  <Upload size={16} />
                  {t('uploadImage')}
                </button>
              </div>
            </div>
          </header>

          <main>
            {images.length === 0 ? (
              <div className="empty-state">
                <p>{t('noImages')}</p>
                <button className="upload-btn" onClick={handleUploadClick}>
                  {t('uploadNow')}
                </button>
              </div>
            ) : (
              <div className="gallery-grid">
                {images.map((image, index) => {
                  const patternIndex = index % 7;
                  let itemClass = "gallery-item";
                  
                  if (patternIndex === 0) itemClass += " span-2 row-span-3"; 
                  else if (patternIndex === 1) itemClass += " span-1 row-span-2"; 
                  else if (patternIndex === 2) itemClass += " span-1 row-span-3"; 
                  else if (patternIndex === 3) itemClass += " span-1 row-span-2"; 
                  else if (patternIndex === 4) itemClass += " span-1 row-span-2"; 
                  else if (patternIndex === 5) itemClass += " span-1 row-span-2"; 
                  else if (patternIndex === 6) itemClass += " span-2 row-span-2"; 

                  return (
                    <div 
                      key={image.id} 
                      className={itemClass}
                      onClick={() => setSelectedIndex(index)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={image.url} alt={image.title} loading="lazy" />
                      <div className="item-overlay">
                        <button 
                          className="delete-btn" 
                          onClick={(e) => handleDelete(image.id, e)}
                          title={t('deleteImage')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </>
      ) : (
        <>
          {activePage === 'home' && (
            <div className="page-content home-content">
              <span className="pill">{t('welcome')}</span>
              <h1 className="page-title">{t('homeTitle')}</h1>
              <p className="page-desc">{t('homeDesc')}</p>
              <button className="upload-btn" onClick={() => setActivePage('gallery')}>{t('viewOurWork')}</button>
            </div>
          )}

          {activePage === 'about' && (
            <div className="page-content about-content">
              <span className="pill">{t('aboutUs')}</span>
              <h1 className="page-title">{t('ourFoundation')}</h1>
              <p className="page-desc">{t('aboutDesc1')}</p>
              <p className="page-desc">{t('aboutDesc2')}</p>
              <section className="about-profile" aria-labelledby="about-profile-heading">
                <figure className="about-profile-figure">
                  <img
                    src="/team-ajith-nv.svg"
                    alt={t('aboutProfilePhotoAlt')}
                    width="640"
                    height="800"
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
                <div className="about-profile-text">
                  <span className="pill" id="about-profile-heading">
                    {t('aboutProfileHeading')}
                  </span>
                  <h2 className="about-profile-name">{t('aboutProfileName')}</h2>
                  <p className="about-profile-role">{t('aboutProfileRole')}</p>
                </div>
              </section>
            </div>
          )}

          {activePage === 'contact' && (
            <div className="page-content contact-content">
              <span className="pill">{t('getInTouch')}</span>
              <h1 className="page-title">{t('letsBuild')}</h1>
              <p className="page-desc">{t('contactDesc')}</p>
              <div className="contact-form">
                <input id="userName" type="text" placeholder={t('yourName')} className="contact-input" />
                <input id="userEmail" type="email" placeholder={t('emailAddress')} className="contact-input" />
                <textarea id="userProject" placeholder={t('projectDetails')} rows="5" className="contact-input"></textarea>
                <button id="sendBtn" type="button" className="upload-btn form-submit" onClick={sendToWhatsApp}>{t('sendMessage')}</button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedIndex !== null && (
        <div className="lightbox-overlay" onClick={() => setSelectedIndex(null)}>
          <button className="lightbox-close" onClick={() => setSelectedIndex(null)}>
            <X size={32} />
          </button>
          
          <button className="lightbox-nav lightbox-prev" onClick={handlePrev}>
            <ChevronLeft size={48} />
          </button>
          
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={images[selectedIndex].url} alt={images[selectedIndex].title} />
          </div>

          <button className="lightbox-nav lightbox-next" onClick={handleNext}>
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
