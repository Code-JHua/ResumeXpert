import React, { useContext } from 'react'
import { UserContext } from '../context/UserContext.jsx'
import { landingPageStyles } from '../assets/dummystyle'
import { LayoutTemplate, Menu, X, Zap, Download, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileInfoCard } from '../components/Cards.jsx';
import Modal from '../components/Modal.jsx';
import Login from '../components/Login.jsx';
import SignUp from '../components/SignUp.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import { useTranslation } from 'react-i18next';



const LandingPage = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');

  const handleCTA = () => {
    if (!user) {
      setOpenAuthModal(true);
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <div className={landingPageStyles.container}>
      {/* header */}
      <header className={landingPageStyles.header}>
        <div className={landingPageStyles.headerContainer}>
          <div className={landingPageStyles.logoContainer}>
            <div className={landingPageStyles.logoIcon}>
              <LayoutTemplate className={landingPageStyles.logoIconInner} />
            </div>
            <span className={landingPageStyles.logoText}>
              {t('common.appName')}
            </span>
          </div>

          {/* mobile menu btn */}
          <div className='flex items-center gap-2 md:hidden'>
            <LanguageSelector
              variant='compact'
              className='!px-3 !py-2 shadow-md shadow-violet-200/60'
            />
            <button className={landingPageStyles.mobileMenuButton} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ?
                <X className={landingPageStyles.mobileMenuIcon} size={24} /> :
                <Menu className={landingPageStyles.mobileMenuIcon} size={24} />
              }
            </button>
          </div>

          {/* desktop navigation */}
          <div className='hidden md:flex items-center gap-3'>
            <LanguageSelector />
            {user ? (
              <ProfileInfoCard />
            ) : (
              <button className={landingPageStyles.desktopAuthButton}
                onClick={() => setOpenAuthModal(true)}>
                <div className={landingPageStyles.desktopAuthButtonOverlay}></div>
                <span className={landingPageStyles.desktopAuthButtonText}>{t('common.getStarted')}</span>
              </button>
            )
            }
          </div>
        </div>

        {/* mobile menu */}
        {mobileMenuOpen && (
          <div className={landingPageStyles.mobileMenu}>
            <div className={landingPageStyles.mobileMenuContainer}>
              {user ? (
                <div className={landingPageStyles.mobileUserInfo}>
                  <div className={landingPageStyles.mobileUserWelcome}>
                    {t('landing.mobileMenu.welcomeBack')}
                  </div>
                  <button className={landingPageStyles.mobileDashboardButton} onClick={() => {
                    navigate('/dashboard')
                    setMobileMenuOpen(false)
                  }}>
                    {t('landing.mobileMenu.goToDashboard')}
                  </button>
                </div>
              ) : (
                <button className={landingPageStyles.mobileAuthButton} onClick={() => {
                  setOpenAuthModal(true)
                  setMobileMenuOpen(false)
                }}>
                  {t('common.getStarted')}
                </button>
              )}

              <div className='pt-2 border-t border-violet-100/80'>
                <LanguageSelector className='w-full justify-center shadow-md shadow-violet-200/50' />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* main content */}
      <main className={landingPageStyles.main}>
        <section className={landingPageStyles.heroSection}>
          <div className={landingPageStyles.heroGrid}>
            {/* left content */}
            <div className={landingPageStyles.heroLeft}>
              <div className={landingPageStyles.tagline}>
                {t('landing.tagline')}
              </div>

              <h1 className={landingPageStyles.heading}>
                <span className={landingPageStyles.headingText}>{t('landing.headingCraft')}</span>
                <span className={landingPageStyles.headingGradient}>{t('landing.headingProfessional')}</span>
                <span className={landingPageStyles.headingText}>{t('landing.headingResumes')}</span>
              </h1>

              <p className={landingPageStyles.description}>
                {t('landing.description')}
              </p>

              <div className={landingPageStyles.ctaButtons}>
                <button className={landingPageStyles.primaryButton} onClick={handleCTA}>
                  <div className={landingPageStyles.primaryButtonOverlay}></div>
                  <span className={landingPageStyles.primaryButtonContent}>
                    {t('landing.startBuilding')}
                    <ArrowRight className={landingPageStyles.primaryButtonIcon} size={18} />
                  </span>
                </button>

                <button className={landingPageStyles.secondaryButton} onClick={handleCTA}>
                  {t('landing.viewTemplates')}
                </button>
              </div>

              {/* stats grid */}
              <div className={landingPageStyles.statsContainer}>
                {[
                  { value: '50K+', label: t('landing.stats.resumes'), gradient: 'from-violet-600 to-fuchsia-600' },
                  { value: '4.9★', label: t('landing.stats.rating'), gradient: 'from-orange-500 to-red-500' },
                  { value: '5 Min', label: t('landing.stats.buildTime'), gradient: 'from-emerald-500 to-teal-500' }
                ].map((stat, idx) => (
                  <div className={landingPageStyles.statItem} key={idx}>
                    <div className={`${landingPageStyles.statNumber} ${stat.gradient}`}>
                      {stat.value}
                    </div>
                    <div className={landingPageStyles.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - SVG Illustration */}
            <div className={landingPageStyles.heroIllustration}>
              <div className={landingPageStyles.heroIllustrationBg}></div>
              <div className={landingPageStyles.heroIllustrationContainer}>
                <svg
                  viewBox="0 0 400 500"
                  className={landingPageStyles.svgContainer}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Background */}
                  <defs>
                    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#f8fafc" />
                    </linearGradient>
                  </defs>

                  {/* SVG elements */}
                  <rect x="50" y="50" width="300" height="400" rx="20" className={landingPageStyles.svgRect} />
                  <circle cx="120" cy="120" r="25" className={landingPageStyles.svgCircle} />
                  <rect x="160" y="105" width="120" height="8" rx="4" className={landingPageStyles.svgRectPrimary} />
                  <rect x="160" y="120" width="80" height="6" rx="3" className={landingPageStyles.svgRectSecondary} />
                  <rect x="70" y="170" width="260" height="4" rx="2" className={landingPageStyles.svgRectLight} />
                  <rect x="70" y="185" width="200" height="4" rx="2" className={landingPageStyles.svgRectLight} />
                  <rect x="70" y="200" width="240" height="4" rx="2" className={landingPageStyles.svgRectLight} />
                  <rect x="70" y="230" width="60" height="6" rx="3" className={landingPageStyles.svgRectPrimary} />
                  <rect x="70" y="250" width="40" height="15" rx="7" className={landingPageStyles.svgRectSkill} />
                  <rect x="120" y="250" width="50" height="15" rx="7" className={landingPageStyles.svgRectSkill} />
                  <rect x="180" y="250" width="45" height="15" rx="7" className={landingPageStyles.svgRectSkill} />
                  <rect x="70" y="290" width="80" height="6" rx="3" className={landingPageStyles.svgRectSecondary} />
                  <rect x="70" y="310" width="180" height="4" rx="2" className={landingPageStyles.svgRectLight} />
                  <rect x="70" y="325" width="150" height="4" rx="2" className={landingPageStyles.svgRectLight} />
                  <rect x="70" y="340" width="200" height="4" rx="2" className={landingPageStyles.svgRectLight} />

                  {/* Animated elements */}
                  <circle cx="320" cy="100" r="15" className={landingPageStyles.svgAnimatedCircle}>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0,0; 0,-10; 0,0"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <rect x="30" y="300" width="12" height="12" rx="6" className={landingPageStyles.svgAnimatedRect}>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0,0; 5,0; 0,0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </rect>
                  <polygon points="360,200 370,220 350,220" className={landingPageStyles.svgAnimatedPolygon}>
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0 360 210; 360 360 210; 0 360 210"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </polygon>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* features section */}
        <section className={landingPageStyles.featuresSection}>
          <div className={landingPageStyles.footerContainer}>
            <div className={landingPageStyles.featuresHeader}>
              <h2 className={landingPageStyles.featuresTitle}>
                {t('landing.features.title')} <span className={landingPageStyles.featuresTitleGradient}>{t('common.appName')}</span>
              </h2>
              <p className={landingPageStyles.featureDescription}>
                {t('landing.features.subtitle')}
              </p>
            </div>

            <div className={landingPageStyles.featuresGrid}>
              {[
                {
                  icon: <Zap className={landingPageStyles.featureIcon} />,
                  title: t('landing.features.lightningFast.title'),
                  description: t('landing.features.lightningFast.description'),
                  gradient: landingPageStyles.featureIconViolet,
                  bg: landingPageStyles.featureCardViolet
                },
                {
                  icon: <LayoutTemplate className={landingPageStyles.featureIcon} />,
                  title: t('landing.features.proTemplates.title'),
                  description: t('landing.features.proTemplates.description'),
                  gradient: landingPageStyles.featureIconFuchsia,
                  bg: landingPageStyles.featureCardFuchsia
                },
                {
                  icon: <Download className={landingPageStyles.featureIcon} />,
                  title: t('landing.features.instantExport.title'),
                  description: t('landing.features.instantExport.description'),
                  gradient: landingPageStyles.featureIconOrange,
                  bg: landingPageStyles.featureCardOrange
                }
              ].map((feature, index) => (
                <div key={index} className={landingPageStyles.featureCard}>
                  <div className={landingPageStyles.featureCardHover}></div>
                  <div className={`${landingPageStyles.featureCardContent} ${feature.bg}`}>
                    <div className={`${landingPageStyles.featureIconContainer} ${feature.gradient}`}>
                      {feature.icon}
                    </div>
                    <h3 className={landingPageStyles.featureTitle}>
                      {feature.title}
                    </h3>
                    <p className={landingPageStyles.featureDescription}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className={landingPageStyles.ctaSection}>
          <div className={landingPageStyles.ctaContainer}>
            <div className={landingPageStyles.ctaCard}>
              <div className={landingPageStyles.ctaCardBg}></div>
              <div className={landingPageStyles.ctaCardContent}>
                <h2 className={landingPageStyles.ctaTitle}>
                  {t('landing.cta.title')} <span className={landingPageStyles.ctaTitleGradient}>{t('landing.cta.highlight')}</span>
                </h2>
                <p className={landingPageStyles.ctaDescription}>
                  {t('landing.cta.subtitle')}
                </p>
                <button className={landingPageStyles.ctaButton} onClick={handleCTA}>
                  <div className={landingPageStyles.ctaButtonOverlay}></div>
                  <span className={landingPageStyles.ctaButtonText}>
                    {t('landing.cta.button')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* footer section */}
      <footer className={landingPageStyles.footer}>
        <div className={landingPageStyles.footerContainer}>
          <p className={landingPageStyles.footerText}>
            {t('landing.footer.craftedBy')} <span className={landingPageStyles.footerHeart}>❤️</span> by{' '}
            <span className={landingPageStyles.footerLink}>Hua</span>
          </p>
        </div>
      </footer>

      {/* modal for login and signup */}
      <Modal isOpen={openAuthModal} onClose={() => {
        setOpenAuthModal(false)
        setCurrentPage('login')
      }} hideHeader>
        <div>
          {currentPage === 'login' && <Login setCurrentPage={setCurrentPage} />}
          {currentPage === 'signup' && <SignUp setCurrentPage={setCurrentPage} />}
        </div>
      </Modal>
    </div>
  )
}

export default LandingPage
