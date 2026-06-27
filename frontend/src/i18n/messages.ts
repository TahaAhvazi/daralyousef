// Centralized translations. Keys mirror the on-screen structure so it's easy
// to translate and review. Iraqi dialect is used where natural; otherwise
// Modern Standard Arabic with Iraqi spellings.
import type { Locale } from "./config";

export type Dict = {
  brand: { name: string; tagline: string };
  meta: { siteTitle: string; siteDescription: string };

  nav: {
    services: string;
    how: string;
    pricing: string;
    portal: string;
    reviews: string;
    signIn: string;
    startOrder: string;
    themeToggle: string;
    languageToggle: string;
    openMenu: string;
    closeMenu: string;
  };

  hero: {
    badge: string;
    titleA: string; // line 1
    titleHl: string; // gradient highlight
    titleB: string; // line 2 (continued after highlight)
    description: { lead: string; bold: string; rest: string };
    primaryCta: string;
    secondaryCta: string;
    pills: { noFees: string; signedApprovals: string; sameDay: string };
    mockup: {
      orderCode: string;
      orderTitle: string;
      inProduction: string;
      designApproved: string;
      materialsReserved: string;
      printing: string;
      delivery: string;
      live: string;
      estimated: string;
      instantPricing: string;
      base: string;
      mesh: string;
      total: string;
      designV3: string;
      awaitingYou: string;
      approve: string;
      revise: string;
      brandLabel: string;
    };
  };

  landing: {
    typingHeadline: string;
    heroLine1: string;
    heroLine2: string;
    heroSubtext: string;
    signInTab: string;
    signUpTab: string;
    authCardLead: string;
    authCardTitle: string;
    explorePortal: string;
    regionLabel: string;
  };

  services: {
    eyebrow: string;
    title: { line1: string; line2: string };
    description: string;
    items: {
      printing: { title: string; desc: string };
      branding: { title: string; desc: string };
      outdoor: { title: string; desc: string };
      embroidery: { title: string; desc: string };
      education: { title: string; desc: string };
      marketing: { title: string; desc: string };
      gifts: { title: string; desc: string };
    };
  };

  how: {
    eyebrow: string;
    title: string;
    description: string;
    steps: {
      orderOnline: { title: string; desc: string };
      uploadBrief: { title: string; desc: string };
      approveDesign: { title: string; desc: string };
      receive: { title: string; desc: string };
    };
  };

  pricing: {
    eyebrow: string;
    title: { before: string; highlight: string; after: string };
    description: string;
    chooseService: string;
    material: string;
    complexity: string;
    quantity: string;
    discount5: string;
    discount10: string;
    instantQuote: string;
    basePrice: string;
    materialLabel: string;
    complexityLabel: string;
    volumeDiscount: string;
    estimatedTotal: string;
    orderNow: string;
    services: {
      flex: string; uv: string; logo: string; embroidery: string;
    };
    units: { m2: string; pcs: string; pkg: string };
    materialKeys: { flex: string; mesh: string; paper: string; acrylic: string; metal: string };
    complexityKeys: { low: string; medium: string; high: string };
  };

  portal: {
    badge: string;
    title: { line1: string; line2: string };
    description: string;
    features: {
      track: { title: string; desc: string };
      sign: { title: string; desc: string };
      talk: { title: string; desc: string };
      vip: { title: string; desc: string };
    };
    createCta: string;
    haveCta: string;
    hello: string;
    welcomeBack: string;
    active: string;
    activeShort: string;
    balance: string;
    tickets: string;
    recentOrders: string;
    orderSamples: { brand: string; cards: string; campaign: string };
    statuses: { in_production: string; ready: string; delivered: string };
  };

  stats: {
    ordersDelivered: string;
    designsApproved: string;
    onTime: string;
    rating: string;
  };

  testimonials: {
    eyebrow: string;
    title: string;
    items: { quote: string; author: string; role: string }[];
  };

  faq: {
    eyebrow: string;
    title: string;
    description: string;
    items: { q: string; a: string }[];
  };

  finalCta: {
    title: { line1: string; line2: string };
    description: string;
    primaryCta: string;
    secondaryCta: string;
    free: string;
    designed: string;
  };

  footer: {
    tagline: string;
    columns: {
      services: { title: string; items: string[] };
      company: { title: string; items: string[] };
      help: { title: string; items: string[] };
    };
    copyright: string;
    builtWith: string;
  };

  auth: {
    welcome: string;
    signInSubtitle: string;
    email: string;
    password: string;
    remember: string;
    forgot: string;
    signIn: string;
    newHere: string;
    createAccount: string;
    tryDemo: string;
    demo: {
      ceo: string;
      generalManager: string;
      departmentManager: string;
      designer: string;
      printingOperator: string;
      accountant: string;
      marketing: string;
      warehouse: string;
      sales: string;
      support: string;
      customer: string;
    };
    loginFailed: string;
    // hero
    heroH1A: string; heroH1B: string;
    heroLead: string;
    heroFeatures: { instant: string; live: string; audit: string };
    footer: string;
    // register
    registerTitle: string;
    registerSubtitle: string;
    fullName: string;
    company: string;
    phone: string;
    optional: string;
    passwordHint: string;
    createBtn: string;
    haveAccount: string;
    registerFailed: string;
    // forgot
    forgotTitle: string;
    forgotSubtitle: string;
    sendReset: string;
    forgotSent: string;
    devTokenLabel: string;
    backToSignIn: string;
  };

  portalUi: {
    welcomeUser: string; // "Welcome, {name}"
    signOut: string;
    nav: {
      overview: string;
      myOrders: string;
      quotations: string;
      invoices: string;
      support: string;
    };
    home: {
      greeting: string; // "Hello, {name}"
      subtitle: string;
      startOrder: string;
      kpiActive: string;
      kpiOutstanding: string;
      kpiOpenTickets: string;
      recentOrders: string;
      recentOrdersSub: string;
      invoices: string;
      invoicesSub: string;
      viewAll: string;
      noOrders: string;
      noInvoices: string;
      deadline: string;
      due: string;
    };
    orders: {
      title: string;
      description: string;
      startOrder: string;
      colOrder: string;
      colStatus: string;
      colDeadline: string;
      colTotal: string;
      emptyTitle: string;
      emptyDesc: string;
      requestSubmitted: string;
      pricingPending: string;
      deadlinePending: string;
      back: string;
      requestDetails: string;
      lineItems: string;
      reviewProposal: string;
      reviewHint: string;
      responseNotes: string;
      approve: string;
      requestChanges: string;
      responseSent: string;
      timeline: string;
      confirmReceiptTitle: string;
      confirmReceiptHint: string;
      confirmReceiptQuestion: string;
      confirmReceiptYes: string;
      confirmReceiptSuccess: string;
    };
    statuses: Record<string, string>;
  };

  staffUi: {
    brand: { name: string; subtitle: string };
    topbar: {
      search: string;
      notifications: string;
      profile: string;
      signOut: string;
      themeToggle: string;
      languageToggle: string;
      openMenu: string;
      closeMenu: string;
      defaultRole: string;
      viewAllNotifications: string;
      markAllRead: string;
      noNotifications: string;
    };
    nav: {
      // sections
      overview: string;
      crm: string;
      operations: string;
      catalog: string;
      service: string;
      insights: string;
      // items
      dashboard: string;
      auditLog: string;
      customers: string;
      companies: string;
      leads: string;
      opportunities: string;
      orders: string;
      newOrder: string;
      orderBoard: string;
      quotations: string;
      invoices: string;
      payments: string;
      products: string;
      materials: string;
      movements: string;
      tickets: string;
      messages: string;
      design: string;
      files: string;
      analytics: string;
      users: string;
      myEmployees: string;
      settings: string;
    };
    common: {
      cancel: string;
      save: string;
      create: string;
      edit: string;
      delete: string;
      submit: string;
      send: string;
      record: string;
      accept: string;
      previous: string;
      next: string;
      page: string;
      of: string;
      total: string;
      search: string;
      noResults: string;
      all: string;
      live: string;
      autoRefresh: string;
      required: string;
      optional: string;
      yes: string;
      no: string;
    };
    dashboard: {
      title: string;
      description: string;
      revenueTitle: string;
      revenueSubtitle: string; // "Today {today} · MTD {mtd}"
      paid: string;
      ordersByStatusTitle: string;
      ordersByStatusSub: string;
      onlineTitle: string;
      onlineSub: string;
      nobodyOnline: string;
      liveActivityTitle: string;
      liveActivitySub: string;
      noActivity: string;
      deptLoadTitle: string;
      deptLoadSub: string;
      noWorkload: string;
      lowStockTitle: string;
      lowStockSub: string;
      lowStockOk: string;
      overdueTitle: string;
      overdueSub: string;
      overdueOk: string;
      due: string;
      approvalsTitle: string;
      approvalsSub: string;
      noApprovals: string;
      revisionPrefix: string; // "Revision #"
      orderNumber: string; // "Order #"
      activeLabel: string; // "active"
      delayedLabel: string; // "delayed"
      kpis: {
        revenueToday: string;
        revenueMTD: string;
        activeOrders: string;
        delayedOrders: string;
        onlineNow: string;
        pendingApprovals: string;
        revenueTodayHint: string;
        revenueMTDHint: string;
        activeHint: string;
        delayedHint: string;
        onlineHint: string;
        pendingHint: string;
      };
    };
    customers: {
      title: string;
      description: string;
      newBtn: string;
      newTitle: string;
      searchPh: string;
      colCustomer: string;
      colCode: string;
      colPhone: string;
      colLocation: string;
      colTags: string;
      emptyTitle: string;
      emptyDesc: string;
      showing: string; // "Showing page {p} of {n} · {t} total"
      archived: string;
      // form
      fullName: string;
      email: string;
      phone: string;
      jobTitle: string;
      city: string;
      country: string;
      tags: string;
      notes: string;
      saved: string;
    };
    leads: {
      title: string;
      description: string;
      newBtn: string;
      newTitle: string;
      allStages: string;
      colLead: string;
      colSource: string;
      colStage: string;
      colScore: string;
      colValue: string;
      converted: string;
      convert: string;
      emptyTitle: string;
      emptyDesc: string;
      created: string;
      convertedToast: string;
      // form
      fullName: string;
      company: string;
      email: string;
      phone: string;
      source: string;
      stage: string;
      score: string;
      estValue: string;
    };
    orders: {
      title: string;
      description: string;
      newBtn: string;
      searchPh: string;
      allStatuses: string;
      colCode: string;
      colTitle: string;
      colStatus: string;
      colPriority: string;
      colDeadline: string;
      colTotal: string;
      placedVia: string; // "via {ch}"
      emptyTitle: string;
      emptyDesc: string;
      timeline: {
        title: string;
        subtitle: string;
        thread: string;
        staff: string;
        customer: string;
        unknownActor: string;
        noMessage: string;
        openMessages: string;
      };
      confirmReceiptTitle: string;
      confirmReceiptHint: string;
      confirmReceiptQuestion: string;
      confirmReceiptYes: string;
      confirmReceiptSuccess: string;
      payment: {
        label: string;
        confirmTitle: string;
        confirmHint: string;
        revokeTitle: string;
        revokeHint: string;
        notesLabel: string;
        notesPlaceholder: string;
        revokeReasonLabel: string;
        revokeReasonPlaceholder: string;
        uploadLabel: string;
        uploadHint: string;
        confirmBtn: string;
        revokeBtn: string;
        markedPaid: string;
        clearedPaid: string;
      };
      detail: {
        back: string;
        boardView: string;
        status: string;
        priority: string;
        deadline: string;
        payment: string;
        total: string;
        lineItemsCount: string;
        productionPipeline: string;
        productionPipelineSub: string;
        stageTeam: string;
        notAssigned: string;
        history: string;
        pipelineUpdated: string;
        updateFailed: string;
        loading: string;
        workflowStages: {
          pending: string;
          design: string;
          printing: string;
          production: string;
          finishing: string;
          delivery: string;
          completed: string;
          on_hold: string;
          cancelled: string;
        };
      };
    };
    departments: Record<string, string>;
    orderBoard: {
      title: string;
      description: string;
      allDepartments: string;
      refresh: string;
      listView: string;
      activeCount: string;
      loading: string;
      moved: string;
      moveFailed: string;
      stageNotApplicable: string;
      stageMarkedNa: string;
      stageNoAssignees: string;
      oneStageBackOnly: string;
      dragHint: string;
      statsTitle: string;
      totalOrders: string;
      activityTitle: string;
      activityEmpty: string;
      sourcePortal: string;
      sourceStaff: string;
      lastUpdated: string;
      zoomIn: string;
      zoomOut: string;
      resetZoom: string;
      fitView: string;
      zoomPct: string;
      panHint: string;
      enterFullscreen: string;
      exitFullscreen: string;
      mobileTapHint: string;
      mobilePrevStage: string;
      mobileNextStage: string;
      emptyColumn: string;
      moveBack: string;
      moveForward: string;
      openOrder: string;
      revertRequiresReason: string;
      revertTitle: string;
      revertDescription: string;
      revertReasonLabel: string;
      revertReasonPlaceholder: string;
      revertConfirm: string;
      assignmentsRequired: string;
      columns: {
        intake: string;
        approval: string;
        confirmed: string;
        paid: string;
        design: string;
        printing: string;
        production: string;
        finishing: string;
        delivery: string;
        completed: string;
        cancelled: string;
      };
    };
    messages: {
      title: string;
      description: string;
      tabChats: string;
      tabContacts: string;
      search: string;
      today: string;
      empty: string;
      selectChat: string;
      placeholder: string;
      attach: string;
      linkProject: string;
      noProject: string;
      newGroup: string;
      createGroup: string;
      groupCreated: string;
      groupName: string;
      members: string;
      groupFallback: string;
      attachments: string;
    };
    notifications: {
      title: string;
      description: string;
      emptyTitle: string;
      emptyHint: string;
      markAllRead: string;
      all: string;
      unread: string;
      types: {
        chatMessage: string;
        orderAssigned: string;
        orderAssignmentUpdated: string;
        orderAssignmentsChanged: string;
        orderReleased: string;
      };
      bodies: {
        chatPreview: string;
        assignedToStages: string;
        assignmentUpdated: string;
        managerAssignments: string;
        managerAssignmentsUpdated: string;
        releasedAssignee: string;
        releasedManager: string;
      };
    };
    newOrder: {
      title: string;
      description: string;
      cancel: string;
      submit: string;
      created: string; // "Order {code} created"
      detailsTitle: string;
      detailsSub: string;
      customerLabel: string;
      selectCustomer: string;
      placingAs: string;
      orderTitleLabel: string;
      orderTitlePh: string;
      deadline: string;
      priority: string;
      priorities: { low: string; normal: string; high: string; urgent: string };
      notes: string;
      lineItemsTitle: string;
      lineItemsSub: string;
      addLine: string;
      noItems: string;
      noItemsHintBefore: string;
      noItemsHintLink: string;
      noItemsHintAfter: string;
      summaryTitle: string;
      summarySub: string;
      subtotal: string;
      tax: string;
      grandTotal: string;
      instantQuote: string;
      attachTitle: string;
      attachSub: string;
      uploadCta: string;
      uploadHint: string;
      uploadsDone: string;
      // line row
      product: string;
      selectProduct: string;
      quantity: string;
      unit: string;
      unitPrice: string;
      livePricing: string;
      addProduct: string;
      reviewTitle: string;
      reviewSub: string;
      itemCount: string; // "{count} item(s)"
      itemFallback: string; // "Item {n}"
    };
    workflowAssignments: {
      title: string;
      subtitle: string;
      description: string;
      selectStaff: string;
      notApplicable: string;
      skippedHint: string;
      noStaff: string;
      selectedCount: string;
      editTitle: string;
      editSubtitle: string;
      saveAssignments: string;
      saved: string;
      stages: {
        design: string;
        printing: string;
        production: string;
        finishing: string;
        delivery: string;
      };
    };
    quotations: {
      title: string;
      description: string;
      colCode: string;
      colStatus: string;
      colIssued: string;
      colValid: string;
      colTotal: string;
      accept: string;
      invoice: string;
      accepted: string;
      invoiceCreated: string; // "Invoice {code} created"
      emptyTitle: string;
      emptyDesc: string;
    };
    invoices: {
      title: string;
      description: string;
      colCode: string;
      colStatus: string;
      colIssued: string;
      colDue: string;
      colBalance: string;
      colTotal: string;
      colDescription: string;
      colQty: string;
      colUnitPrice: string;
      colTax: string;
      colLineTotal: string;
      colSubtotal: string;
      colTaxTotal: string;
      colPaid: string;
      emptyTitle: string;
      emptyDesc: string;
      back: string;
      summary: string;
      lineItems: string;
      notes: string;
      loading: string;
      generateEn: string;
      generateAr: string;
      generateBtn: string;
      deleteBtn: string;
      deleted: string;
      confirmDelete: string;
      downloadEn: string;
      downloadAr: string;
      pdfDownloaded: string;
      generated: string;
      updated: string;
      issuedAt: string;
      portalUpdated: string;
      portalVisible: string;
      showInPortal: string;
      hideFromPortal: string;
      orderSectionTitle: string;
      orderSectionSub: string;
      noOrderInvoices: string;
      shareWithPortal: string;
    };
    materials: {
      title: string;
      description: string;
      newBtn: string;
      newTitle: string;
      editTitle: string;
      updated: string;
      deleted: string;
      searchPh: string;
      lowOnly: string;
      filters: string;
      allMaterials: string;
      kpiTotal: string;
      kpiTotalHint: string;
      kpiLowStock: string;
      kpiLowStockHint: string;
      kpiOutOfStock: string;
      kpiOutOfStockHint: string;
      kpiStockValue: string;
      kpiStockValueHint: string;
      colSku: string;
      colMaterial: string;
      colOnHand: string;
      colReorder: string;
      colCost: string;
      colUnitCost: string;
      colStockValue: string;
      colStatus: string;
      colActions: string;
      stockLow: string;
      stockOk: string;
      stockOut: string;
      movement: string;
      movementTitle: string; // "Stock movement · {name}"
      movementTitleEmpty: string;
      movementType: string;
      movementTypes: {
        IN: string;
        OUT: string;
        DAMAGED: string;
        ADJUSTMENT: string;
        TRANSFER: string;
      };
      movementQty: string;
      movementNotes: string;
      record: string;
      created: string;
      recorded: string;
      emptyTitle: string;
      // form
      name: string;
      sku: string;
      unit: string;
      category: string;
      onHand: string;
      cost: string;
      reorderLevel: string;
    };
    tickets: {
      title: string;
      description: string;
      newBtn: string;
      newTitle: string;
      colCode: string;
      colSubject: string;
      colPriority: string;
      colStatus: string;
      colCreated: string;
      defaultCategory: string;
      emptyTitle: string;
      created: string;
      // form
      subject: string;
      priority: string;
      priorities: { low: string; normal: string; high: string; urgent: string };
      describeIssue: string;
      detail: {
        back: string;
        conversation: string;
        openHint: string;
        closedHint: string;
        replyPlaceholder: string;
        replySent: string;
        closeBtn: string;
        closed: string;
        details: string;
        assignee: string;
        assignTitle: string;
        assignHint: string;
        unassigned: string;
        assigned: string;
        staffLabel: string;
        customerLabel: string;
      };
    };
    products: {
      title: string;
      description: string;
      searchPh: string;
      emptyTitle: string;
      perUnit: string;
      addBtn: string;
      filters: string;
      allProducts: string;
      kpiTotal: string;
      kpiTotalHint: string;
      kpiActive: string;
      kpiActiveHint: string;
      kpiLowStock: string;
      kpiLowStockHint: string;
      kpiCatalogValue: string;
      kpiCatalogValueHint: string;
      colProduct: string;
      colPrice: string;
      colMaterials: string;
      colStock: string;
      colStatus: string;
      colCost: string;
      statusActive: string;
      statusInactive: string;
      stockStatus: { inStock: string; restock: string; outOfStock: string };
      bom: {
        title: string;
        description: string;
        addLine: string;
        material: string;
        selectMaterial: string;
        qtyPerUnit: string;
      };
      form: {
        title: string;
        editTitle: string;
        nameEn: string;
        nameEnPh: string;
        nameAr: string;
        nameArPh: string;
        category: string;
        selectCategory: string;
        unit: string;
        pricingModel: string;
        basePrice: string;
        cost: string;
        taxRate: string;
        descriptionEn: string;
        descriptionAr: string;
        created: string;
        updated: string;
        deleted: string;
        confirmDelete: string;
        failed: string;
        models: { fixed: string; variable: string; customQuote: string };
      };
    };
    catalogOptions: {
      attrs: Record<string, string>;
      values: Record<string, string>;
      breakdown: Record<string, string>;
    };
    audit: {
      title: string;
      description: string;
      colWhen: string;
      colActor: string;
      colAction: string;
      colModule: string;
      colEntity: string;
      colIp: string;
      actionPh: string;
      allModules: string;
      modules: {
        auth: string;
        users: string;
        crm: string;
        orders: string;
        finance: string;
        inventory: string;
        catalog: string;
        support: string;
        files: string;
      };
      emptyTitle: string;
      summary: string; // "Page {p} of {n} · {t} entries"
    };
    users: {
      title: string;
      description: string;
      searchPh: string;
      staffOnly: string;
      newBtn: string;
      newTitle: string;
      editTitle: string;
      fullName: string;
      email: string;
      password: string;
      passwordOptional: string;
      phone: string;
      department: string;
      titleField: string;
      roles: string;
      rolesHint: string;
      isActive: string;
      created: string;
      updated: string;
      deleted: string;
      confirmDelete: string;
      colUser: string;
      colRoles: string;
      colDept: string;
      colStatus: string;
      colLastLogin: string;
      active: string;
      inactive: string;
      emptyTitle: string;
    };
    settings: {
      title: string;
      description: string;
      profileTitle: string;
      profileSub: string;
      fullName: string;
      email: string;
      phone: string;
      department: string;
      save: string;
      saved: string;
      appearanceTitle: string;
      appearanceSub: string;
      light: string;
      lightHint: string;
      dark: string;
      darkHint: string;
      brandTitle: string;
      brandSub: string;
      brandSaved: string;
      adminOnly: string;
      appName: string;
      appNameAr: string;
      tagline: string;
      taglineAr: string;
      sidebarSubtitle: string;
      sidebarSubtitleAr: string;
      logoTitle: string;
      logoHint: string;
      uploadLogo: string;
      logoUploaded: string;
      removeLogo: string;
      removingLogo: string;
      currentLogo: string;
      noLogo: string;
      paletteTitle: string;
      paletteSub: string;
      paletteReset: string;
      brandColor: string;
      brandColorHint: string;
      brandColorDark: string;
      brandColorDarkHint: string;
      accentColor: string;
      accentColorHint: string;
      accentColorDark: string;
      accentColorDarkHint: string;
      previewTitle: string;
      previewPrimary: string;
      previewSecondary: string;
      previewBadgeBrand: string;
      previewBadgeAccent: string;
      previewBadgeSuccess: string;
    };
    placedVia: Record<string, string>;
    priorities: Record<string, string>;
  };

  common: {
    none: string;
    loading: string;
    error: string;
  };
};

const en: Dict = {
  brand: { name: "Dar Al-Yousef Printing", tagline: "Print · Brand · Beyond" },
  meta: {
    siteTitle: "Dar Al-Yousef Printing",
    siteDescription: "A modern printing & branding house — instant pricing, digital approvals and a beautiful customer portal.",
  },
  nav: {
    services: "Services",
    how: "How it works",
    pricing: "Pricing",
    portal: "Portal",
    reviews: "Reviews",
    signIn: "Sign in",
    startOrder: "Start an order",
    themeToggle: "Toggle theme",
    languageToggle: "Change language",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  hero: {
    badge: "Now serving 12,400+ creative orders",
    titleA: "Bring your",
    titleHl: "brand",
    titleB: "to life in a few elegant clicks.",
    description: {
      lead: "Order printing, branding, outdoor advertising, embroidery and more — with ",
      bold: "instant pricing",
      rest: ", live tracking, digital approvals and a beautiful customer portal.",
    },
    primaryCta: "Start an order",
    secondaryCta: "See how it works",
    pills: { noFees: "No upfront fees", signedApprovals: "Signed digital approvals", sameDay: "Same-day quotes" },
    mockup: {
      orderCode: "ORDER #ORD-2026",
      orderTitle: "Flex Banner 3 × 2m + Cards",
      inProduction: "In production",
      designApproved: "Design approved",
      materialsReserved: "Materials reserved",
      printing: "Printing",
      delivery: "Delivery",
      live: "Live",
      estimated: "Estimated",
      instantPricing: "Instant pricing",
      base: "Base",
      mesh: "Mesh ×1.2",
      total: "Total",
      designV3: "Design v3",
      awaitingYou: "Awaiting you",
      approve: "Approve",
      revise: "Revise",
      brandLabel: "BRAND · v3",
    },
  },

  landing: {
    typingHeadline: "Bring your brand to life in a few elegant clicks.",
    heroLine1: "Bring your brand to life",
    heroLine2: "with elegant print solutions.",
    heroSubtext:
      "Order printing, branding, outdoor advertising, embroidery and more — with instant pricing, live tracking and digital approvals.",
    signInTab: "Sign in",
    signUpTab: "Create account",
    authCardLead: "Track orders, approve designs and get instant quotes.",
    authCardTitle: "Access your customer portal",
    explorePortal: "Customer portal",
    regionLabel: "IRAQ · Baghdad",
  },

  services: {
    eyebrow: "One studio, every service",
    title: { line1: "Everything your brand needs,", line2: "under one roof." },
    description: "From a single embroidered cap to a multi-city outdoor campaign — order it all in one place, track it all in one place.",
    items: {
      printing: { title: "Printing", desc: "Flex, mesh, UV, business cards, posters, packaging." },
      branding: { title: "Branding", desc: "Logos & full visual identity." },
      outdoor: { title: "Outdoor", desc: "Billboards, signboards, vehicle wraps." },
      embroidery: { title: "Embroidery", desc: "Uniforms, caps, corporate clothing." },
      education: { title: "Education", desc: "Books, exams, research formatting." },
      marketing: { title: "Marketing", desc: "Social campaigns, content calendar." },
      gifts: { title: "Gifts", desc: "Promotional gifts & corporate sets." },
    },
  },

  how: {
    eyebrow: "Quietly simple",
    title: "Four steps from idea to delivery.",
    description: "No phone tag. No spreadsheets. Just a calm, transparent flow you can check anytime.",
    steps: {
      orderOnline: { title: "Order online", desc: "Pick a service, configure it, see live pricing instantly." },
      uploadBrief: { title: "Upload & brief", desc: "Drop in your files (PDF/PSD/AI) and any reference material." },
      approveDesign: { title: "Approve design", desc: "Review drafts in your portal, sign with one click." },
      receive: { title: "Receive & relax", desc: "Track production live and we deliver to your door." },
    },
  },

  pricing: {
    eyebrow: "Instant pricing",
    title: { before: "Know the price ", highlight: "before", after: " you commit." },
    description: "Try the live calculator below. The same engine powers every quote on the platform.",
    chooseService: "Choose a service",
    material: "Material",
    complexity: "Complexity",
    quantity: "Quantity",
    discount5: "500 (5% off)",
    discount10: "1000 (10% off)",
    instantQuote: "Instant quote",
    basePrice: "Base price",
    materialLabel: "Material",
    complexityLabel: "Complexity",
    volumeDiscount: "Volume discount",
    estimatedTotal: "Estimated total",
    orderNow: "Order now",
    services: { flex: "Flex Banner", uv: "UV Print A2", logo: "Logo Design", embroidery: "Embroidered Uniform" },
    units: { m2: "m²", pcs: "pcs", pkg: "pkg" },
    materialKeys: { flex: "flex", mesh: "mesh", paper: "paper", acrylic: "acrylic", metal: "metal" },
    complexityKeys: { low: "low", medium: "medium", high: "high" },
  },

  portal: {
    badge: "Customer portal",
    title: { line1: "Your projects,", line2: "on your time." },
    description: "A calm, focused space for everything you've ordered with us — past, present and on the way.",
    features: {
      track: { title: "Track every order live", desc: "Status, deadlines, files, approvals — always in sync." },
      sign: { title: "Sign designs in one click", desc: "Legally auditable approval with timestamp, IP and device." },
      talk: { title: "Talk directly with the studio", desc: "Tickets, replies and notifications in one inbox." },
      vip: { title: "VIP service for repeat clients", desc: "Faster quotes, preferred rates and a dedicated account lead." },
    },
    createCta: "Create your portal account",
    haveCta: "I already have one",
    hello: "Hello, Acme Corp",
    welcomeBack: "Welcome back to your portal",
    active: "3 active",
    activeShort: "Active",
    balance: "Balance",
    tickets: "Tickets",
    recentOrders: "Recent orders",
    orderSamples: { brand: "Brand identity refresh", cards: "1,000 business cards", campaign: "Q3 social campaign" },
    statuses: { in_production: "in production", ready: "ready", delivered: "delivered" },
  },

  stats: {
    ordersDelivered: "Orders delivered",
    designsApproved: "Designs approved",
    onTime: "On-time rate",
    rating: "Average rating",
  },

  testimonials: {
    eyebrow: "Loved by creative teams",
    title: "We're not the only ones who think this feels right.",
    items: [
      { quote: "We launched a 12-city outdoor campaign and watched every billboard go up from one dashboard. Truly Apple-grade.", author: "Maya R.", role: "CMO · Northwind" },
      { quote: "Instant quotes saved our team hours every week. Clients love being able to play with the calculator.", author: "Daniel K.", role: "Founder · Pixelhaus" },
      { quote: "Customer portal feels like a luxury private app. We approve designs from our phone in seconds.", author: "Sara P.", role: "Brand Lead · ACME" },
      { quote: "Their embroidery quality matched the digital workflow. Our uniforms have never looked better.", author: "Omar L.", role: "Ops · Helios" },
    ],
  },

  faq: {
    eyebrow: "Common questions",
    title: "Anything else you'd like to know?",
    description: "Can't find an answer? Open a quick ticket from your customer portal and we'll be right with you.",
    items: [
      { q: "How fast can I get a quote?", a: "Instantly. The platform calculates a binding quote the moment you finish configuring your order — no waiting for a sales call." },
      { q: "Which file formats can I upload?", a: "PDF, PSD, AI, SVG, PNG, JPG, ZIP, DOCX — up to 50 MB per file. Larger files? Open a ticket and we'll arrange transfer." },
      { q: "Can I sign approvals digitally?", a: "Yes. Every design approval is captured with your e-signature plus timestamp, IP and device info for a fully auditable trail." },
      { q: "Do you handle outdoor installation?", a: "Of course — billboards, signboards, light boxes and vehicle wrapping are all part of our installation projects module." },
      { q: "How are returns and revisions handled?", a: "You can request up to 3 free revisions per design phase. Production issues are reprinted at no cost when reported within 7 days." },
    ],
  },

  finalCta: {
    title: { line1: "Let's create something", line2: "beautifully on-brand." },
    description: "Open your customer portal account and place your first order in under a minute.",
    primaryCta: "Start an order",
    secondaryCta: "Sign in to portal",
    free: "Free to join",
    designed: "Designed for creatives",
  },

  footer: {
    tagline: "Run your creative business from one quiet, beautiful place.",
    columns: {
      services: { title: "Services", items: ["Printing", "Branding", "Outdoor", "Embroidery", "Education", "Marketing"] },
      company: { title: "Company", items: ["About", "Studio", "Careers", "Press"] },
      help: { title: "Help", items: ["Customer Portal", "Sign in", "Open ticket", "Terms", "Privacy"] },
    },
    copyright: "© 2026 Dar Al-Yousef Printing · All rights reserved.",
    builtWith: "Crafted with care · Built with FastAPI + React",
  },

  auth: {
    welcome: "Welcome back",
    signInSubtitle: "Sign in to your Dar Al-Yousef workspace.",
    email: "Email",
    password: "Password",
    remember: "Remember me",
    forgot: "Forgot password?",
    signIn: "Sign in",
    newHere: "New here?",
    createAccount: "Create a customer account",
    tryDemo: "Try a demo role",
    demo: {
      ceo: "CEO",
      generalManager: "General Manager",
      departmentManager: "Dept. Manager",
      designer: "Designer",
      printingOperator: "Print Operator",
      accountant: "Accountant",
      marketing: "Marketing",
      warehouse: "Warehouse",
      sales: "Sales",
      support: "Support",
      customer: "Customer",
    },
    loginFailed: "Login failed",
    heroH1A: "Run your creative business",
    heroH1B: "from one quiet, beautiful place.",
    heroLead: "Printing, branding, outdoor advertising, embroidery and a customer portal — all from Dar Al-Yousef.",
    heroFeatures: {
      instant: "Instant pricing & digital quotations",
      live: "Live production tracking & approvals",
      audit: "Full audit log & executive command center",
    },
    footer: "© 2026 Dar Al-Yousef Printing · Built with care.",
    registerTitle: "Create your account",
    registerSubtitle: "Place orders, upload files, approve designs.",
    fullName: "Full name",
    company: "Company",
    phone: "Phone",
    optional: "optional",
    passwordHint: "At least 8 characters",
    createBtn: "Create account",
    haveAccount: "Already have an account?",
    registerFailed: "Registration failed",
    forgotTitle: "Forgot your password?",
    forgotSubtitle: "We'll send a one-time reset link to your email.",
    sendReset: "Send reset link",
    forgotSent: "If the account exists, instructions have been sent.",
    devTokenLabel: "Dev reset token:",
    backToSignIn: "Back to sign in",
  },

  portalUi: {
    welcomeUser: "Welcome, {name}",
    signOut: "Sign out",
    nav: {
      overview: "Overview",
      myOrders: "My orders",
      quotations: "Quotations",
      invoices: "Invoices",
      support: "Support",
    },
    home: {
      greeting: "Hello, {name}",
      subtitle: "Here's a quick snapshot of your account.",
      startOrder: "Start a new order",
      kpiActive: "Active orders",
      kpiOutstanding: "Outstanding balance",
      kpiOpenTickets: "Open tickets",
      recentOrders: "Recent orders",
      recentOrdersSub: "Latest production status",
      invoices: "Invoices",
      invoicesSub: "Outstanding and recent",
      viewAll: "View all",
      noOrders: "No orders yet.",
      noInvoices: "No invoices yet.",
      deadline: "deadline",
      due: "Due",
    },
    orders: {
      title: "My orders",
      description: "Track production status of all your orders.",
      startOrder: "Start a new order",
      colOrder: "Order",
      colStatus: "Status",
      colDeadline: "Deadline",
      colTotal: "Total",
      emptyTitle: "No orders yet",
      emptyDesc: "Start your first order to see it here.",
      requestSubmitted: "Request submitted — our team will review and send you a quote.",
      pricingPending: "Pricing pending review",
      deadlinePending: "Delivery date will be confirmed by our team.",
      back: "Back",
      requestDetails: "Request details",
      lineItems: "Items",
      reviewProposal: "Review proposal",
      reviewHint: "Approve the pricing and terms, or request changes.",
      responseNotes: "Notes (optional)",
      approve: "Approve",
      requestChanges: "Request changes",
      responseSent: "Your response was sent",
      timeline: "Timeline",
      confirmReceiptTitle: "Delivery confirmation",
      confirmReceiptHint: "Let us know when you have received your order — at any stage of production or delivery.",
      confirmReceiptQuestion: "Have you received this order?",
      confirmReceiptYes: "Yes, I received it",
      confirmReceiptSuccess: "Thank you — your order is marked as delivered.",
    },
    statuses: {
      draft: "draft",
      pending_review: "Pending review",
      awaiting_customer: "Awaiting your approval",
      customer_approved: "Customer approved",
      confirmed: "confirmed",
      paid: "paid",
      in_production: "in production",
      delivered: "delivered",
      closed: "closed",
      cancelled: "cancelled",
      open: "open",
      in_progress: "in progress",
      waiting_customer: "waiting on you",
      resolved: "resolved",
      partial: "partial",
      unpaid: "unpaid",
      overdue: "overdue",
      accepted: "accepted",
      rejected: "rejected",
      new: "new",
      contacted: "contacted",
      qualified: "qualified",
      proposal: "proposal",
      won: "won",
      lost: "lost",
    },
  },

  staffUi: {
    brand: { name: "Dar Al-Yousef", subtitle: "Enterprise Suite" },
    topbar: {
      search: "Search orders, customers, invoices…",
      notifications: "Notifications",
      profile: "Profile & Settings",
      signOut: "Sign out",
      themeToggle: "Toggle theme",
      languageToggle: "Change language",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      defaultRole: "User",
      viewAllNotifications: "View all notifications",
      markAllRead: "Mark all as read",
      noNotifications: "You're all caught up",
    },
    nav: {
      overview: "Overview",
      crm: "CRM",
      operations: "Operations",
      catalog: "Catalog & Inventory",
      service: "Service",
      insights: "Administration",
      dashboard: "Dashboard",
      auditLog: "Audit Log",
      customers: "Customers",
      companies: "Companies",
      leads: "Leads",
      opportunities: "Opportunities",
      orders: "Orders",
      newOrder: "New Order",
      orderBoard: "Project Board",
      quotations: "Quotations",
      invoices: "Invoices",
      payments: "Payments",
      products: "Products",
      materials: "Materials",
      movements: "Stock Movements",
      tickets: "Tickets",
      messages: "Messages",
      design: "Design Studio",
      files: "Media Library",
      analytics: "Analytics",
      users: "Users & Roles",
      myEmployees: "My Employees",
      settings: "Settings",
    },
    common: {
      cancel: "Cancel",
      save: "Save",
      create: "Create",
      edit: "Edit",
      delete: "Delete",
      submit: "Submit",
      send: "Send",
      record: "Record",
      accept: "Accept",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      total: "total",
      search: "Search…",
      noResults: "No results",
      all: "All",
      live: "Live",
      autoRefresh: "Live · auto-refresh",
      required: "required",
      optional: "optional",
      yes: "Yes",
      no: "No",
    },
    dashboard: {
      title: "Executive command center",
      description: "Live KPIs, production status, audit feed and approvals.",
      revenueTitle: "Revenue · last 30 days",
      revenueSubtitle: "Today {today} · MTD {mtd}",
      paid: "Paid",
      ordersByStatusTitle: "Orders by status",
      ordersByStatusSub: "Pipeline distribution",
      onlineTitle: "Online now",
      onlineSub: "Last 10 minutes",
      nobodyOnline: "Nobody online right now.",
      liveActivityTitle: "Live activity",
      liveActivitySub: "From the audit log",
      noActivity: "No activity yet.",
      deptLoadTitle: "Department load",
      deptLoadSub: "Active vs delayed",
      noWorkload: "No active workload.",
      lowStockTitle: "Low stock",
      lowStockSub: "At or below reorder level",
      lowStockOk: "All materials sufficiently stocked.",
      overdueTitle: "Overdue invoices",
      overdueSub: "Action required",
      overdueOk: "All invoices on track.",
      due: "Due",
      approvalsTitle: "Pending design approvals",
      approvalsSub: "Awaiting customer decision",
      noApprovals: "No pending approvals.",
      revisionPrefix: "Revision #",
      orderNumber: "Order #",
      activeLabel: "active",
      delayedLabel: "delayed",
      kpis: {
        revenueToday: "Revenue Today",
        revenueMTD: "Revenue MTD",
        activeOrders: "Active Orders",
        delayedOrders: "Delayed Orders",
        onlineNow: "Online Now",
        pendingApprovals: "Pending Approvals",
        revenueTodayHint: "Paid invoices",
        revenueMTDHint: "Month to date",
        activeHint: "In flight",
        delayedHint: "Past deadline",
        onlineHint: "Last 10 min",
        pendingHint: "Design revisions",
      },
    },
    customers: {
      title: "Customers",
      description: "People and companies you serve.",
      newBtn: "New customer",
      newTitle: "New customer",
      searchPh: "Search by name, email, phone…",
      colCustomer: "Customer",
      colCode: "Code",
      colPhone: "Phone",
      colLocation: "Location",
      colTags: "Tags",
      emptyTitle: "No customers yet",
      emptyDesc: "Add your first customer to get started.",
      showing: "Showing page {p} of {n} · {t} total",
      archived: "Customer archived",
      fullName: "Full name",
      email: "Email",
      phone: "Phone",
      jobTitle: "Title",
      city: "City",
      country: "Country",
      tags: "Tags",
      notes: "Notes",
      saved: "Customer created",
    },
    leads: {
      title: "Leads",
      description: "Track and qualify your sales pipeline.",
      newBtn: "New lead",
      newTitle: "New lead",
      allStages: "All stages",
      colLead: "Lead",
      colSource: "Source",
      colStage: "Stage",
      colScore: "Score",
      colValue: "Est. value",
      converted: "Converted",
      convert: "Convert",
      emptyTitle: "No leads in this stage",
      emptyDesc: "Add a lead or change filters.",
      created: "Lead created",
      convertedToast: "Lead converted",
      fullName: "Full name",
      company: "Company",
      email: "Email",
      phone: "Phone",
      source: "Source",
      stage: "Stage",
      score: "Score",
      estValue: "Estimated value (USD)",
    },
    orders: {
      title: "Orders",
      description: "Track production workflows end-to-end.",
      newBtn: "New order",
      searchPh: "Search by code or title…",
      allStatuses: "All statuses",
      colCode: "Code",
      colTitle: "Title",
      colStatus: "Status",
      colPriority: "Priority",
      colDeadline: "Deadline",
      colTotal: "Total",
      placedVia: "via {ch}",
      emptyTitle: "No orders found",
      emptyDesc: "Place a new order or change filters.",
      timeline: {
        title: "Status & messages",
        subtitle: "Status changes and messages in order.",
        thread: "Approval conversation",
        staff: "Team",
        customer: "Customer",
        unknownActor: "System",
        noMessage: "No message for this step.",
        openMessages: "Open team messages →",
      },
      confirmReceiptTitle: "Confirm delivery",
      confirmReceiptHint: "Mark the order as delivered when the customer has received it (any production stage).",
      confirmReceiptQuestion: "Mark this order as delivered?",
      confirmReceiptYes: "Confirm delivered",
      confirmReceiptSuccess: "Order marked as delivered",
      payment: {
        label: "Payment received",
        confirmTitle: "Confirm payment",
        confirmHint: "Upload a receipt or screenshot, or add a note explaining why this order is marked as paid.",
        revokeTitle: "Clear payment confirmation",
        revokeHint: "Explain why payment confirmation should be removed.",
        notesLabel: "Payment note",
        notesPlaceholder: "e.g. bank transfer ref #12345, cash received…",
        revokeReasonLabel: "Reason",
        revokeReasonPlaceholder: "Why is payment being cleared?",
        uploadLabel: "Upload receipt or screenshot",
        uploadHint: "PNG, JPG, or PDF — up to 50 MB",
        confirmBtn: "Mark as paid",
        revokeBtn: "Clear payment",
        markedPaid: "Payment confirmed",
        clearedPaid: "Payment confirmation cleared",
      },
      detail: {
        back: "Back",
        boardView: "Board view",
        status: "Status",
        priority: "Priority",
        deadline: "Deadline",
        payment: "Payment",
        total: "Total",
        lineItemsCount: "Line items ({n})",
        productionPipeline: "Production pipeline",
        productionPipelineSub: "All {n} line item(s) move together through each stage.",
        stageTeam: "Stage team",
        notAssigned: "This project is not assigned to you — only the stage owner can move it forward.",
        history: "History",
        pipelineUpdated: "Order pipeline updated",
        updateFailed: "Update failed",
        loading: "Loading order…",
        workflowStages: {
          pending: "Pending",
          design: "Design",
          printing: "Printing",
          production: "Production",
          finishing: "Finishing",
          delivery: "Delivery",
          completed: "Completed",
          on_hold: "On Hold",
          cancelled: "Cancelled",
        },
      },
    },
    departments: {
      accounting: "Accounting",
      sales: "Sales / Marketing",
      design: "Design",
      printing: "Printing",
      cnc: "CNC",
      flex_uv: "Flex / UV",
      warehouse: "Warehouse",
      delivery: "Delivery / Operations",
    },
    orderBoard: {
      title: "Project Board",
      description: "Track every order from customer request through production to delivery.",
      allDepartments: "All departments",
      refresh: "Refresh",
      listView: "List view",
      activeCount: "{n} order(s) on the board",
      loading: "Loading board…",
      moved: "Order moved",
      moveFailed: "Could not move order",
      stageNotApplicable: "This stage is not used for this order",
      stageMarkedNa:
        "The {stage} stage is marked N/A — no staff is assigned. Ask a manager to update the project team before moving here.",
      stageNoAssignees:
        "No staff assigned for {stage} yet. Open the order detail page and add team members for this department.",
      oneStageBackOnly: "You can only move one stage back — contact your manager",
      dragHint: "Drag to move",
      statsTitle: "Order overview",
      totalOrders: "Total orders",
      activityTitle: "Recent activity",
      activityEmpty: "No recent status changes.",
      sourcePortal: "Customer portal",
      sourceStaff: "Staff",
      lastUpdated: "Updated",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      resetZoom: "Reset zoom",
      fitView: "Fit to screen",
      zoomPct: "{n}%",
      panHint: "Scroll to zoom · Shift+scroll to pan · Space+drag to pan · Double-click fullscreen",
      enterFullscreen: "Fullscreen",
      exitFullscreen: "Exit fullscreen",
      mobileTapHint: "Pick a stage below, then use the buttons on each card to move orders.",
      mobilePrevStage: "Previous stage",
      mobileNextStage: "Next stage",
      emptyColumn: "No orders in this stage.",
      moveBack: "Back to {stage}",
      moveForward: "Move to {stage}",
      openOrder: "Open order",
      revertRequiresReason: "Please provide a reason to move this order back",
      revertTitle: "Move order back",
      revertDescription: "Explain why this order should return to the previous stage.",
      revertReasonLabel: "Reason",
      revertReasonPlaceholder: "e.g. missing design approval, quality issue…",
      revertConfirm: "Move back",
      assignmentsRequired:
        "Assign staff for every production stage before moving into Design, Printing, etc. Open the order detail page to configure team members.",
      columns: {
        intake: "New request",
        approval: "Approval",
        confirmed: "Confirmed",
        paid: "Paid",
        design: "Design",
        printing: "Printing",
        production: "Production",
        finishing: "Finishing",
        delivery: "Ready for delivery",
        completed: "Completed",
        cancelled: "Cancelled",
      },
    },
    messages: {
      title: "Messages",
      description: "Team chat — link projects and share files.",
      tabChats: "All messages",
      tabContacts: "Contacts",
      search: "Search…",
      today: "Today",
      empty: "No conversations yet.",
      selectChat: "Select a chat or pick a contact to start messaging.",
      placeholder: "Type something…",
      attach: "Attach file",
      linkProject: "Link to project (order)",
      noProject: "No project link",
      newGroup: "New group",
      createGroup: "Create group",
      groupCreated: "Group created",
      groupName: "Group name",
      members: "Members",
      groupFallback: "Group chat",
      attachments: "Shared files",
    },
    notifications: {
      title: "Notifications",
      description: "Messages, assignments, and production updates for your role.",
      emptyTitle: "No notifications yet",
      emptyHint: "You'll see new messages and order updates here.",
      markAllRead: "Mark all as read",
      all: "All",
      unread: "Unread",
      types: {
        chatMessage: "New message",
        orderAssigned: "Order assignment",
        orderAssignmentUpdated: "Assignment updated",
        orderAssignmentsChanged: "Team assignment",
        orderReleased: "Released to production",
      },
      bodies: {
        chatPreview: "{sender}: {preview}",
        assignedToStages: "You were assigned to {stages}",
        assignmentUpdated: "Your assignment was updated ({stages})",
        managerAssignments: "{actor} assigned team for {code} ({stages})",
        managerAssignmentsUpdated: "{actor} updated team for {code} ({stages})",
        releasedAssignee: "Order released — you are on the production team",
        releasedManager: "{actor} released {code} to production",
      },
    },
    newOrder: {
      title: "New order",
      description: "Configure services, see live pricing, and submit.",
      cancel: "Cancel",
      submit: "Submit order",
      created: "Order {code} created",
      detailsTitle: "Order details",
      detailsSub: "Customer, deadline & meta",
      customerLabel: "Customer",
      selectCustomer: "Select customer…",
      placingAs: "Placing as: {name}",
      orderTitleLabel: "Order title",
      orderTitlePh: "e.g. Q3 launch package",
      deadline: "Deadline",
      priority: "Priority",
      priorities: { low: "Low", normal: "Normal", high: "High", urgent: "Urgent" },
      notes: "Notes",
      lineItemsTitle: "Line items",
      lineItemsSub: "Choose a product and configure it — pricing updates live.",
      addLine: "Add line",
      noItems: "No items yet.",
      noItemsHintBefore: "Click ",
      noItemsHintLink: "Add line",
      noItemsHintAfter: " to begin.",
      summaryTitle: "Order summary",
      summarySub: "Live total",
      subtotal: "Subtotal",
      tax: "Tax",
      grandTotal: "Grand total",
      instantQuote: "Instant quote",
      attachTitle: "Attach files",
      attachSub: "Designs, references, source files",
      uploadCta: "Click to upload",
      uploadHint: "Any file type (images, PDF, PSD, AI, ZIP, DOCX, …) — up to 50 MB each",
      uploadsDone: "Files uploaded",
      product: "Product",
      selectProduct: "Select product…",
      quantity: "Quantity",
      unit: "Unit",
      unitPrice: "Unit price",
      livePricing: "Live pricing breakdown",
      addProduct: "Add new product",
      reviewTitle: "Review order",
      reviewSub: "Confirm details before submitting",
      itemCount: "{count} item(s)",
      itemFallback: "Item {n}",
    },
    workflowAssignments: {
      title: "Production assignments",
      subtitle: "Optional now — required before release to production",
      description:
        "For each stage: select one or more staff members, or mark N/A if this order does not need that step (e.g. logo design without CNC).",
      selectStaff: "Select at least one staff member…",
      notApplicable: "N/A",
      skippedHint: "This stage is skipped for this order",
      noStaff: "No staff in this department",
      selectedCount: "{n} selected",
      editTitle: "Production team",
      editSubtitle: "Add or remove staff per stage — changes apply immediately and persist when moving orders back on the board.",
      saveAssignments: "Save team assignments",
      saved: "Team assignments updated",
      stages: {
        design: "Design",
        printing: "Printing",
        production: "CNC / Production",
        finishing: "Finishing / Flex-UV",
        delivery: "Delivery / Warehouse",
      },
    },
    quotations: {
      title: "Quotations",
      description: "Drafts, accepted, and invoiced quotes.",
      colCode: "Code",
      colStatus: "Status",
      colIssued: "Issued",
      colValid: "Valid until",
      colTotal: "Total",
      accept: "Accept",
      invoice: "Invoice",
      accepted: "Accepted",
      invoiceCreated: "Invoice {code} created",
      emptyTitle: "No quotations yet",
      emptyDesc: "Create one from an opportunity.",
    },
    invoices: {
      title: "Invoices",
      description: "Issued bills and their payment status.",
      colCode: "Code",
      colStatus: "Status",
      colIssued: "Issued",
      colDue: "Due",
      colBalance: "Balance",
      colTotal: "Total",
      colDescription: "Description",
      colQty: "Qty",
      colUnitPrice: "Unit price",
      colTax: "Tax",
      colLineTotal: "Line total",
      colSubtotal: "Subtotal",
      colTaxTotal: "Tax",
      colPaid: "Paid",
      emptyTitle: "No invoices yet",
      emptyDesc: "Generate an invoice from any order or convert a quotation.",
      back: "Back",
      summary: "Summary",
      lineItems: "Line items",
      notes: "Notes",
      loading: "Loading invoice…",
      generateEn: "Generate invoice (English PDF)",
      generateAr: "Generate invoice (Arabic PDF)",
      generateBtn: "Generate invoice",
      deleteBtn: "Delete",
      deleted: "Invoice deleted",
      confirmDelete: "Delete this invoice?",
      downloadEn: "Download PDF (English)",
      downloadAr: "Download PDF (Arabic)",
      pdfDownloaded: "PDF downloaded",
      generated: "Invoice {code} created",
      updated: "Invoice {code} updated with latest order data",
      issuedAt: "Issued",
      portalUpdated: "Portal visibility updated",
      portalVisible: "Visible in portal",
      showInPortal: "Show in customer portal",
      hideFromPortal: "Hide from customer portal",
      orderSectionTitle: "Invoices",
      orderSectionSub: "Generate professional PDF invoices for this project at any stage.",
      noOrderInvoices: "No invoices for this order yet.",
      shareWithPortal: "Share with customer portal when generating",
    },
    materials: {
      title: "Materials & inventory",
      description: "Live on-hand stock, unit costs, and reorder alerts.",
      newBtn: "New material",
      newTitle: "New material",
      editTitle: "Edit material",
      updated: "Material updated",
      deleted: "Material removed",
      searchPh: "Search materials…",
      lowOnly: "Low stock",
      filters: "Filters",
      allMaterials: "All materials",
      kpiTotal: "Total materials",
      kpiTotalHint: "Items in catalog",
      kpiLowStock: "Low stock",
      kpiLowStockHint: "At or below reorder level",
      kpiOutOfStock: "Out of stock",
      kpiOutOfStockHint: "Zero on hand",
      kpiStockValue: "Stock value",
      kpiStockValueHint: "On hand × unit cost",
      colSku: "SKU",
      colMaterial: "Material",
      colOnHand: "Stock",
      colReorder: "Reorder",
      colCost: "Cost",
      colUnitCost: "Unit cost",
      colStockValue: "Stock value",
      colStatus: "Status",
      colActions: "",
      stockLow: "Restock",
      stockOk: "In stock",
      stockOut: "Out of stock",
      movement: "Movement",
      movementTitle: "Stock movement · {name}",
      movementTitleEmpty: "Movement",
      movementType: "Type",
      movementTypes: {
        IN: "In",
        OUT: "Out",
        DAMAGED: "Damaged",
        ADJUSTMENT: "Adjustment",
        TRANSFER: "Transfer",
      },
      movementQty: "Quantity",
      movementNotes: "Notes",
      record: "Record",
      created: "Material created",
      recorded: "Movement recorded",
      emptyTitle: "No materials",
      name: "Name",
      sku: "SKU",
      unit: "Unit",
      category: "Category",
      onHand: "On hand",
      cost: "Cost",
      reorderLevel: "Reorder level",
    },
    tickets: {
      title: "Tickets",
      description: "Customer & internal support tickets.",
      newBtn: "New ticket",
      newTitle: "Open a ticket",
      colCode: "Code",
      colSubject: "Subject",
      colPriority: "Priority",
      colStatus: "Status",
      colCreated: "Created",
      defaultCategory: "general",
      emptyTitle: "No open tickets",
      created: "Ticket created",
      subject: "Subject",
      priority: "Priority",
      priorities: { low: "Low", normal: "Normal", high: "High", urgent: "Urgent" },
      describeIssue: "Describe the issue",
      detail: {
        back: "Back",
        conversation: "Conversation",
        openHint: "Reply below to continue the thread.",
        closedHint: "This ticket is closed.",
        replyPlaceholder: "Write your message…",
        replySent: "Message sent",
        closeBtn: "Close ticket",
        closed: "Ticket closed",
        details: "Details",
        assignee: "Assignee",
        assignTitle: "Assignment",
        assignHint: "Route this ticket to a support agent.",
        unassigned: "Unassigned",
        assigned: "Assignee updated",
        staffLabel: "Support",
        customerLabel: "You",
      },
    },
    products: {
      title: "Products & services",
      description: "Catalog pricing, material usage (BOM), and stock readiness.",
      searchPh: "Search products…",
      emptyTitle: "No products",
      perUnit: "/",
      addBtn: "Add product",
      filters: "Filters",
      allProducts: "All products",
      kpiTotal: "Total products",
      kpiTotalHint: "In catalog",
      kpiActive: "Active",
      kpiActiveHint: "Available to order",
      kpiLowStock: "Needs restock",
      kpiLowStockHint: "BOM materials low or out",
      kpiCatalogValue: "Base price sum",
      kpiCatalogValueHint: "Current page total",
      colProduct: "Product",
      colPrice: "Price",
      colMaterials: "Materials",
      colStock: "Stock",
      colStatus: "Status",
      colCost: "Cost",
      statusActive: "Active",
      statusInactive: "Inactive",
      stockStatus: { inStock: "In stock", restock: "Restock", outOfStock: "Out of stock" },
      bom: {
        title: "Material usage (BOM)",
        description: "How much of each material is consumed per product unit. Orders deduct this automatically.",
        addLine: "Add material",
        material: "Material",
        selectMaterial: "Select material…",
        qtyPerUnit: "Qty per unit",
      },
      form: {
        title: "Add new product",
        editTitle: "Edit product",
        nameEn: "Name (English)",
        nameEnPh: "e.g. Business Cards",
        nameAr: "Name (Arabic)",
        nameArPh: "مثلاً: بطاقات عمل",
        category: "Category",
        selectCategory: "Select category…",
        unit: "Unit",
        pricingModel: "Pricing model",
        basePrice: "Base price",
        cost: "Unit cost",
        taxRate: "Tax rate (%)",
        descriptionEn: "Description (English)",
        descriptionAr: "Description (Arabic)",
        created: "Product created",
        updated: "Product updated",
        deleted: "Product removed",
        confirmDelete: "Remove this product?",
        failed: "Could not save product",
        models: { fixed: "Fixed", variable: "Variable", customQuote: "Custom quote" },
      },
    },
    catalogOptions: {
      attrs: {
        sizes: "Size",
        materials: "Material",
        complexity: "Complexity",
        finish: "Finish",
        sides: "Sides",
        package: "Package",
        size: "Size",
        coverage: "Coverage",
        binding: "Binding",
        stitches: "Stitch count",
        tier: "Tier",
      },
      values: {
        "3m": "3 m",
        "6m": "6 m",
        "12m": "12 m",
        A4: "A4",
        A3: "A3",
        A2: "A2",
        A1: "A1",
        flex: "Flex",
        mesh: "Mesh",
        paper: "Paper",
        acrylic: "Acrylic",
        metal: "Metal",
        wood: "Wood",
        mdf: "MDF",
        low: "Low",
        medium: "Medium",
        high: "High",
        matte: "Matte",
        gloss: "Gloss",
        "soft-touch": "Soft-touch",
        single: "Single-sided",
        double: "Double-sided",
        basic: "Basic",
        standard: "Standard",
        premium: "Premium",
        small: "Small",
        large: "Large",
        xl: "Extra large",
        partial: "Partial",
        full: "Full",
        staple: "Staple",
        thermal: "Thermal binding",
        paperback: "Paperback",
        hardcover: "Hardcover",
        starter: "Starter",
        growth: "Growth",
      },
      breakdown: {
        base: "Base price",
        volume_discount: "Volume discount",
      },
    },
    audit: {
      title: "Audit log",
      description: "Every meaningful change in the system, immutable and searchable.",
      colWhen: "When",
      colActor: "Actor",
      colAction: "Action",
      colModule: "Module",
      colEntity: "Entity",
      colIp: "IP",
      actionPh: "Action…",
      allModules: "All modules",
      modules: {
        auth: "Auth",
        users: "Users",
        crm: "CRM",
        orders: "Orders",
        finance: "Finance",
        inventory: "Inventory",
        catalog: "Catalog",
        support: "Support",
        files: "Files",
      },
      emptyTitle: "Nothing logged",
      summary: "Page {p} of {n} · {t} entries",
    },
    users: {
      title: "My employees",
      description: "Add team members and assign any role.",
      searchPh: "Search…",
      staffOnly: "Staff only",
      newBtn: "Add employee",
      newTitle: "New employee",
      editTitle: "Edit employee",
      fullName: "Full name",
      email: "Email",
      password: "Password",
      passwordOptional: "New password (optional)",
      phone: "Phone",
      department: "Department",
      titleField: "Job title",
      roles: "Roles",
      rolesHint: "Select one or more roles for this employee.",
      isActive: "Active account",
      created: "Employee created",
      updated: "Employee updated",
      deleted: "Employee removed",
      confirmDelete: "Remove this employee?",
      colUser: "User",
      colRoles: "Roles",
      colDept: "Department",
      colStatus: "Status",
      colLastLogin: "Last login",
      active: "Active",
      inactive: "Inactive",
      emptyTitle: "No employees found",
    },
    settings: {
      title: "Settings",
      description: "Personal information and preferences.",
      profileTitle: "Profile",
      profileSub: "Visible to your team",
      fullName: "Full name",
      email: "Email",
      phone: "Phone",
      department: "Department",
      save: "Save changes",
      saved: "Profile updated",
      appearanceTitle: "Appearance",
      appearanceSub: "Theme preference",
      light: "Light",
      lightHint: "Black & white, high contrast",
      dark: "Dark",
      darkHint: "Dark monochrome, easy on the eyes",
      brandTitle: "Brand identity",
      brandSub: "System name and logo shown across the entire platform.",
      brandSaved: "Brand identity updated",
      adminOnly: "Visible to administrators only",
      appName: "System name (English)",
      appNameAr: "System name (Arabic)",
      tagline: "Tagline (English)",
      taglineAr: "Tagline (Arabic)",
      sidebarSubtitle: "Sidebar subtitle (English)",
      sidebarSubtitleAr: "Sidebar subtitle (Arabic)",
      logoTitle: "Brand logo",
      logoHint: "PNG, JPG, WEBP or SVG. Max 5 MB. Used as favicon and across the app.",
      uploadLogo: "Upload new logo",
      logoUploaded: "Logo updated",
      removeLogo: "Remove logo",
      removingLogo: "Removing…",
      currentLogo: "Current logo",
      noLogo: "Default logo (built-in)",
      paletteTitle: "Organisation colours",
      paletteSub: "Pick the brand and accent colours for light and dark mode. Changes preview live; click Save to apply for everyone.",
      paletteReset: "Reset to defaults",
      brandColor: "Brand colour (light mode)",
      brandColorHint: "Primary identity colour shown across light backgrounds.",
      brandColorDark: "Brand colour (dark mode)",
      brandColorDarkHint: "Brighter variant used on dark surfaces.",
      accentColor: "Accent colour (light mode)",
      accentColorHint: "Used for highlights, gold details and gradients.",
      accentColorDark: "Accent colour (dark mode)",
      accentColorDarkHint: "Brighter accent for dark surfaces.",
      previewTitle: "Live preview",
      previewPrimary: "Primary action",
      previewSecondary: "Secondary action",
      previewBadgeBrand: "Brand",
      previewBadgeAccent: "Accent",
      previewBadgeSuccess: "Success",
    },
    placedVia: {
      portal: "portal",
      phone: "phone",
      email: "email",
      walk_in: "walk-in",
      reseller: "reseller",
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      staff: "staff",
    },
    priorities: {
      low: "Low",
      normal: "Normal",
      high: "High",
      urgent: "Urgent",
    },
  },

  common: { none: "—", loading: "Loading…", error: "Something went wrong." },
};

const ar: Dict = {
  brand: { name: "مطبعة دار اليوسف", tagline: "طباعة · هوية · وأكثر" },
  meta: {
    siteTitle: "مطبعة دار اليوسف",
    siteDescription: "مطبعة عصرية للطباعة والهوية البصرية — تسعيرة فورية، اعتمادات رقمية، وبوابة عميل أنيقة.",
  },
  nav: {
    services: "الخدمات",
    how: "كيف تشتغل",
    pricing: "السعر",
    portal: "البوابة",
    reviews: "آراء الزبائن",
    signIn: "تسجيل دخول",
    startOrder: "ابدأ طلبك",
    themeToggle: "تبديل المظهر",
    languageToggle: "تغيير اللغة",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
  },

  hero: {
    badge: "تجاوزنا ١٢٬٤٠٠ طلب إبداعي",
    titleA: "خلّي علامتك التجارية",
    titleHl: "تنبض",
    titleB: "بالحياة بكم نقرة أنيقة.",
    description: {
      lead: "اطلب طباعة، هوية بصرية، إعلانات خارجية، تطريز وأكثر — مع ",
      bold: "تسعيرة فورية",
      rest: "، متابعة مباشرة، اعتمادات رقمية، وبوابة عميل أنيقة.",
    },
    primaryCta: "ابدأ طلبك",
    secondaryCta: "شوف شلون تشتغل",
    pills: { noFees: "بدون رسوم مقدمة", signedApprovals: "اعتمادات موقّعة رقميًا", sameDay: "تسعيرة بنفس اليوم" },
    mockup: {
      orderCode: "طلب #ORD-2026",
      orderTitle: "بانر فلكس ٣×٢م + بطاقات",
      inProduction: "قيد التنفيذ",
      designApproved: "اعتُمد التصميم",
      materialsReserved: "تم حجز المواد",
      printing: "الطباعة",
      delivery: "التسليم",
      live: "مباشر",
      estimated: "السعر المتوقع",
      instantPricing: "تسعيرة فورية",
      base: "الأساس",
      mesh: "مش ×1.2",
      total: "المجموع",
      designV3: "تصميم v3",
      awaitingYou: "بانتظار موافقتك",
      approve: "اعتماد",
      revise: "تعديل",
      brandLabel: "هوية · v3",
    },
  },

  landing: {
    typingHeadline: "خلّي علامتك التجارية تنبض بالحياة بكم نقرة أنيقة.",
    heroLine1: "خلّي علامتك التجارية",
    heroLine2: "تنبض بأناقة مع كل طبعة.",
    heroSubtext:
      "اطلب طباعة، هوية بصرية، إعلانات خارجية، تطريز وأكثر — مع تسعيرة فورية، متابعة مباشرة واعتمادات رقمية.",
    signInTab: "تسجيل دخول",
    signUpTab: "إنشاء حساب",
    authCardLead: "تابع الطلبات، اعتمد التصاميم، واحصل على تسعيرة فورية.",
    authCardTitle: "بوابة العميل",
    explorePortal: "بوابة العميل",
    regionLabel: "العراق · بغداد",
  },

  services: {
    eyebrow: "ستوديو واحد، خدمات شاملة",
    title: { line1: "كل شي تحتاجه علامتك،", line2: "تحت سقف واحد." },
    description: "من قبعة مطرّزة لحملة إعلانية بعدة محافظات — اطلبها كلها بمكان واحد، وتابعها كلها بمكان واحد.",
    items: {
      printing: { title: "الطباعة", desc: "فلكس، مش، UV، بطاقات، ملصقات، تغليف." },
      branding: { title: "الهوية البصرية", desc: "شعارات وهوية كاملة." },
      outdoor: { title: "إعلانات خارجية", desc: "لوحات، يفط، ولفّ سيارات." },
      embroidery: { title: "التطريز", desc: "بدلات عمل، كاسكيتات، ملابس شركات." },
      education: { title: "تعليمي", desc: "كتب، امتحانات، تنسيق أبحاث." },
      marketing: { title: "التسويق", desc: "حملات سوشيال، جدول محتوى." },
      gifts: { title: "هدايا ترويجية", desc: "هدايا دعائية وأطقم شركات." },
    },
  },

  how: {
    eyebrow: "بساطة هادئة",
    title: "أربع خطوات من الفكرة للتسليم.",
    description: "بدون مكالمات متكررة وبدون جداول. مسار هادئ وشفّاف تكدر تشوفه بأي وقت.",
    steps: {
      orderOnline: { title: "اطلب أونلاين", desc: "اختر الخدمة، عدّل خياراتها، وشوف السعر فوراً." },
      uploadBrief: { title: "ارفع ملفاتك", desc: "حمّل ملفاتك (PDF/PSD/AI) وأي مرجع تحبه." },
      approveDesign: { title: "اعتمد التصميم", desc: "راجع التصاميم من بوابتك ووقّع بنقرة وحدة." },
      receive: { title: "استلم وارتاح", desc: "تابع الإنتاج مباشرة، ونوصّل لباب بيتك." },
    },
  },

  pricing: {
    eyebrow: "تسعيرة فورية",
    title: { before: "اعرف السعر ", highlight: "قبل", after: " ما تلتزم." },
    description: "جرّب الحاسبة الحيّة بالأسفل. نفس المحرّك يشتغل خلف كل عرض سعر بالموقع.",
    chooseService: "اختر الخدمة",
    material: "الخامة",
    complexity: "درجة التعقيد",
    quantity: "الكمية",
    discount5: "٥٠٠ (خصم ٥٪)",
    discount10: "١٠٠٠ (خصم ١٠٪)",
    instantQuote: "عرض سعر فوري",
    basePrice: "السعر الأساسي",
    materialLabel: "الخامة",
    complexityLabel: "درجة التعقيد",
    volumeDiscount: "خصم الكمية",
    estimatedTotal: "المجموع التقريبي",
    orderNow: "اطلب الآن",
    services: { flex: "بانر فلكس", uv: "طباعة UV A2", logo: "تصميم شعار", embroidery: "بدلة مطرّزة" },
    units: { m2: "م²", pcs: "قطعة", pkg: "باقة" },
    materialKeys: { flex: "فلكس", mesh: "مش", paper: "ورق", acrylic: "أكريليك", metal: "معدن" },
    complexityKeys: { low: "بسيط", medium: "متوسط", high: "معقد" },
  },

  portal: {
    badge: "بوابة العميل",
    title: { line1: "مشاريعك،", line2: "بوقتك إنت." },
    description: "مساحة هادئة ومركّزة لكل شي طلبته منا — من السابق، الحاضر، واللي بالطريق.",
    features: {
      track: { title: "تابع كل طلب مباشرة", desc: "الحالة، المواعيد، الملفات، الاعتمادات — كلشي محدّث." },
      sign: { title: "اعتمد التصاميم بنقرة", desc: "اعتماد موقّع قانونيًا مع توقيت وIP وجهاز." },
      talk: { title: "حكي مباشرة وية الستوديو", desc: "تذاكر، ردود، وإشعارات بمكان واحد." },
      vip: { title: "خدمة VIP للزبون الدائم", desc: "تسعيرة أسرع، أسعار مفضّلة، وموظف حساب مخصّص." },
    },
    createCta: "أنشئ حسابك بالبوابة",
    haveCta: "عندي حساب",
    hello: "هلا، شركة Acme",
    welcomeBack: "أهلاً بيك من جديد ببوابتك",
    active: "٣ قيد التنفيذ",
    activeShort: "قيد التنفيذ",
    balance: "الرصيد",
    tickets: "التذاكر",
    recentOrders: "آخر الطلبات",
    orderSamples: { brand: "تحديث الهوية البصرية", cards: "١٬٠٠٠ بطاقة شخصية", campaign: "حملة سوشيال للربع الثالث" },
    statuses: { in_production: "قيد التنفيذ", ready: "جاهز", delivered: "تم التسليم" },
  },

  stats: {
    ordersDelivered: "طلب مُسلَّم",
    designsApproved: "تصميم معتمد",
    onTime: "نسبة التسليم بالموعد",
    rating: "متوسط التقييم",
  },

  testimonials: {
    eyebrow: "الفِرَق الإبداعية يحبّون شغلنا",
    title: "ما إحنا الوحيدين اللي نشوف هاي التجربة مريحة.",
    items: [
      { quote: "أطلقنا حملة لوحات بـ ١٢ محافظة وتابعنا تركيب كل لوحة من لوحة تحكّم واحدة. تجربة بمستوى آبل.", author: "ميّا ر.", role: "مديرة تسويق · Northwind" },
      { quote: "التسعيرة الفورية وفّرت علينا ساعات أسبوعيًا. الزبائن أحبّوا يلعبون بالحاسبة بأنفسهم.", author: "دانيال ك.", role: "مؤسس · Pixelhaus" },
      { quote: "بوابة العميل تحسّ بيها كتطبيق فاخر. نعتمد التصاميم من الموبايل بثواني.", author: "سارة ب.", role: "مديرة هوية · ACME" },
      { quote: "جودة التطريز عندهم تطابق جودة المنصّة الرقمية. أزيائنا أبدًا ما كانت أحلى من هيج.", author: "عمر ل.", role: "عمليات · Helios" },
    ],
  },

  faq: {
    eyebrow: "أسئلة شائعة",
    title: "بعدك تريد تعرف شي؟",
    description: "ما لكيت الإجابة؟ افتح تذكرة من بوابتك ونرد عليك خلال دقائق.",
    items: [
      { q: "بشكَد وكت أحصل على عرض سعر؟", a: "فوريًا. المنصّة تحسب لك السعر بمجرد ما تخلّص ضبط الطلب — بدون انتظار مكالمة مبيعات." },
      { q: "أي صيغ ملفات أكدر أرفع؟", a: "PDF, PSD, AI, SVG, PNG, JPG, ZIP, DOCX — حد أقصى ٥٠ ميغا للملف. ملف أكبر؟ افتح تذكرة ونرتّب التحويل." },
      { q: "أكدر أعتمد التصاميم رقميًا؟", a: "نعم. كل اعتماد يُسجَّل بتوقيعك الإلكتروني مع التوقيت وIP وبيانات الجهاز لمسار تدقيق كامل." },
      { q: "تتكفّلون بتركيب اللوحات الإعلانية؟", a: "أكيد — لوحات، يفط، صناديق إضاءة، ولفّ سيارات، كلها ضمن وحدة مشاريع التركيب عندنا." },
      { q: "شلون تتعاملون وية الإرجاع والتعديلات؟", a: "تكدر تطلب لحد ٣ تعديلات مجانية لكل مرحلة تصميم. مشاكل الطباعة نطبعها من جديد مجانًا إذا انبلّغ خلال ٧ أيام." },
    ],
  },

  finalCta: {
    title: { line1: "خلّينا نسوي شي", line2: "أنيق وعلى ذوق علامتك." },
    description: "افتح حسابك بالبوابة وسجّل أول طلب بأقل من دقيقة.",
    primaryCta: "ابدأ طلبك",
    secondaryCta: "تسجيل دخول",
    free: "الاشتراك مجاني",
    designed: "مصمّمة للمبدعين",
  },

  footer: {
    tagline: "أدر شغلك الإبداعي من مكان واحد هادئ وأنيق.",
    columns: {
      services: { title: "الخدمات", items: ["الطباعة", "الهوية البصرية", "إعلانات خارجية", "التطريز", "تعليمي", "التسويق"] },
      company: { title: "الشركة", items: ["نبذة عنا", "الستوديو", "وظائف", "إعلام"] },
      help: { title: "مساعدة", items: ["بوابة العميل", "تسجيل دخول", "افتح تذكرة", "الشروط", "الخصوصية"] },
    },
    copyright: "© ٢٠٢٦ مطبعة دار اليوسف · جميع الحقوق محفوظة.",
    builtWith: "صُنع بعناية · مبني على FastAPI + React",
  },

  auth: {
    welcome: "أهلاً برجوعك",
    signInSubtitle: "سجّل دخولك لمساحة دار اليوسف الخاصة بك.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    remember: "تذكرني",
    forgot: "نسيت كلمة المرور؟",
    signIn: "تسجيل دخول",
    newHere: "أول مرة عندنا؟",
    createAccount: "أنشئ حساب زبون",
    tryDemo: "جرّب دور تجريبي",
    demo: {
      ceo: "مدير عام",
      generalManager: "مدير عام (GM)",
      departmentManager: "مدير قسم",
      designer: "مصمم",
      printingOperator: "مشغّل طباعة",
      accountant: "محاسب",
      marketing: "تسويق",
      warehouse: "مخزن",
      sales: "مبيعات",
      support: "دعم",
      customer: "زبون",
    },
    loginFailed: "فشل تسجيل الدخول",
    heroH1A: "أدِر شغلك الإبداعي",
    heroH1B: "من مكان واحد هادئ وأنيق.",
    heroLead: "طباعة، هوية بصرية، إعلانات خارجية، تطريز، وبوابة عميل — كلها من دار اليوسف.",
    heroFeatures: {
      instant: "تسعيرة فورية وعروض سعر رقمية",
      live: "متابعة إنتاج مباشرة واعتمادات",
      audit: "سجلّ تدقيق كامل ومركز قيادة تنفيذي",
    },
    footer: "© ٢٠٢٦ مطبعة دار اليوسف · صُنع بعناية.",
    registerTitle: "أنشئ حسابك",
    registerSubtitle: "اطلب، ارفع ملفاتك، واعتمد التصاميم.",
    fullName: "الاسم الكامل",
    company: "الشركة",
    phone: "رقم الموبايل",
    optional: "اختياري",
    passwordHint: "٨ خانات على الأقل",
    createBtn: "إنشاء الحساب",
    haveAccount: "عندك حساب من قبل؟",
    registerFailed: "فشل إنشاء الحساب",
    forgotTitle: "نسيت كلمة المرور؟",
    forgotSubtitle: "رح نرسل لك رابط إعادة تعيين لمرّة واحدة على إيميلك.",
    sendReset: "أرسل رابط الاسترداد",
    forgotSent: "إذا الحساب موجود، رح توصلك التعليمات بالإيميل.",
    devTokenLabel: "رمز إعادة التعيين (للتطوير):",
    backToSignIn: "رجوع لتسجيل الدخول",
  },

  portalUi: {
    welcomeUser: "أهلاً، {name}",
    signOut: "تسجيل الخروج",
    nav: {
      overview: "النظرة العامة",
      myOrders: "طلباتي",
      quotations: "عروض الأسعار",
      invoices: "الفواتير",
      support: "الدعم",
    },
    home: {
      greeting: "هلا، {name}",
      subtitle: "خلاصة سريعة لحسابك.",
      startOrder: "ابدأ طلب جديد",
      kpiActive: "طلبات نشطة",
      kpiOutstanding: "الرصيد المستحق",
      kpiOpenTickets: "تذاكر مفتوحة",
      recentOrders: "آخر الطلبات",
      recentOrdersSub: "حالة الإنتاج الحالية",
      invoices: "الفواتير",
      invoicesSub: "المستحقة والأخيرة",
      viewAll: "عرض الكل",
      noOrders: "ما عدك طلبات بعد.",
      noInvoices: "ما عدك فواتير بعد.",
      deadline: "موعد التسليم",
      due: "تستحق",
    },
    orders: {
      title: "طلباتي",
      description: "تابع حالة الإنتاج لجميع طلباتك.",
      startOrder: "ابدأ طلب جديد",
      colOrder: "الطلب",
      colStatus: "الحالة",
      colDeadline: "موعد التسليم",
      colTotal: "المجموع",
      emptyTitle: "ما عدك طلبات بعد",
      emptyDesc: "سجّل أول طلب لك وراح يظهر هنا.",
      requestSubmitted: "تم إرسال الطلب — فريقنا راح يراجع ويرسل لك عرض السعر.",
      pricingPending: "بانتظار التسعير",
      deadlinePending: "موعد التسليم يحدده فريقنا.",
      back: "رجوع",
      requestDetails: "تفاصيل الطلب",
      lineItems: "البنود",
      reviewProposal: "مراجعة العرض",
      reviewHint: "وافق على السعر والشروط، أو اطلب تعديلات.",
      responseNotes: "ملاحظات (اختياري)",
      approve: "موافقة",
      requestChanges: "طلب تعديل",
      responseSent: "تم إرسال ردك",
      timeline: "السجل",
      confirmReceiptTitle: "تأكيد الاستلام",
      confirmReceiptHint: "خبرنا إذا استلمت طلبك — بأي مرحلة من الإنتاج أو التوصيل.",
      confirmReceiptQuestion: "استلمت الطلب؟",
      confirmReceiptYes: "نعم، استلمته",
      confirmReceiptSuccess: "شكراً — تم تسجيل الطلب كمُسلَّم.",
    },
    statuses: {
      draft: "مسودّة",
      pending_review: "بانتظار المراجعة",
      awaiting_customer: "بانتظار موافقتك",
      customer_approved: "وافق العميل",
      confirmed: "مؤكَّد",
      paid: "مدفوع",
      in_production: "قيد التنفيذ",
      delivered: "تم التسليم",
      closed: "مغلق",
      cancelled: "ملغى",
      open: "مفتوح",
      in_progress: "قيد العمل",
      waiting_customer: "بانتظارك",
      resolved: "تمّ الحلّ",
      partial: "مدفوع جزئيًا",
      unpaid: "غير مدفوع",
      overdue: "متأخر",
      accepted: "مقبول",
      rejected: "مرفوض",
      new: "جديد",
      contacted: "تمّ التواصل",
      qualified: "مؤهَّل",
      proposal: "عرض مقترح",
      won: "ربحناه",
      lost: "خسرناه",
    },
  },

  staffUi: {
    brand: { name: "دار اليوسف", subtitle: "نظام إدارة المؤسسة" },
    topbar: {
      search: "ابحث عن طلب، زبون، أو فاتورة…",
      notifications: "الإشعارات",
      profile: "الملف الشخصي والإعدادات",
      signOut: "تسجيل الخروج",
      themeToggle: "تبديل المظهر",
      languageToggle: "تغيير اللغة",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      defaultRole: "مستخدم",
      viewAllNotifications: "عرض كل الإشعارات",
      markAllRead: "تعليم الكل كمقروء",
      noNotifications: "ما في إشعارات جديدة",
    },
    nav: {
      overview: "نظرة عامة",
      crm: "إدارة العلاقات",
      operations: "العمليات",
      catalog: "الكتالوج والمخزون",
      service: "الخدمة",
      insights: "الإدارة",
      dashboard: "لوحة التحكم",
      auditLog: "سجلّ التدقيق",
      customers: "الزبائن",
      companies: "الشركات",
      leads: "العملاء المحتملون",
      opportunities: "الفرص",
      orders: "الطلبات",
      newOrder: "طلب جديد",
      orderBoard: "لوحة الطلبات",
      quotations: "عروض الأسعار",
      invoices: "الفواتير",
      payments: "المدفوعات",
      products: "المنتجات",
      materials: "المواد",
      movements: "حركات المخزون",
      tickets: "التذاكر",
      messages: "الرسائل",
      design: "ستوديو التصميم",
      files: "مكتبة الوسائط",
      analytics: "التحليلات",
      users: "المستخدمون والأدوار",
      myEmployees: "موظفيني",
      settings: "الإعدادات",
    },
    common: {
      cancel: "إلغاء",
      save: "حفظ",
      create: "إنشاء",
      edit: "تعديل",
      delete: "حذف",
      submit: "إرسال",
      send: "إرسال",
      record: "تسجيل",
      accept: "قبول",
      previous: "السابق",
      next: "التالي",
      page: "صفحة",
      of: "من",
      total: "الإجمالي",
      search: "بحث…",
      noResults: "لا توجد نتائج",
      all: "الكل",
      live: "مباشر",
      autoRefresh: "مباشر · تحديث تلقائي",
      required: "مطلوب",
      optional: "اختياري",
      yes: "نعم",
      no: "لا",
    },
    dashboard: {
      title: "مركز القيادة التنفيذي",
      description: "مؤشرات مباشرة، حالة الإنتاج، سجلّ التدقيق، والاعتمادات.",
      revenueTitle: "الإيرادات · آخر ٣٠ يوم",
      revenueSubtitle: "اليوم {today} · الشهر حتى الآن {mtd}",
      paid: "مدفوع",
      ordersByStatusTitle: "الطلبات حسب الحالة",
      ordersByStatusSub: "توزيع المسار",
      onlineTitle: "متّصلون الآن",
      onlineSub: "آخر ١٠ دقائق",
      nobodyOnline: "لا أحد متّصل حالياً.",
      liveActivityTitle: "النشاط المباشر",
      liveActivitySub: "من سجلّ التدقيق",
      noActivity: "لا يوجد نشاط بعد.",
      deptLoadTitle: "حِمل الأقسام",
      deptLoadSub: "النشط مقابل المتأخر",
      noWorkload: "لا يوجد عمل نشط.",
      lowStockTitle: "مخزون منخفض",
      lowStockSub: "عند أو تحت مستوى إعادة الطلب",
      lowStockOk: "جميع المواد متوفّرة بشكل كافٍ.",
      overdueTitle: "فواتير متأخرة",
      overdueSub: "تتطلّب إجراءً",
      overdueOk: "جميع الفواتير ضمن المسار.",
      due: "تستحق",
      approvalsTitle: "اعتمادات تصميم بانتظار الموافقة",
      approvalsSub: "بانتظار قرار الزبون",
      noApprovals: "لا توجد اعتمادات قيد الانتظار.",
      revisionPrefix: "مراجعة رقم ",
      orderNumber: "الطلب رقم ",
      activeLabel: "نشط",
      delayedLabel: "متأخر",
      kpis: {
        revenueToday: "إيرادات اليوم",
        revenueMTD: "الإيرادات الشهرية",
        activeOrders: "طلبات نشطة",
        delayedOrders: "طلبات متأخرة",
        onlineNow: "متّصلون الآن",
        pendingApprovals: "اعتمادات معلّقة",
        revenueTodayHint: "فواتير مدفوعة",
        revenueMTDHint: "منذ بداية الشهر",
        activeHint: "قيد التنفيذ",
        delayedHint: "تجاوزت الموعد",
        onlineHint: "آخر ١٠ دقائق",
        pendingHint: "مراجعات تصاميم",
      },
    },
    customers: {
      title: "الزبائن",
      description: "الأشخاص والشركات اللي تخدمهم.",
      newBtn: "زبون جديد",
      newTitle: "زبون جديد",
      searchPh: "ابحث بالاسم، الإيميل، أو الموبايل…",
      colCustomer: "الزبون",
      colCode: "الرمز",
      colPhone: "الموبايل",
      colLocation: "الموقع",
      colTags: "وسوم",
      emptyTitle: "ما عدك زبائن بعد",
      emptyDesc: "أضف أول زبون لتبدأ.",
      showing: "الصفحة {p} من {n} · المجموع {t}",
      archived: "تمت أرشفة الزبون",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "الموبايل",
      jobTitle: "المسمى الوظيفي",
      city: "المدينة",
      country: "الدولة",
      tags: "وسوم",
      notes: "ملاحظات",
      saved: "تم إنشاء الزبون",
    },
    leads: {
      title: "العملاء المحتملون",
      description: "تتبّع وتأهيل قنوات المبيعات.",
      newBtn: "عميل محتمل جديد",
      newTitle: "عميل محتمل جديد",
      allStages: "كل المراحل",
      colLead: "العميل المحتمل",
      colSource: "المصدر",
      colStage: "المرحلة",
      colScore: "النقاط",
      colValue: "القيمة التقديرية",
      converted: "تمّ التحويل",
      convert: "تحويل",
      emptyTitle: "ما في عملاء بهاي المرحلة",
      emptyDesc: "أضف عميل أو غيّر الفلتر.",
      created: "تم إنشاء العميل",
      convertedToast: "تمّ تحويل العميل",
      fullName: "الاسم الكامل",
      company: "الشركة",
      email: "البريد الإلكتروني",
      phone: "الموبايل",
      source: "المصدر",
      stage: "المرحلة",
      score: "النقاط",
      estValue: "القيمة التقديرية (دولار)",
    },
    orders: {
      title: "الطلبات",
      description: "تتبّع سير الإنتاج من البداية للنهاية.",
      newBtn: "طلب جديد",
      searchPh: "ابحث بالرمز أو العنوان…",
      allStatuses: "كل الحالات",
      colCode: "الرمز",
      colTitle: "العنوان",
      colStatus: "الحالة",
      colPriority: "الأولوية",
      colDeadline: "الموعد النهائي",
      colTotal: "المجموع",
      placedVia: "عبر {ch}",
      emptyTitle: "ما في طلبات",
      emptyDesc: "سجّل طلب جديد أو غيّر الفلتر.",
      timeline: {
        title: "الحالة والرسائل",
        subtitle: "تغيّرات الحالة والرسائل بالترتيب.",
        thread: "محادثة الموافقة",
        staff: "الفريق",
        customer: "الزبون",
        unknownActor: "النظام",
        noMessage: "ما في رسالة لهذه الخطوة.",
        openMessages: "فتح رسائل الفريق ←",
      },
      confirmReceiptTitle: "تأكيد التسليم",
      confirmReceiptHint: "سجّل الطلب كمُسلَّم لما يستلمه الزبون (بأي مرحلة إنتاج).",
      confirmReceiptQuestion: "تسجيل الطلب كمُسلَّم؟",
      confirmReceiptYes: "تأكيد التسليم",
      confirmReceiptSuccess: "تم تسجيل الطلب كمُسلَّم",
      payment: {
        label: "تم استلام الدفع",
        confirmTitle: "تأكيد الدفع",
        confirmHint: "ارفع إيصال أو لقطة شاشة، أو اكتب ملاحظة توضّح سبب تسجيل الدفع.",
        revokeTitle: "إلغاء تأكيد الدفع",
        revokeHint: "اشرح لماذا يجب إلغاء تأكيد الدفع.",
        notesLabel: "ملاحظة الدفع",
        notesPlaceholder: "مثال: تحويل بنكي رقم 12345، استلام نقدي…",
        revokeReasonLabel: "السبب",
        revokeReasonPlaceholder: "لماذا يُلغى تأكيد الدفع؟",
        uploadLabel: "رفع إيصال أو لقطة شاشة",
        uploadHint: "PNG أو JPG أو PDF — حتى 50 ميغابايت",
        confirmBtn: "تسجيل كمدفوع",
        revokeBtn: "إلغاء الدفع",
        markedPaid: "تم تأكيد الدفع",
        clearedPaid: "تم إلغاء تأكيد الدفع",
      },
      detail: {
        back: "رجوع",
        boardView: "عرض اللوحة",
        status: "الحالة",
        priority: "الأولوية",
        deadline: "الموعد النهائي",
        payment: "الدفع",
        total: "المجموع",
        lineItemsCount: "بنود الطلب ({n})",
        productionPipeline: "سير الإنتاج",
        productionPipelineSub: "كل {n} بنود الطلب تتحرك سوية بكل مرحلة.",
        stageTeam: "فريق المرحلة",
        notAssigned: "هذا المشروع مو مخصص إلك — بس صاحب المرحلة يقدر يحرّكه للأمام.",
        history: "السجل",
        pipelineUpdated: "تم تحديث سير الإنتاج",
        updateFailed: "فشل التحديث",
        loading: "جاري تحميل الطلب…",
        workflowStages: {
          pending: "قيد الانتظار",
          design: "التصميم",
          printing: "الطباعة",
          production: "الإنتاج",
          finishing: "التشطيب",
          delivery: "التسليم",
          completed: "مكتمل",
          on_hold: "معلّق",
          cancelled: "ملغى",
        },
      },
    },
    departments: {
      accounting: "المحاسبة",
      sales: "المبيعات / التسويق",
      design: "التصميم",
      printing: "الطباعة",
      cnc: "CNC",
      flex_uv: "فليكس / UV",
      warehouse: "المخزن",
      delivery: "التسليم / العمليات",
    },
    orderBoard: {
      title: "لوحة الطلبات",
      description: "تابع كل طلب من لحظة الطلب حتى الإنتاج والتسليم.",
      allDepartments: "كل الأقسام",
      refresh: "تحديث",
      listView: "عرض القائمة",
      activeCount: "{n} طلب على اللوحة",
      loading: "جاري تحميل اللوحة…",
      moved: "تم نقل الطلب",
      moveFailed: "تعذّر نقل الطلب",
      stageNotApplicable: "هذه المرحلة غير مستخدمة لهذا الطلب",
      stageMarkedNa:
        "مرحلة {stage} محددة كـ N/A — ما في موظفين معيّنين. اطلب من المدير تحديث فريق المشروع قبل النقل هنا.",
      stageNoAssignees:
        "ما في موظفين معيّنين لمرحلة {stage}. افتح صفحة تفاصيل الطلب وأضف أعضاء الفريق لهذا القسم.",
      oneStageBackOnly: "تقدر ترجع مرحلة واحدة بس — تواصل مع المدير",
      dragHint: "اسحب للنقل",
      statsTitle: "نظرة عامة",
      totalOrders: "إجمالي الطلبات",
      activityTitle: "آخر النشاط",
      activityEmpty: "ما في تغييرات حالة حديثة.",
      sourcePortal: "بوابة الزبون",
      sourceStaff: "الموظفين",
      lastUpdated: "آخر تحديث",
      zoomIn: "تكبير",
      zoomOut: "تصغير",
      resetZoom: "إعادة التكبير",
      fitView: "ملاءمة الشاشة",
      zoomPct: "{n}٪",
      panHint: "مرّر للتكبير · Shift+مرّر للتحريك · مسافة+سحب · نقرتين للشاشة الكاملة",
      enterFullscreen: "شاشة كاملة",
      exitFullscreen: "خروج من الشاشة الكاملة",
      mobileTapHint: "اختر المرحلة من الأسفل، ثم استخدم الأزرار على كل بطاقة لنقل الطلب.",
      mobilePrevStage: "المرحلة السابقة",
      mobileNextStage: "المرحلة التالية",
      emptyColumn: "ما في طلبات بهذه المرحلة.",
      moveBack: "رجوع إلى {stage}",
      moveForward: "نقل إلى {stage}",
      openOrder: "فتح الطلب",
      revertRequiresReason: "يرجى ذكر سبب إرجاع الطلب للمرحلة السابقة",
      revertTitle: "إرجاع للمرحلة السابقة",
      revertDescription: "اشرح لماذا يجب إرجاع هذا الطلب للمرحلة السابقة.",
      revertReasonLabel: "السبب",
      revertReasonPlaceholder: "مثلاً: نقص موافقة التصميم، مشكلة جودة…",
      revertConfirm: "إرجاع",
      assignmentsRequired:
        "عيّن موظفين لكل مرحلة إنتاج قبل النقل إلى التصميم أو الطباعة وغيرها. افتح صفحة تفاصيل الطلب لتعيين الفريق.",
      columns: {
        intake: "طلب جديد",
        approval: "الموافقة",
        confirmed: "مؤكّد",
        paid: "مدفوع",
        design: "التصميم",
        printing: "الطباعة",
        production: "الإنتاج",
        finishing: "التشطيب",
        delivery: "جاهز للتسليم",
        completed: "مكتمل",
        cancelled: "ملغى",
      },
    },
    messages: {
      title: "الرسائل",
      description: "دردشة الفريق — اربط المشاريع وشارك الملفات.",
      tabChats: "كل الرسائل",
      tabContacts: "جهات الاتصال",
      search: "بحث…",
      today: "اليوم",
      empty: "ما في محادثات بعد.",
      selectChat: "اختر محادثة أو جهة اتصال لبدء المراسلة.",
      placeholder: "اكتب رسالة…",
      attach: "إرفاق ملف",
      linkProject: "ربط بمشروع (طلب)",
      noProject: "بدون ربط مشروع",
      newGroup: "مجموعة جديدة",
      createGroup: "إنشاء مجموعة",
      groupCreated: "تم إنشاء المجموعة",
      groupName: "اسم المجموعة",
      members: "الأعضاء",
      groupFallback: "مجموعة",
      attachments: "الملفات المشتركة",
    },
    notifications: {
      title: "الإشعارات",
      description: "الرسائل، التعيينات، وتحديثات الإنتاج حسب دورك.",
      emptyTitle: "ما في إشعارات بعد",
      emptyHint: "راح تشوف هنا الرسائل الجديدة وتحديثات الطلبات.",
      markAllRead: "تعليم الكل كمقروء",
      all: "الكل",
      unread: "غير مقروء",
      types: {
        chatMessage: "رسالة جديدة",
        orderAssigned: "تعيين طلب",
        orderAssignmentUpdated: "تحديث التعيين",
        orderAssignmentsChanged: "تعيين الفريق",
        orderReleased: "إرسال للإنتاج",
      },
      bodies: {
        chatPreview: "{sender}: {preview}",
        assignedToStages: "تم تعيينك على {stages}",
        assignmentUpdated: "تم تحديث تعيينك ({stages})",
        managerAssignments: "{actor} عيّن فريق {code} ({stages})",
        managerAssignmentsUpdated: "{actor} حدّث فريق {code} ({stages})",
        releasedAssignee: "تم إرسال الطلب للإنتاج — أنت ضمن فريق الإنتاج",
        releasedManager: "{actor} أرسل {code} للإنتاج",
      },
    },
    newOrder: {
      title: "طلب جديد",
      description: "اضبط الخدمات، شوف السعر مباشرة، وقدّم الطلب.",
      cancel: "إلغاء",
      submit: "تقديم الطلب",
      created: "تم إنشاء الطلب {code}",
      detailsTitle: "تفاصيل الطلب",
      detailsSub: "الزبون، الموعد، والبيانات",
      customerLabel: "الزبون",
      selectCustomer: "اختر الزبون…",
      placingAs: "بصفة: {name}",
      orderTitleLabel: "عنوان الطلب",
      orderTitlePh: "مثلاً: حملة الربع الثالث",
      deadline: "الموعد النهائي",
      priority: "الأولوية",
      priorities: { low: "منخفضة", normal: "عادية", high: "عالية", urgent: "عاجلة" },
      notes: "ملاحظات",
      lineItemsTitle: "بنود الطلب",
      lineItemsSub: "اختر منتج واضبطه — السعر يتحدّث مباشرة.",
      addLine: "إضافة بند",
      noItems: "ما في بنود بعد.",
      noItemsHintBefore: "اضغط ",
      noItemsHintLink: "إضافة بند",
      noItemsHintAfter: " للبدء.",
      summaryTitle: "ملخّص الطلب",
      summarySub: "المجموع المباشر",
      subtotal: "المجموع الفرعي",
      tax: "الضريبة",
      grandTotal: "المجموع الكلي",
      instantQuote: "تسعيرة فورية",
      attachTitle: "إرفاق ملفات",
      attachSub: "تصاميم، مراجع، ملفات مصدرية",
      uploadCta: "اضغط للرفع",
      uploadHint: "أي نوع ملف (صور، PDF، PSD، AI، ZIP، DOCX، …) — حتى ٥٠ ميغا لكل ملف",
      uploadsDone: "تم رفع الملفات",
      product: "المنتج",
      selectProduct: "اختر المنتج…",
      quantity: "الكمية",
      unit: "الوحدة",
      unitPrice: "سعر الوحدة",
      livePricing: "تفصيل التسعير المباشر",
      addProduct: "إضافة منتج جديد",
      reviewTitle: "مراجعة الطلب",
      reviewSub: "تأكد من التفاصيل قبل الإرسال",
      itemCount: "{count} بند",
      itemFallback: "بند {n}",
    },
    workflowAssignments: {
      title: "تعيينات الإنتاج",
      subtitle: "اختياري هسه — مطلوب قبل الإرسال للإنتاج",
      description:
        "لكل مرحلة: اختر موظفاً واحداً أو أكثر، أو حدد N/A إذا الطلب ما يحتاج هالخطوة (مثلاً تصميم شعار بدون CNC).",
      selectStaff: "اختر موظفاً واحداً على الأقل…",
      notApplicable: "غير مطلوب",
      skippedHint: "هذه المرحلة غير مستخدمة لهذا الطلب",
      noStaff: "ما في موظفين بهالقسم",
      selectedCount: "{n} محدد",
      editTitle: "فريق الإنتاج",
      editSubtitle: "أضف أو أزل موظفين لكل مرحلة — التغييرات تبقى حتى عند إرجاع الطلب على اللوحة.",
      saveAssignments: "حفظ التعيينات",
      saved: "تم تحديث فريق العمل",
      stages: {
        design: "التصميم",
        printing: "الطباعة",
        production: "CNC / الإنتاج",
        finishing: "التشطيب / Flex-UV",
        delivery: "التسليم / المخزن",
      },
    },
    quotations: {
      title: "عروض الأسعار",
      description: "المسوّدات، المقبولة، والمحوّلة لفواتير.",
      colCode: "الرمز",
      colStatus: "الحالة",
      colIssued: "تاريخ الإصدار",
      colValid: "صالح حتى",
      colTotal: "المجموع",
      accept: "قبول",
      invoice: "فاتورة",
      accepted: "مقبول",
      invoiceCreated: "تم إنشاء الفاتورة {code}",
      emptyTitle: "ما في عروض أسعار بعد",
      emptyDesc: "أنشئ عرضاً من فرصة.",
    },
    invoices: {
      title: "الفواتير",
      description: "الفواتير الصادرة وحالات الدفع.",
      colCode: "الرمز",
      colStatus: "الحالة",
      colIssued: "تاريخ الإصدار",
      colDue: "تاريخ الاستحقاق",
      colBalance: "الرصيد",
      colTotal: "المجموع",
      colDescription: "الوصف",
      colQty: "الكمية",
      colUnitPrice: "سعر الوحدة",
      colTax: "الضريبة",
      colLineTotal: "مجموع البند",
      colSubtotal: "المجموع الفرعي",
      colTaxTotal: "الضريبة",
      colPaid: "المدفوع",
      emptyTitle: "ما في فواتير بعد",
      emptyDesc: "أنشئ فاتورة من أي طلب أو حوّل عرض سعر مقبول.",
      back: "رجوع",
      summary: "الملخص",
      lineItems: "البنود",
      notes: "ملاحظات",
      loading: "جاري تحميل الفاتورة…",
      generateEn: "إنشاء فاتورة (PDF إنجليزي)",
      generateAr: "إنشاء فاتورة (PDF عربي)",
      generateBtn: "إنشاء فاتورة",
      deleteBtn: "حذف",
      deleted: "تم حذف الفاتورة",
      confirmDelete: "حذف هذه الفاتورة؟",
      downloadEn: "تحميل PDF (إنجليزي)",
      downloadAr: "تحميل PDF (عربي)",
      pdfDownloaded: "تم تحميل PDF",
      generated: "تم إنشاء الفاتورة {code}",
      updated: "تم تحديث الفاتورة {code} بأحدث بيانات الطلب",
      issuedAt: "تاريخ الإصدار",
      portalUpdated: "تم تحديث ظهور الفاتورة في البوابة",
      portalVisible: "ظاهرة في البوابة",
      showInPortal: "إظهار في بوابة الزبون",
      hideFromPortal: "إخفاء من بوابة الزبون",
      orderSectionTitle: "الفواتير",
      orderSectionSub: "أنشئ فواتير PDF احترافية لهذا المشروع في أي مرحلة.",
      noOrderInvoices: "ما في فواتير لهذا الطلب بعد.",
      shareWithPortal: "مشاركة مع بوابة الزبون عند الإنشاء",
    },
    materials: {
      title: "المواد والمخزون",
      description: "المخزون المتاح، تكلفة الوحدة، وتنبيهات إعادة الطلب.",
      newBtn: "مادة جديدة",
      newTitle: "مادة جديدة",
      editTitle: "تعديل المادة",
      updated: "تم تحديث المادة",
      deleted: "تم حذف المادة",
      searchPh: "بحث بالمواد…",
      lowOnly: "مخزون منخفض",
      filters: "فلاتر",
      allMaterials: "كل المواد",
      kpiTotal: "إجمالي المواد",
      kpiTotalHint: "عناصر بالكتالوج",
      kpiLowStock: "مخزون منخفض",
      kpiLowStockHint: "عند أو تحت نقطة الطلب",
      kpiOutOfStock: "نفد المخزون",
      kpiOutOfStockHint: "الكمية صفر",
      kpiStockValue: "قيمة المخزون",
      kpiStockValueHint: "المتوفر × تكلفة الوحدة",
      colSku: "رمز المادة",
      colMaterial: "المادة",
      colOnHand: "المخزون",
      colReorder: "نقطة الطلب",
      colCost: "التكلفة",
      colUnitCost: "تكلفة الوحدة",
      colStockValue: "قيمة المخزون",
      colStatus: "الحالة",
      colActions: "",
      stockLow: "إعادة طلب",
      stockOk: "متوفر",
      stockOut: "نفد",
      movement: "حركة",
      movementTitle: "حركة مخزون · {name}",
      movementTitleEmpty: "حركة",
      movementType: "النوع",
      movementTypes: {
        IN: "وارد",
        OUT: "صادر",
        DAMAGED: "تالف",
        ADJUSTMENT: "تسوية",
        TRANSFER: "تحويل",
      },
      movementQty: "الكمية",
      movementNotes: "ملاحظات",
      record: "تسجيل",
      created: "تم إنشاء المادة",
      recorded: "تم تسجيل الحركة",
      emptyTitle: "ما في مواد",
      name: "الاسم",
      sku: "رمز المادة",
      unit: "الوحدة",
      category: "الفئة",
      onHand: "المتوفر",
      cost: "التكلفة",
      reorderLevel: "نقطة إعادة الطلب",
    },
    tickets: {
      title: "التذاكر",
      description: "تذاكر دعم الزبائن والدعم الداخلي.",
      newBtn: "تذكرة جديدة",
      newTitle: "افتح تذكرة",
      colCode: "الرمز",
      colSubject: "الموضوع",
      colPriority: "الأولوية",
      colStatus: "الحالة",
      colCreated: "تاريخ الإنشاء",
      defaultCategory: "عامة",
      emptyTitle: "ما في تذاكر مفتوحة",
      created: "تم إنشاء التذكرة",
      subject: "الموضوع",
      priority: "الأولوية",
      priorities: { low: "منخفضة", normal: "عادية", high: "عالية", urgent: "عاجلة" },
      describeIssue: "صف المشكلة",
      detail: {
        back: "رجوع",
        conversation: "المحادثة",
        openHint: "اكتب ردّك أدناه لمتابعة التذكرة.",
        closedHint: "هذه التذكرة مغلقة.",
        replyPlaceholder: "اكتب رسالتك…",
        replySent: "تم إرسال الرسالة",
        closeBtn: "إغلاق التذكرة",
        closed: "تم إغلاق التذكرة",
        details: "التفاصيل",
        assignee: "المسؤول",
        assignTitle: "التخصيص",
        assignHint: "وجّه التذكرة إلى موظف الدعم.",
        unassigned: "غير مخصصة",
        assigned: "تم تحديث المسؤول",
        staffLabel: "الدعم",
        customerLabel: "أنت",
      },
    },
    products: {
      title: "المنتجات والخدمات",
      description: "تسعيرة الكتالوج، استهلاك المواد (BOM)، وجاهزية المخزون.",
      searchPh: "بحث بالمنتجات…",
      emptyTitle: "ما في منتجات",
      perUnit: "/",
      addBtn: "إضافة منتج",
      filters: "فلاتر",
      allProducts: "كل المنتجات",
      kpiTotal: "إجمالي المنتجات",
      kpiTotalHint: "بالكتالوج",
      kpiActive: "نشط",
      kpiActiveHint: "متاح للطلب",
      kpiLowStock: "يحتاج إعادة طلب",
      kpiLowStockHint: "مواد BOM منخفضة أو نافذة",
      kpiCatalogValue: "مجموع الأسعار",
      kpiCatalogValueHint: "مجموع الصفحة الحالية",
      colProduct: "المنتج",
      colPrice: "السعر",
      colMaterials: "المواد",
      colStock: "المخزون",
      colStatus: "الحالة",
      colCost: "التكلفة",
      statusActive: "نشط",
      statusInactive: "غير نشط",
      stockStatus: { inStock: "متوفر", restock: "إعادة طلب", outOfStock: "نفد" },
      bom: {
        title: "استهلاك المواد (BOM)",
        description: "كمية كل مادة تُستهلك لكل وحدة منتج. الطلبات تخصمها تلقائياً.",
        addLine: "إضافة مادة",
        material: "المادة",
        selectMaterial: "اختر مادة…",
        qtyPerUnit: "الكمية لكل وحدة",
      },
      form: {
        title: "إضافة منتج جديد",
        editTitle: "تعديل المنتج",
        nameEn: "الاسم (إنجليزي)",
        nameEnPh: "e.g. Business Cards",
        nameAr: "الاسم (عربي)",
        nameArPh: "مثلاً: بطاقات عمل",
        category: "الفئة",
        selectCategory: "اختر الفئة…",
        unit: "الوحدة",
        pricingModel: "نموذج التسعير",
        basePrice: "السعر الأساسي",
        cost: "تكلفة الوحدة",
        taxRate: "نسبة الضريبة (%)",
        descriptionEn: "الوصف (إنجليزي)",
        descriptionAr: "الوصف (عربي)",
        created: "تم إنشاء المنتج",
        updated: "تم تحديث المنتج",
        deleted: "تم حذف المنتج",
        confirmDelete: "حذف هذا المنتج؟",
        failed: "تعذّر حفظ المنتج",
        models: { fixed: "ثابت", variable: "متغير", customQuote: "عرض مخصص" },
      },
    },
    catalogOptions: {
      attrs: {
        sizes: "المقاس",
        materials: "المادة",
        complexity: "التعقيد",
        finish: "التشطيب",
        sides: "الوجه",
        package: "الباقة",
        size: "الحجم",
        coverage: "التغطية",
        binding: "التجليد",
        stitches: "عدد الغرز",
        tier: "المستوى",
      },
      values: {
        "3m": "3 م",
        "6m": "6 م",
        "12m": "12 م",
        A4: "A4",
        A3: "A3",
        A2: "A2",
        A1: "A1",
        flex: "فليكس",
        mesh: "مش",
        paper: "ورق",
        acrylic: "أكريليك",
        metal: "معدن",
        wood: "خشب",
        mdf: "MDF",
        low: "منخفض",
        medium: "متوسط",
        high: "عالي",
        matte: "مطفي",
        gloss: "لامع",
        "soft-touch": "لمسة ناعمة",
        single: "وجه واحد",
        double: "وجهان",
        basic: "أساسي",
        standard: "قياسي",
        premium: "مميز",
        small: "صغير",
        large: "كبير",
        xl: "كبير جداً",
        partial: "جزئي",
        full: "كامل",
        staple: "تدبيس",
        thermal: "تجليد حراري",
        paperback: "غلاف ورقي",
        hardcover: "غلاف مقوى",
        starter: "مبتدئ",
        growth: "نمو",
      },
      breakdown: {
        base: "السعر الأساسي",
        volume_discount: "خصم الكمية",
      },
    },
    audit: {
      title: "سجلّ التدقيق",
      description: "كل تغيير مهم بالنظام، غير قابل للتعديل وقابل للبحث.",
      colWhen: "الوقت",
      colActor: "المنفّذ",
      colAction: "الإجراء",
      colModule: "الوحدة",
      colEntity: "الكيان",
      colIp: "IP",
      actionPh: "إجراء…",
      allModules: "كل الوحدات",
      modules: {
        auth: "المصادقة",
        users: "المستخدمون",
        crm: "إدارة العلاقات",
        orders: "الطلبات",
        finance: "المالية",
        inventory: "المخزون",
        catalog: "الكتالوج",
        support: "الدعم",
        files: "الملفات",
      },
      emptyTitle: "ما في سجلات",
      summary: "الصفحة {p} من {n} · {t} سجلّ",
    },
    users: {
      title: "موظفيني",
      description: "إضافة أعضاء الفريق وتعيين أي دور لهم.",
      searchPh: "بحث…",
      staffOnly: "الموظفون فقط",
      newBtn: "إضافة موظف",
      newTitle: "موظف جديد",
      editTitle: "تعديل الموظف",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      passwordOptional: "كلمة مرور جديدة (اختياري)",
      phone: "الموبايل",
      department: "القسم",
      titleField: "المسمى الوظيفي",
      roles: "الأدوار",
      rolesHint: "اختر دوراً واحداً أو أكثر لهذا الموظف.",
      isActive: "حساب نشط",
      created: "تم إنشاء الموظف",
      updated: "تم تحديث الموظف",
      deleted: "تم حذف الموظف",
      confirmDelete: "حذف هذا الموظف؟",
      colUser: "المستخدم",
      colRoles: "الأدوار",
      colDept: "القسم",
      colStatus: "الحالة",
      colLastLogin: "آخر دخول",
      active: "نشط",
      inactive: "غير نشط",
      emptyTitle: "ما في موظفين",
    },
    settings: {
      title: "الإعدادات",
      description: "البيانات الشخصية والتفضيلات.",
      profileTitle: "الملف الشخصي",
      profileSub: "مرئي لفريقك",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "الموبايل",
      department: "القسم",
      save: "حفظ التغييرات",
      saved: "تم تحديث الملف الشخصي",
      appearanceTitle: "المظهر",
      appearanceSub: "تفضيل المظهر",
      light: "فاتح",
      lightHint: "أبيض وأسود، تباين عالٍ",
      dark: "داكن",
      darkHint: "أحادي اللون الداكن، مريح للعين",
      brandTitle: "هوية النظام",
      brandSub: "اسم النظام والشعار اللي يظهر بكل الصفحات.",
      brandSaved: "تم تحديث هوية النظام",
      adminOnly: "يظهر للمسؤول (الأدمن) فقط",
      appName: "اسم النظام (إنجليزي)",
      appNameAr: "اسم النظام (عربي)",
      tagline: "الشعار النصي (إنجليزي)",
      taglineAr: "الشعار النصي (عربي)",
      sidebarSubtitle: "وصف الشريط الجانبي (إنجليزي)",
      sidebarSubtitleAr: "وصف الشريط الجانبي (عربي)",
      logoTitle: "شعار النظام",
      logoHint: "PNG · JPG · WEBP · SVG — حتى ٥ ميغابايت. يستخدم كأيقونة المتصفح وبكل صفحات النظام.",
      uploadLogo: "رفع شعار جديد",
      logoUploaded: "تم تحديث الشعار",
      removeLogo: "حذف الشعار",
      removingLogo: "جارٍ الحذف…",
      currentLogo: "الشعار الحالي",
      noLogo: "الشعار الافتراضي (المدمج)",
      paletteTitle: "ألوان النظام",
      paletteSub: "اختر لون الهوية الأساسي واللون المساعد لوضع الفاتح والداكن. التغيير يظهر فوراً، واضغط حفظ ليصبح للجميع.",
      paletteReset: "إرجاع للألوان الافتراضية",
      brandColor: "لون الهوية (وضع فاتح)",
      brandColorHint: "اللون الرئيسي للهوية على الخلفيات الفاتحة.",
      brandColorDark: "لون الهوية (وضع داكن)",
      brandColorDarkHint: "نسخة أفتح من اللون تستخدم على الخلفيات الداكنة.",
      accentColor: "اللون المساعد (وضع فاتح)",
      accentColorHint: "للتمييزات والذهبيات والتدرجات.",
      accentColorDark: "اللون المساعد (وضع داكن)",
      accentColorDarkHint: "نسخة أفتح للون المساعد على الخلفيات الداكنة.",
      previewTitle: "معاينة مباشرة",
      previewPrimary: "إجراء أساسي",
      previewSecondary: "إجراء ثانوي",
      previewBadgeBrand: "الهوية",
      previewBadgeAccent: "مساعد",
      previewBadgeSuccess: "نجاح",
    },
    placedVia: {
      portal: "البوابة",
      phone: "هاتف",
      email: "إيميل",
      walk_in: "زيارة",
      reseller: "موزّع",
      whatsapp: "واتساب",
      instagram: "إنستغرام",
      staff: "موظف",
    },
    priorities: {
      low: "منخفضة",
      normal: "عادية",
      high: "عالية",
      urgent: "عاجلة",
    },
  },

  common: { none: "—", loading: "جارٍ التحميل…", error: "صار خطأ غير متوقع." },
};

export const MESSAGES: Record<Locale, Dict> = { en, ar };
