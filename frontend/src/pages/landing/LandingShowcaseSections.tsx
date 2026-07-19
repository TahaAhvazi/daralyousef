import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  LocateFixed,
  MessagesSquare,
  Quote,
  Receipt,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";

import { useT } from "@/i18n/useT";

const easeOut = [0.2, 0.7, 0.2, 1] as const;

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: easeOut, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ── Interactive dot-wave canvas ──────────────────────────────────────────
 * Performance strategy for low-end devices:
 * - dot count capped (~700, degrades once to ~350 if frames are slow)
 * - devicePixelRatio capped at 1.5
 * - fillRect instead of arc (dots are tiny, shape is indistinguishable)
 * - rAF loop only runs while the section is on screen and the tab is visible
 * - pointer tracking only on fine-pointer (mouse) devices
 * - prefers-reduced-motion: one static frame, no loop
 */
export function DotWaveCanvas({
  baseColor = "#9db8e8",
  highlightColor = "#f5c518",
  density = 700,
}: {
  baseColor?: string;
  highlightColor?: string;
  density?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const section = host.parentElement ?? host;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let width = 0;
    let height = 0;
    let dots = new Float32Array(0);
    let count = 0;
    let spacingBoost = 1;
    let raf = 0;
    let running = false;
    let inView = false;
    let t = 0;
    let lastTs = 0;
    let slowFrames = 0;

    const pointer = { x: -1e4, y: -1e4 };

    const build = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const spacing = Math.max(24, Math.sqrt((width * height) / density)) * spacingBoost;
      const cols = Math.max(1, Math.floor(width / spacing));
      const rows = Math.max(1, Math.floor(height / spacing));
      const ox = (width - (cols - 1) * spacing) / 2;
      const oy = (height - (rows - 1) * spacing) / 2;
      count = cols * rows;
      dots = new Float32Array(count * 2);
      let i = 0;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          dots[i] = ox + c * spacing;
          dots[i + 1] = oy + r * spacing;
          i += 2;
        }
      }
    };

    const drawFrame = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const px = pointer.x;
      const py = pointer.y;
      const radius = 150;
      const radiusSq = radius * radius;

      for (let i = 0; i < count; i += 1) {
        const x = dots[i * 2];
        const y = dots[i * 2 + 1];
        const wave = Math.sin(x * 0.018 + y * 0.011 + time * 1.7);
        let ax = x;
        let ay = y + wave * 4;
        let size = 1.5 + (wave + 1) * 0.5;
        let gold = 0;

        const dx = ax - px;
        const dy = ay - py;
        const distSq = dx * dx + dy * dy;
        if (distSq < radiusSq) {
          const dist = Math.sqrt(distSq) || 1;
          const f = 1 - dist / radius;
          const push = f * f * 22;
          ax += (dx / dist) * push;
          ay += (dy / dist) * push;
          size += f * 2;
          gold = f;
        }

        ctx.globalAlpha = Math.min(1, 0.24 + (wave + 1) * 0.12 + gold * 0.5);
        ctx.fillStyle = gold > 0.12 ? highlightColor : baseColor;
        ctx.fillRect(ax - size / 2, ay - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (ts: number) => {
      if (!running) return;
      const dt = lastTs ? ts - lastTs : 16;
      lastTs = ts;
      t += Math.min(dt, 48) / 1000;

      if (dt > 34 && spacingBoost === 1) {
        slowFrames += 1;
        if (slowFrames >= 40) {
          spacingBoost = 1.45;
          build();
        }
      }

      drawFrame(t);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      lastTs = 0;
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    build();
    if (reduceMotion) drawFrame(0);

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !document.hidden) start();
        else stop();
      },
      { rootMargin: "80px" },
    );
    io.observe(host);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (inView) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => {
      build();
      if (reduceMotion) drawFrame(0);
    });
    ro.observe(host);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -1e4;
      pointer.y = -1e4;
    };

    if (finePointer && !reduceMotion) {
      section.addEventListener("pointermove", onMove, { passive: true });
      section.addEventListener("pointerleave", onLeave);
    }

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (finePointer && !reduceMotion) {
        section.removeEventListener("pointermove", onMove);
        section.removeEventListener("pointerleave", onLeave);
      }
    };
  }, [reduceMotion, baseColor, highlightColor, density]);

  return (
    <div className="landing-dar-why-canvas" aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
}

/* ── Why us — spotlight cards over the dot field ─────────────────────────── */

type WhyFeature = {
  icon: typeof Zap;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
};

const WHY_FEATURES: WhyFeature[] = [
  {
    icon: Zap,
    titleAr: "تنفيذ سريع",
    titleEn: "Fast turnaround",
    descAr: "من تأكيد الطلب إلى التسليم بأقصر وقت ممكن.",
    descEn: "From order confirmation to delivery in record time.",
  },
  {
    icon: BadgeCheck,
    titleAr: "جودة مضمونة",
    titleEn: "Guaranteed quality",
    descAr: "فحص جودة على كل قطعة قبل التسليم.",
    descEn: "Every piece is quality-checked before it ships.",
  },
  {
    icon: LocateFixed,
    titleAr: "تتبع مباشر",
    titleEn: "Live tracking",
    descAr: "تابع حالة طلبك خطوة بخطوة من البوابة.",
    descEn: "Follow your order step by step from the portal.",
  },
  {
    icon: MessagesSquare,
    titleAr: "تواصل فوري",
    titleEn: "Instant messaging",
    descAr: "راسل فريقنا واعتمد التصاميم مباشرة.",
    descEn: "Chat with our team and approve designs directly.",
  },
  {
    icon: ShieldCheck,
    titleAr: "ملفات آمنة",
    titleEn: "Secure files",
    descAr: "ملفاتك وتصاميمك محفوظة وخاصة.",
    descEn: "Your files and artwork stay safe and private.",
  },
  {
    icon: Receipt,
    titleAr: "أسعار شفافة",
    titleEn: "Transparent pricing",
    descAr: "عروض أسعار وفواتير واضحة بدون مفاجآت.",
    descEn: "Clear quotes and invoices with no surprises.",
  },
];

function SpotlightCard({ feature, isAr }: { feature: WhyFeature; isAr: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = feature.icon;

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} className="landing-dar-spot-card" onMouseMove={onMouseMove}>
      <span className="landing-dar-spot-icon" aria-hidden>
        <Icon className="size-5" />
      </span>
      <h3 className="landing-dar-spot-title">{isAr ? feature.titleAr : feature.titleEn}</h3>
      <p className="landing-dar-spot-desc">{isAr ? feature.descAr : feature.descEn}</p>
    </div>
  );
}

export function LandingWhyUsSection() {
  const { locale } = useT();
  const isAr = locale.startsWith("ar");

  return (
    <section id="why-us" className="landing-dar-section landing-dar-section--why">
      <DotWaveCanvas />

      <div className="landing-shell">
        <Reveal className="landing-dar-section-head">
          <p className="landing-dar-eyebrow">{isAr ? "لماذا دار اليوسف" : "Why Dar Alyousif"}</p>
          <h2 className="landing-dar-section-title">
            {isAr ? "كل شيء في منصة واحدة" : "Everything in one platform"}
          </h2>
          <p className="landing-dar-section-lead">
            {isAr
              ? "اطلب، تابع، اعتمد، واستلم — تجربة رقمية كاملة لخدمات الطباعة والإعلان."
              : "Order, track, approve, and receive — a complete digital experience for printing & advertising."}
          </p>
        </Reveal>

        <div className="landing-dar-spot-grid">
          {WHY_FEATURES.map((feature, index) => (
            <Reveal key={feature.titleEn} delay={index * 0.06}>
              <SpotlightCard feature={feature} isAr={isAr} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials — dual-direction marquee ───────────────────────────────── */

type Testimonial = {
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  quoteAr: string;
  quoteEn: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    nameAr: "أبو علي",
    nameEn: "Abu Ali",
    roleAr: "مطعم الديوان",
    roleEn: "Al-Diwan Restaurant",
    quoteAr: "طلبنا يونيفورم كامل للفريق ووصل خلال أيام — سرعة وجودة ما توقعناها.",
    quoteEn: "We ordered full team uniforms and got them within days — speed and quality beyond expectations.",
  },
  {
    nameAr: "سارة الخفاجي",
    nameEn: "Sara Al-Khafaji",
    roleAr: "مؤسسة ناشئة",
    roleEn: "Startup founder",
    quoteAr: "صمموا هويتنا البصرية كاملة وطبعوا كل شيء. متابعة الطلب من البوابة كانت مريحة جدًا.",
    quoteEn: "They designed our full brand identity and printed everything. Tracking it all from the portal was so convenient.",
  },
  {
    nameAr: "م. حسين كريم",
    nameEn: "Eng. Hussein Karim",
    roleAr: "شركة مقاولات",
    roleEn: "Contracting company",
    quoteAr: "لوحات CNC بدقة ممتازة وتركيب احترافي. صار موردنا الدائم لكل الواجهات.",
    quoteEn: "CNC signage with excellent precision and professional installation. Now our go-to for every facade.",
  },
  {
    nameAr: "أستاذة زينب",
    nameEn: "Ms. Zainab",
    roleAr: "مدرسة أهلية",
    roleEn: "Private school",
    quoteAr: "طباعة الملازم والكتب صارت أسهل بكثير — نرفع الملفات ويوصلنا كل شيء جاهز.",
    quoteEn: "Printing study notes and books is so much easier — we upload the files and everything arrives ready.",
  },
  {
    nameAr: "علي الساعدي",
    nameEn: "Ali Al-Saadi",
    roleAr: "معرض سيارات",
    roleEn: "Car showroom",
    quoteAr: "حملة بنرات كاملة بيوم واحد. التواصل المباشر مع الفريق وفّر علينا وقت كبير.",
    quoteEn: "A full banner campaign in one day. Direct messaging with the team saved us huge time.",
  },
  {
    nameAr: "دعاء محمد",
    nameEn: "Duaa Mohammed",
    roleAr: "متجر إلكتروني",
    roleEn: "Online store",
    quoteAr: "تغليف وستيكرات بجودة عالية جدًا، والأسعار واضحة من أول عرض.",
    quoteEn: "Very high-quality packaging and stickers, with clear pricing from the first quote.",
  },
];

function TestimonialCard({ item, isAr }: { item: Testimonial; isAr: boolean }) {
  return (
    <figure className="landing-dar-tmk-card">
      <Quote className="landing-dar-tmk-quote size-5" aria-hidden />
      <div className="landing-dar-tmk-stars" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-3.5" fill="currentColor" />
        ))}
      </div>
      <blockquote>{isAr ? item.quoteAr : item.quoteEn}</blockquote>
      <figcaption>
        <span className="landing-dar-tmk-avatar" aria-hidden>
          {(isAr ? item.nameAr : item.nameEn).charAt(0)}
        </span>
        <span>
          <strong>{isAr ? item.nameAr : item.nameEn}</strong>
          <small>{isAr ? item.roleAr : item.roleEn}</small>
        </span>
      </figcaption>
    </figure>
  );
}

function TestimonialRow({ items, isAr, reverse }: { items: Testimonial[]; isAr: boolean; reverse?: boolean }) {
  const cards = (ariaHidden: boolean) => (
    <div className="landing-dar-tmk-row" aria-hidden={ariaHidden || undefined}>
      {items.map((item) => (
        <TestimonialCard key={item.nameEn} item={item} isAr={isAr} />
      ))}
    </div>
  );

  return (
    <div className={`landing-dar-tmk-track${reverse ? " landing-dar-tmk-track--reverse" : ""}`}>
      {cards(false)}
      {cards(true)}
    </div>
  );
}

export function LandingTestimonialsSection() {
  const { locale } = useT();
  const isAr = locale.startsWith("ar");

  const firstRow = TESTIMONIALS.slice(0, 3);
  const secondRow = TESTIMONIALS.slice(3);

  return (
    <section id="testimonials" className="landing-dar-section landing-dar-section--tmk">
      <DotWaveCanvas baseColor="#1a3f96" highlightColor="#0a1f4d" density={550} />

      <div className="landing-shell">
        <Reveal className="landing-dar-section-head">
          <p className="landing-dar-eyebrow">{isAr ? "آراء عملائنا" : "Client words"}</p>
          <h2 className="landing-dar-section-title">
            {isAr ? "موثوقون من مئات العملاء" : "Trusted by hundreds of clients"}
          </h2>
          <p className="landing-dar-section-lead">
            {isAr
              ? "قصص حقيقية من عملاء اعتمدوا علينا في الطباعة والتصميم والإعلان."
              : "Real stories from clients who rely on us for print, design, and advertising."}
          </p>
        </Reveal>
      </div>

      <div className="landing-dar-tmk">
        <TestimonialRow items={firstRow} isAr={isAr} />
        <TestimonialRow items={secondRow} isAr={isAr} reverse />
      </div>
    </section>
  );
}
