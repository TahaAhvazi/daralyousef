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
    emailOrPhone: string;
    emailOrPhoneHint: string;
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
      profile: string;
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
    tour: {
      ariaLabel: string;
      replay: string;
      skip: string;
      next: string;
      back: string;
      finish: string;
      progress: string;
      steps: Record<string, { title: string; body: string }>;
    };
    nav: {
      // modules (accordion headers)
      modDashboard: string;
      modSales: string;
      modPos: string;
      modInstallments: string;
      modCrm: string;
      modHrm: string;
      modInventory: string;
      modOperations: string;
      modAccounting: string;
      modReports: string;
      modTemplates: string;
      modSettings: string;
      // legacy section keys (kept for breadcrumbs / older refs)
      overview: string;
      crm: string;
      operations: string;
      catalog: string;
      service: string;
      insights: string;
      // items
      dashboard: string;
      humanResources: string;
      payrollReport: string;
      auditLog: string;
      customers: string;
      companies: string;
      leads: string;
      opportunities: string;
      orders: string;
      newOrder: string;
      manageOrders: string;
      createOrder: string;
      orderBoard: string;
      quotations: string;
      manageQuotations: string;
      invoices: string;
      manageInvoices: string;
      createInvoice: string;
      creditNotes: string;
      salesReturns: string;
      recurringInvoices: string;
      customerPayments: string;
      salesSettings: string;
      payments: string;
      expenses: string;
      products: string;
      materials: string;
      movements: string;
      purchases: string;
      vendors: string;
      tickets: string;
      messages: string;
      design: string;
      files: string;
      analytics: string;
      users: string;
      myEmployees: string;
      settings: string;
      posTerminal: string;
      posSessions: string;
      installmentPlans: string;
      salesReports: string;
      docTemplates: string;
    };
    hr: {
      title: string;
      description: string;
      contractsTitle: string;
      contractsSub: string;
      contractsTotal: string;
      viewDetails: string;
      showAll: string;
      newEmployee: string;
      pendingTitle: string;
      pendingSub: string;
      pendingEmpty: string;
      pendingBadge: string;
      payrollTitle: string;
      totalGross: string;
      totalDeductions: string;
      totalNet: string;
      payslips: string;
      last7Days: string;
      last30Days: string;
      last90Days: string;
      lastNDays: string;
      expiringTitle: string;
      expiringSub: string;
      expiringEmpty: string;
      attendanceTitle: string;
      payrollReportTitle: string;
      payrollReportSub: string;
      payrollReportExport: string;
      payrollReportFrom: string;
      payrollReportTo: string;
      payrollReportDept: string;
      payrollReportAllDepts: string;
      payrollReportHeadcount: string;
      payrollReportBonus: string;
      payrollReportEmpty: string;
      workforceTitle: string;
      workforceSub: string;
      employeesTotal: string;
      employeesActive: string;
      employeesInactive: string;
      syncedDaftra: string;
      withDepartment: string;
      withTitle: string;
      withContract: string;
      byDepartment: string;
      byTitle: string;
      viewEmployees: string;
      contractStatuses: {
        active: string;
        expired: string;
        under_review: string;
        replacement: string;
        cancelled: string;
        suspended: string;
        draft: string;
      };
      attendanceStatuses: {
        present: string;
        absent: string;
        late: string;
        on_leave: string;
      };
      requestTypes: {
        leave: string;
        permission: string;
        overtime: string;
        document: string;
        other: string;
      };
      employee: {
        notFound: string;
        notFoundHint: string;
        backToHr: string;
        editInUsers: string;
        editEmployee: string;
        deleteEmployee: string;
        newEmployee: string;
        defaultSubtitle: string;
        inactive: string;
        contractCode: string;
        statPresent: string;
        statPayslips: string;
        statRequests: string;
        statContracts: string;
        statProjects: string;
        tabDetails: string;
        tabProjects: string;
        tabAttendance: string;
        tabPayroll: string;
        tabRequests: string;
        tabActivity: string;
        projectsTitle: string;
        projectsSub: string;
        projectsEmpty: string;
        projectOnBoard: string;
        projectOffBoard: string;
        projectRoleAssignee: string;
        projectRoleOwner: string;
        openOrder: string;
        openBoard: string;
        stageLabel: string;
        contractInfo: string;
        profileInfo: string;
        contactInfo: string;
        fieldAddress: string;
        fieldAddress2: string;
        fieldCity: string;
        fieldState: string;
        fieldPostal: string;
        fieldCountry: string;
        fieldNationality: string;
        fieldCitizenship: string;
        fieldOfficialId: string;
        fieldGender: string;
        fieldHireDate: string;
        fieldBirthDate: string;
        fieldResidenceExpiry: string;
        fieldHourlyRate: string;
        fieldCodeStaff: string;
        fieldStaffType: string;
        fieldSystemAccess: string;
        fieldHomePhone: string;
        fieldBusinessPhone: string;
        fieldMobile: string;
        fieldFax: string;
        fieldEmail: string;
        fieldLastLogin: string;
        fieldCreated: string;
        fieldNotes: string;
        fieldDaftraId: string;
        timeline: string;
        salaryData: string;
        allContracts: string;
        fieldEmployee: string;
        fieldJobTitle: string;
        fieldJobLevel: string;
        fieldCode: string;
        fieldPrimary: string;
        fieldDescription: string;
        fieldStart: string;
        fieldJoin: string;
        fieldSigned: string;
        fieldEnd: string;
        fieldProbation: string;
        fieldDuration: string;
        fieldCurrency: string;
        fieldSalary: string;
        fieldTemplate: string;
        fieldNetPeriod: string;
        yes: string;
        no: string;
        attendanceSummary: string;
        attendanceLog: string;
        attendanceLogSub: string;
        attendanceEmpty: string;
        attendanceCalendar: string;
        markWeekdaysPresent: string;
        dailyRate: string;
        saveAttendance: string;
        checkIn: string;
        checkOut: string;
        deductionOverride: string;
        clearDay: string;
        attendanceSaved: string;
        attendanceSaveFailed: string;
        payrollThisMonth: string;
        payrollThisMonthSub: string;
        absentDays: string;
        absenceDeduction: string;
        rowBonus: string;
        extraDeduction: string;
        adjustments: string;
        addAdjustment: string;
        adjAmount: string;
        adjReason: string;
        kindBonus: string;
        kindDeduction: string;
        kindOvertime: string;
        generateDraft: string;
        confirmPaid: string;
        draftStatus: string;
        noAdjustments: string;
        actions: string;
        addPayslip: string;
        editPayslip: string;
        runPayroll: string;
        unpayPayslip: string;
        deletePayslip: string;
        markPaid: string;
        confirmDeletePayslip: string;
        runFromAttendance: string;
        payrollMonth: string;
        totalGross: string;
        totalDeductions: string;
        totalNet: string;
        avgGross: string;
        avgNet: string;
        payrollOverview: string;
        payrollOverviewSub: string;
        payrollChart: string;
        payrollMatrix: string;
        rowSalary: string;
        rowOvertime: string;
        rowAbsence: string;
        rowTotal: string;
        colTotal: string;
        payslips: string;
        payslipList: string;
        payslipEmpty: string;
        voucherId: string;
        voucherPeriod: string;
        voucherAmount: string;
        voucherStatus: string;
        paid: string;
        unpaid: string;
        requestsTitle: string;
        requestsEmpty: string;
        activityTitle: string;
        activitySub: string;
        activityEmpty: string;
        salaryTemplates: { monthly: string; weekly: string; daily: string };
        requestStatuses: { pending: string; approved: string; rejected: string; cancelled: string };
        activityKinds: { request: string; payslip: string; attendance: string; audit: string };
      };
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
      view: string;
      open: string;
      archive: string;
      tip: string;
      dismissTip: string;
      clickRowToOpen: string;
      startHere: string;
    };
    workHome: {
      title: string;
      description: string;
      openShortcut: string;
      hints: {
        orderBoard: string;
        newOrder: string;
        customers: string;
        invoices: string;
        quotations: string;
        materials: string;
        tickets: string;
        orders: string;
      };
    };
    dashboard: {
      title: string;
      greeting: string;
      defaultUser: string;
      description: string;
      quickAccessTitle: string;
      quickAccessDescription: string;
      customerSearchLabel: string;
      orderSearchLabel: string;
      searchCustomers: string;
      searchOrders: string;
      schedulesTitle: string;
      schedulesSub: string;
      schedulesEmpty: string;
      scheduleOrder: string;
      scheduleFollowUp: string;
      scheduleBy: string;
      scheduleNoOwner: string;
      lowStockPanelTitle: string;
      lowStockPanelSub: string;
      stockCritical: string;
      stockLow: string;
      stockOk: string;
      stockAvailable: string;
      currentActivityTitle: string;
      currentActivitySub: string;
      todayFilter: string;
      showAll: string;
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
      updated: string;
      portalAccess: string;
      portalAccessHint: string;
      portalPassword: string;
      portalPasswordConfirm: string;
      portalPasswordMismatch: string;
      portalSaved: string;
      portalBadge: string;
      colPortal: string;
      editTitle: string;
      editBtn: string;
      resetPortalPassword: string;
      resetPortalPasswordHint: string;
      enablePortal: string;
      enablePortalHint: string;
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
      sourceDaftra: string;
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
      searchPh: string;
      filterMine: string;
      filterOverdue: string;
      hideEmpty: string;
      showDone: string;
      selectStage: string;
      prevPage: string;
      nextPage: string;
      pageOf: string;
      showingCount: string;
      mineBadge: string;
      overdueBadge: string;
      progressLabel: string;
      dueLabel: string;
      noDeadline: string;
      unassigned: string;
      itemCount: string;
      columns: {
        intake: string;
        approval: string;
        confirmed: string;
        paid: string;
        warehouse: string;
        design: string;
        printing: string;
        production: string;
        finishing: string;
        delivery: string;
        completed: string;
        cancelled: string;
      };
    };
    orderLifecycle: {
      guideTitle: string;
      guideSubtitle: string;
      gmHint: string;
      roleSales: string;
      roleAccountant: string;
      roleWarehouse: string;
      roleDesigner: string;
      rolePrint: string;
      roleCnc: string;
      roleFinish: string;
      roleDelivery: string;
      roleDone: string;
      stockCheck: {
        title: string;
        subtitle: string;
        waitingHint: string;
        waitForWarehouse: string;
        notesLabel: string;
        notesPlaceholder: string;
        approve: string;
        reject: string;
        approvedLabel: string;
        rejectedLabel: string;
        approvedToast: string;
        rejectedToast: string;
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
    orderCollab: {
      tabOverview: string;
      tabChat: string;
      tabNotes: string;
      chatTitle: string;
      chatSubtitle: string;
      chatPlaceholder: string;
      chatEmpty: string;
      chatEmptyHint: string;
      chatLoadError: string;
      send: string;
      notesTitle: string;
      notesSubtitle: string;
      notesComposeLabel: string;
      notesPlaceholder: string;
      addNote: string;
      notesEmpty: string;
      notesEmptyHint: string;
      notesReadOnly: string;
      noteSaved: string;
      noteDeleted: string;
      confirmDeleteNote: string;
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
      created: string;
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
      product: string;
      selectProduct: string;
      quantity: string;
      unit: string;
      unitPrice: string;
      livePricing: string;
      addProduct: string;
      reviewTitle: string;
      reviewSub: string;
      itemCount: string;
      itemFallback: string;
      preview: string;
      saveDraft: string;
      saveSubmit: string;
      template: string;
      defaultTemplate: string;
      newCustomer: string;
      orderNumber: string;
      orderNumberHint: string;
      orderDate: string;
      salesperson: string;
      selectSalesperson: string;
      colItem: string;
      colDescription: string;
      colDiscount: string;
      colTax: string;
      colLineTotal: string;
      tabSettlement: string;
      tabWarehouse: string;
      tabAttachments: string;
      orderDiscount: string;
      orderDiscountPct: string;
      settlement: string;
      warehouse: string;
      selectWarehouse: string;
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
      list: {
        newInvoice: string;
        reports: string;
        settings: string;
        searchTitle: string;
        filterCustomer: string;
        anyCustomer: string;
        filterCode: string;
        searchCustomerPh: string;
        searchInvoicePh: string;
        searchInvoiceHint: string;
        filterStatus: string;
        anyStatus: string;
        searchBtn: string;
        clearFilters: string;
        tabResults: string;
        tabAll: string;
        tabLate: string;
        tabDue: string;
        tabUnpaid: string;
        tabDraft: string;
        tabOverpaid: string;
        sortNewest: string;
        sortOldest: string;
        sortAmountDesc: string;
        sortAmountAsc: string;
        sortDue: string;
        soldBy: string;
        activityCreated: string;
        activityPayment: string;
        linkedOrder: string;
        balance: string;
        actions: string;
        open: string;
        recordPayment: string;
        statuses: {
          unpaid: string;
          partial: string;
          paid: string;
          draft: string;
          late: string;
          overpaid: string;
        };
      };
      createForm: {
        title: string;
        description: string;
        preview: string;
        saveDraft: string;
        saveSubmit: string;
        template: string;
        defaultTemplate: string;
        customer: string;
        selectCustomer: string;
        newCustomer: string;
        invoiceNumber: string;
        invoiceNumberHint: string;
        invoiceDate: string;
        issueDate: string;
        dueDate: string;
        salesperson: string;
        selectSalesperson: string;
        paymentTerms: string;
        lineItems: string;
        lineItemsSub: string;
        addLine: string;
        colItem: string;
        colDescription: string;
        colUnitPrice: string;
        colQty: string;
        colDiscount: string;
        colTax: string;
        colLineTotal: string;
        selectItem: string;
        customItem: string;
        noTax: string;
        itemFallback: string;
        subtotal: string;
        tax: string;
        grandTotal: string;
        tabSettlement: string;
        tabDeposit: string;
        tabWarehouse: string;
        tabAttachments: string;
        orderDiscount: string;
        orderDiscountPct: string;
        discountTypePct: string;
        discountTypeFixed: string;
        settlement: string;
        settlementHint: string;
        settlementNotePh: string;
        deposit: string;
        advancePayment: string;
        advancePaymentHint: string;
        depositAmount: string;
        payMethodCash: string;
        payMethodCard: string;
        payMethodTransfer: string;
        payMethodDeposit: string;
        warehouse: string;
        selectWarehouse: string;
        attachmentsHint: string;
        notesTerms: string;
        alreadyPaid: string;
        alreadyPaidQ: string;
        alreadyPaidHint: string;
      };
      detail: {
        invoiceTitle: string;
        print: string;
        edit: string;
        pdf: string;
        addPayment: string;
        creditNote: string;
        undoCreditNote: string;
        confirmDeleteCreditNote: string;
        creditNoteDeleted: string;
        return: string;
        copy: string;
        addInstallment: string;
        more: string;
        allPayments: string;
        tabInvoice: string;
        tabDetails: string;
        tabStock: string;
        tabActivity: string;
        docTitle: string;
        docNumber: string;
        docDate: string;
        docBillTo: string;
        docItem: string;
        docDescription: string;
        docUnitPrice: string;
        docQty: string;
        docLineTotal: string;
        amountDue: string;
        customer: string;
        soldBy: string;
        warehouse: string;
        order: string;
        noWarehouse: string;
        stockHint: string;
        linkedInstallments: string;
        activityCreated: string;
        activityPayment: string;
        noActivityExtra: string;
        amount: string;
        method: string;
        installmentCount: string;
        firstDue: string;
        saved: string;
        paymentRecorded: string;
        installmentCreated: string;
        copied: string;
        creditReason: string;
        creditCreated: string;
        returnCreated: string;
        issueDate: string;
        totalAmount: string;
        createdBy: string;
        lastAction: string;
        actionCreated: string;
        salesperson: string;
        salesRecord: string;
        shippingData: string;
        productsList: string;
        qtyRequired: string;
        qtyReceived: string;
        underDelivery: string;
        noStockVoucher: string;
        createStockVoucher: string;
        stockIssued: string;
        stockIssueBy: string;
        undoStockVoucher: string;
        confirmUndoStock: string;
        stockIssueUndone: string;
        filterActions: string;
        allActions: string;
        periodFrom: string;
        periodTo: string;
        activityStock: string;
        activityUpdate: string;
      };
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
      filterEmployees: string;
      filterPortal: string;
      filterAll: string;
      editBtn: string;
      deleteBtn: string;
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
      colTitle: string;
      colStatus: string;
      colLastLogin: string;
      active: string;
      inactive: string;
      emptyTitle: string;
      emptyDesc: string;
      allDepartments: string;
      resultCount: string;
    };
    settings: {
      title: string;
      description: string;
      profileTitle: string;
      profileSub: string;
      avatarTitle: string;
      avatarSub: string;
      avatarHint: string;
      avatarUpload: string;
      avatarChange: string;
      avatarRemove: string;
      avatarUpdated: string;
      avatarRemoved: string;
      avatarTypeError: string;
      avatarSizeError: string;
      profileViewTitle: string;
      profileLoadError: string;
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
      pushTitle: string;
      pushSub: string;
      pushHint: string;
      pushEnable: string;
      pushDisable: string;
      pushEnabled: string;
      pushDisabled: string;
      pushUnsupported: string;
      pushDenied: string;
      pushUnavailable: string;
      pushFailed: string;
      pushStatusOn: string;
      pushStatusOff: string;
      pushPromptTitle: string;
      pushPromptBody: string;
      pushLater: string;
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
      daftraTitle: string;
      daftraSub: string;
      daftraTest: string;
      daftraSync: string;
      daftraEnabled: string;
      daftraDisabled: string;
      daftraConfigured: string;
      daftraNotConfigured: string;
      daftraBaseUrl: string;
      daftraMapped: string;
      daftraLastSync: string;
      daftraNever: string;
      daftraTestOk: string;
      daftraTestFail: string;
      daftraSyncOk: string;
      daftraSyncFail: string;
      daftraSyncStarted: string;
      daftraSyncRunning: string;
      daftraCreated: string;
      daftraUpdated: string;
      daftraSkipped: string;
      daftraErrors: string;
      daftraPages: string;
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
    regionLabel: "Basra",
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
    emailOrPhone: "Email or phone",
    emailOrPhoneHint: "Staff: work email · Customers: phone number · default password yousef123",
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
      profile: "Profile",
    },
    home: {
      greeting: "Hello, {name}",
      subtitle: "Start with a new order, or open your orders and invoices below. Big buttons = main actions.",
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
    tour: {
      ariaLabel: "Product guided tour",
      replay: "How this system works",
      skip: "Skip tour",
      next: "Next",
      back: "Back",
      finish: "Got it",
      progress: "Step {n} of {total}",
      steps: {
        welcome: {
          title: "Welcome — this is your staff system",
          body: "Assume you know nothing yet: this guided walkthrough explains every panel you can open, what it is for, and how an order travels from sales to delivery. Tap the glowing circle or Next. Replay anytime with the amber ? icon.",
        },
        sidebar: {
          title: "Navigation sidebar",
          body: "Everything lives in this left menu. Modules are grouped by department (Sales, CRM, Inventory, Operations…). Click a group header to expand it, then click a page. Your role only shows the modules you are allowed to use.",
        },
        navDashboard: {
          title: "Dashboard / Work home",
          body: "Your starting screen. Executives see company KPIs and alerts. Other roles see a work home with shortcuts to the pages they use most (new order, board, invoices, materials…). Check it each morning for what needs attention.",
        },
        navSales: {
          title: "Sales module",
          body: "The commercial heart of the system. Here you manage sales orders, create new jobs, send quotations, issue invoices, track customer payments, credit notes, returns, and recurring invoices. Almost every production job starts in Sales.",
        },
        manageOrders: {
          title: "Manage sales orders",
          body: "The order list shows every job: status, customer, amounts, and workflow stage. Open an order to edit lines, assign production people, chat with the team, approve/reject portal requests, and follow the lifecycle (intake → paid → warehouse → production → delivery).",
        },
        createOrder: {
          title: "Create a sales order",
          body: "1) Choose or create a customer. 2) Add products/services and quantities. 3) Assign who handles each production stage (or mark N/A). 4) Save. Portal orders wait for customer approval before release. Stock is validated at create, then reserved later at warehouse approval.",
        },
        navQuotations: {
          title: "Quotations (price offers)",
          body: "Send a formal price offer before the customer commits. When they accept, convert it into a sales order / invoice. Use this when the deal is not final yet — it keeps pricing professional and trackable.",
        },
        navInvoices: {
          title: "Invoices",
          body: "Official billing documents. Search by invoice code, customer name, code, phone, or email. Open an invoice to see lines, PDF, payment status, and linked order. After an order is released, finance uses invoices to confirm money received.",
        },
        createInvoice: {
          title: "Create an invoice",
          body: "Build a standalone invoice (or from an order/quotation). Pick the customer, add lines, tax/notes, then save or send. Keep amounts accurate — payment confirmation and reports depend on this data.",
        },
        accountantPay: {
          title: "Your key step: mark Paid",
          body: "Open the related order or invoice, attach payment proof or a clear note, then mark Paid. Until payment is confirmed, the job stays blocked before warehouse and production. This is the finance gate in the order flow.",
        },
        navPaymentsSales: {
          title: "Customer payments",
          body: "A ledger of money received from customers — cash, transfer, card, etc. Use it to reconcile what was paid against open invoices and installment plans. Always record payments here so reports stay correct.",
        },
        navPos: {
          title: "Point of Sale (POS)",
          body: "Fast counter sales: open a POS session, scan/add items, take payment, and print a receipt. Sessions track cash drawer open/close. Use POS for walk-in retail; use Sales Orders for custom print/production jobs.",
        },
        navInstallments: {
          title: "Installment plans",
          body: "When a customer pays in installments, create and track the schedule here: due dates, amounts paid vs remaining, and overdue alerts. Link plans to invoices so collections stay organized.",
        },
        navCrm: {
          title: "CRM — customers & service",
          body: "Customer Relationship Management: people and companies you sell to, sales leads, support tickets, and internal messages. Good CRM data makes order entry faster and support clearer.",
        },
        navCustomers: {
          title: "Customers",
          body: "Master customer records: name, code, phone, email, city, tags, and history. Always search by name/code/phone when creating orders or invoices so you don’t duplicate customers. Open a profile to see related orders and invoices.",
        },
        navLeads: {
          title: "Leads (potential customers)",
          body: "People or companies who showed interest but are not customers yet. Track follow-ups here, then convert a lead into a customer when the deal becomes real.",
        },
        navTickets: {
          title: "Support tickets",
          body: "Customer or internal issues (delays, quality, questions). Assign an owner, reply, and close when resolved. Use tickets so problems don’t get lost in chat or phone calls.",
        },
        navMessages: {
          title: "Messages",
          body: "Team messaging inside the system. Use it for short coordination; for order-specific decisions prefer the order chat so the history stays on that job.",
        },
        navHrm: {
          title: "HRM — people & payroll",
          body: "Human Resources: employees, contracts, attendance, payroll summaries, and staff user accounts. Managers use this to see who works where and who can log into the portal.",
        },
        navHr: {
          title: "Human Resources",
          body: "Employee directory synced with operations: departments, job titles, contracts, attendance, and payslip overview. Open an employee to review details. Job titles often map to system roles (designer, accountant, warehouse…).",
        },
        navUsers: {
          title: "Staff users & access",
          body: "Who can log into this staff app and with which permissions. Create or disable users carefully — wrong access can show finance or override production. Staff often use their email plus the portal default password until they change it.",
        },
        navWarehouse: {
          title: "Inventory & purchases",
          body: "Everything about stock: raw materials, finished products catalog, purchase orders, and vendors. After an order is Paid, warehouse must approve stock before design/production starts.",
        },
        navMaterials: {
          title: "Materials (stock items)",
          body: "Raw materials and consumables with quantities on hand. Keep levels updated — the system checks stock when creating orders and again at warehouse approval. Low stock here means jobs can be blocked.",
        },
        warehouseCheck: {
          title: "Your key step: stock check",
          body: "On a Paid order, open the stock-check panel: Approve to reserve materials, or Reject with a reason. Production cannot start until stock is approved (managers may override). This protects the shop from starting jobs without materials.",
        },
        navPurchases: {
          title: "Purchases",
          body: "Buy stock from suppliers: create purchase documents, receive goods, and increase material quantities. Use purchases whenever inventory is low before promising delivery dates to customers.",
        },
        navVendors: {
          title: "Vendors (suppliers)",
          body: "Supplier directory — who you buy materials from. Keep contacts and terms here so purchasing is consistent and linked to purchase documents.",
        },
        navProducts: {
          title: "Products catalog",
          body: "Sellable products/services offered to customers (print products, packages, etc.). Catalog items appear when building orders and invoices. Managing the catalog needs catalog permission.",
        },
        navBoard: {
          title: "Operations — Project Board",
          body: "The live production kanban. Every released job appears as a card moving through stages. This is where designers and operators do day-to-day work after sales and warehouse gates are cleared.",
        },
        boardFlow: {
          title: "How the board works",
          body: "Stages: intake → approval → confirmed → paid → warehouse → design → print → CNC → finish → delivery → done. Assignees drag a card to the next stage or use forward/back. Only advance when your work is really finished. Managers/GM can jump or reverse stages when needed.",
        },
        navAccounting: {
          title: "Accounting module",
          body: "Money in and money out beyond the sales invoice list: payments received, expenses, and credit notes. Use it to keep books tidy for the end of day/month.",
        },
        navExpenses: {
          title: "Expenses",
          body: "Record company costs (rent, supplies, shipping, misc.). Categorize clearly so sales reports and profit views stay meaningful.",
        },
        navReports: {
          title: "Reports",
          body: "Sales and performance summaries — what sold, what was collected, trends over time. Leaders and accountants use this for decisions; don’t rely on memory when numbers are available here.",
        },
        navAudit: {
          title: "Audit log",
          body: "A security/history trail of important actions (who changed what). Use it when investigating mistakes, disputes, or unexpected status changes on orders and invoices.",
        },
        navTemplates: {
          title: "Document templates",
          body: "Layouts for PDFs (invoices, quotations, etc.). Update company header, terms, and branding here so printed/shared documents look consistent.",
        },
        navSettings: {
          title: "Settings",
          body: "Personal and company preferences: language, appearance, and sales/document options you are allowed to change. If something looks wrong globally, check Settings (and Sales Settings) before assuming a bug.",
        },
        topbarHelp: {
          title: "Replay this tour anytime",
          body: "The amber ? in the top bar restarts this walkthrough. Use it for new teammates or when you forget where a panel lives. The tour only highlights modules your account can open.",
        },
        flowSummary: {
          title: "Full order journey (memorize this)",
          body: "1) Sales creates the order & assigns the team. 2) Customer/admin approves if needed. 3) Accountant marks Paid (with proof). 4) Warehouse approves stock. 5) Design → print → CNC → finish on the Project Board. 6) Delivery confirms handover. Every move is logged in order chat — read it before asking “where is this job?”",
        },
        done: {
          title: "You’re ready to explore",
          body: "You now know what each panel is for. Start with your daily module, follow the order flow above, and tap ? whenever you need this guide again. When unsure, open the order chat and the board stage — the system already shows the next owner.",
        },
        sales_welcome: {
          title: "Sales — start here",
          body: "You own intake: customers, quotations, orders, pricing, team assignment, and releasing work. This tour also shows CRM and how money/warehouse/production continue after you.",
        },
        accountant_welcome: {
          title: "Finance — start here",
          body: "You own invoices, payments, expenses, and the Paid gate. Without your confirmation (with proof), warehouse and production stay blocked. We’ll also show related sales and report panels.",
        },
        warehouse_welcome: {
          title: "Warehouse — start here",
          body: "You own materials, purchases, vendors, and the stock-check gate after payment. Approve only when materials are really available — then production can begin safely.",
        },
        production_welcome: {
          title: "Production — start here",
          body: "You own your stage on the Project Board. We’ll show the board, how to advance work, and nearby tools (orders, materials, messages) so you know the full picture around your station.",
        },
        executive_welcome: {
          title: "Leadership — full system tour",
          body: "You’ll walk every major module and the full order lifecycle. You can override stages when the team needs an exception — use that power carefully and leave a note in chat.",
        },
      },
    },
    nav: {
      modDashboard: "Dashboard",
      modSales: "Sales",
      modPos: "Point of Sale",
      modInstallments: "Installments",
      modCrm: "CRM",
      modHrm: "HRM",
      modInventory: "Inventory & Purchases",
      modOperations: "Operations",
      modAccounting: "Accounting",
      modReports: "Reports",
      modTemplates: "Templates",
      modSettings: "Settings",
      overview: "Overview",
      crm: "CRM",
      operations: "Operations",
      catalog: "Catalog & Inventory",
      service: "Service",
      insights: "Administration",
      dashboard: "Dashboard",
      humanResources: "Human Resources",
      payrollReport: "Payroll report",
      auditLog: "Audit Log",
      customers: "Customers",
      companies: "Companies",
      leads: "Leads",
      opportunities: "Opportunities",
      orders: "Orders",
      newOrder: "New Order",
      manageOrders: "Manage Sales Orders",
      createOrder: "Create Sales Order",
      orderBoard: "Project Board",
      quotations: "Quotations",
      manageQuotations: "Manage Quotations",
      invoices: "Invoices",
      manageInvoices: "Manage Invoices",
      createInvoice: "Create Invoice",
      creditNotes: "Credit Notes",
      salesReturns: "Returned Invoices",
      recurringInvoices: "Recurring Invoices",
      customerPayments: "Customer Payments",
      salesSettings: "Sales Settings",
      payments: "Payments",
      expenses: "Expenses",
      products: "Products",
      materials: "Materials",
      movements: "Stock Movements",
      purchases: "Purchases",
      vendors: "Vendors",
      tickets: "Tickets",
      messages: "Messages",
      design: "Design Studio",
      files: "Media Library",
      analytics: "Analytics",
      users: "Users & Roles",
      myEmployees: "My Employees",
      settings: "Settings",
      posTerminal: "POS Terminal",
      posSessions: "POS Sessions",
      installmentPlans: "Installment Plans",
      salesReports: "Sales Reports",
      docTemplates: "Document Templates",
    },
    hr: {
      title: "Human Resources",
      description: "Contracts, payroll, attendance, workforce directory and pending employee requests.",
      contractsTitle: "Contracts summary",
      contractsSub: "Status breakdown across all employee contracts",
      contractsTotal: "{n} contracts total",
      viewDetails: "View details",
      showAll: "Show all",
      newEmployee: "New employee",
      pendingTitle: "Pending requests",
      pendingSub: "Leave and HR requests awaiting action",
      pendingEmpty: "No pending requests yet.",
      pendingBadge: "Pending",
      payrollTitle: "Payroll summary",
      totalGross: "Total paid wages",
      totalDeductions: "Total deductions",
      totalNet: "Net wages",
      payslips: "Payslips",
      last7Days: "Last 7 days",
      last30Days: "Last 30 days",
      last90Days: "Last 90 days",
      lastNDays: "Last {n} days",
      expiringTitle: "Expiring contracts",
      expiringSub: "Contracts ending within the next 45 days",
      expiringEmpty: "No contracts expiring soon.",
      attendanceTitle: "Attendance summary",
      payrollReportTitle: "Payroll report",
      payrollReportSub: "Complete salary payments across the organization",
      payrollReportExport: "Export CSV",
      payrollReportFrom: "From",
      payrollReportTo: "To",
      payrollReportDept: "Department",
      payrollReportAllDepts: "All departments",
      payrollReportHeadcount: "Employees paid",
      payrollReportBonus: "Total bonuses",
      payrollReportEmpty: "No payslips in this period.",
      workforceTitle: "Workforce directory",
      workforceSub: "Employees synced into the system — by department and job title",
      employeesTotal: "Total employees",
      employeesActive: "Active",
      employeesInactive: "Inactive",
      syncedDaftra: "Synced from Daftra",
      withDepartment: "With department",
      withTitle: "With job title",
      withContract: "With contract",
      byDepartment: "By department",
      byTitle: "By job title",
      viewEmployees: "Open employees",
      contractStatuses: {
        active: "Active",
        expired: "Expired",
        under_review: "Under review",
        replacement: "Replacement",
        cancelled: "Cancelled",
        suspended: "Suspended",
        draft: "Draft",
      },
      attendanceStatuses: {
        present: "Present",
        absent: "Absent",
        late: "Late",
        on_leave: "On leave",
      },
      requestTypes: {
        leave: "Leave",
        permission: "Permission",
        overtime: "Overtime",
        document: "Document",
        other: "Other",
      },
      employee: {
        notFound: "Employee not found",
        notFoundHint: "This employee profile is unavailable or is not a staff account.",
        backToHr: "Back to HR",
        editInUsers: "Manage in Users",
        editEmployee: "Edit employee",
        deleteEmployee: "Delete",
        newEmployee: "New employee",
        defaultSubtitle: "Employee profile",
        inactive: "Inactive",
        contractCode: "Contract",
        statPresent: "Present",
        statPayslips: "Payslips",
        statRequests: "Requests",
        statContracts: "Contracts",
        statProjects: "Projects",
        tabDetails: "Details",
        tabProjects: "Projects",
        tabAttendance: "Attendance",
        tabPayroll: "Payroll",
        tabRequests: "Requests",
        tabActivity: "Activity",
        projectsTitle: "Assigned projects",
        projectsSub: "Orders this employee owns or is assigned to on the project board",
        projectsEmpty: "No project assignments yet.",
        projectOnBoard: "On board",
        projectOffBoard: "Off board",
        projectRoleAssignee: "Assignee",
        projectRoleOwner: "Owner",
        openOrder: "Open order",
        openBoard: "Project board",
        stageLabel: "Stage",
        contractInfo: "Contract information",
        profileInfo: "Employee profile",
        contactInfo: "Contact & phones",
        fieldAddress: "Address",
        fieldAddress2: "Address line 2",
        fieldCity: "City",
        fieldState: "State / province",
        fieldPostal: "Postal code",
        fieldCountry: "Country",
        fieldNationality: "Nationality",
        fieldCitizenship: "Citizenship status",
        fieldOfficialId: "Official ID",
        fieldGender: "Gender",
        fieldHireDate: "Hire date",
        fieldBirthDate: "Birth date",
        fieldResidenceExpiry: "Residence expiry",
        fieldHourlyRate: "Hourly rate",
        fieldCodeStaff: "Staff code",
        fieldStaffType: "Staff type",
        fieldSystemAccess: "System access",
        fieldHomePhone: "Home phone",
        fieldBusinessPhone: "Business phone",
        fieldMobile: "Mobile",
        fieldFax: "Fax",
        fieldEmail: "Email",
        fieldLastLogin: "Last login",
        fieldCreated: "Created",
        fieldNotes: "Notes",
        fieldDaftraId: "Daftra ID",
        timeline: "Dates & timeline",
        salaryData: "Salary data",
        allContracts: "All contracts",
        fieldEmployee: "Employee",
        fieldJobTitle: "Job title",
        fieldJobLevel: "Job level",
        fieldCode: "Code",
        fieldPrimary: "Primary contract",
        fieldDescription: "Description",
        fieldStart: "Start date",
        fieldJoin: "Join date",
        fieldSigned: "Signing date",
        fieldEnd: "End date",
        fieldProbation: "Probation end",
        fieldDuration: "Duration",
        fieldCurrency: "Currency",
        fieldSalary: "Basic salary",
        fieldTemplate: "Salary template",
        fieldNetPeriod: "Net (period)",
        yes: "Yes",
        no: "No",
        attendanceSummary: "Attendance summary",
        attendanceLog: "Attendance log",
        attendanceLogSub: "Recent check-ins and absences",
        attendanceEmpty: "No attendance records yet.",
        attendanceCalendar: "Attendance calendar",
        markWeekdaysPresent: "Mark weekdays present",
        dailyRate: "Daily rate (salary ÷ 30)",
        saveAttendance: "Save day",
        checkIn: "Check-in",
        checkOut: "Check-out",
        deductionOverride: "Deduction override",
        clearDay: "Clear",
        attendanceSaved: "Saved",
        attendanceSaveFailed: "Could not save",
        payrollThisMonth: "This month payroll",
        payrollThisMonthSub: "Built from attendance, bonuses and deductions",
        absentDays: "Absent days",
        absenceDeduction: "Absence deduction",
        rowBonus: "Bonus",
        extraDeduction: "Extra deductions",
        adjustments: "Adjustments",
        addAdjustment: "Add",
        adjAmount: "Amount",
        adjReason: "Reason",
        kindBonus: "Bonus",
        kindDeduction: "Deduction",
        kindOvertime: "Overtime",
        generateDraft: "Generate draft payslip",
        confirmPaid: "Confirm & mark paid",
        draftStatus: "Draft",
        noAdjustments: "No adjustments this month.",
        actions: "Actions",
        addPayslip: "Add payslip",
        editPayslip: "Edit payslip",
        runPayroll: "Run payroll",
        unpayPayslip: "Revert to draft",
        deletePayslip: "Delete",
        markPaid: "Mark as paid",
        confirmDeletePayslip: "Delete this payslip?",
        runFromAttendance: "Run from attendance",
        payrollMonth: "Payroll month",
        totalGross: "Total paid wages",
        totalDeductions: "Total deductions",
        totalNet: "Total net salary",
        avgGross: "Average gross salary",
        avgNet: "Average net salary",
        payrollOverview: "Contracts overview",
        payrollOverviewSub: "Salary totals and trends for this employee",
        payrollChart: "Net salary trend",
        payrollMatrix: "Monthly breakdown",
        rowSalary: "Salary",
        rowOvertime: "Overtime",
        rowAbsence: "Absence",
        rowTotal: "Total",
        colTotal: "Total",
        payslips: "Payslips",
        payslipList: "Payroll vouchers",
        payslipEmpty: "No payslips yet.",
        voucherId: "ID",
        voucherPeriod: "Period",
        voucherAmount: "Total amount",
        voucherStatus: "Status",
        paid: "Paid",
        unpaid: "Unpaid",
        requestsTitle: "Employee requests",
        requestsEmpty: "No requests yet.",
        activityTitle: "Activity log",
        activitySub: "Requests, payslips, attendance and system actions",
        activityEmpty: "No activity yet.",
        salaryTemplates: { monthly: "Monthly", weekly: "Weekly", daily: "Daily" },
        requestStatuses: {
          pending: "Pending",
          approved: "Approved",
          rejected: "Rejected",
          cancelled: "Cancelled",
        },
        activityKinds: {
          request: "Request",
          payslip: "Payslip",
          attendance: "Attendance",
          audit: "System",
        },
      },
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
      view: "View",
      open: "Open",
      archive: "Archive",
      tip: "Tip",
      dismissTip: "Dismiss tip",
      clickRowToOpen: "Click a row to open details",
      startHere: "Start here",
    },
    workHome: {
      title: "Your workspace",
      description: "Pick a task below. Each card opens one clear place to work — nothing is hidden.",
      openShortcut: "Open →",
      hints: {
        orderBoard: "See every job on a board and move it step by step",
        newOrder: "Create a new order in a few simple steps",
        customers: "Find customers and add new ones",
        invoices: "Check invoices and payment status",
        quotations: "Review price quotes for customers",
        materials: "See stock and materials you have",
        tickets: "Answer support tickets from customers",
        orders: "Browse the full list of orders",
      },
    },
    dashboard: {
      title: "Dashboard overview",
      greeting: "Welcome back, {name}",
      defaultUser: "there",
      description: "Numbers that need attention first — then charts and activity below.",
      quickAccessTitle: "Quick access",
      quickAccessDescription: "Search records or jump directly to the work you need.",
      customerSearchLabel: "Customer search",
      orderSearchLabel: "Order search",
      searchCustomers: "Search by customer name, email or phone…",
      searchOrders: "Search by order code or title…",
      schedulesTitle: "Latest schedules",
      schedulesSub: "Upcoming order deadlines and follow-ups",
      schedulesEmpty: "No upcoming schedules.",
      scheduleOrder: "Work order",
      scheduleFollowUp: "Follow-up",
      scheduleBy: "By {name}",
      scheduleNoOwner: "Unassigned",
      lowStockPanelTitle: "Low stock materials",
      lowStockPanelSub: "Items at or below reorder level",
      stockCritical: "Out of stock",
      stockLow: "Low stock",
      stockOk: "In stock",
      stockAvailable: "{count} {unit} available",
      currentActivityTitle: "Current activity",
      currentActivitySub: "Live actions across the system",
      todayFilter: "Today",
      showAll: "Show all",
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
        activeOrders: "Active",
        delayedOrders: "Delayed",
        onlineNow: "Online",
        pendingApprovals: "Approvals",
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
      description: "People and companies you serve. Search above, then use New customer or Archive on a row.",
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
      updated: "Customer updated",
      portalAccess: "Create portal login",
      portalAccessHint: "Customer can sign in to /portal with this email and password. Self-registration still works separately.",
      portalPassword: "Portal password",
      portalPasswordConfirm: "Confirm portal password",
      portalPasswordMismatch: "Passwords do not match",
      portalSaved: "Customer created — they can sign in to the portal with the email and password you set.",
      portalBadge: "Portal",
      colPortal: "Portal",
      editTitle: "Edit customer",
      editBtn: "Edit",
      resetPortalPassword: "New portal password (optional)",
      resetPortalPasswordHint: "Leave blank to keep the current password.",
      enablePortal: "Enable portal login now",
      enablePortalHint: "Creates a portal account with the email and password below.",
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
      description: "Find an order with search or filters. Open Board for the visual workflow, or New order to start.",
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
      sourceDaftra: "Daftra",
      lastUpdated: "Updated",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      resetZoom: "Reset zoom",
      fitView: "Fit to screen",
      zoomPct: "{n}%",
      panHint: "Scroll to zoom · Shift+scroll to pan · Space+drag to pan · Double-click fullscreen",
      enterFullscreen: "Fullscreen",
      exitFullscreen: "Exit fullscreen",
      mobileTapHint: "Pick a stage, swipe left/right to switch, then use the big buttons on each card.",
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
      searchPh: "Search code, title, assignee…",
      filterMine: "My jobs",
      filterOverdue: "Overdue",
      hideEmpty: "Hide empty",
      showDone: "Show done",
      selectStage: "Stages",
      prevPage: "Previous page",
      nextPage: "Next page",
      pageOf: "Page {page} of {pages}",
      showingCount: "Showing {shown} of {total}",
      mineBadge: "Mine",
      overdueBadge: "Overdue",
      progressLabel: "Progress",
      dueLabel: "Due",
      noDeadline: "No deadline",
      unassigned: "Unassigned",
      itemCount: "{n} items",
      columns: {
        intake: "New request",
        approval: "Approval",
        confirmed: "Confirmed",
        paid: "Paid — ready",
        warehouse: "Warehouse check",
        design: "Design",
        printing: "Printing",
        production: "Production",
        finishing: "Finishing",
        delivery: "Ready for delivery",
        completed: "Completed",
        cancelled: "Cancelled",
      },
    },
    orderLifecycle: {
      guideTitle: "Order journey",
      guideSubtitle: "From intake to delivery — each role owns a step.",
      gmHint: "General Manager can move any stage forward or back from the board or this page.",
      roleSales: "Sales / admin — create, price, release",
      roleAccountant: "Accountant — confirm payment",
      roleWarehouse: "Warehouse — verify & reserve materials",
      roleDesigner: "Designer — artwork",
      rolePrint: "Print operator",
      roleCnc: "CNC / production",
      roleFinish: "Finishing / Flex-UV",
      roleDelivery: "Delivery / warehouse hand-off",
      roleDone: "Customer or staff confirms receipt",
      stockCheck: {
        title: "Warehouse stock check",
        subtitle: "Confirm materials are available before production starts.",
        waitingHint: "Review BOM materials, then approve to reserve stock — or reject with a reason.",
        waitForWarehouse: "Waiting for warehouse to approve stock…",
        notesLabel: "Notes",
        notesPlaceholder: "Optional note (required when rejecting)…",
        approve: "Approve stock",
        reject: "Reject",
        approvedLabel: "Stock approved — production can start",
        rejectedLabel: "Stock rejected",
        approvedToast: "Stock approved",
        rejectedToast: "Stock check rejected",
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
    orderCollab: {
      tabOverview: "Overview",
      tabChat: "Project chat",
      tabNotes: "Shift notes",
      chatTitle: "Project chat",
      chatSubtitle: "Group for everyone assigned to this project. Messages stay here for the whole team.",
      chatPlaceholder: "Message the project group…",
      chatEmpty: "No messages yet",
      chatEmptyHint: "Say hello — assignees are added to this group automatically.",
      chatLoadError: "Couldn’t load the project chat.",
      send: "Send",
      notesTitle: "Shift notes",
      notesSubtitle: "Handoff for the next person: what you did, what changed, where to continue. Separate from chat.",
      notesComposeLabel: "New note",
      notesPlaceholder: "e.g. Finished print setup — next shift: start finishing. Material X swapped to stock Y…",
      addNote: "Add note",
      notesEmpty: "No shift notes yet",
      notesEmptyHint: "Leave a short handoff so the next assignee knows where things stand.",
      notesReadOnly: "Only assignees, CEO, and accountant can add notes on this project.",
      noteSaved: "Note saved",
      noteDeleted: "Note deleted",
      confirmDeleteNote: "Delete this note?",
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
      title: "Create sales order",
      description: "Customer, line items, discounts and attachments in one form.",
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
      lineItemsSub: "Product, price, quantity, discount and tax.",
      addLine: "Add",
      noItems: "No items yet.",
      noItemsHintBefore: "Click ",
      noItemsHintLink: "Add",
      noItemsHintAfter: " to begin.",
      summaryTitle: "Order summary",
      summarySub: "Live total",
      subtotal: "Subtotal",
      tax: "Tax",
      grandTotal: "Total",
      instantQuote: "Instant quote",
      attachTitle: "Attach files",
      attachSub: "Designs, references, source files",
      uploadCta: "Click to upload",
      uploadHint: "Any file type (images, PDF, PSD, AI, ZIP, DOCX, …) — up to 50 MB each",
      uploadsDone: "Files uploaded",
      product: "Product",
      selectProduct: "Select item…",
      quantity: "Qty",
      unit: "Unit",
      unitPrice: "Unit price",
      livePricing: "Live pricing breakdown",
      addProduct: "New product",
      reviewTitle: "Review order",
      reviewSub: "Confirm details before submitting",
      itemCount: "{count} item(s)",
      itemFallback: "Item {n}",
      preview: "Preview",
      saveDraft: "Save as draft",
      saveSubmit: "Save",
      template: "Document template",
      defaultTemplate: "Default template",
      newCustomer: "New",
      orderNumber: "Sales order no.",
      orderNumberHint: "Auto on save",
      orderDate: "Order date",
      salesperson: "Salesperson",
      selectSalesperson: "Select salesperson…",
      colItem: "Item",
      colDescription: "Description",
      colDiscount: "Discount %",
      colTax: "Tax %",
      colLineTotal: "Total",
      tabSettlement: "Discount & settlement",
      tabWarehouse: "Warehouse",
      tabAttachments: "Attach documents",
      orderDiscount: "Order discount",
      orderDiscountPct: "Order discount %",
      settlement: "Settlement adjustment",
      warehouse: "Warehouse",
      selectWarehouse: "Select warehouse…",
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
      list: {
        newInvoice: "New invoice",
        reports: "Reports",
        settings: "Settings",
        searchTitle: "Search",
        filterCustomer: "Customer",
        anyCustomer: "Any customer",
        filterCode: "Search invoices",
        searchCustomerPh: "Name, code, phone…",
        searchInvoicePh: "Invoice #, customer name or code…",
        searchInvoiceHint: "Matches invoice number, customer name, code, phone, or email",
        filterStatus: "Status",
        anyStatus: "Any status",
        searchBtn: "Search",
        clearFilters: "Clear filters",
        tabResults: "Results",
        tabAll: "All",
        tabLate: "Late",
        tabDue: "Due",
        tabUnpaid: "Unpaid",
        tabDraft: "Draft",
        tabOverpaid: "Overpaid",
        sortNewest: "Sort: newest",
        sortOldest: "Sort: oldest",
        sortAmountDesc: "Sort: amount high → low",
        sortAmountAsc: "Sort: amount low → high",
        sortDue: "Sort: due date",
        soldBy: "Sold by",
        activityCreated: "Created",
        activityPayment: "Payment added",
        linkedOrder: "Order",
        balance: "Balance",
        actions: "Actions",
        open: "Open",
        recordPayment: "Record payment",
        statuses: {
          unpaid: "Unpaid",
          partial: "Partial",
          paid: "Paid",
          draft: "Draft",
          late: "Late",
          overpaid: "Overpaid",
        },
      },
      createForm: {
        title: "Create invoice",
        description: "Customer, lines, discount, deposit and payment in one form.",
        preview: "Preview",
        saveDraft: "Save as draft",
        saveSubmit: "Save without printing",
        template: "Invoice template",
        defaultTemplate: "Default template",
        customer: "Customer",
        selectCustomer: "Select customer…",
        newCustomer: "New",
        invoiceNumber: "Invoice no.",
        invoiceNumberHint: "Auto on save",
        invoiceDate: "Invoice date",
        issueDate: "Issue date",
        dueDate: "Due date",
        salesperson: "Salesperson",
        selectSalesperson: "Select salesperson…",
        paymentTerms: "Payment terms (days)",
        lineItems: "Line items",
        lineItemsSub: "Item, price, quantity, discount and tax.",
        addLine: "Add",
        colItem: "Item",
        colDescription: "Description",
        colUnitPrice: "Unit price",
        colQty: "Qty",
        colDiscount: "Discount %",
        colTax: "Tax",
        colLineTotal: "Total",
        selectItem: "Select item…",
        customItem: "Custom item name",
        noTax: "No tax",
        itemFallback: "Item",
        subtotal: "Subtotal",
        tax: "Tax",
        grandTotal: "Total",
        tabSettlement: "Discount & settlement",
        tabDeposit: "Deposit",
        tabWarehouse: "Warehouse",
        tabAttachments: "Attach documents",
        orderDiscount: "Discount",
        orderDiscountPct: "Discount %",
        discountTypePct: "Percentage (%)",
        discountTypeFixed: "Fixed amount",
        settlement: "Settlement",
        settlementHint: "Manual adjustment added to the invoice total.",
        settlementNotePh: "Note",
        deposit: "Deposit",
        advancePayment: "Advance payment",
        advancePaymentHint: "Amount expected as advance on this invoice.",
        depositAmount: "Amount",
        payMethodCash: "Cash",
        payMethodCard: "Card",
        payMethodTransfer: "Transfer",
        payMethodDeposit: "Deposit",
        warehouse: "Warehouse",
        selectWarehouse: "Select warehouse…",
        attachmentsHint: "Attach files from the invoice detail page after saving.",
        notesTerms: "Notes / terms",
        alreadyPaid: "Already paid",
        alreadyPaidQ: "Already paid?",
        alreadyPaidHint: "Marks the invoice as fully paid when saving.",
      },
      detail: {
        invoiceTitle: "Invoice",
        print: "Print",
        edit: "Edit",
        pdf: "PDF",
        addPayment: "Add payment",
        creditNote: "Credit note",
        undoCreditNote: "Undo / delete",
        confirmDeleteCreditNote: "Cancel credit note {code}? Linked invoice balances will be restored.",
        creditNoteDeleted: "Credit note cancelled",
        return: "Return",
        copy: "Copy",
        addInstallment: "Add installment plan",
        more: "More",
        allPayments: "All payments",
        tabInvoice: "Invoice",
        tabDetails: "Details",
        tabStock: "Stock vouchers",
        tabActivity: "Activity log",
        docTitle: "Invoice",
        docNumber: "Invoice number",
        docDate: "Invoice date",
        docBillTo: "Bill to",
        docItem: "Item",
        docDescription: "Description",
        docUnitPrice: "Unit price",
        docQty: "Qty",
        docLineTotal: "Total",
        amountDue: "Amount due",
        customer: "Customer",
        soldBy: "Sold by",
        warehouse: "Warehouse",
        order: "Order",
        noWarehouse: "No warehouse selected",
        stockHint: "Warehouse movements linked to this invoice appear here when inventory vouchers are posted.",
        linkedInstallments: "Linked installment plans",
        activityCreated: "Invoice created",
        activityPayment: "Payment added",
        noActivityExtra: "No payments recorded yet.",
        amount: "Amount",
        method: "Method",
        installmentCount: "Number of installments",
        firstDue: "First due date",
        saved: "Invoice updated",
        paymentRecorded: "Payment recorded",
        installmentCreated: "Installment plan created",
        copied: "Copied as {code}",
        creditReason: "Credit against invoice",
        creditCreated: "Credit note {code} created",
        returnCreated: "Return created",
        issueDate: "Issue date",
        totalAmount: "Total amount",
        createdBy: "Created by",
        lastAction: "Last action",
        actionCreated: "Created",
        salesperson: "Salesperson",
        salesRecord: "Sales record",
        shippingData: "Shipping data",
        productsList: "Products list",
        qtyRequired: "Required qty",
        qtyReceived: "Received qty",
        underDelivery: "Under delivery",
        noStockVoucher: "No warehouse voucher yet",
        createStockVoucher: "Create stock issue",
        stockIssued: "Stock issue voucher created",
        stockIssueBy: "Warehouse issue · {warehouse} · by {user}",
        undoStockVoucher: "Undo / delete",
        confirmUndoStock: "Cancel this warehouse voucher? You can create it again later if needed.",
        stockIssueUndone: "Warehouse voucher cancelled",
        filterActions: "Actions",
        allActions: "All actions",
        periodFrom: "From",
        periodTo: "To",
        activityStock: "Stock issue",
        activityUpdate: "Update",
      },
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
      description: "Team directory — departments, job titles, and roles. Synced staff appear here after Daftra import.",
      searchPh: "Search name, email, phone, title…",
      staffOnly: "Staff only",
      filterEmployees: "Employees",
      filterPortal: "Portal customers",
      filterAll: "All accounts",
      editBtn: "Edit",
      deleteBtn: "Delete",
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
      colUser: "Employee",
      colRoles: "Roles",
      colDept: "Department",
      colTitle: "Job title",
      colStatus: "Status",
      colLastLogin: "Last login",
      active: "Active",
      inactive: "Inactive",
      emptyTitle: "No employees found",
      emptyDesc: "Import staff from Settings → Daftra Sync, or add an employee manually.",
      allDepartments: "All departments",
      resultCount: "{n} employees",
    },
    settings: {
      title: "Settings",
      description: "Personal information and preferences.",
      profileTitle: "Profile",
      profileSub: "Visible to your team",
      avatarTitle: "Profile photo",
      avatarSub: "Shown in chat, sidebar, and team lists for every role.",
      avatarHint: "PNG, JPG or WEBP · max 3 MB. Any role can set their own photo.",
      avatarUpload: "Upload photo",
      avatarChange: "Change photo",
      avatarRemove: "Remove photo",
      avatarUpdated: "Profile photo updated",
      avatarRemoved: "Profile photo removed",
      avatarTypeError: "Use a PNG, JPG, or WEBP image.",
      avatarSizeError: "Photo must be 3 MB or smaller.",
      profileViewTitle: "Profile",
      profileLoadError: "Couldn’t load this profile.",
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
      pushTitle: "Desktop notifications",
      pushSub: "Chrome / Edge on Windows — also works on Android Chrome when installed.",
      pushHint:
        "Get an OS alert for new chat messages and order updates even when this tab is in the background.",
      pushEnable: "Enable notifications",
      pushDisable: "Turn off",
      pushEnabled: "Desktop notifications enabled",
      pushDisabled: "Desktop notifications turned off",
      pushUnsupported: "This browser does not support push notifications.",
      pushDenied: "Permission blocked — allow notifications in browser settings for this site.",
      pushUnavailable: "Push is not configured on the server yet.",
      pushFailed: "Could not update notification settings",
      pushStatusOn: "On — you’ll get Windows alerts for chats and assignments.",
      pushStatusOff: "Off — enable to receive alerts when you’re away from this tab.",
      pushPromptTitle: "Turn on desktop alerts?",
      pushPromptBody: "Get pinged for new messages and project updates on Windows (Chrome / Edge).",
      pushLater: "Later",
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
      daftraTitle: "Daftra sync",
      daftraSub: "Import clients, invoices, subscriptions, products, payments, expenses, refund receipts (credit notes), job designations, staff, payslips and work orders (project board) from Daftra. Data is stored locally — the app keeps working if Daftra is offline. Customers get portal access (phone + default password).",
      daftraTest: "Test connection",
      daftraSync: "Sync now",
      daftraEnabled: "Enabled",
      daftraDisabled: "Disabled on server",
      daftraConfigured: "API key configured",
      daftraNotConfigured: "API key missing",
      daftraBaseUrl: "API base URL",
      daftraMapped: "Imported records",
      daftraLastSync: "Last sync",
      daftraNever: "Never",
      daftraTestOk: "Connection OK",
      daftraTestFail: "Connection failed",
      daftraSyncOk: "Sync finished",
      daftraSyncFail: "Sync finished with errors",
      daftraSyncStarted: "Sync started in the background — this can take several minutes for large accounts.",
      daftraSyncRunning: "Syncing…",
      daftraCreated: "created",
      daftraUpdated: "updated",
      daftraSkipped: "skipped",
      daftraErrors: "errors",
      daftraPages: "pages",
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
    regionLabel: "البصرة",
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
    emailOrPhone: "البريد أو رقم الموبايل",
    emailOrPhoneHint: "الموظفين: الإيميل · الزبائن: رقم الموبايل · كلمة المرور الافتراضية yousef123",
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
      profile: "الملف الشخصي",
    },
    home: {
      greeting: "هلا، {name}",
      subtitle: "ابدأ بطلب جديد، أو افتح طلباتك وفواتيرك من الأسفل. الأزرار الكبيرة = الإجراءات الرئيسية.",
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
    tour: {
      ariaLabel: "جولة تعريفية بالنظام",
      replay: "كيف يشتغل النظام",
      skip: "تخطي الجولة",
      next: "التالي",
      back: "رجوع",
      finish: "تمام",
      progress: "خطوة {n} من {total}",
      steps: {
        welcome: {
          title: "أهلاً — هذا نظام الموظفين",
          body: "افترض إنك ما تعرف شي بعد: هالجولة تشرح كل پنل تقدر تفتحه، ليش موجود، وكيف الطلب يمشي من المبيعات للتسليم. اضغط الدائرة المضيئة أو «التالي». تقدر تعيد الجولة بأي وقت من أيقونة ؟ الصفراء.",
        },
        sidebar: {
          title: "القائمة الجانبية",
          body: "كل شيء موجود بهالقائمة. الوحدات مجمّعة حسب القسم (مبيعات، CRM، مخزون، عمليات…). اضغط رأس المجموعة لفتحها ثم اختر الصفحة. دورك يعرض فقط الوحدات المسموح لك فيها.",
        },
        navDashboard: {
          title: "لوحة التحكم / صفحة العمل",
          body: "شاشتك الأولى. الإدارة تشوف مؤشرات وتنبيهات الشركة. باقي الأدوار تشوف اختصارات لصفحاتهم اليومية (طلب جديد، اللوحة، فواتير، مواد…). راجعها كل صباح لتعرف وش يحتاج انتباه.",
        },
        navSales: {
          title: "وحدة المبيعات",
          body: "قلب العمل التجاري: إدارة أوامر البيع، إنشاء طلبات، عروض أسعار، فواتير، مدفوعات العملاء، إشعارات دائن، مرتجعات، وفواتير متكررة. أغلب شغل الإنتاج يبدأ من هنا.",
        },
        manageOrders: {
          title: "إدارة أوامر البيع",
          body: "قائمة كل الطلبات: الحالة، الزبون، المبالغ، ومرحلة المسار. افتح الطلب لتعديل الأصناف، تعيين فريق الإنتاج، الدردشة، الموافقة/الرفض، ومتابعة المسار (استلام → دفع → مخزن → إنتاج → تسليم).",
        },
        createOrder: {
          title: "إنشاء أمر بيع",
          body: "١) اختر أو أنشئ زبون. ٢) أضف المنتجات/الخدمات والكميات. ٣) عيّن مسؤول كل مرحلة إنتاج (أو N/A). ٤) احفظ. طلبات البوابة تنتظر موافقة الزبون. المخزون يُفحص عند الإنشاء ويُحجز لاحقاً بموافقة المخزن.",
        },
        navQuotations: {
          title: "عروض الأسعار",
          body: "أرسل عرض سعر رسمي قبل ما يلتزم الزبون. عند القبول حوّله لطلب بيع/فاتورة. استخدمه لما الصفقة لسه مو نهائية — يحفظ التسعير بشكل مرتب وقابل للتتبع.",
        },
        navInvoices: {
          title: "الفواتير",
          body: "مستندات الفوترة الرسمية. ابحث برمز الفاتورة أو اسم الزبون أو الرمز أو الهاتف أو الإيميل. افتح الفاتورة للأسطر وPDF وحالة الدفع والطلب المرتبط. بعد إطلاق الطلب، المالية تؤكد الاستلام من هنا.",
        },
        createInvoice: {
          title: "إنشاء فاتورة",
          body: "ابنِ فاتورة مستقلة (أو من طلب/عرض). اختر الزبون، أضف الأسطر والضريبة/الملاحظات، ثم احفظ أو أرسل. خلك دقيق بالمبالغ — تأكيد الدفع والتقارير تعتمد عليها.",
        },
        accountantPay: {
          title: "خطوتك الأساسية: تعليم مدفوع",
          body: "افتح الطلب أو الفاتورة، أرفق إثبات دفع أو ملاحظة واضحة، ثم علّم «مدفوع». بدون تأكيد الدفع يبقى الشغل موقوفاً قبل المخزن والإنتاج. هذي بوابة المالية في مسار الطلب.",
        },
        navPaymentsSales: {
          title: "مدفوعات العملاء",
          body: "سجلّ الأموال المستلمة — نقد، تحويل، بطاقة… استخدمه لمطابقة المدفوع مع الفواتير المفتوحة وخطط الأقساط. سجّل كل دفعة هنا عشان التقارير تطلع صحيحة.",
        },
        navPos: {
          title: "نقاط البيع (POS)",
          body: "بيع سريع من الكاونتر: افتح جلسة، أضف أصناف، خذ الدفع، واطبع إيصال. الجلسات تتابع درج النقد. استخدم POS للبيع الفوري، وأوامر البيع للشغل المخصص/الإنتاج.",
        },
        navInstallments: {
          title: "إدارة الأقساط",
          body: "لما الزبون يدفع على أقساط، أنشئ الجدول هنا: تواريخ الاستحقاق، المدفوع مقابل المتبقي، وتنبيهات التأخير. اربط الخطط بالفواتير عشان التحصيل يكون مرتب.",
        },
        navCrm: {
          title: "CRM — الزبائن والخدمة",
          body: "إدارة علاقات العملاء: الأشخاص والشركات، العملاء المحتملون، تذاكر الدعم، والرسائل الداخلية. بيانات CRM الجيدة تسرّع إنشاء الطلبات وتوضح الدعم.",
        },
        navCustomers: {
          title: "العملاء",
          body: "سجلّ العملاء الأساسي: الاسم، الرمز، الهاتف، الإيميل، المدينة، الوسوم، والتاريخ. ابحث دائماً بالاسم/الرمز/الهاتف عند إنشاء طلب أو فاتورة حتى ما تكرّر العميل. افتح الملف لتشوف الطلبات والفواتير المرتبطة.",
        },
        navLeads: {
          title: "العملاء المحتملون",
          body: "أشخاص أو شركات مهتمة بس لسه مو عملاء. تابع المتابعة هنا، ثم حوّل الـ Lead لعميل لما الصفقة تصير جدية.",
        },
        navTickets: {
          title: "تذاكر الدعم",
          body: "مشاكل الزبون أو الداخلية (تأخير، جودة، استفسار). عيّن مسؤول، رد، وأغلق لما تنحل. استخدم التذاكر عشان المشاكل ما تضيع بالشات أو المكالمات.",
        },
        navMessages: {
          title: "الرسائل",
          body: "مراسلة الفريق داخل النظام. للتنسيق القصير مناسبة؛ ولقرارات الطلب استخدم دردشة الطلب عشان التاريخ يبقى على نفس الشغل.",
        },
        navHrm: {
          title: "الموارد البشرية",
          body: "الموظفون، العقود، الحضور، ملخص الرواتب، وحسابات دخول الموظفين. المدراء يستخدمونه لمعرفة مين يشتغل وين ومين يقدر يدخل النظام.",
        },
        navHr: {
          title: "صفحة الموارد البشرية",
          body: "دليل الموظفين: الأقسام، المسميات، العقود، الحضور، والرواتب. افتح موظف للتفاصيل. المسميات غالباً ترتبط بأدوار النظام (مصمم، محاسب، مخزن…).",
        },
        navUsers: {
          title: "المستخدمون والصلاحيات",
          body: "مين يقدر يدخل تطبيق الموظفين وبأي صلاحيات. أنشئ أو عطّل بحذر — صلاحية غلط تكشف المالية أو تسمح بتجاوز الإنتاج. غالباً الإيميل + كلمة مرور البوابة الافتراضية إلى أن يغيّرها.",
        },
        navWarehouse: {
          title: "المخزون والمشتريات",
          body: "كل شيء عن المخزون: المواد، كتالوج المنتجات، المشتريات، والموردين. بعد ما الطلب يصير «مدفوع»، المخزن لازم يوافق على المخزون قبل التصميم/الإنتاج.",
        },
        navMaterials: {
          title: "المواد (المخزون)",
          body: "المواد الخام والمستلزمات مع الكميات المتاحة. حدّث المستويات — النظام يفحص المخزون عند إنشاء الطلب ومرة ثانية بموافقة المخزن. نقص المخزون هنا يوقف الشغل.",
        },
        warehouseCheck: {
          title: "خطوتك الأساسية: فحص المخزون",
          body: "على الطلب المدفوع، افتح لوحة الفحص: وافق لحجز المواد، أو ارفض مع سبب. الإنتاج ما يبدأ بدون موافقة المخزن (المدير قد يتجاوز). هذي تحمي الورشة من بدء شغل بدون مواد.",
        },
        navPurchases: {
          title: "المشتريات",
          body: "اشترِ من الموردين: أنشئ مستند شراء، استلم البضاعة، وزد كميات المواد. استخدم المشتريات لما المخزون ينقص قبل ما تعد الزبون بموعد تسليم.",
        },
        navVendors: {
          title: "الموردون",
          body: "دليل الموردين — منين تشتري المواد. احتفظ بجهات الاتصال والشروط هنا عشان المشتريات تكون متسقة ومرتبطة بمستندات الشراء.",
        },
        navProducts: {
          title: "كتالوج المنتجات",
          body: "المنتجات/الخدمات القابلة للبيع (طباعة، باقات…). تظهر عند بناء الطلبات والفواتير. إدارة الكتالوج تحتاج صلاحية الكتالوج.",
        },
        navBoard: {
          title: "العمليات — لوحة المشاريع",
          body: "كانبان الإنتاج الحي. كل شغل مطلق يظهر كبطاقة تتحرك بين المراحل. هنا يشتغل المصممون والمشغّلون يومياً بعد ما بوابات المبيعات والمخزن تنفتح.",
        },
        boardFlow: {
          title: "كيف تشتغل اللوحة",
          body: "المراحل: استلام → موافقة → تأكيد → دفع → مخزن → تصميم → طباعة → CNC → تشطيب → تسليم → إنجاز. المكلّف يسحب البطاقة أو يستخدم تقدم/رجوع. قدّم المرحلة فقط لما تخلص فعلاً. المدراء يقدرون يتخطّون أو يرجعون عند الحاجة.",
        },
        navAccounting: {
          title: "وحدة المحاسبة",
          body: "المال الداخل والخارج أبعد من قائمة فواتير المبيعات: المدفوعات، المصروفات، وإشعارات الدائن. استخدمها لضبط الدفاتر لنهاية اليوم/الشهر.",
        },
        navExpenses: {
          title: "المصروفات",
          body: "سجّل تكاليف الشركة (إيجار، مستلزمات، شحن…). صنّفها بوضوح عشان تقارير المبيعات والربح تطلع مفهومة.",
        },
        navReports: {
          title: "التقارير",
          body: "ملخصات المبيعات والأداء — وش انباع، وش تحصل، والاتجاهات. الإدارة والمحاسبة يعتمدون عليها؛ لا تعتمد على الذاكرة والأرقام موجودة هنا.",
        },
        navAudit: {
          title: "سجلّ التدقيق",
          body: "أثر أمني/تاريخي لأهم الإجراءات (مين غيّر وش). استخدمه عند التحقيق بأخطاء أو خلافات أو تغييرات حالة غير متوقعة.",
        },
        navTemplates: {
          title: "قوالب المستندات",
          body: "تخطيطات PDF (فواتير، عروض…). حدّث رأس الشركة والشروط والهوية هنا عشان المستندات المطبوعة/المشاركة تطلع متناسقة.",
        },
        navSettings: {
          title: "الإعدادات",
          body: "تفضيلاتك وتفضيلات الشركة: اللغة، المظهر، وخيارات المبيعات/المستندات المسموح لك تغييرها. إذا شي طالع غلط عام، راجع الإعدادات (وإعدادات المبيعات) قبل ما تفترض فيه خلل.",
        },
        topbarHelp: {
          title: "أعد الجولة متى ما احتجت",
          body: "أيقونة ؟ الصفراء فوق بالشريط تعيد هالجولة. مفيدة للموظفين الجدد أو لما تنسى وين پنل معيّن. الجولة تبرز فقط الوحدات اللي حسابك يقدر يفتحها.",
        },
        flowSummary: {
          title: "مسار الطلب الكامل (احفظه)",
          body: "١) المبيعات تنشئ الطلب وتعيّن الفريق. ٢) موافقة الزبون/الإدارة عند الحاجة. ٣) المحاسب يعلّم مدفوع (مع إثبات). ٤) المخزن يوافق على المخزون. ٥) تصميم → طباعة → CNC → تشطيب على لوحة المشاريع. ٦) التسليم يؤكد الاستلام. كل حركة مسجّلة بدردشة الطلب — اقرأها قبل ما تسأل «وين هالشغل؟»",
        },
        done: {
          title: "جاهز تستكشف",
          body: "الحين تعرف وظيفة كل پنل. ابدأ بوحدتك اليومية، اتبع مسار الطلب فوق، واضغط ؟ متى ما احتجت الدليل. إذا محتار، افتح دردشة الطلب ومرحلة اللوحة — النظام يبيّن المالك التالي.",
        },
        sales_welcome: {
          title: "المبيعات — ابدأ من هنا",
          body: "أنت مسؤول الاستلام: الزبائن، العروض، الطلبات، التسعير، تعيين الفريق، والإطلاق. الجولة كمان توضح CRM وكيف المالية والمخزن والإنتاج يكملون بعدك.",
        },
        accountant_welcome: {
          title: "المالية — ابدأ من هنا",
          body: "أنت مسؤول الفواتير والمدفوعات والمصروفات وبوابة «مدفوع». بدون تأكيدك (مع إثبات) المخزن والإنتاج يبقون موقفين. كمان نشوف پنلات المبيعات والتقارير المرتبطة.",
        },
        warehouse_welcome: {
          title: "المخزن — ابدأ من هنا",
          body: "أنت مسؤول المواد والمشتريات والموردين وبوابة فحص المخزون بعد الدفع. وافق فقط لما المواد متوفرة فعلاً — بعدها الإنتاج يقدر يبدأ بأمان.",
        },
        production_welcome: {
          title: "الإنتاج — ابدأ من هنا",
          body: "أنت مسؤول مرحلتك على لوحة المشاريع. نشرح اللوحة وكيف تقدّم الشغل، والأدوات القريبة (طلبات، مواد، رسائل) عشان تشوف الصورة الكاملة حول محطتك.",
        },
        executive_welcome: {
          title: "الإدارة — جولة النظام كاملة",
          body: "تمر على كل الوحدات الرئيسية ومسار الطلب الكامل. تقدر تتجاوز المراحل عند الحاجة — استخدمها بحذر واترك ملاحظة بالدردشة.",
        },
      },
    },
    nav: {
      modDashboard: "لوحة التحكم",
      modSales: "المبيعات",
      modPos: "نقاط البيع",
      modInstallments: "إدارة الأقساط",
      modCrm: "إدارة علاقات العملاء",
      modHrm: "الموارد البشرية",
      modInventory: "المخزون والمشتريات",
      modOperations: "العمليات",
      modAccounting: "المحاسبة",
      modReports: "التقارير",
      modTemplates: "القوالب",
      modSettings: "الإعدادات",
      overview: "نظرة عامة",
      crm: "إدارة العلاقات",
      operations: "العمليات",
      catalog: "الكتالوج والمخزون",
      service: "الخدمة",
      insights: "الإدارة",
      dashboard: "لوحة التحكم",
      humanResources: "الموارد البشرية",
      payrollReport: "تقرير الرواتب",
      auditLog: "سجلّ التدقيق",
      customers: "العملاء",
      companies: "الشركات",
      leads: "العملاء المحتملون",
      opportunities: "الفرص",
      orders: "الطلبات",
      newOrder: "طلب جديد",
      manageOrders: "إدارة أوامر البيع",
      createOrder: "إنشاء أمر بيع",
      orderBoard: "لوحة الطلبات",
      quotations: "عروض الأسعار",
      manageQuotations: "إدارة عروض الأسعار",
      invoices: "الفواتير",
      manageInvoices: "إدارة الفواتير",
      createInvoice: "إنشاء فاتورة",
      creditNotes: "إشعارات دائنة",
      salesReturns: "الفواتير المرتجعة",
      recurringInvoices: "الفواتير الدورية",
      customerPayments: "مدفوعات العملاء",
      salesSettings: "إعدادات المبيعات",
      payments: "المدفوعات",
      expenses: "المصروفات",
      products: "المنتجات",
      materials: "المواد",
      movements: "حركات المخزون",
      purchases: "المشتريات",
      vendors: "الموردون",
      tickets: "التذاكر",
      messages: "الرسائل",
      design: "ستوديو التصميم",
      files: "مكتبة الوسائط",
      analytics: "التحليلات",
      users: "المستخدمون والأدوار",
      myEmployees: "موظفيني",
      settings: "الإعدادات",
      posTerminal: "نقطة البيع",
      posSessions: "جلسات نقاط البيع",
      installmentPlans: "خطط الأقساط",
      salesReports: "تقارير المبيعات",
      docTemplates: "قوالب المستندات",
    },
    hr: {
      title: "الموارد البشرية",
      description: "العقود والرواتب والحضور ودليل القوة العاملة والطلبات المعلقة للموظفين.",
      contractsTitle: "ملخص العقود",
      contractsSub: "توزيع حالات عقود الموظفين",
      contractsTotal: "المجموع {n} عقد",
      viewDetails: "عرض التفاصيل",
      showAll: "عرض الجميع",
      newEmployee: "موظف جديد",
      pendingTitle: "الطلبات المعلقة",
      pendingSub: "طلبات الإجازة والموارد البشرية بانتظار الإجراء",
      pendingEmpty: "لا يوجد طلبات حتى الآن",
      pendingBadge: "معلّق",
      payrollTitle: "ملخص الرواتب",
      totalGross: "إجمالي الأجر المدفوع",
      totalDeductions: "إجمالي الخصومات",
      totalNet: "إجمالي صافي الأجر",
      payslips: "قسائم الرواتب",
      last7Days: "آخر ٧ أيام",
      last30Days: "آخر ٣٠ يوم",
      last90Days: "آخر ٩٠ يوم",
      lastNDays: "آخر {n} يوم",
      expiringTitle: "العقود التي ستنتهي صلاحيتها",
      expiringSub: "عقود تنتهي خلال ٤٥ يوماً القادمة",
      expiringEmpty: "لا توجد عقود قاربت على الانتهاء.",
      attendanceTitle: "ملخص الحضور",
      payrollReportTitle: "تقرير الرواتب",
      payrollReportSub: "تقرير كامل للرواتب المدفوعة في المؤسسة",
      payrollReportExport: "تصدير CSV",
      payrollReportFrom: "من",
      payrollReportTo: "إلى",
      payrollReportDept: "القسم",
      payrollReportAllDepts: "كل الأقسام",
      payrollReportHeadcount: "عدد الموظفين",
      payrollReportBonus: "إجمالي المكافآت",
      payrollReportEmpty: "لا توجد قسائم في هذه الفترة.",
      workforceTitle: "دليل القوة العاملة",
      workforceSub: "الموظفون المستوردون للنظام — حسب القسم والمسمى الوظيفي",
      employeesTotal: "إجمالي الموظفين",
      employeesActive: "نشط",
      employeesInactive: "غير نشط",
      syncedDaftra: "مزامن من دفترة",
      withDepartment: "لديهم قسم",
      withTitle: "لديهم مسمى",
      withContract: "لديهم عقد",
      byDepartment: "حسب القسم",
      byTitle: "حسب المسمى",
      viewEmployees: "فتح الموظفين",
      contractStatuses: {
        active: "نشط",
        expired: "منتهي",
        under_review: "تحت المراجعة",
        replacement: "استبدال",
        cancelled: "ملغي",
        suspended: "موقوف",
        draft: "مسودة",
      },
      attendanceStatuses: {
        present: "حضور",
        absent: "غياب",
        late: "تأخير",
        on_leave: "إجازة",
      },
      requestTypes: {
        leave: "إجازة",
        permission: "استئذان",
        overtime: "عمل إضافي",
        document: "مستند",
        other: "أخرى",
      },
      employee: {
        notFound: "الموظف غير موجود",
        notFoundHint: "ملف هذا الموظف غير متاح أو ليس حساب موظّف.",
        backToHr: "العودة للموارد البشرية",
        editInUsers: "إدارة من المستخدمين",
        editEmployee: "تعديل الموظف",
        deleteEmployee: "حذف",
        newEmployee: "موظف جديد",
        defaultSubtitle: "ملف الموظف",
        inactive: "غير نشط",
        contractCode: "العقد",
        statPresent: "حضور",
        statPayslips: "قسائم",
        statRequests: "طلبات",
        statContracts: "عقود",
        statProjects: "مشاريع",
        tabDetails: "التفاصيل",
        tabProjects: "المشاريع",
        tabAttendance: "الحضور",
        tabPayroll: "المرتبات",
        tabRequests: "الطلبات",
        tabActivity: "سجل النشاطات",
        projectsTitle: "المشاريع المعيّنة",
        projectsSub: "الطلبات التي يملكها أو يعمل عليها هذا الموظف على لوحة المشاريع",
        projectsEmpty: "لا توجد تعيينات مشاريع بعد.",
        projectOnBoard: "على اللوحة",
        projectOffBoard: "خارج اللوحة",
        projectRoleAssignee: "مكلّف",
        projectRoleOwner: "مالك",
        openOrder: "فتح الطلب",
        openBoard: "لوحة المشاريع",
        stageLabel: "المرحلة",
        contractInfo: "معلومات العقد",
        profileInfo: "ملف الموظف",
        contactInfo: "التواصل والهواتف",
        fieldAddress: "العنوان",
        fieldAddress2: "العنوان 2",
        fieldCity: "المدينة",
        fieldState: "المحافظة / الولاية",
        fieldPostal: "الرمز البريدي",
        fieldCountry: "الدولة",
        fieldNationality: "الجنسية",
        fieldCitizenship: "حالة المواطنة",
        fieldOfficialId: "الرقم الرسمي",
        fieldGender: "الجنس",
        fieldHireDate: "تاريخ التعيين",
        fieldBirthDate: "تاريخ الميلاد",
        fieldResidenceExpiry: "انتهاء الإقامة",
        fieldHourlyRate: "الأجر بالساعة",
        fieldCodeStaff: "رمز الموظف",
        fieldStaffType: "نوع الموظف",
        fieldSystemAccess: "صلاحية النظام",
        fieldHomePhone: "هاتف المنزل",
        fieldBusinessPhone: "هاتف العمل",
        fieldMobile: "الموبايل",
        fieldFax: "الفاكس",
        fieldEmail: "البريد الإلكتروني",
        fieldLastLogin: "آخر تسجيل دخول",
        fieldCreated: "تاريخ الإنشاء",
        fieldNotes: "ملاحظات",
        fieldDaftraId: "معرّف دفترة",
        timeline: "التواريخ والمدة",
        salaryData: "بيانات المرتب",
        allContracts: "كل العقود",
        fieldEmployee: "موظف",
        fieldJobTitle: "المسمى الوظيفي",
        fieldJobLevel: "المستوى الوظيفي",
        fieldCode: "الكود",
        fieldPrimary: "العقد الأساسي",
        fieldDescription: "الوصف",
        fieldStart: "تاريخ البدء",
        fieldJoin: "تاريخ الالتحاق",
        fieldSigned: "تاريخ توقيع العقد",
        fieldEnd: "تاريخ الانتهاء",
        fieldProbation: "نهاية مدة الاختبار",
        fieldDuration: "المدة",
        fieldCurrency: "العملة",
        fieldSalary: "الراتب الأساسي",
        fieldTemplate: "قالب الراتب",
        fieldNetPeriod: "صافي الفترة",
        yes: "نعم",
        no: "لا",
        attendanceSummary: "ملخص الحضور",
        attendanceLog: "سجل الحضور",
        attendanceLogSub: "آخر تسجيلات الدخول والغياب",
        attendanceEmpty: "لا توجد سجلات حضور بعد.",
        attendanceCalendar: "تقويم الحضور",
        markWeekdaysPresent: "تأشير أيام العمل حضور",
        dailyRate: "الأجر اليومي (الراتب ÷ 30)",
        saveAttendance: "حفظ اليوم",
        checkIn: "وقت الدخول",
        checkOut: "وقت الخروج",
        deductionOverride: "مبلغ خصم مخصص",
        clearDay: "مسح",
        attendanceSaved: "تم الحفظ",
        attendanceSaveFailed: "تعذّر الحفظ",
        payrollThisMonth: "راتب هذا الشهر",
        payrollThisMonthSub: "من الحضور والمكافآت والخصومات",
        absentDays: "أيام الغياب",
        absenceDeduction: "خصم الغياب",
        rowBonus: "مكافأة",
        extraDeduction: "خصومات إضافية",
        adjustments: "التعديلات",
        addAdjustment: "إضافة",
        adjAmount: "المبلغ",
        adjReason: "السبب",
        kindBonus: "مكافأة",
        kindDeduction: "خصم",
        kindOvertime: "أوفر تايم",
        generateDraft: "إنشاء مسودة قسيمة",
        confirmPaid: "تأكيد ودفع",
        draftStatus: "مسودة",
        noAdjustments: "لا توجد تعديلات لهذا الشهر.",
        actions: "إجراءات",
        addPayslip: "إضافة قسيمة",
        editPayslip: "تعديل القسيمة",
        runPayroll: "تشغيل الرواتب",
        unpayPayslip: "إرجاع لمسودة",
        deletePayslip: "حذف",
        markPaid: "تعيين كمدفوع",
        confirmDeletePayslip: "حذف هذه القسيمة؟",
        runFromAttendance: "حساب من الحضور",
        payrollMonth: "شهر الراتب",
        totalGross: "إجمالي الأجر المدفوع",
        totalDeductions: "إجمالي الخصومات",
        totalNet: "إجمالي صافي الراتب",
        avgGross: "متوسط الراتب الإجمالي",
        avgNet: "متوسط الراتب الصافي",
        payrollOverview: "نظرة عامة على العقود",
        payrollOverviewSub: "إجماليات واتجاهات الراتب لهذا الموظف",
        payrollChart: "اتجاه صافي الراتب",
        payrollMatrix: "التفصيل الشهري",
        rowSalary: "الراتب",
        rowOvertime: "أوفر تايم",
        rowAbsence: "غياب",
        rowTotal: "الإجمالي",
        colTotal: "الإجمالي",
        payslips: "قسائم الرواتب",
        payslipList: "قسائم الرواتب",
        payslipEmpty: "لا توجد قسائم بعد.",
        voucherId: "الرقم التعريفي",
        voucherPeriod: "الفترة الزمنية",
        voucherAmount: "إجمالي المبلغ",
        voucherStatus: "الحالة",
        paid: "مدفوع",
        unpaid: "غير مدفوع",
        requestsTitle: "طلبات الموظف",
        requestsEmpty: "لا توجد طلبات بعد.",
        activityTitle: "سجل النشاطات",
        activitySub: "الطلبات والقسائم والحضور وإجراءات النظام",
        activityEmpty: "لا يوجد نشاط بعد.",
        salaryTemplates: { monthly: "شهري", weekly: "أسبوعي", daily: "يومي" },
        requestStatuses: {
          pending: "معلّق",
          approved: "مقبول",
          rejected: "مرفوض",
          cancelled: "ملغي",
        },
        activityKinds: {
          request: "طلب",
          payslip: "قسيمة",
          attendance: "حضور",
          audit: "نظام",
        },
      },
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
      view: "عرض",
      open: "فتح",
      archive: "أرشفة",
      tip: "نصيحة",
      dismissTip: "إخفاء النصيحة",
      clickRowToOpen: "اضغط على صف لفتح التفاصيل",
      startHere: "ابدأ من هنا",
    },
    workHome: {
      title: "مساحة عملك",
      description: "اختر مهمة من البطاقات أدناه. كل بطاقة تفتح مكان عمل واحد واضح — بدون خيارات مخفية.",
      openShortcut: "افتح ←",
      hints: {
        orderBoard: "شوف كل الشغل على اللوحة وحرّكه خطوة بخطوة",
        newOrder: "أنشئ طلب جديد بخطوات بسيطة",
        customers: "لاقي العملاء أو أضف عميل جديد",
        invoices: "راجع الفواتير وحالة الدفع",
        quotations: "راجع عروض الأسعار للعملاء",
        materials: "شوف المخزون والمواد المتوفرة",
        tickets: "جاوب تذاكر الدعم من العملاء",
        orders: "تصفح قائمة كل الطلبات",
      },
    },
    dashboard: {
      title: "نظرة عامة على اللوحة",
      greeting: "أهلاً بعودتك، {name}",
      defaultUser: "مرحباً",
      description: "الأرقام اللي تحتاج انتباه أولاً — بعدها الرسوم والنشاط.",
      quickAccessTitle: "الوصول السريع",
      quickAccessDescription: "ابحث في السجلات أو انتقل مباشرة إلى المهمة المطلوبة.",
      customerSearchLabel: "البحث عن الزبائن",
      orderSearchLabel: "البحث عن الطلبات",
      searchCustomers: "ابحث باسم الزبون أو الإيميل أو الموبايل…",
      searchOrders: "ابحث برمز الطلب أو عنوانه…",
      schedulesTitle: "أحدث المواعيد",
      schedulesSub: "مواعيد تسليم الطلبات والمتابعات القادمة",
      schedulesEmpty: "لا توجد مواعيد قادمة.",
      scheduleOrder: "أمر الشغل",
      scheduleFollowUp: "متابعة",
      scheduleBy: "بواسطة {name}",
      scheduleNoOwner: "غير معيّن",
      lowStockPanelTitle: "المواد منخفضة المخزون",
      lowStockPanelSub: "عند أو تحت مستوى إعادة الطلب",
      stockCritical: "نفد المخزون",
      stockLow: "مخزون منخفض",
      stockOk: "في المخزون",
      stockAvailable: "{count} {unit} متوفّر",
      currentActivityTitle: "الأنشطة الحالية",
      currentActivitySub: "آخر الإجراءات داخل النظام",
      todayFilter: "اليوم",
      showAll: "عرض الجميع",
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
        activeOrders: "نشطة",
        delayedOrders: "متأخرة",
        onlineNow: "متّصلون",
        pendingApprovals: "اعتمادات",
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
      description: "الأشخاص والشركات اللي تخدمهم. ابحث فوق، وبعدها استخدم «زبون جديد» أو «أرشفة» على الصف.",
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
      updated: "تم تحديث الزبون",
      portalAccess: "إنشاء دخول للبوابة",
      portalAccessHint: "الزبون يقدر يدخل البوابة (/portal) بنفس الإيميل وكلمة المرور. تسجيل الزبون لنفسه يبقى شغّال مثل قبل.",
      portalPassword: "كلمة مرور البوابة",
      portalPasswordConfirm: "تأكيد كلمة مرور البوابة",
      portalPasswordMismatch: "كلمتا المرور غير متطابقتين",
      portalSaved: "تم إنشاء الزبون — يقدر يسجّل دخول للبوابة بالإيميل وكلمة المرور اللي حطيتها.",
      portalBadge: "بوابة",
      colPortal: "البوابة",
      editTitle: "تعديل الزبون",
      editBtn: "تعديل",
      resetPortalPassword: "كلمة مرور جديدة للبوابة (اختياري)",
      resetPortalPasswordHint: "اتركها فارغة إذا ما تريد تغيير كلمة المرور.",
      enablePortal: "تفعيل دخول البوابة الآن",
      enablePortalHint: "ينشئ حساب بوابة بالإيميل وكلمة المرور أدناه.",
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
      description: "لاقي الطلب بالبحث أو الفلتر. افتح اللوحة لمسار الإنتاج البصري، أو «طلب جديد» للبدء.",
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
      sourceDaftra: "دفترة",
      lastUpdated: "آخر تحديث",
      zoomIn: "تكبير",
      zoomOut: "تصغير",
      resetZoom: "إعادة التكبير",
      fitView: "ملاءمة الشاشة",
      zoomPct: "{n}٪",
      panHint: "مرّر للتكبير · Shift+مرّر للتحريك · مسافة+سحب · نقرتين للشاشة الكاملة",
      enterFullscreen: "شاشة كاملة",
      exitFullscreen: "خروج من الشاشة الكاملة",
      mobileTapHint: "اختر المرحلة، اسحب يمين/يسار للتبديل، وبعدين استخدم الأزرار الكبيرة على البطاقة.",
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
      searchPh: "ابحث بالرمز أو العنوان أو المعيَّن…",
      filterMine: "شغلي",
      filterOverdue: "متأخر",
      hideEmpty: "إخفاء الفارغ",
      showDone: "إظهار المكتمل",
      selectStage: "المراحل",
      prevPage: "الصفحة السابقة",
      nextPage: "الصفحة التالية",
      pageOf: "صفحة {page} من {pages}",
      showingCount: "عرض {shown} من {total}",
      mineBadge: "إلي",
      overdueBadge: "متأخر",
      progressLabel: "التقدّم",
      dueLabel: "الموعد",
      noDeadline: "بدون موعد",
      unassigned: "غير معيَّن",
      itemCount: "{n} أصناف",
      columns: {
        intake: "طلب جديد",
        approval: "الموافقة",
        confirmed: "مؤكّد",
        paid: "مدفوع — جاهز",
        warehouse: "فحص المخزن",
        design: "التصميم",
        printing: "الطباعة",
        production: "الإنتاج",
        finishing: "التشطيب",
        delivery: "جاهز للتسليم",
        completed: "مكتمل",
        cancelled: "ملغى",
      },
    },
    orderLifecycle: {
      guideTitle: "مسار الطلب",
      guideSubtitle: "من الاستلام حتى التسليم — كل دور مسؤول عن خطوة.",
      gmHint: "المدير العام يقدر يحرّك أي مرحلة للأمام أو للخلف من اللوحة أو صفحة الطلب.",
      roleSales: "المبيعات / الإدارة — إنشاء، تسعير، إطلاق",
      roleAccountant: "المحاسب — تأكيد الدفع",
      roleWarehouse: "المخزن — التحقق وحجز المواد",
      roleDesigner: "المصمم — العمل الفني",
      rolePrint: "مشغّل الطباعة",
      roleCnc: "CNC / الإنتاج",
      roleFinish: "التشطيب / Flex-UV",
      roleDelivery: "التسليم / تسليم المخزن",
      roleDone: "الزبون أو الموظف يؤكد الاستلام",
      stockCheck: {
        title: "فحص مخزون المخزن",
        subtitle: "تأكيد توفر المواد قبل بدء الإنتاج.",
        waitingHint: "راجع مواد BOM ثم وافق لحجز المخزون — أو ارفض مع سبب.",
        waitForWarehouse: "بانتظار موافقة المخزن على المخزون…",
        notesLabel: "ملاحظات",
        notesPlaceholder: "ملاحظة اختيارية (مطلوبة عند الرفض)…",
        approve: "الموافقة على المخزون",
        reject: "رفض",
        approvedLabel: "تمت الموافقة على المخزون — يمكن بدء الإنتاج",
        rejectedLabel: "تم رفض المخزون",
        approvedToast: "تمت الموافقة على المخزون",
        rejectedToast: "تم رفض فحص المخزون",
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
    orderCollab: {
      tabOverview: "نظرة عامة",
      tabChat: "دردشة المشروع",
      tabNotes: "ملاحظات الوردية",
      chatTitle: "دردشة المشروع",
      chatSubtitle: "مجموعة لكل من عليه مسؤولية بهذا المشروع. الرسائل تبقى هنا للفريق كامل.",
      chatPlaceholder: "اكتب رسالة لمجموعة المشروع…",
      chatEmpty: "ما في رسائل بعد",
      chatEmptyHint: "ابدأ المحادثة — المعيَّنون ينضافون للمجموعة تلقائياً.",
      chatLoadError: "ما قدرنا نحمّل دردشة المشروع.",
      send: "إرسال",
      notesTitle: "ملاحظات الوردية",
      notesSubtitle: "تسليم للشخص اللي بعده: شو سويت، شو تغيّر، ومن وين يكمل. منفصلة عن الدردشة.",
      notesComposeLabel: "ملاحظة جديدة",
      notesPlaceholder: "مثال: خلّصت تجهيز الطباعة — الوردية الجاية: ابدأ التشطيب. المادة X استُبدلت بـ Y…",
      addNote: "إضافة ملاحظة",
      notesEmpty: "ما في ملاحظات وردية بعد",
      notesEmptyHint: "اترك تسليم قصير عشان المعيَّن الجاي يعرف وين وصل الشغل.",
      notesReadOnly: "بس المعيَّنين والمدير التنفيذي والمحاسب يقدروا يضيفوا ملاحظات على هالمشروع.",
      noteSaved: "تم حفظ الملاحظة",
      noteDeleted: "تم حذف الملاحظة",
      confirmDeleteNote: "تحذف هالملاحظة؟",
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
      title: "إنشاء أمر بيع",
      description: "العميل والبنود والخصم والمرفقات في نموذج واحد.",
      cancel: "إلغاء",
      submit: "تقديم الطلب",
      created: "تم إنشاء الطلب {code}",
      detailsTitle: "تفاصيل الطلب",
      detailsSub: "الزبون، الموعد، والبيانات",
      customerLabel: "العميل",
      selectCustomer: "اختر العميل…",
      placingAs: "بصفة: {name}",
      orderTitleLabel: "عنوان الطلب",
      orderTitlePh: "مثلاً: حملة الربع الثالث",
      deadline: "الموعد النهائي",
      priority: "الأولوية",
      priorities: { low: "منخفضة", normal: "عادية", high: "عالية", urgent: "عاجلة" },
      notes: "ملاحظات",
      lineItemsTitle: "بنود الطلب",
      lineItemsSub: "البند والسعر والكمية والخصم والضريبة.",
      addLine: "إضافة",
      noItems: "ما في بنود بعد.",
      noItemsHintBefore: "اضغط ",
      noItemsHintLink: "إضافة",
      noItemsHintAfter: " للبدء.",
      summaryTitle: "ملخّص الطلب",
      summarySub: "المجموع المباشر",
      subtotal: "المجموع الفرعي",
      tax: "الضريبة",
      grandTotal: "المجموع",
      instantQuote: "تسعيرة فورية",
      attachTitle: "إرفاق ملفات",
      attachSub: "تصاميم، مراجع، ملفات مصدرية",
      uploadCta: "اضغط للرفع",
      uploadHint: "أي نوع ملف (صور، PDF، PSD، AI، ZIP، DOCX، …) — حتى ٥٠ ميغا لكل ملف",
      uploadsDone: "تم رفع الملفات",
      product: "المنتج",
      selectProduct: "اختر البند…",
      quantity: "الكمية",
      unit: "الوحدة",
      unitPrice: "سعر الوحدة",
      livePricing: "تفصيل التسعير المباشر",
      addProduct: "منتج جديد",
      reviewTitle: "مراجعة الطلب",
      reviewSub: "تأكد من التفاصيل قبل الإرسال",
      itemCount: "{count} بند",
      itemFallback: "بند {n}",
      preview: "معاينة",
      saveDraft: "حفظ كمسودة",
      saveSubmit: "حفظ",
      template: "قالب المستند",
      defaultTemplate: "القالب الافتراضي",
      newCustomer: "جديد",
      orderNumber: "رقم أمر البيع",
      orderNumberHint: "تلقائي عند الحفظ",
      orderDate: "تاريخ أمر البيع",
      salesperson: "مسؤول المبيعات",
      selectSalesperson: "اختر المسؤول…",
      colItem: "البند",
      colDescription: "الوصف",
      colDiscount: "الخصم %",
      colTax: "الضريبة %",
      colLineTotal: "المجموع",
      tabSettlement: "الخصم والتسوية",
      tabWarehouse: "المستودع",
      tabAttachments: "إرفاق المستندات",
      orderDiscount: "خصم الطلب",
      orderDiscountPct: "خصم الطلب %",
      settlement: "تسوية",
      warehouse: "المستودع",
      selectWarehouse: "اختر المستودع…",
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
      list: {
        newInvoice: "فاتورة جديدة",
        reports: "التقارير",
        settings: "الإعدادات",
        searchTitle: "بحث",
        filterCustomer: "العميل",
        anyCustomer: "أي عميل",
        filterCode: "بحث الفواتير",
        searchCustomerPh: "الاسم، الرمز، الهاتف…",
        searchInvoicePh: "رقم الفاتورة، اسم أو رمز العميل…",
        searchInvoiceHint: "يبحث في رقم الفاتورة واسم العميل ورمزه وهاتفه وبريده",
        filterStatus: "الحالة",
        anyStatus: "أي حالة",
        searchBtn: "بحث",
        clearFilters: "إلغاء الفلتر",
        tabResults: "النتائج",
        tabAll: "الكل",
        tabLate: "متأخر",
        tabDue: "مستحقة الدفع",
        tabUnpaid: "غير مدفوعة",
        tabDraft: "مسودة",
        tabOverpaid: "مدفوع بالزيادة",
        sortNewest: "الترتيب: الأحدث",
        sortOldest: "الترتيب: الأقدم",
        sortAmountDesc: "الترتيب: المبلغ من الأعلى",
        sortAmountAsc: "الترتيب: المبلغ من الأقل",
        sortDue: "الترتيب: تاريخ الاستحقاق",
        soldBy: "بواسطة",
        activityCreated: "أنشئت",
        activityPayment: "أضيفت عملية دفع",
        linkedOrder: "الطلب",
        balance: "الرصيد",
        actions: "إجراءات",
        open: "فتح",
        recordPayment: "تسجيل دفعة",
        statuses: {
          unpaid: "غير مدفوعة",
          partial: "مدفوعة جزئياً",
          paid: "مدفوعة",
          draft: "مسودة",
          late: "متأخر",
          overpaid: "مدفوع بالزيادة",
        },
      },
      createForm: {
        title: "إضافة فاتورة",
        description: "الزبون والبنود والخصم والإيداع والدفع في نموذج واحد.",
        preview: "معاينة",
        saveDraft: "حفظ كمسودة",
        saveSubmit: "حفظ دون طباعة",
        template: "قالب الفاتورة",
        defaultTemplate: "القالب الافتراضي",
        customer: "العميل",
        selectCustomer: "اختر العميل…",
        newCustomer: "جديد",
        invoiceNumber: "رقم الفاتورة",
        invoiceNumberHint: "تلقائي عند الحفظ",
        invoiceDate: "تاريخ الفاتورة",
        issueDate: "تاريخ الإصدار",
        dueDate: "تاريخ الاستحقاق",
        salesperson: "مسؤول المبيعات",
        selectSalesperson: "اختر مسؤول المبيعات…",
        paymentTerms: "شروط الدفع (أيام)",
        lineItems: "البنود",
        lineItemsSub: "البند والسعر والكمية والخصم والضريبة.",
        addLine: "إضافة",
        colItem: "البند",
        colDescription: "الوصف",
        colUnitPrice: "سعر الوحدة",
        colQty: "الكمية",
        colDiscount: "الخصم %",
        colTax: "الضريبة",
        colLineTotal: "المجموع",
        selectItem: "اختر البند…",
        customItem: "اسم بند مخصص",
        noTax: "بدون ضريبة",
        itemFallback: "بند",
        subtotal: "الإجمالي",
        tax: "الضريبة",
        grandTotal: "الإجمالي",
        tabSettlement: "الخصم والتسوية",
        tabDeposit: "إيداع",
        tabWarehouse: "المستودع",
        tabAttachments: "إرفاق المستندات",
        orderDiscount: "الخصم",
        orderDiscountPct: "نسبة الخصم %",
        discountTypePct: "نسبة مئوية (%)",
        discountTypeFixed: "مبلغ ثابت",
        settlement: "التسوية",
        settlementHint: "تعديل يدوي يُضاف إلى إجمالي الفاتورة.",
        settlementNotePh: "ملاحظة",
        deposit: "إيداع",
        advancePayment: "الدفعة المقدمة",
        advancePaymentHint: "المبلغ المتوقع كدفعة مقدمة لهذه الفاتورة.",
        depositAmount: "المبلغ",
        payMethodCash: "نقداً",
        payMethodCard: "بطاقة",
        payMethodTransfer: "تحويل",
        payMethodDeposit: "إيداع",
        warehouse: "المستودع",
        selectWarehouse: "اختر المستودع…",
        attachmentsHint: "أرفق الملفات من صفحة تفاصيل الفاتورة بعد الحفظ.",
        notesTerms: "الملاحظات / الشروط",
        alreadyPaid: "مدفوع بالفعل",
        alreadyPaidQ: "مدفوع بالفعل؟",
        alreadyPaidHint: "عند الحفظ تُسجَّل الفاتورة كمدفوعة بالكامل.",
      },
      detail: {
        invoiceTitle: "فاتورة",
        print: "طباعة",
        edit: "تعديل",
        pdf: "PDF",
        addPayment: "إضافة عملية دفع",
        creditNote: "قسيمة دائن",
        undoCreditNote: "تراجع / حذف",
        confirmDeleteCreditNote: "إلغاء إشعار الدائن {code}؟ رصيد الفاتورة المرتبطة يُرجَع.",
        creditNoteDeleted: "تم إلغاء إشعار الدائن",
        return: "مرتجع",
        copy: "نسخ",
        addInstallment: "أضف اتفاقية تقسيط",
        more: "المزيد",
        allPayments: "كل المدفوعات",
        tabInvoice: "فاتورة",
        tabDetails: "التفاصيل",
        tabStock: "الأذون المخزنية",
        tabActivity: "سجل النشاطات",
        docTitle: "فاتورة",
        docNumber: "رقم الفاتورة",
        docDate: "تاريخ الفاتورة",
        docBillTo: "فاتورة إلى",
        docItem: "البند",
        docDescription: "الوصف",
        docUnitPrice: "سعر الوحدة",
        docQty: "الكمية",
        docLineTotal: "المجموع",
        amountDue: "المبلغ المستحق",
        customer: "العميل",
        soldBy: "بواسطة",
        warehouse: "المستودع",
        order: "الطلب",
        noWarehouse: "لم يُحدد مستودع",
        stockHint: "تظهر هنا حركات المخزون المرتبطة بهذه الفاتورة عند ترحيل أذون المخزن.",
        linkedInstallments: "اتفاقيات التقسيط المرتبطة",
        activityCreated: "تم إنشاء الفاتورة",
        activityPayment: "أضيفت عملية دفع",
        noActivityExtra: "لا توجد مدفوعات مسجّلة بعد.",
        amount: "المبلغ",
        method: "الطريقة",
        installmentCount: "عدد الأقساط",
        firstDue: "أول تاريخ استحقاق",
        saved: "تم تحديث الفاتورة",
        paymentRecorded: "تم تسجيل الدفعة",
        installmentCreated: "تم إنشاء اتفاقية التقسيط",
        copied: "تم النسخ كـ {code}",
        creditReason: "إشعار دائن على الفاتورة",
        creditCreated: "تم إنشاء إشعار دائن {code}",
        returnCreated: "تم إنشاء المرتجع",
        issueDate: "تاريخ الإصدار",
        totalAmount: "إجمالي المبلغ",
        createdBy: "أنشئ بواسطة",
        lastAction: "أحدث إجراء",
        actionCreated: "أنشئت",
        salesperson: "مسؤول المبيعات",
        salesRecord: "قيد المبيعات",
        shippingData: "بيانات الشحن",
        productsList: "قائمة المنتجات",
        qtyRequired: "الكمية المطلوبة",
        qtyReceived: "الكمية المستلمة",
        underDelivery: "تحت التسليم",
        noStockVoucher: "لا يوجد إذن مخزني بعد",
        createStockVoucher: "إنشاء إذن صرف مخزن",
        stockIssued: "تم إنشاء إذن الصرف المخزني",
        stockIssueBy: "إذن صرف مخزن {warehouse} بواسطة: {user}",
        undoStockVoucher: "تراجع / حذف",
        confirmUndoStock: "إلغاء إذن المخزن هذا؟ تقدر تنشئه مرة ثانية لاحقاً إذا احتجت.",
        stockIssueUndone: "تم إلغاء إذن المخزن",
        filterActions: "الإجراءات",
        allActions: "كل الإجراءات",
        periodFrom: "الفترة من",
        periodTo: "إلى",
        activityStock: "إذن مخزني",
        activityUpdate: "تحديث",
      },
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
      description: "دليل الفريق — الأقسام والمسميات والأدوار. الموظفون المستوردون من دفترة يظهرون هنا بعد المزامنة.",
      searchPh: "بحث بالاسم أو البريد أو الموبايل أو المسمى…",
      staffOnly: "الموظفون فقط",
      filterEmployees: "الموظفون",
      filterPortal: "زبائن البوابة",
      filterAll: "كل الحسابات",
      editBtn: "تعديل",
      deleteBtn: "حذف",
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
      colUser: "الموظف",
      colRoles: "الأدوار",
      colDept: "القسم",
      colTitle: "المسمى",
      colStatus: "الحالة",
      colLastLogin: "آخر دخول",
      active: "نشط",
      inactive: "غير نشط",
      emptyTitle: "ما في موظفين",
      emptyDesc: "استورد الموظفين من الإعدادات ← مزامنة دفترة، أو أضف موظفاً يدوياً.",
      allDepartments: "كل الأقسام",
      resultCount: "{n} موظف",
    },
    settings: {
      title: "الإعدادات",
      description: "البيانات الشخصية والتفضيلات.",
      profileTitle: "الملف الشخصي",
      profileSub: "مرئي لفريقك",
      avatarTitle: "صورة الملف الشخصي",
      avatarSub: "تظهر في الدردشة والقائمة الجانبية وقوائم الفريق لكل الأدوار.",
      avatarHint: "PNG أو JPG أو WEBP · بحد أقصى 3 ميجابايت. أي دور يقدر يضيف صورته.",
      avatarUpload: "رفع صورة",
      avatarChange: "تغيير الصورة",
      avatarRemove: "حذف الصورة",
      avatarUpdated: "تم تحديث صورة الملف الشخصي",
      avatarRemoved: "تم حذف صورة الملف الشخصي",
      avatarTypeError: "استخدم صورة PNG أو JPG أو WEBP.",
      avatarSizeError: "الصورة لازم تكون 3 ميجابايت أو أقل.",
      profileViewTitle: "الملف الشخصي",
      profileLoadError: "ما قدرنا نحمّل هالملف.",
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
      pushTitle: "إشعارات سطح المكتب",
      pushSub: "كروم / إيدج على ويندوز — وكمان أندرويد كروم لما يكون التطبيق مفعّل.",
      pushHint:
        "وصلك تنبيه من النظام لرسائل الشات وتحديثات الطلبات حتى لو التبويب بالخلفية.",
      pushEnable: "تفعيل الإشعارات",
      pushDisable: "إيقاف",
      pushEnabled: "تم تفعيل إشعارات سطح المكتب",
      pushDisabled: "تم إيقاف إشعارات سطح المكتب",
      pushUnsupported: "هذا المتصفح ما يدعم إشعارات الدفع.",
      pushDenied: "الإذن مرفوض — فعّل الإشعارات من إعدادات المتصفح لهذا الموقع.",
      pushUnavailable: "إشعارات الدفع لسا مو مفعّلة على السيرفر.",
      pushFailed: "ما قدرنا نحدّث إعدادات الإشعارات",
      pushStatusOn: "مفعّل — راح توصلك تنبيهات ويندوز للشات والتعيينات.",
      pushStatusOff: "مطفأ — فعّله عشان توصلك تنبيهات وأنت بعيد عن التبويب.",
      pushPromptTitle: "تفعّل تنبيهات سطح المكتب؟",
      pushPromptBody: "وصلك تنبيه لرسائل جديدة وتحديثات المشاريع على ويندوز (كروم / إيدج).",
      pushLater: "لاحقاً",
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
      daftraTitle: "مزامنة دفترة",
      daftraSub: "استيراد العملاء والفواتير والاشتراكات والمنتجات والمدفوعات والمصروفات وإيصالات الاسترداد (إشعارات دائن) والمسميات الوظيفية والموظفين وقسائم الرواتب وأوامر العمل (لوحة المشاريع) من دفترة. البيانات تُحفظ محلياً — النظام يشتغل حتى لو دفترة توقف. الزبائن يحصلون على بوابة (موبايل + كلمة مرور افتراضية).",
      daftraTest: "اختبار الاتصال",
      daftraSync: "مزامنة الآن",
      daftraEnabled: "مفعّل",
      daftraDisabled: "معطّل على السيرفر",
      daftraConfigured: "مفتاح API مضبوط",
      daftraNotConfigured: "مفتاح API غير موجود",
      daftraBaseUrl: "عنوان الـ API",
      daftraMapped: "سجلات مستوردة",
      daftraLastSync: "آخر مزامنة",
      daftraNever: "أبداً",
      daftraTestOk: "الاتصال ناجح",
      daftraTestFail: "فشل الاتصال",
      daftraSyncOk: "انتهت المزامنة",
      daftraSyncFail: "انتهت المزامنة مع أخطاء",
      daftraSyncStarted: "بدأت المزامنة في الخلفية — للحسابات الكبيرة قد تستغرق عدة دقائق.",
      daftraSyncRunning: "جارٍ المزامنة…",
      daftraCreated: "جديد",
      daftraUpdated: "محدّث",
      daftraSkipped: "متجاوز",
      daftraErrors: "أخطاء",
      daftraPages: "صفحات",
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
