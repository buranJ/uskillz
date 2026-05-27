import { useRef, useEffect, useState, useCallback, memo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, MeshDistortMaterial, Float } from '@react-three/drei'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Menu, X, ArrowRight, Phone, MessageCircle } from 'lucide-react'
import Lenis from 'lenis'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useIsMobile(bp = 768) {
  const [v, setV] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < bp : true))
  useEffect(() => {
    const h = () => setV(window.innerWidth < bp)
    window.addEventListener('resize', h, { passive: true })
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return v
}

// ─── 3D ──────────────────────────────────────────────────────────────────────

const PART_D = (() => { const p = new Float32Array(900 * 3); for (let i = 0; i < p.length; i++) p[i] = (Math.random() - 0.5) * 22; return p })()
const PART_M = (() => { const p = new Float32Array(350 * 3); for (let i = 0; i < p.length; i++) p[i] = (Math.random() - 0.5) * 18; return p })()

function Particles({ isMobile }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.rotation.x = Math.sin(t * 0.035) * 0.12
    ref.current.rotation.y = t * 0.022
  })
  return (
    <Points ref={ref} positions={isMobile ? PART_M : PART_D} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#C8F400" size={0.02} sizeAttenuation depthWrite={false} opacity={0.45} />
    </Points>
  )
}

function MorphBlob({ mouse, isMobile }) {
  const g = useRef()
  useFrame(() => {
    if (!g.current) return
    const tx = isMobile ? mouse.current.x * 0.4 : mouse.current.x * 1.8
    const ty = isMobile ? mouse.current.y * 0.3 : mouse.current.y * 1.2
    g.current.position.x += (tx - g.current.position.x) * 0.045
    g.current.position.y += (ty - g.current.position.y) * 0.045
  })
  const r = isMobile ? 1.5 : 2.1
  const seg = isMobile ? 32 : 64
  return (
    <group ref={g} position={isMobile ? [0, 0, 0] : [1.2, 0, 0]}>
      <Float speed={1.4} floatIntensity={0.55} rotationIntensity={0.3}>
        <mesh>
          <sphereGeometry args={[r, seg, seg]} />
          <MeshDistortMaterial
            color="#C8F400" emissive="#C8F400" emissiveIntensity={0.22}
            distort={0.48} speed={2.2} roughness={0.08} metalness={0.65}
          />
        </mesh>
      </Float>
    </group>
  )
}

function RedOrb({ mouse }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.position.x = Math.sin(t * 0.32) * 3.2 + mouse.current.x * -0.55
    ref.current.position.y = Math.cos(t * 0.26) * 1.8 + mouse.current.y * 0.35
  })
  return (
    <mesh ref={ref} position={[-2.5, 0.5, -1]}>
      <sphereGeometry args={[0.7, 32, 32]} />
      <MeshDistortMaterial
        color="#FF2D00" emissive="#FF2D00" emissiveIntensity={0.5}
        distort={0.65} speed={3.2} roughness={0.05} metalness={0.88}
      />
    </mesh>
  )
}

function Scene({ mouse, isMobile }) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[3, 3, 5]}  intensity={2.8} color="#C8F400" />
      <pointLight position={[-3, -2, 3]} intensity={2.2} color="#FF2D00" />
      <Particles isMobile={isMobile} />
      <MorphBlob mouse={mouse} isMobile={isMobile} />
      {!isMobile && <RedOrb mouse={mouse} />}
    </>
  )
}

// ─── Custom Cursor ────────────────────────────────────────────────────────────

function CustomCursor() {
  const dotRef  = useRef()
  const ringRef = useRef()
  const pos  = useRef({ x: 0, y: 0 })
  const ring = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const move = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px'
        dotRef.current.style.top  = e.clientY + 'px'
      }
    }
    const enter = (e) => { if (e.target.closest('a,button') && ringRef.current) ringRef.current.classList.add('hover') }
    const leave = (e) => { if (e.target.closest('a,button') && ringRef.current) ringRef.current.classList.remove('hover') }
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseover',  enter)
    document.addEventListener('mouseout', leave)
    let raf
    const lerp = (a, b, t) => a + (b - a) * t
    const tick = () => {
      ring.current.x = lerp(ring.current.x, pos.current.x, 0.1)
      ring.current.y = lerp(ring.current.y, pos.current.y, 0.1)
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + 'px'
        ringRef.current.style.top  = ring.current.y + 'px'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseover', enter)
      document.removeEventListener('mouseout', leave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  />
      <div ref={ringRef} className="cursor-ring" />
    </>
  )
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const links = [
    { label: 'Курсы',    href: '#courses'  },
    { label: 'О нас',   href: '#about'    },
    { label: 'Таланты', href: '#talents'  },
  ]

  return (
    <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <a href="#" className="nav__logo">U!<span>SkillZ</span></a>

      <ul className="nav__links">
        {links.map(l => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}
      </ul>

      <div className="nav__actions">
        <a href="#cta" className="btn btn--primary">Записаться</a>
        <button className="nav__burger" onClick={() => setOpen(p => !p)} aria-label="Меню">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className={`nav__mobile${open ? ' open' : ''}`}>
        {links.map(l => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
        ))}
        <a href="#cta" className="btn btn--primary" onClick={() => setOpen(false)}>Записаться на курс</a>
      </div>
    </nav>
  )
}

// ─── Intro — scroll-driven 3D categories ─────────────────────────────────────

const CATS = [
  { abbr: 'IT',      label: 'Разработка',    color: '#C8F400', shadow: '#3a5200', courses: ['JavaScript', 'Python'] },
  { abbr: 'ДИЗАЙН',  label: 'Дизайн',        color: '#FF2D00', shadow: '#5c1200', courses: ['Digital Art', 'UX/UI Design', 'Motion Design'] },
  { abbr: 'SMM',     label: 'Маркетинг',     color: '#C8F400', shadow: '#3a5200', courses: ['SMM', 'SMM + Фото'] },
  { abbr: 'MOTION',  label: 'Motion Design', color: '#FF2D00', shadow: '#5c1200', courses: ['Motion Design', 'Digital Art'] },
]

// ── 3D Objects per category ──────────────────────────────────────────────────

function CatObjects({ catIdx, color, xs = 1, os = 1 }) {
  const m = { color, emissive: color, emissiveIntensity: 0.28, metalness: 0.72, roughness: 0.14 }

  if (catIdx === 0) { // IT — laptop, curly-brace, wireframe globe, data-dots
    return (
      <>
        {/* Laptop */}
        <Float speed={0.7} floatIntensity={0.6} rotationIntensity={0.35} position={[3.8 * xs, 0.6, -0.5]}>
          <group scale={1.2 * os} rotation={[0.08, -0.3, 0]}>
            <mesh position={[0, 0.62, 0]}><boxGeometry args={[1.6, 1.1, 0.07]} /><meshStandardMaterial {...m} /></mesh>
            <mesh position={[0, 0.62, 0.042]}><boxGeometry args={[1.28, 0.88, 0.01]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} roughness={0.9} /></mesh>
            <mesh position={[0, 0.03, 0.52]} rotation={[-1.42, 0, 0]}><boxGeometry args={[1.6, 0.07, 1.05]} /><meshStandardMaterial {...m} /></mesh>
          </group>
        </Float>
        {/* Curly brace { */}
        <Float speed={0.9} floatIntensity={0.65} position={[-3.8 * xs, 0.5, 0]}>
          <group scale={os}>
            <mesh position={[0.18, 0, 0]}><boxGeometry args={[0.13, 2.6, 0.13]} /><meshStandardMaterial {...m} /></mesh>
            <mesh position={[-0.08, 0.88, 0]}><boxGeometry args={[0.42, 0.13, 0.13]} /><meshStandardMaterial {...m} /></mesh>
            <mesh position={[-0.08, -0.88, 0]}><boxGeometry args={[0.42, 0.13, 0.13]} /><meshStandardMaterial {...m} /></mesh>
            <mesh position={[-0.02, 0, 0]}><boxGeometry args={[0.32, 0.13, 0.13]} /><meshStandardMaterial {...m} /></mesh>
          </group>
        </Float>
        {/* Wireframe network globe */}
        <Float speed={1.3} floatIntensity={0.65} rotationIntensity={0.9} position={[-2.4 * xs, -2.3, 0.4]}>
          <mesh scale={0.9 * os}><sphereGeometry args={[0.72, 8, 8]} /><meshStandardMaterial {...m} wireframe /></mesh>
        </Float>
        {/* Data-node dots */}
        {[[-2.8, 2.9, 0.4], [4.6, -1.8, -0.3], [2.4, 3.4, -1.0], [5.5, 1.6, -0.4]].map(([x, y, z], i) => (
          <Float key={i} speed={0.7 + i * 0.15} floatIntensity={1.1} position={[x * xs, y, z]}>
            <mesh scale={os}><sphereGeometry args={[0.11 + (i % 3) * 0.05, 10, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} /></mesh>
          </Float>
        ))}
      </>
    )
  }

  if (catIdx === 1) { // Дизайн — paintbrush, magnifying glass, diamond gem, blobs
    return (
      <>
        {/* Paintbrush */}
        <Float speed={0.85} floatIntensity={0.7} rotationIntensity={0.3} position={[3.8 * xs, 0.6, -0.3]}>
          <group scale={1.15 * os} rotation={[0, 0.25, -0.65]}>
            <mesh><cylinderGeometry args={[0.1, 0.13, 2.5, 8]} /><meshStandardMaterial {...m} /></mesh>
            <mesh position={[0, -1.12, 0]}><cylinderGeometry args={[0.15, 0.15, 0.24, 8]} /><meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} /></mesh>
            <mesh position={[0, -1.55, 0]}><coneGeometry args={[0.14, 0.62, 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.38} roughness={0.45} /></mesh>
          </group>
        </Float>
        {/* Magnifying glass */}
        <Float speed={1.1} floatIntensity={0.9} rotationIntensity={0.45} position={[-3.8 * xs, 0.3, 0]}>
          <group scale={1.3 * os} rotation={[0, 0, 0.55]}>
            <mesh><torusGeometry args={[0.6, 0.1, 12, 36]} /><meshStandardMaterial {...m} /></mesh>
            <mesh position={[0.52, -0.55, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <cylinderGeometry args={[0.07, 0.07, 0.95, 8]} />
              <meshStandardMaterial {...m} />
            </mesh>
          </group>
        </Float>
        {/* Diamond gem */}
        <Float speed={1.0} floatIntensity={0.85} rotationIntensity={0.9} position={[5.0 * xs, -1.8, -0.5]}>
          <mesh scale={0.95 * os}><octahedronGeometry args={[0.88, 0]} /><meshStandardMaterial {...m} flatShading /></mesh>
        </Float>
        {/* Color blobs */}
        {[[-2.5, -2.4, 0.2], [2.2, 3.2, -0.8], [-3.8, 2.6, 0.5]].map(([x, y, z], i) => (
          <Float key={i} speed={0.8 + i * 0.22} floatIntensity={0.9} position={[x * xs, y, z]}>
            <mesh scale={os}><sphereGeometry args={[0.24 + i * 0.07, 12, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.5} /></mesh>
          </Float>
        ))}
      </>
    )
  }

  if (catIdx === 2) { // SMM — megaphone, smartphone, notification dots
    return (
      <>
        {/* Megaphone */}
        <Float speed={0.85} floatIntensity={0.75} rotationIntensity={0.3} position={[3.6 * xs, 0.3, -0.4]}>
          <group scale={os} rotation={[0, 0, -0.38]}>
            <mesh><cylinderGeometry args={[0.85, 0.28, 1.4, 14]} /><meshStandardMaterial {...m} /></mesh>
            <mesh position={[0, 0.8, 0]}><torusGeometry args={[0.87, 0.09, 8, 28]} /><meshStandardMaterial {...m} /></mesh>
            <mesh position={[0, 1.35, 0]}><torusGeometry args={[1.12, 0.045, 6, 24]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} transparent opacity={0.65} /></mesh>
            <mesh position={[0, 1.82, 0]}><torusGeometry args={[1.48, 0.032, 6, 24]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} transparent opacity={0.42} /></mesh>
          </group>
        </Float>
        {/* Smartphone */}
        <Float speed={1.1} floatIntensity={0.8} rotationIntensity={0.3} position={[-3.6 * xs, 0.1, 0]}>
          <group scale={os} rotation={[0, 0.35, 0.1]}>
            <mesh><boxGeometry args={[0.66, 1.32, 0.09]} /><meshStandardMaterial {...m} /></mesh>
            <mesh position={[0, 0, 0.05]}><boxGeometry args={[0.52, 1.1, 0.01]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12} roughness={0.9} /></mesh>
            <mesh position={[0, -0.56, 0.055]}><cylinderGeometry args={[0.07, 0.07, 0.07, 12]} /><meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} /></mesh>
          </group>
        </Float>
        {/* Notification spheres */}
        {[[-2.2, 2.9, 0.5], [4.9, 2.4, -0.5], [5.5, -1.8, 0.3], [-4.8, -1.8, 0.5], [-1.2, 3.4, -0.4]].map(([x, y, z], i) => (
          <Float key={i} speed={0.85 + i * 0.18} floatIntensity={1.3} position={[x * xs, y, z]}>
            <mesh scale={os}><sphereGeometry args={[0.17 + (i % 3) * 0.07, 12, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} /></mesh>
          </Float>
        ))}
      </>
    )
  }

  // Motion Design — play-button ring, camera body, film frames, capsule
  return (
    <>
      {/* Play button ring + triangle */}
      <Float speed={0.75} floatIntensity={0.65} rotationIntensity={0.35} position={[3.8 * xs, 0.3, -0.4]}>
        <group scale={1.1 * os}>
          <mesh><torusGeometry args={[1.12, 0.1, 12, 60]} /><meshStandardMaterial {...m} /></mesh>
          <mesh position={[0.15, 0, 0]} rotation={[Math.PI / 2, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0, 0.65, 0.22, 3]} />
            <meshStandardMaterial {...m} />
          </mesh>
        </group>
      </Float>
      {/* Camera body */}
      <Float speed={1.0} floatIntensity={0.75} rotationIntensity={0.4} position={[-3.8 * xs, 0.3, 0.1]}>
        <group scale={os} rotation={[0, 0.3, 0]}>
          <mesh><boxGeometry args={[1.5, 0.96, 0.65]} /><meshStandardMaterial {...m} /></mesh>
          <mesh position={[0.5, 0.12, 0.37]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.32, 0.38, 18]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0.5, 0.12, 0.55]}><circleGeometry args={[0.21, 18]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} transparent opacity={0.6} /></mesh>
          <mesh position={[-0.35, 0.6, 0]}><boxGeometry args={[0.46, 0.22, 0.46]} /><meshStandardMaterial {...m} /></mesh>
        </group>
      </Float>
      {/* Film frames */}
      {[[-2.4, -2.4, 0.2], [2.0, 3.0, -0.8]].map(([x, y, z], i) => (
        <Float key={i} speed={0.9 + i * 0.3} floatIntensity={0.7} rotationIntensity={1.3} position={[x * xs, y, z]}>
          <mesh scale={os} rotation={[0.3 * i, 0.4 * (i + 1), 0.2 * i]}>
            <boxGeometry args={[1.12, 0.76, 0.06]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} metalness={0.5} roughness={0.3} />
          </mesh>
        </Float>
      ))}
      {/* Motion capsule */}
      <Float speed={1.3} floatIntensity={0.9} rotationIntensity={0.5} position={[5.2 * xs, -1.8, -0.3]}>
        <mesh scale={os} rotation={[0, 0, Math.PI / 4]}><capsuleGeometry args={[0.18, 1.1, 8, 18]} /><meshStandardMaterial {...m} /></mesh>
      </Float>
      {/* Glow dots */}
      {[[-1.8, 3.0, 0.4], [5.0, 1.0, -0.5]].map(([x, y, z], i) => (
        <Float key={i + 10} speed={0.7 + i * 0.3} floatIntensity={1.3} position={[x * xs, y, z]}>
          <mesh scale={os}><sphereGeometry args={[0.15 + i * 0.05, 10, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} /></mesh>
        </Float>
      ))}
    </>
  )
}

// ── 3D Scene ─────────────────────────────────────────────────────────────────

function IntroScene({ activeRef, isMobile }) {
  const groupRefs   = useRef([])
  const prevIdx     = useRef(-1)
  const initialized = useRef(false)

  useFrame(() => {
    if (!initialized.current) {
      groupRefs.current.forEach((g, i) => {
        if (!g) return
        g.position.y = i === 0 ? 0 : 12
        g.scale.setScalar(i === 0 ? 1 : 0.3)
      })
      prevIdx.current = 0
      initialized.current = true
    }

    const cur = activeRef.current
    if (cur !== prevIdx.current && initialized.current && cur >= 0) {
      const old = groupRefs.current[prevIdx.current]
      const next = groupRefs.current[cur]
      if (old) {
        gsap.to(old.position, { y: -12, duration: 0.55, ease: 'power3.in', overwrite: true })
        gsap.to(old.scale,    { x: 0.3, y: 0.3, z: 0.3, duration: 0.5, ease: 'power3.in', overwrite: true })
      }
      if (next) {
        next.position.y = 12
        next.scale.setScalar(0.4)
        gsap.to(next.position, { y: 0, duration: 0.7, ease: 'back.out(1.2)', delay: 0.08, overwrite: true })
        gsap.to(next.scale,    { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(1.4)', delay: 0.08, overwrite: true })
      }
      prevIdx.current = cur
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]}   intensity={3.2} color="#C8F400" />
      <pointLight position={[-5, -3, 3]} intensity={2.4} color="#FF2D00" />
      <pointLight position={[0, -8, 4]}  intensity={1.5} color="#0C0C1D" />
      {CATS.map((cat, i) => (
        <group key={i} ref={el => groupRefs.current[i] = el}>
          <CatObjects catIdx={i} color={cat.color} xs={isMobile ? 0.55 : 1} os={isMobile ? 0.82 : 1} />
        </group>
      ))}
    </>
  )
}

// ── Intro component ───────────────────────────────────────────────────────────

function Intro() {
  const isMobile   = useIsMobile()
  const [active, setActive] = useState(0)
  const activeRef  = useRef(0)
  const sectionRef = useRef()
  const textRef    = useRef()
  const labelRef   = useRef()
  const animating  = useRef(false)
  const toRef      = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const st = ScrollTrigger.create({
      trigger: el,
      pin: true,
      anticipatePin: 1,
      start: 'top top',
      end: `+=${(CATS.length - 1) * window.innerHeight}`,
      scrub: 0.8,
      onUpdate(self) {
        const idx = Math.min(CATS.length - 1, Math.floor(self.progress * CATS.length))
        if (idx === activeRef.current || animating.current) return
        animating.current = true

        const out = (el) => el && gsap.to(el, { yPercent: -70, opacity: 0, duration: 0.22, ease: 'power3.in' })
        out(textRef.current)
        out(labelRef.current)

        toRef.current = setTimeout(() => {
          activeRef.current = idx
          setActive(idx)
          requestAnimationFrame(() => requestAnimationFrame(() => {
            const inn = (el, d = 0) => el && gsap.fromTo(el,
              { yPercent: 70, opacity: 0 },
              { yPercent: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.5)', delay: d,
                onComplete: () => { animating.current = false } }
            )
            inn(textRef.current)
            inn(labelRef.current, 0.06)
          }))
        }, 230)
      },
    })

    return () => { st.kill(); clearTimeout(toRef.current) }
  }, [])

  const cat = CATS[active]

  return (
    <section className="intro3d" ref={sectionRef}>
      {/* 3D canvas */}
      <div className="intro3d__canvas">
        <Canvas
          camera={{ position: [0, 0, isMobile ? 7 : 8.5], fov: isMobile ? 65 : 50 }}
          gl={{ antialias: true, alpha: true }}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
        >
          <Suspense fallback={null}>
            <IntroScene activeRef={activeRef} isMobile={isMobile} />
          </Suspense>
        </Canvas>
      </div>

      {/* Radial vignette */}
      <div className="intro3d__vig" />

      {/* UI overlay */}
      <div className="intro3d__ui">

        <div className="intro3d__top">
          <div className="intro__badge">
            <span className="badge__dot" />
            Выбери свою профессию
          </div>
        </div>

        <div className="intro3d__center">
          <div className="intro3d__clip">
            <div
              ref={textRef}
              className="intro3d__abbr"
              style={{
                color: cat.color,
                textShadow: `3px 3px 0 ${cat.shadow}, 6px 6px 0 ${cat.shadow}bb, 10px 10px 24px rgba(0,0,0,0.55)`,
              }}
            >
              {cat.abbr}
            </div>
          </div>
          <div ref={labelRef} className="intro3d__sublabel">{cat.label}</div>
        </div>

        <div className="intro3d__bottom">
          <div className="intro3d__pips">
            {CATS.map((c, i) => (
              <div key={i} className={`intro3d__pip${i === active ? ' active' : ''}`}
                style={i === active ? { background: c.color } : {}} />
            ))}
          </div>
          <div className="intro3d__courses">
            {cat.courses.map(c => <span key={c}>{c}</span>)}
          </div>
          <p className="intro3d__hint">↓ Скролли для переключения</p>
        </div>

      </div>
    </section>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ mouse }) {
  const isMobile  = useIsMobile()
  const rootRef   = useRef()
  const badgeRef  = useRef()
  const titleRef  = useRef()
  const subRef    = useRef()
  const ctaRef    = useRef()

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 })
    tl.from(badgeRef.current,  { opacity: 0, y: 18, duration: 0.55 })
      .from(titleRef.current.querySelectorAll('.line'), { opacity: 0, y: 72, skewY: 3, stagger: 0.09, duration: 1.05 }, '-=0.25')
      .from(subRef.current,  { opacity: 0, y: 22, duration: 0.7 }, '-=0.45')
      .from(ctaRef.current.children, { opacity: 0, y: 18, stagger: 0.1, duration: 0.6 }, '-=0.35')
  }, { scope: rootRef })

  return (
    <section className="hero" ref={rootRef}>
      {/* 3D canvas */}
      <div className="hero__canvas">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 55 }}
          gl={{ antialias: true, alpha: true }}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          frameloop="always"
        >
          <Suspense fallback={null}>
            <Scene mouse={mouse} isMobile={isMobile} />
          </Suspense>
        </Canvas>
      </div>

      {/* overlay for text readability */}
      <div className="hero__overlay" />

      <div className="hero__content">
        <div className="hero__badge" ref={badgeRef}>
          <span className="badge__dot" />
          Школа Креативных Профессий · Бишкек
        </div>

        <h1 className="hero__title" ref={titleRef}>
          <span className="line">СТАНЬ</span>
          <span className="line line--lime">ПРОФИ</span>
          <span className="line line--red">СЕЙЧАС</span>
        </h1>

        <p className="hero__sub" ref={subRef}>
          Курсы по дизайну, маркетингу и разработке.
          Более <strong>5000 выпускников</strong> уже работают в крутых компаниях.
        </p>

        <div className="hero__cta" ref={ctaRef}>
          <a href="#courses" className="btn btn--primary btn--lg">
            Смотреть курсы <ArrowRight size={17} />
          </a>
          <a href="#cta" className="btn btn--ghost btn--lg">
            Бесплатный урок
          </a>
        </div>

        <div className="hero__social">
          <a href="https://t.me/uskillz" target="_blank" rel="noopener noreferrer">
            <MessageCircle size={15} /> Telegram
          </a>
          <a href="tel:+996" >
            <Phone size={15} /> Позвонить
          </a>
        </div>
      </div>

      <div className="hero__scroll">
        <span>Скролл</span>
        <div className="scroll-mouse"><div className="scroll-dot" /></div>
      </div>
    </section>
  )
}

// ─── Marquee ─────────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  'Digital Art', 'UX/UI Design', 'Motion Design', 'SMM', 'JavaScript',
  'Python', 'Дизайн', 'Маркетинг', 'Разработка', 'U! SkillZ',
]

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__row">
        <div className="marquee__track">
          {items.map((item, i) => (
            <span key={i} className="marquee__item">
              {item}<span className="marquee__sep"> ✦ </span>
            </span>
          ))}
        </div>
      </div>
      <div className="marquee__row marquee__row--rev">
        <div className="marquee__track">
          {items.map((item, i) => (
            <span key={i} className="marquee__item">
              {item}<span className="marquee__sep"> ✦ </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: 5000, suffix: '+', label: 'Выпускников',   sub: 'работают по специальности' },
  { value: 15,   suffix: '+', label: 'Менторов',      sub: 'практикующих специалистов' },
  { value: 4,    suffix: '+', label: 'Года',          sub: 'на рынке онлайн-образования' },
]

const Stats = memo(function Stats() {
  const ref   = useRef()
  const nums  = useRef([])

  useGSAP(() => {
    STATS.forEach((s, i) => {
      const el = nums.current[i]; if (!el) return
      const obj = { val: 0 }
      gsap.to(obj, {
        val: s.value, duration: 2.4, ease: 'power2.out',
        snap: { val: 1 },
        scrollTrigger: { trigger: ref.current, start: 'top 72%' },
        onUpdate: () => { if (el) el.textContent = Math.floor(obj.val) + s.suffix }
      })
    })
    gsap.from(ref.current.querySelectorAll('.stat-card'), {
      opacity: 0, y: 44, stagger: 0.13, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 76%' }
    })
    gsap.from(ref.current.querySelector('.stats__top'), {
      opacity: 0, y: 36, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 80%' }
    })
  }, { scope: ref })

  return (
    <section className="stats" id="about" ref={ref}>
      <div className="stats__inner">
        <div className="stats__top">
          <span className="tag">Наши результаты</span>
          <h2>Цифры говорят<br /><span className="accent">сами за себя</span></h2>
          <p>Мы измеряем успех количеством людей, которые изменили свою жизнь с U! SkillZ.</p>
        </div>
        <div className="stats__grid">
          {STATS.map((s, i) => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__num" ref={el => nums.current[i] = el}>0{s.suffix}</div>
              <div className="stat-card__label">{s.label}</div>
              <div className="stat-card__sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

// ─── Courses — 3D Coverflow ───────────────────────────────────────────────────

const COURSES = [
  {
    id: 1, tag: 'Дизайн',     tagBg: '#C8F400', tagClr: '#0C0C1D',
    title: 'Digital Art',   mentor: 'Чынгыз',     dur: '1 месяц',
    desc: 'Основы цифрового рисунка, работа с планшетом, создание иллюстраций и персонажей.',
    photo: 'https://static.tildacdn.one/tild3332-6362-4833-b762-323765653061/AVA-CHIKA_cp.jpg',
  },
  {
    id: 2, tag: 'Дизайн',     tagBg: '#FF2D00', tagClr: '#fff',
    title: 'UX/UI Design',  mentor: 'Урмат',       dur: '1 месяц',
    desc: 'Figma, проектирование интерфейсов, пользовательский опыт, прототипирование.',
    photo: 'https://static.tildacdn.one/tild3636-3738-4132-b138-326632316164/AVA-UMKA_cp.jpg',
  },
  {
    id: 3, tag: '🔥 Хит',     tagBg: '#0C0C1D', tagClr: '#C8F400',
    title: 'Motion Design', mentor: 'Артур',        dur: '3 месяца',
    desc: 'After Effects, анимация для соцсетей, motion-графика. Самый востребованный курс.',
    photo: 'https://static.tildacdn.one/tild6230-6234-4331-b336-393432373862/AVA-ARTUR_cp.jpg',
  },
  {
    id: 4, tag: 'Маркетинг',  tagBg: '#C8F400', tagClr: '#0C0C1D',
    title: 'SMM',           mentor: 'Бегимай',     dur: '1 месяц',
    desc: 'Instagram, Telegram, TikTok. Контент-план, таргетированная реклама, аналитика.',
    photo: 'https://static.tildacdn.one/tild3563-6161-4134-b935-663138306533/AVA-BEMA_2_mozjpg.jpg',
  },
  {
    id: 5, tag: 'Маркетинг',  tagBg: '#FF2D00', tagClr: '#fff',
    title: 'SMM + Фото',    mentor: 'Святослава',  dur: '1.5 месяца',
    desc: 'SMM плюс мобильная фотография. Создай профессиональный контент прямо со смартфона.',
    photo: 'https://static.tildacdn.one/tild6131-3462-4031-b537-363933643036/AVA-SVIATA_cp.jpg',
  },
  {
    id: 6, tag: 'Разработка', tagBg: '#0C0C1D', tagClr: '#C8F400',
    title: 'JavaScript',    mentor: 'Сейтек',      dur: '6 месяцев',
    desc: 'Полный курс фронтенда: HTML, CSS, JavaScript, React. От нуля до первой работы.',
    photo: 'https://static.tildacdn.one/tild6261-6634-4765-b435-326435656434/AVA-SEITEK_cp.jpg',
  },
  {
    id: 7, tag: 'Разработка', tagBg: '#C8F400', tagClr: '#0C0C1D',
    title: 'Python',        mentor: 'Жорупбек',    dur: '6 месяцев',
    desc: 'Backend, автоматизация, Django, APIs. Карьера в IT с нуля до middle-уровня.',
    photo: 'https://static.tildacdn.one/tild6339-3430-4933-b339-356661666430/AVA-JOKE_cp.jpg',
  },
]

const Courses = memo(function Courses() {
  const [active, setActive]   = useState(2)
  const [entered, setEntered] = useState(false)
  const sectionRef = useRef()
  const cardsRef   = useRef([])
  const infoRef    = useRef()

  const INIT = 2

  const getOffset = useCallback(() => {
    if (typeof window === 'undefined') return 270
    const w = window.innerWidth
    if (w < 430) return 170
    if (w < 768) return 215
    return 272
  }, [])

  const positionCards = useCallback((activeIdx, animate) => {
    cardsRef.current.forEach((card, i) => {
      if (!card) return
      const off    = i - activeIdx
      const absOff = Math.abs(off)
      const props  = {
        x:       off * getOffset(),
        z:       -absOff * 110,
        rotateY: -off * 33,
        scale:   Math.max(0.56, 1 - absOff * 0.145),
        opacity: Math.max(0.15, 1 - absOff * 0.3),
        zIndex:  100 - absOff * 10,
      }
      if (animate) {
        gsap.to(card, { ...props, duration: 0.65, ease: 'power3.out', overwrite: true })
      } else {
        gsap.set(card, props)
      }
    })
  }, [getOffset])

  // Scroll-triggered entrance
  useGSAP(() => {
    gsap.from(sectionRef.current.querySelector('.cflow-head').children, {
      opacity: 0, y: 36, stagger: 0.1, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 82%' },
    })

    // cards start below
    gsap.set(cardsRef.current.filter(Boolean), { y: 200, opacity: 0 })

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 65%',
      once: true,
      onEnter: () => {
        // snap to positions without animation first
        positionCards(INIT, false)
        // sort cards so center comes in first, then outward
        const order = [...Array(COURSES.length).keys()]
          .sort((a, b) => Math.abs(a - INIT) - Math.abs(b - INIT))
        const orderedCards = order.map(i => cardsRef.current[i]).filter(Boolean)
        gsap.to(orderedCards, {
          y: 0,
          opacity: (j) => Math.max(0.15, 1 - Math.abs(order[j] - INIT) * 0.3),
          stagger: 0.07,
          duration: 0.82,
          ease: 'power3.out',
          onComplete: () => setEntered(true),
        })
      },
    })
  }, { scope: sectionRef })

  // Animate cards when active changes (only after entrance)
  useEffect(() => {
    if (entered) positionCards(active, true)
  }, [active, entered, positionCards])

  // Fade info panel on each change
  useEffect(() => {
    if (!infoRef.current) return
    gsap.fromTo(infoRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out' },
    )
  }, [active])

  const go = useCallback((dir) => {
    setActive(p => Math.max(0, Math.min(COURSES.length - 1, p + dir)))
  }, [])

  // Touch swipe
  const touchX = useRef(null)
  const onTouchStart = useCallback((e) => { touchX.current = e.touches[0].clientX }, [])
  const onTouchEnd   = useCallback((e) => {
    if (touchX.current === null) return
    const diff = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 44) go(diff > 0 ? 1 : -1)
    touchX.current = null
  }, [go])

  const c = COURSES[active]

  return (
    <section className="courses" id="courses" ref={sectionRef}>
      {/* Header */}
      <div className="cflow-head">
        <span className="tag">Программы обучения</span>
        <h2>7 курсов на выбор,<br /><span className="accent">1 путь к профессии</span></h2>
      </div>

      {/* Coverflow stage */}
      <div
        className="cflow-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {COURSES.map((course, i) => (
          <div
            key={course.id}
            ref={el => cardsRef.current[i] = el}
            className={`cflow-card${i === active ? ' cflow-card--active' : ''}`}
            onClick={() => i !== active && setActive(i)}
            aria-label={course.title}
          >
            <img
              src={course.photo}
              alt={course.mentor}
              className="cflow-card__img"
              loading="lazy"
              draggable="false"
            />
            <div className="cflow-card__overlay">
              <span
                className="cflow-card__tag"
                style={{ background: course.tagBg, color: course.tagClr }}
              >
                {course.tag}
              </span>
              <div className="cflow-card__mentor">{course.mentor}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Active course info */}
      <div className="cflow-info" ref={infoRef} key={active}>
        <div className="cflow-info__meta">
          <span>{c.mentor}</span>
          <span className="cflow-info__dot">·</span>
          <span>{c.dur}</span>
        </div>
        <h3 className="cflow-info__title">{c.title}</h3>
        <p className="cflow-info__desc">{c.desc}</p>
        <div className="cflow-info__cta">
          <a href="#cta" className="btn btn--primary">
            Записаться <ArrowRight size={16} />
          </a>
          <button className="btn btn--ghost">Подробнее</button>
        </div>
      </div>

      {/* Navigation */}
      <div className="cflow-nav">
        <button
          className="cflow-arr"
          onClick={() => go(-1)}
          disabled={active === 0}
          aria-label="Предыдущий курс"
        >
          <ArrowRight size={17} style={{ transform: 'rotate(180deg)' }} />
        </button>

        <div className="cflow-dots">
          {COURSES.map((_, i) => (
            <button
              key={i}
              className={`cflow-dot${i === active ? ' active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Курс ${i + 1}`}
            />
          ))}
        </div>

        <button
          className="cflow-arr"
          onClick={() => go(1)}
          disabled={active === COURSES.length - 1}
          aria-label="Следующий курс"
        >
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  )
})

// ─── Course Showcase (full-screen bg) ─────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const Showcase = memo(function Showcase() {
  const [active, setActive]   = useState(2)   // Motion Design first
  const activeRef             = useRef(2)
  const sectionRef            = useRef()
  const bgLayersRef           = useRef([])
  const contentRef            = useRef()
  const cardsRef              = useRef()

  // Crossfade background + reveal content
  const switchTo = useCallback((i) => {
    if (i === activeRef.current) return
    const prev      = activeRef.current
    activeRef.current = i
    setActive(i)

    gsap.to(bgLayersRef.current[prev], { opacity: 0, duration: 0.75, ease: 'power2.inOut' })
    gsap.to(bgLayersRef.current[i],    { opacity: 1, duration: 0.75, ease: 'power2.inOut' })

    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current.querySelectorAll('.sc-el'),
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.55, ease: 'power3.out', delay: 0.18 }
      )
    }
  }, [])

  // Entrance — set initial bg opacities then reveal on scroll
  useGSAP(() => {
    bgLayersRef.current.forEach((el, i) => el && gsap.set(el, { opacity: i === 2 ? 1 : 0 }))

    gsap.from(contentRef.current.querySelectorAll('.sc-el'), {
      opacity: 0, y: 36, stagger: 0.09, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 68%' },
    })
    gsap.from(cardsRef.current.children, {
      opacity: 0, y: 50, scale: 0.82, stagger: 0.06, duration: 0.7, ease: 'back.out(1.3)',
      scrollTrigger: { trigger: cardsRef.current, start: 'top 88%' },
    })
  }, { scope: sectionRef })

  // Touch swipe
  const tx = useRef(null)
  const onTS = useCallback((e) => { tx.current = e.touches[0].clientX }, [])
  const onTE = useCallback((e) => {
    if (tx.current === null) return
    const diff = tx.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 44) switchTo(Math.max(0, Math.min(COURSES.length - 1, active + (diff > 0 ? 1 : -1))))
    tx.current = null
  }, [active, switchTo])

  const c = COURSES[active]
  const num = String(active + 1).padStart(2, '0')

  return (
    <section className="showcase" id="mentors" ref={sectionRef} onTouchStart={onTS} onTouchEnd={onTE}>

      {/* ── Backgrounds ── */}
      <div className="sc-bgs">
        {COURSES.map((course, i) => (
          <div key={course.id} ref={el => bgLayersRef.current[i] = el} className="sc-bg">
            <img src={course.photo} alt="" className="sc-bg__img" />
          </div>
        ))}
        {/* Multi-stop gradient: transparent top → heavy dark bottom */}
        <div className="sc-bg__vignette" />
      </div>

      {/* ── Body ── */}
      <div className="sc-body">

        {/* Watermark number */}
        <div className="sc-watermark" aria-hidden="true">{num}</div>

        {/* Text content */}
        <div className="sc-content" ref={contentRef}>
          {/* Top line */}
          <div className="sc-topline sc-el">
            <span className="sc-tag" style={{ background: c.tagBg, color: c.tagClr }}>{c.tag}</span>
            <span className="sc-idx">{num} / 07</span>
          </div>

          {/* Title */}
          <h2 className="sc-title sc-el">{c.title}</h2>

          {/* Meta row */}
          <div className="sc-meta sc-el">
            <div className="sc-avatar">
              <img src={c.photo} alt={c.mentor} />
            </div>
            <div className="sc-meta__text">
              <span className="sc-meta__name">{c.mentor}</span>
              <span className="sc-meta__dur">{c.dur}</span>
            </div>
          </div>

          {/* Description */}
          <p className="sc-desc sc-el">{c.desc}</p>

          {/* CTA */}
          <div className="sc-cta sc-el">
            <a href="#cta" className="btn btn--primary">
              Записаться <ArrowRight size={16} />
            </a>
            <div className="sc-progress">
              {COURSES.map((_, i) => (
                <button
                  key={i}
                  className={`sc-pip${i === active ? ' active' : ''}`}
                  onClick={() => switchTo(i)}
                  aria-label={`Курс ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Card strip ── */}
        <div className="sc-strip" ref={cardsRef}>
          {COURSES.map((course, i) => (
            <button
              key={course.id}
              className={`sc-card${i === active ? ' sc-card--active' : ''}`}
              onClick={() => switchTo(i)}
              aria-label={course.title}
            >
              <img src={course.photo} alt={course.mentor} className="sc-card__img" draggable="false" />
              <div className="sc-card__caption">
                <span className="sc-card__name">{course.mentor}</span>
                <span className="sc-card__course">{course.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
})

// ─── Process ──────────────────────────────────────────────────────────────────

const STEPS = [
  { num: '01', title: 'Учись',     desc: 'Практические знания от действующих специалистов. Никакой воды — только то, что реально работает на рынке.' },
  { num: '02', title: 'Создавай',  desc: 'С первого занятия делаешь реальные проекты. К концу курса у тебя будет портфолио, которое говорит громче резюме.' },
  { num: '03', title: 'Практикуй', desc: 'Программа U! Talents помогает с трудоустройством. Наши партнёры: Gazprom, Xiaomi, Kipish и ещё 13+ компаний.' },
]

const Process = memo(function Process() {
  const ref = useRef()
  useGSAP(() => {
    gsap.from(ref.current.querySelectorAll('.step'), {
      opacity: 0, x: -36, stagger: 0.18, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 72%' }
    })
    gsap.from(ref.current.querySelector('.process__head'), {
      opacity: 0, y: 32, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 80%' }
    })
  }, { scope: ref })

  return (
    <section className="process" id="process" ref={ref}>
      <div className="process__inner">
        <div className="process__head">
          <span className="tag tag--light">Как это работает</span>
          <h2>Три шага к новой<br />профессии</h2>
        </div>
        <div className="steps">
          {STEPS.map(s => (
            <div key={s.num} className="step">
              <div className="step__num">{s.num}</div>
              <div className="step__body">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

// ─── Talents ──────────────────────────────────────────────────────────────────

const PARTNERS = ['Gazprom', 'Xiaomi', 'Kipish', 'EVO', 'Optima', 'MegaCom', 'Elcat', 'Ozone']

const Talents = memo(function Talents() {
  const ref = useRef()
  useGSAP(() => {
    gsap.from(ref.current.querySelector('.talents__inner'), {
      opacity: 0, y: 36, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 78%' }
    })
    gsap.from(ref.current.querySelectorAll('.partner'), {
      opacity: 0, scale: 0.78, stagger: 0.07, duration: 0.6, ease: 'back.out(1.3)',
      scrollTrigger: { trigger: ref.current, start: 'top 68%' }
    })
  }, { scope: ref })

  return (
    <section className="talents" id="talents" ref={ref}>
      <div className="talents__inner">
        <span className="tag">Трудоустройство</span>
        <h2>U! Talents — твой<br /><span className="accent">путь к работе</span></h2>
        <p>Помогаем выпускникам с поиском работы и стажировок. Наша сеть партнёров растёт каждый месяц.</p>
        <div className="partners">
          {PARTNERS.map(p => <div key={p} className="partner">{p}</div>)}
        </div>
      </div>
    </section>
  )
})

// ─── CTA ──────────────────────────────────────────────────────────────────────

const CTA = memo(function CTA() {
  const [form, setForm] = useState({ name: '', phone: '' })
  const [sent, setSent]  = useState(false)
  const ref = useRef()

  useGSAP(() => {
    gsap.from(ref.current.querySelectorAll('.cta-el'), {
      opacity: 0, y: 38, stagger: 0.12, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 72%' }
    })
  }, { scope: ref })

  const submit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section className="cta-sec" id="cta" ref={ref}>
      <div className="cta-sec__inner">
        <span className="tag tag--dark cta-el">Начни сегодня</span>
        <h2 className="cta-el">Запишись на<br />бесплатный урок</h2>
        <p className="cta-el">Попробуй перед оплатой — первый урок бесплатно.<br />Мы свяжемся в течение часа.</p>
        {sent ? (
          <div className="cta-el" style={{ padding: '32px 0', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--cream)' }}>
            ✓ Заявка отправлена! Мы свяжемся с вами скоро.
          </div>
        ) : (
          <form className="cta-form cta-el" onSubmit={submit}>
            <input
              type="text" placeholder="Твоё имя"
              value={form.name} required
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
            <input
              type="tel" placeholder="+996 ___ ___ ___"
              value={form.phone} required
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            />
            <button type="submit" className="btn btn--cta">
              Записаться бесплатно <ArrowRight size={18} />
            </button>
          </form>
        )}
        <p className="cta-note cta-el">Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности</p>
      </div>
    </section>
  )
})

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">U!<span>SkillZ</span></div>
          <p>Школа Креативных Профессий.<br />Учись, создавай, практикуй.</p>
          <div className="footer__contacts">
            <a href="https://uskillz.online" target="_blank" rel="noopener noreferrer">uskillz.online</a>
            <a href="https://t.me/uskillz"   target="_blank" rel="noopener noreferrer">Telegram</a>
            <a href="tel:+996">+996 __ ___ ___</a>
          </div>
        </div>
        <div className="footer__links">
          <div>
            <h4>Курсы</h4>
            <ul>
              {['Digital Art', 'UX/UI Design', 'Motion Design', 'SMM', 'JavaScript', 'Python'].map(l => (
                <li key={l}><a href="#courses">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Компания</h4>
            <ul>
              {['О нас', 'Менторы', 'U! Talents', 'Блог', 'Контакты'].map(l => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <p>© 2026 U! SkillZ. Все права защищены.</p>
        <div>
          <a href="#">Политика конфиденциальности</a>
          <a href="#">Условия</a>
        </div>
      </div>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothTouch: false })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
    const id = setTimeout(() => ScrollTrigger.refresh(), 500)
    return () => { lenis.destroy(); clearTimeout(id) }
  }, [])

  useEffect(() => {
    const h = (e) => {
      mouse.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  return (
    <>
      <CustomCursor />
      <Nav />
      <main>
        <Intro />
        <Hero mouse={mouse} />
        <Marquee />
        <Stats />
        <Courses />
        {/* т<Showcase /> */}
        <Process />
        <Talents />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
