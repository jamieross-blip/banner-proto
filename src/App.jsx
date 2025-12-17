import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'fabtcg-banner-config-v1'

const MEDIA_TARGETS = {
  desktop: {
    label: 'Desktop (1920 × 1080)',
    width: 1920,
    height: 1080,
    ratio: 16 / 9,
    ratioLabel: '16:9 widescreen',
  },
  mobile: {
    label: 'Mobile (800 × 1200)',
    width: 800,
    height: 1200,
    ratio: 800 / 1200,
    ratioLabel: '3:4 portrait',
  },
}

const DEFAULT_MEDIA = {
  desktop: {
    kind: 'image',
    src: 'https://images.unsplash.com/photo-1618005198919-d3d4b8880c5d?auto=format&fit=crop&w=1920&q=80',
    label: 'Default widescreen illustration',
    sourceType: 'default',
    fileSize: null,
    meta: {
      width: 1920,
      height: 1080,
      ratioValue: 16 / 9,
      ratioLabel: '16:9',
      warnings: [],
      status: 'ok',
    },
  },
  mobile: {
    kind: 'image',
    src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    label: 'Default portrait artwork',
    sourceType: 'default',
    fileSize: null,
    meta: {
      width: 800,
      height: 1200,
      ratioValue: 800 / 1200,
      ratioLabel: '3:4',
      warnings: [],
      status: 'ok',
    },
  },
}

const fontOptions = [
  'Playfair Display',
  'Inter',
  'Poppins',
  'Montserrat',
  'Space Grotesk',
  'Cormorant Garamond',
]

const overlayPositions = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'center-left', label: 'Center left' },
  { value: 'center-right', label: 'Center right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
]

const transitionOptions = [
  { value: 'soft-fade', label: 'Soft fade' },
  { value: 'angled', label: 'Angled slice' },
  { value: 'wave', label: 'Wave flourish' },
]

const buttonStyles = [
  { value: 'solid', label: 'Solid' },
  { value: 'ghost', label: 'Ghost' },
  { value: 'soft', label: 'Soft gradient' },
]

const overlayTypes = [
  { value: 'text', label: 'Text + CTA' },
  { value: 'image', label: 'Image overlay' },
]

const getDefaultMedia = (key) => JSON.parse(JSON.stringify(DEFAULT_MEDIA[key]))

const buildDefaultConfig = () => ({
  title: 'Monarch: Prism Ascendant',
  subtitle: 'First edition cold foil hero drop',
  tagline: 'Featured product',
  overlayType: 'text',
  overlayImage: '',
  overlayImageAlt: 'Overlay graphic',
  overlayBackground: 'rgba(15, 23, 42, 0.72)',
  overlayShadow: true,
  overlayGlow: true,
  overlayBackgroundBlur: 18,
  overlayPositionDesktop: 'bottom-left',
  mobileTextAlignment: 'center',
  titleSize: 54,
  subtitleSize: 22,
  taglineSize: 14,
  titleFont: 'Playfair Display',
  bodyFont: 'Inter',
  textColor: '#ffffff',
  subtitleColor: '#e2e8f0',
  accentColor: '#fcd34d',
  buttonText: 'Explore drop',
  buttonUrl: 'https://fabtcg.com/products',
  buttonStyle: 'solid',
  showOverlayBackground: true,
  showOverlayBorder: false,
  backgroundTint: 'rgba(2, 6, 23, 0.35)',
  transitions: { style: 'soft-fade', color: '#fcd34d' },
  useUnifiedMedia: false,
  videoAutoplay: true,
  videoMuted: true,
  allowVideoSound: false,
  mobileOverlayInset: 16,
  adminNotes: 'Swap hero art when releases change. Use mobile preview before publishing.',
  media: {
    desktop: getDefaultMedia('desktop'),
    mobile: getDefaultMedia('mobile'),
  },
})

function App() {
  const [config, setConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          return {
            ...buildDefaultConfig(),
            ...parsed,
            media: {
              desktop: parsed?.media?.desktop ?? getDefaultMedia('desktop'),
              mobile: parsed?.media?.mobile ?? getDefaultMedia('mobile'),
            },
          }
        } catch (error) {
          console.warn('Unable to load stored banner config', error)
        }
      }
    }
    return buildDefaultConfig()
  })
  const [previewDevice, setPreviewDevice] = useState('desktop')
  const [previewFullscreen, setPreviewFullscreen] = useState(false)
  const objectUrls = useRef([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    }
  }, [config])

  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const original = document.body.style.overflow
      document.body.style.overflow = previewFullscreen ? 'hidden' : original || ''
      return () => {
        document.body.style.overflow = original
      }
    }
    return undefined
  }, [previewFullscreen])

  const previewMedia = useMemo(() => {
    if (previewDevice === 'mobile' && !config.useUnifiedMedia) {
      return config.media.mobile
    }
    return config.media.desktop
  }, [config.media.desktop, config.media.mobile, config.useUnifiedMedia, previewDevice])

  const updateConfig = (updates) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  const updateMedia = (key, updates) => {
    setConfig((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        [key]: { ...prev.media[key], ...updates },
      },
    }))
  }

  const handleMediaUpload = (targetKey, file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    objectUrls.current.push(url)
    const kind = file.type.startsWith('video') ? 'video' : 'image'
    const baseMeta = { loading: true, warnings: [], ratioLabel: '', status: 'pending' }
    updateMedia(targetKey, {
      kind,
      src: url,
      label: file.name,
      fileSize: file.size,
      sourceType: 'upload',
      meta: baseMeta,
    })

    const target = MEDIA_TARGETS[targetKey]
    const inspector = kind === 'image' ? evaluateImageFile : evaluateVideoFile
    inspector(file, target).then((meta) => {
      updateMedia(targetKey, {
        meta,
      })
    })
  }

  const resetMediaToDefault = (key) => {
    updateMedia(key, getDefaultMedia(key))
  }

  const handleOverlayImageUpload = (file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    objectUrls.current.push(url)
    updateConfig({ overlayImage: url, overlayImageAlt: file.name })
  }

  const handleConfigField = (field, value) => {
    updateConfig({ [field]: value })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">FABTCG · banner prototype</p>
          <h1>Product Header / Banner Builder</h1>
          <p className="lede">
            Configure the hero block editors will use on product pages. Tune imagery, copy,
            overlay styling, and transitions, then preview the output for mobile and desktop.
          </p>
        </div>
        <button className="ghost" type="button" onClick={() => updateConfig(buildDefaultConfig())}>
          Reset to recommended defaults
        </button>
      </header>

      <div className="app-layout">
        <BannerPreview
          config={config}
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          media={previewMedia}
          isFullscreen={previewFullscreen}
          onFullscreenChange={setPreviewFullscreen}
        />

        <AdminPanel
          config={config}
          onFieldChange={handleConfigField}
          onMediaUpload={handleMediaUpload}
          onOverlayImageUpload={handleOverlayImageUpload}
          onResetMedia={resetMediaToDefault}
          onConfigChange={updateConfig}
        />
      </div>
    </div>
  )
}

function BannerPreview({ config, device, onDeviceChange, media, isFullscreen, onFullscreenChange }) {
  if (isFullscreen) {
    return (
      <FullScreenPreviewPage
        config={config}
        device={device}
        media={media}
        onDeviceChange={onDeviceChange}
        onExit={() => onFullscreenChange(false)}
      />
    )
  }

  return (
    <section className={`panel preview-panel ${isFullscreen ? 'preview-fullscreen' : ''}`}>
      <div className="panel-heading">
        <div>
          <h2>Live preview</h2>
          <p>Toggle devices to validate layout before handing to editors.</p>
        </div>
        <div className="preview-controls">
          <div className="device-toggle">
            {['desktop', 'mobile'].map((item) => (
              <button
                key={item}
                type="button"
                className={item === device ? 'active' : ''}
                onClick={() => onDeviceChange(item)}
              >
                {item === 'desktop' ? 'Desktop 16:9' : 'Mobile 3:4'}
              </button>
            ))}
          </div>
          <button className="ghost" type="button" onClick={() => onFullscreenChange(!isFullscreen)}>
            {isFullscreen ? 'Exit full screen' : 'Full screen preview'}
          </button>
        </div>
      </div>

      <BannerStage config={config} device={device} media={media} />

      <TransitionShowcase transitions={config.transitions} />

      <details className="preview-notes">
        <summary>Editor guidance</summary>
        <p>{config.adminNotes}</p>
      </details>
    </section>
  )
}

function TransitionIndicator({ transitions }) {
  return (
    <div className={`transition transition-${transitions.style}`} style={{ color: transitions.color }}>
      <span />
      <p>{transitions.style === 'soft-fade' ? 'Fade to next block' : transitions.style === 'angled' ? 'Angled reveal' : 'Wave transition'}</p>
    </div>
  )
}

function TransitionShowcase({ transitions }) {
  const labelMap = {
    'soft-fade': 'Soft fade blend',
    angled: 'Angled slice reveal',
    wave: 'Wave flourish',
  }
  const detailMap = {
    'soft-fade': 'Ideal for calm content transitions.',
    angled: 'Adds energy between sections.',
    wave: 'Organic motion for playful drops.',
  }
  const bridgeLabel = transitions.style === 'soft-fade' ? 'Fade' : transitions.style === 'angled' ? 'Slice' : 'Wave'
  return (
    <div className="transition-showcase">
      <div className="transition-preview-strip" style={{ '--transition-color': transitions.color }}>
        <span className="transition-chip">Hero banner</span>
        <span className={`transition-chip transition-chip-accent transition-${transitions.style}`}>{bridgeLabel}</span>
        <span className="transition-chip">Next block</span>
      </div>
      <div className={`transition-visual transition-${transitions.style}`} style={{ '--transition-color': transitions.color }}>
        <div className="transition-block current">
          <p>Hero banner</p>
        </div>
        <div className="transition-bridge">{bridgeLabel}</div>
        <div className="transition-block next">
          <p>Next block</p>
        </div>
      </div>
      <p className="meta">
        <strong>{labelMap[transitions.style]}</strong> · {detailMap[transitions.style]}
      </p>
    </div>
  )
}

function BannerStage({ config, device, media }) {
  const isVideo = media.kind === 'video'
  const overlayStyles = device === 'mobile' ? getMobileOverlayStyles(config) : getDesktopOverlayStyles(config)
  const overlayClass = ['overlay-surface']
  if (config.overlayShadow) overlayClass.push('overlay-shadow')
  if (config.overlayGlow) overlayClass.push('overlay-glow')
  if (!config.showOverlayBackground) overlayClass.push('overlay-transparent')

  return (
    <div className={`banner-stage banner-${device}`} style={{ aspectRatio: device === 'desktop' ? '16 / 9' : '3 / 4' }}>
      <div className="media-layer" aria-label="Banner media">
        {isVideo ? (
          <video
            key={media.src}
            src={media.src}
            poster={media.poster}
            className="banner-media"
            autoPlay={config.videoAutoplay}
            muted={config.videoMuted || !config.allowVideoSound}
            loop
            playsInline
            controls={!config.videoAutoplay}
          />
        ) : (
          <img
            src={media.src}
            alt={media.label}
            className="banner-media"
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="media-tint" style={{ background: config.backgroundTint }} aria-hidden="true" />
      </div>

      <div className="overlay-layer" style={overlayStyles.layer}>
        <div
          className={overlayClass.join(' ')}
          style={{
            ...overlayStyles.surface,
            fontFamily: `${config.titleFont}, ${config.bodyFont}, sans-serif`,
            color: config.textColor,
            borderColor: config.showOverlayBorder ? config.accentColor : 'transparent',
          }}
        >
          {config.overlayType === 'text' ? (
            <div className="copy-stack" style={{ textAlign: device === 'mobile' ? config.mobileTextAlignment : 'left' }}>
              {config.tagline && (
                <p
                  className="eyebrow"
                  style={{
                    color: config.accentColor,
                    fontSize: `${config.taglineSize}px`,
                    fontFamily: `${config.bodyFont}, sans-serif`,
                  }}
                >
                  {config.tagline}
                </p>
              )}
              <h3 style={{ fontSize: `${config.titleSize}px`, fontFamily: `${config.titleFont}, serif` }}>{config.title}</h3>
              <p className="subtitle" style={{ fontSize: `${config.subtitleSize}px`, color: config.subtitleColor }}>
                {config.subtitle}
              </p>
              {config.buttonText && (
                <a
                  href={config.buttonUrl}
                  className={`cta ${config.buttonStyle}`}
                  style={{ '--cta-accent': config.accentColor }}
                >
                  {config.buttonText}
                </a>
              )}
            </div>
          ) : config.overlayImage ? (
            <img src={config.overlayImage} alt={config.overlayImageAlt} className="overlay-image" />
          ) : (
            <div className="overlay-placeholder">Upload overlay artwork</div>
          )}
        </div>
      </div>

      <TransitionIndicator transitions={config.transitions} />
    </div>
  )
}

function FullScreenPreviewPage({ config, device, media, onDeviceChange, onExit }) {
  return (
    <div className="preview-page-shell">
      <main className="preview-page-main">
        <BannerStage config={config} device={device} media={media} />
        <section className="next-block spotlight">
          <div>
            <h3>Spotlight: Monarch release</h3>
            <p>
              Carry momentum into the next block with curated storytelling. Editors can drop rich copy, galleries, or feature cards immediately after the banner using
              the selected transition.
            </p>
          </div>
          <div className="spotlight-grid">
            <article>
              <p className="eyebrow">Lore</p>
              <h4>Ascend with Prism</h4>
              <p>Tease the campaign narrative right after the hero to keep fans scrolling.</p>
            </article>
            <article>
              <p className="eyebrow">Product</p>
              <h4>Cold foil chase</h4>
              <p>Highlight chase cards or incentives to convert attention into clicks.</p>
            </article>
          </div>
        </section>
        <section className="next-block product-grid">
          <header>
            <h3>Recommended decks</h3>
            <p>Auto-populated from merch catalog</p>
          </header>
          <div className="product-grid-items">
            {[1, 2, 3].map((item) => (
              <article key={item}>
                <div className="product-thumb" />
                <h4>Bundle #{item}</h4>
                <p>Editor-defined short description to support CTA.</p>
                <button type="button">View bundle</button>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="preview-page-controls">
        <div className="device-toggle">
          {['desktop', 'mobile'].map((item) => (
            <button key={item} type="button" className={item === device ? 'active' : ''} onClick={() => onDeviceChange(item)}>
              {item === 'desktop' ? 'Desktop' : 'Mobile'}
            </button>
          ))}
        </div>
        <button className="ghost" type="button" onClick={onExit}>
          Exit full screen
        </button>
      </footer>
    </div>
  )
}

function AdminPanel({
  config,
  onFieldChange,
  onMediaUpload,
  onOverlayImageUpload,
  onResetMedia,
  onConfigChange,
}) {
  return (
    <section className="panel admin-panel">
      <h2>Admin controls</h2>
      <p>Everything editors need to configure the hero without touching code.</p>

      <fieldset className="panel-card">
        <legend>Hero copy</legend>
        <LabeledInput label="Highlight" value={config.tagline} onChange={(value) => onFieldChange('tagline', value)} placeholder="Featured product" />
        <LabeledInput label="Heading" value={config.title} onChange={(value) => onFieldChange('title', value)} placeholder="Set the hero title" />
        <LabeledInput
          label="Subtitle"
          value={config.subtitle}
          onChange={(value) => onFieldChange('subtitle', value)}
          placeholder="Add supporting copy"
        />
        <div className="dual">
          <LabeledInput label="CTA label" value={config.buttonText} onChange={(value) => onFieldChange('buttonText', value)} />
          <LabeledInput label="CTA URL" value={config.buttonUrl} onChange={(value) => onFieldChange('buttonUrl', value)} />
        </div>
      </fieldset>

      <fieldset className="panel-card">
        <legend>Media</legend>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={config.useUnifiedMedia}
            onChange={(event) => onFieldChange('useUnifiedMedia', event.target.checked)}
          />
          Use desktop asset for mobile
        </label>
        <MediaField
          label="Desktop hero"
          target="desktop"
          media={config.media.desktop}
          targetInfo={MEDIA_TARGETS.desktop}
          onUpload={onMediaUpload}
          onReset={onResetMedia}
        />
        {!config.useUnifiedMedia && (
          <MediaField
            label="Mobile hero"
            target="mobile"
            media={config.media.mobile}
            targetInfo={MEDIA_TARGETS.mobile}
            onUpload={onMediaUpload}
            onReset={onResetMedia}
          />
        )}
      </fieldset>

      <fieldset className="panel-card">
        <legend>Overlay</legend>
        <label className="select">
          <span>Overlay content</span>
          <select value={config.overlayType} onChange={(event) => onFieldChange('overlayType', event.target.value)}>
            {overlayTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        {config.overlayType === 'image' ? (
          <div className="upload-block">
            <label className="file-label">
              <span>Overlay image</span>
              <input type="file" accept="image/*" onChange={(event) => onOverlayImageUpload(event.target.files?.[0])} />
            </label>
            {config.overlayImage ? <p className="meta">Custom overlay active</p> : <p className="meta warning">Upload artwork to replace placeholder</p>}
          </div>
        ) : (
          <>
            <label className="select">
              <span>Desktop alignment</span>
              <select value={config.overlayPositionDesktop} onChange={(event) => onFieldChange('overlayPositionDesktop', event.target.value)}>
                {overlayPositions.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="dual">
              <RangeField
                label="Title size"
                min={36}
                max={72}
                value={config.titleSize}
                suffix="px"
                onChange={(value) => onFieldChange('titleSize', value)}
              />
              <RangeField
                label="Subtitle size"
                min={16}
                max={36}
                value={config.subtitleSize}
                suffix="px"
                onChange={(value) => onFieldChange('subtitleSize', value)}
              />
            </div>
            <RangeField
              label="Tagline size"
              min={10}
              max={22}
              value={config.taglineSize}
              suffix="px"
              onChange={(value) => onFieldChange('taglineSize', value)}
            />
            <label className="color-field">
              <span>Overlay background</span>
              <input type="color" value={rgbaToHex(config.overlayBackground)} onChange={(event) => onFieldChange('overlayBackground', hexToRgba(event.target.value, 0.7))} />
            </label>
            <label className="color-field">
              <span>Banner tint</span>
              <input type="color" value={rgbaToHex(config.backgroundTint)} onChange={(event) => onFieldChange('backgroundTint', hexToRgba(event.target.value, 0.35))} />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={config.overlayShadow}
                onChange={(event) => onFieldChange('overlayShadow', event.target.checked)}
              />
              Drop shadow
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={config.overlayGlow}
                onChange={(event) => onFieldChange('overlayGlow', event.target.checked)}
              />
              Glow outline
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={config.showOverlayBackground}
                onChange={(event) => onFieldChange('showOverlayBackground', event.target.checked)}
              />
              Filled background
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={config.showOverlayBorder}
                onChange={(event) => onFieldChange('showOverlayBorder', event.target.checked)}
              />
              Accent border
            </label>
          </>
        )}
      </fieldset>

      <fieldset className="panel-card">
        <legend>Typography & colors</legend>
        <div className="dual">
          <label className="select">
            <span>Heading font</span>
            <select value={config.titleFont} onChange={(event) => onFieldChange('titleFont', event.target.value)}>
              {fontOptions.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>
          <label className="select">
            <span>Body font</span>
            <select value={config.bodyFont} onChange={(event) => onFieldChange('bodyFont', event.target.value)}>
              {fontOptions.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="dual">
          <label className="color-field">
            <span>Heading color</span>
            <input type="color" value={config.textColor} onChange={(event) => onFieldChange('textColor', event.target.value)} />
          </label>
          <label className="color-field">
            <span>Body color</span>
            <input type="color" value={config.subtitleColor} onChange={(event) => onFieldChange('subtitleColor', event.target.value)} />
          </label>
        </div>
        <label className="color-field">
          <span>Accent color</span>
          <input type="color" value={config.accentColor} onChange={(event) => onFieldChange('accentColor', event.target.value)} />
        </label>
      </fieldset>

      <fieldset className="panel-card">
        <legend>Transitions & video</legend>
        <label className="select">
          <span>Transition to next block</span>
          <select
            value={config.transitions.style}
            onChange={(event) => onConfigChange({ transitions: { ...config.transitions, style: event.target.value } })}
          >
            {transitionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="color-field">
          <span>Transition accent</span>
          <input
            type="color"
            value={config.transitions.color}
            onChange={(event) => onConfigChange({ transitions: { ...config.transitions, color: event.target.value } })}
          />
        </label>
        <label className="select">
          <span>CTA style</span>
          <select value={config.buttonStyle} onChange={(event) => onFieldChange('buttonStyle', event.target.value)}>
            {buttonStyles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="dual">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={config.videoAutoplay}
              onChange={(event) => onFieldChange('videoAutoplay', event.target.checked)}
            />
            Autoplay video
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={config.videoMuted} onChange={(event) => onFieldChange('videoMuted', event.target.checked)} />
            Mute by default
          </label>
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={config.allowVideoSound}
            onChange={(event) => onFieldChange('allowVideoSound', event.target.checked)}
          />
          Allow editors to enable sound
        </label>
      </fieldset>

      <fieldset className="panel-card">
        <legend>Notes for editors</legend>
        <label>
          <span>Quick guidance</span>
          <textarea value={config.adminNotes} onChange={(event) => onFieldChange('adminNotes', event.target.value)} />
        </label>
      </fieldset>
    </section>
  )
}

function MediaField({ label, target, media, targetInfo, onUpload, onReset }) {
  const warnings = media?.meta?.warnings ?? []
  const hasWarnings = warnings.length > 0
  return (
    <div className="media-field">
      <div className="media-header">
        <div>
          <h4>{label}</h4>
          <p>
            Target: {targetInfo.label} · {targetInfo.ratioLabel}
          </p>
        </div>
        <button type="button" className="ghost" onClick={() => onReset(target)}>
          Use default
        </button>
      </div>
      <label className="file-label">
        <span>Upload image / video</span>
        <input type="file" accept="image/*,video/*" onChange={(event) => onUpload(target, event.target.files?.[0])} />
      </label>
      {media?.label && <p className="meta">Current: {media.label}</p>}
      {media?.meta?.loading ? (
        <p className="meta">Analyzing file…</p>
      ) : (
        <ul className={`meta-list ${hasWarnings ? 'warning' : 'success'}`}>
          {warnings.length ? warnings.map((warning) => <li key={warning}>{warning}</li>) : <li>Looks perfect for {targetInfo.ratioLabel}</li>}
        </ul>
      )}
    </div>
  )
}

function LabeledInput({ label, value, onChange, placeholder }) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

function RangeField({ label, min, max, value, suffix, onChange }) {
  return (
    <label className="range-field">
      <div className="range-label">
        <span>{label}</span>
        <strong>
          {value}
          {suffix}
        </strong>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function getDesktopOverlayStyles(config) {
  const map = {
    'top-left': { justifyContent: 'flex-start', alignItems: 'flex-start' },
    'top-right': { justifyContent: 'flex-end', alignItems: 'flex-start' },
    'center-left': { justifyContent: 'center', alignItems: 'flex-start' },
    'center-right': { justifyContent: 'center', alignItems: 'flex-end' },
    'bottom-left': { justifyContent: 'flex-end', alignItems: 'flex-start' },
    'bottom-right': { justifyContent: 'flex-end', alignItems: 'flex-end' },
  }
  const fallback = { justifyContent: 'flex-end', alignItems: 'flex-start' }
  const coords = map[config.overlayPositionDesktop] ?? fallback
  return {
    layer: { ...coords, padding: '2rem' },
    surface: { background: config.showOverlayBackground ? config.overlayBackground : 'transparent' },
  }
}

function getMobileOverlayStyles(config) {
  return {
    layer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: `${config.mobileOverlayInset}px`,
    },
    surface: {
      background: config.showOverlayBackground ? config.overlayBackground : 'transparent',
    },
  }
}

function evaluateImageFile(file, target) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ratioValue = img.width / img.height
      const warnings = []
      if (Math.abs(ratioValue - target.ratio) > 0.03) {
        warnings.push(`Ratio is ${ratioLabel(ratioValue)}, target ${target.ratioLabel}`)
      }
      if (Math.abs(img.width - target.width) > 200 || Math.abs(img.height - target.height) > 200) {
        warnings.push(`Resolution ${img.width}×${img.height} differs from ${target.width}×${target.height}`)
      }
      if (img.width < target.width || img.height < target.height) {
        warnings.push('Image is smaller than recommended and may appear soft')
      }
      URL.revokeObjectURL(url)
      resolve({
        width: img.width,
        height: img.height,
        ratioValue,
        ratioLabel: ratioLabel(ratioValue),
        warnings,
        status: warnings.length ? 'warning' : 'ok',
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ warnings: ['Unable to read image metadata'], status: 'error' })
    }
    img.src = url
  })
}

function evaluateVideoFile(file, target) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const ratioValue = video.videoWidth / video.videoHeight
      const warnings = []
      if (Math.abs(ratioValue - target.ratio) > 0.04) {
        warnings.push(`Video ratio ${ratioLabel(ratioValue)} differs from ${target.ratioLabel}`)
      }
      if (video.videoWidth < target.width || video.videoHeight < target.height) {
        warnings.push('Video resolution is under target, consider exporting larger')
      }
      URL.revokeObjectURL(url)
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        ratioValue,
        ratioLabel: ratioLabel(ratioValue),
        warnings,
        status: warnings.length ? 'warning' : 'ok',
      })
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ warnings: ['Unable to read video metadata'], status: 'error' })
    }
    video.src = url
  })
}

function ratioLabel(value) {
  if (!value || Number.isNaN(value)) return 'n/a'
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100
  return `${rounded}:1`
}

function rgbaToHex(rgba) {
  const match = rgba.match(/rgba?\(([^)]+)\)/)
  if (!match) return '#000000'
  const parts = match[1]
    .split(',')
    .slice(0, 3)
    .map((value) => Number(value.trim()))
  return `#${parts.map((num) => num.toString(16).padStart(2, '0')).join('')}`
}

function hexToRgba(hex, alpha = 1) {
  const normalized = hex.replace('#', '')
  const bigint = parseInt(normalized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default App
