import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, LogIn, X } from "lucide-react";

import { useT } from "@/i18n/useT";
import type { ServiceCategory } from "@/pages/landing/serviceCategories";

type Props = {
  category: ServiceCategory | null;
  onClose: () => void;
};

export function ServiceCategoryDialog({ category, onClose }: Props) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { isRtl, t } = useT();

  useEffect(() => {
    if (!category) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [category, onClose]);

  const title = category ? (isRtl ? category.titleAr : category.titleEn) : "";
  const description = category ? (isRtl ? category.descriptionAr : category.descriptionEn) : "";
  const items = category ? (isRtl ? category.itemsAr : category.itemsEn) : [];

  const closeLabel = isRtl ? "إغلاق" : "Close";
  const itemsLabel = isRtl ? "المنتجات والخدمات" : "Products & services";

  const goToRegister = () => {
    onClose();
    navigate("/register");
  };

  const goToLogin = () => {
    onClose();
    navigate("/login");
  };

  return (
    <AnimatePresence>
      {category ? (
        <div className="landing-dar-dialog-root">
          <motion.button
            type="button"
            className="landing-dar-dialog-backdrop"
            aria-label={closeLabel}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-service-dialog-title"
            className={`landing-dar-dialog ${isRtl ? "font-arabic" : ""}`}
            initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="landing-dar-dialog-close"
              aria-label={closeLabel}
            >
              <X className="size-4" />
            </button>

            <h2 id="landing-service-dialog-title" className="landing-dar-dialog-title">
              {title}
            </h2>
            <p className="landing-dar-dialog-lead">{description}</p>

            <div className="landing-dar-dialog-items">
              <p className="landing-dar-dialog-items-label">{itemsLabel}</p>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="landing-dar-dialog-actions">
              <button type="button" className="landing-dar-cta-primary" onClick={goToRegister}>
                {t.hero.primaryCta}
                <ArrowRight data-rtl-mirror="true" className="size-4" />
              </button>
              <button type="button" className="landing-dar-cta-secondary" onClick={goToLogin}>
                <LogIn data-rtl-mirror="true" className="size-4" />
                {t.auth.signIn}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
