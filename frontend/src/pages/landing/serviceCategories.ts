export type ServiceCategorySlug =
  | "papers"
  | "cnc"
  | "flex-printing"
  | "design"
  | "embroidery"
  | "publishing";

export type ServiceCategory = {
  slug: ServiceCategorySlug;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  itemsAr: string[];
  itemsEn: string[];
};

export const LANDING_COLUMN_SERVICES: ServiceCategory[] = [
  {
    slug: "papers",
    titleAr: "في قسم الورقيات",
    titleEn: "Paper & stationery",
    descriptionAr: "منتجات وخدمات الورقيات والمطبوعات الورقية بجودة عالية وتسليم سريع.",
    descriptionEn: "High-quality paper products and stationery with fast turnaround.",
    itemsAr: ["بطاقات أعمال", "ملصقات", "أوراق رسمية", "تغليف", "منشورات"],
    itemsEn: ["Business cards", "Stickers", "Letterheads", "Packaging", "Brochures"],
  },
  {
    slug: "cnc",
    titleAr: "قسم CNC",
    titleEn: "CNC department",
    descriptionAr: "قص وتشكيل دقيق للأكريليك والخشب والمعادن حسب التصميم.",
    descriptionEn: "Precision cutting and shaping for acrylic, wood, and metal.",
    itemsAr: ["قص ليزر", "حفر CNC", "أحرف بارزة", "لوحات إرشادية", "قطع مخصصة"],
    itemsEn: ["Laser cutting", "CNC routing", "3D letters", "Signage panels", "Custom parts"],
  },
  {
    slug: "flex-printing",
    titleAr: "قسم طباعة الفلكس",
    titleEn: "Flex printing",
    descriptionAr: "طباعة فلكس ومش ولوحات إعلانية للداخل والخارج.",
    descriptionEn: "Flex, mesh, and banner printing for indoor and outdoor use.",
    itemsAr: ["بانر فلكس", "مش إعلاني", "ستيكر كبير", "لوحات واجهات", "معرض وفعاليات"],
    itemsEn: ["Flex banners", "Mesh ads", "Large stickers", "Facade boards", "Events & exhibitions"],
  },
  {
    slug: "design",
    titleAr: "قسم التصميم",
    titleEn: "Design department",
    descriptionAr: "تصميم هوية بصرية ومطبوعات رقمية جاهزة للإنتاج.",
    descriptionEn: "Brand identity and print-ready digital design.",
    itemsAr: ["شعار وهوية", "سوشيال ميديا", "كتالوجات", "تصميم إعلان", "ملفات طباعة"],
    itemsEn: ["Logo & branding", "Social media", "Catalogues", "Ad creatives", "Print files"],
  },
  {
    slug: "embroidery",
    titleAr: "قسم الخياطة والتطريز والطباعة على الملابس",
    titleEn: "Sewing, embroidery & apparel printing",
    descriptionAr: "يونيفورم، تطريز، وطباعة على القمصان والأقمشة.",
    descriptionEn: "Uniforms, embroidery, and apparel printing.",
    itemsAr: ["تطريز شعار", "يونيفورم موظفين", "طباعة DTF", "قبعات وسترات", "هدايا مؤسسية"],
    itemsEn: ["Logo embroidery", "Staff uniforms", "DTF printing", "Caps & jackets", "Corporate gifts"],
  },
  {
    slug: "publishing",
    titleAr: "قسم التنضيد وطباعة الملازم والكتب",
    titleEn: "Typesetting & book printing",
    descriptionAr: "تنضيد، طباعة ملازم، كتب، وتقارير للمؤسسات والمدارس.",
    descriptionEn: "Typesetting, notebooks, books, and institutional reports.",
    itemsAr: ["ملازم دراسية", "كتب مؤسسية", "تقارير سنوية", "مجلات", "تنضيد عربي وإنجليزي"],
    itemsEn: ["Study notes", "Corporate books", "Annual reports", "Magazines", "Arabic & English typesetting"],
  },
];

export function getServiceCategory(slug: string | undefined): ServiceCategory | undefined {
  return LANDING_COLUMN_SERVICES.find((c) => c.slug === slug);
}
