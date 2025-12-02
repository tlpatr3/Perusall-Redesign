document.addEventListener("DOMContentLoaded", () => {
  /* ===== VIEW SWITCHING (dashboard vs reading) ===== */
  const dashboardView = document.getElementById("dashboardView");
  const readingView = document.getElementById("readingView");
  const openReadingBtn = document.getElementById("openReadingBtn");
  const backToDashboardBtn = document.getElementById("backToDashboardBtn");

  function showDashboardView() {
    if (dashboardView && readingView) {
      dashboardView.classList.add("active");
      readingView.classList.remove("active");
    }
  }

  function showReadingView() {
    if (dashboardView && readingView) {
      dashboardView.classList.remove("active");
      readingView.classList.add("active");
    }
  }

  if (openReadingBtn) openReadingBtn.addEventListener("click", showReadingView);
  if (backToDashboardBtn) backToDashboardBtn.addEventListener("click", showDashboardView);

  /* ===== DASHBOARD TABS (Overview / My Annotations / Activity) ===== */
  const navLinks = document.querySelectorAll(".nav-link");
  const dashTabs = document.querySelectorAll(".dash-tab");

  navLinks.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tab;

      navLinks.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      dashTabs.forEach((tab) => {
        tab.classList.toggle("active", tab.id === targetId);
      });
    });
  });

  /* ===== ZOOM CONTROLS ===== */
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomLevelLabel = document.getElementById("zoomLevelLabel");
  const root = document.documentElement;

  let zoomPercent = 100; // 80–140%

  function applyZoom() {
    const scale = zoomPercent / 100;
    root.style.setProperty("--reading-font-size", `${scale}rem`);
    if (zoomLevelLabel) {
      zoomLevelLabel.textContent = `${zoomPercent}%`;
    }
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
      if (zoomPercent < 140) {
        zoomPercent += 10;
        applyZoom();
      }
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      if (zoomPercent > 80) {
        zoomPercent -= 10;
        applyZoom();
      }
    });
  }

  applyZoom();

  /* ===== ANNOTATION CORE ===== */
  const readingContent = document.getElementById("readingContent");
  const addAnnotationBtn = document.getElementById("addAnnotationBtn");

  const annotationModal = document.getElementById("annotationModal");
  const modalSnippet = document.getElementById("modalSnippet");
  const modalTextarea = document.getElementById("modalTextarea");
  const cancelAnnotationBtn = document.getElementById("cancelAnnotationBtn");
  const saveAnnotationBtn = document.getElementById("saveAnnotationBtn");

  const annotationsList = document.getElementById("annotationsList");
  const drawerMyAnnotationsList = document.getElementById("drawerMyAnnotationsList");
  const dashMyAnnotationsList = document.getElementById("dashMyAnnotationsList");
  const annotationCountLabel = document.getElementById("annotationCount");

  let currentSelectionText = "";
  const annotations = [];
  const notifications = [];

  // Track selection within the reading pane
  if (readingContent) {
    readingContent.addEventListener("mouseup", () => {
      const selection = window.getSelection();
      const text = selection && selection.toString().trim();

      if (
        text &&
        selection.anchorNode &&
              readingContent.contains(selection.anchorNode)
      ) {
        currentSelectionText = text;
        if (addAnnotationBtn) addAnnotationBtn.disabled = false;
      } else {
        currentSelectionText = "";
        if (addAnnotationBtn) addAnnotationBtn.disabled = true;
      }
    });
  }

  function openAnnotationModal() {
    if (!currentSelectionText || !annotationModal) return;
    if (modalSnippet) modalSnippet.textContent = currentSelectionText;
    if (modalTextarea) modalTextarea.value = "";
    annotationModal.classList.add("active");
    if (modalTextarea) modalTextarea.focus();
  }

  function closeAnnotationModal() {
    if (!annotationModal) return;
    annotationModal.classList.remove("active");
  }

  if (addAnnotationBtn) addAnnotationBtn.addEventListener("click", openAnnotationModal);
  if (cancelAnnotationBtn) cancelAnnotationBtn.addEventListener("click", closeAnnotationModal);
  if (annotationModal) {
    annotationModal.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-backdrop")) {
        closeAnnotationModal();
      }
    });
  }

  function formatNowShort() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function highlightPhraseOnce(phrase, annotationId) {
    if (!readingContent || !phrase) return;
    const html = readingContent.innerHTML;
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped);
    if (!re.test(html)) return;

    const replaced = html.replace(
      re,
      `<span class="highlight" data-annotation-id="${annotationId}">$&</span>`
    );
    readingContent.innerHTML = replaced;
  }

  function createAnnotation({ snippet, note, author, timeLabel, replies, highlightPhrase }) {
    const id = `a_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const annotation = {
      id,
      snippet,
      note,
      author: author || "You",
      timeLabel: timeLabel || "Just now",
      replies: replies || 0,
    };
    annotations.push(annotation);

    // Only example/seed annotations pass highlightPhrase
    if (highlightPhrase) {
      highlightPhraseOnce(highlightPhrase, id);
    }

    renderAnnotations();

    if (!timeLabel || timeLabel === "Just now") {
      addNotification({
        title: "Note saved",
        body: "Your annotation was added to this chapter.",
        time: formatNowShort(),
      });
    }
  }

  function renderAnnotations() {
    // Drawer “Course” section
    if (annotationsList) {
      annotationsList.innerHTML = "";
      if (!annotations.length) {
        const empty = document.createElement("div");
        empty.className = "annotation-empty";
        empty.textContent = "No annotations yet.";
        annotationsList.appendChild(empty);
      } else {
        annotations.forEach((a) => {
          const card = document.createElement("article");
          card.className = "annotation-card";
          card.dataset.annotationId = a.id;

          const meta = document.createElement("div");
          meta.className = "annotation-meta";
          const left = document.createElement("span");
          left.textContent = `By ${a.author}`;
          const right = document.createElement("span");
          right.textContent = `${a.replies} repl${a.replies === 1 ? "y" : "ies"} · ${a.timeLabel}`;
          meta.append(left, right);

          const body = document.createElement("div");
          body.className = "annotation-body";
          body.textContent = a.note;

          const snippet = document.createElement("div");
          snippet.className = "annotation-snippet";
          snippet.textContent = `“${a.snippet}”`;

          card.append(meta, body, snippet);
          annotationsList.appendChild(card);
        });
      }
    }

    // Drawer “My annotations”
    if (drawerMyAnnotationsList) {
      drawerMyAnnotationsList.innerHTML = "";
      if (!annotations.length) {
        const empty = document.createElement("div");
        empty.className = "simple-empty";
        empty.textContent = "No saved annotations yet.";
        drawerMyAnnotationsList.appendChild(empty);
      } else {
        annotations.forEach((a) => {
          const card = document.createElement("article");
          card.className = "annotation-card";
          card.dataset.annotationId = a.id;

          const meta = document.createElement("div");
          meta.className = "annotation-meta";
          const left = document.createElement("span");
          left.textContent = a.timeLabel;
          const right = document.createElement("span");
          right.textContent = "Week 8";
          meta.append(left, right);

          const body = document.createElement("div");
          body.className = "annotation-body";
          body.textContent = a.note;

          const snippet = document.createElement("div");
          snippet.className = "annotation-snippet";
          snippet.textContent = `“${a.snippet}”`;

          card.append(meta, body, snippet);
          drawerMyAnnotationsList.appendChild(card);
        });
      }
    }

    // Dashboard “My annotations” tab
    if (dashMyAnnotationsList) {
      dashMyAnnotationsList.innerHTML = "";
      if (!annotations.length) {
        const empty = document.createElement("div");
        empty.className = "simple-empty";
        empty.textContent = "No saved annotations for this course yet.";
        dashMyAnnotationsList.appendChild(empty);
      } else {
        annotations.forEach((a) => {
          const item = document.createElement("div");
          item.className = "simple-item";

          const title = document.createElement("div");
          title.className = "simple-title";
          title.textContent = "Week 8 · Evaluating children’s interfaces";

          const meta = document.createElement("div");
          meta.className = "simple-meta";
          meta.textContent = `${a.note.slice(0, 60)}${a.note.length > 60 ? "…" : ""}`;

          item.append(title, meta);
          dashMyAnnotationsList.appendChild(item);
        });
      }
    }

    if (annotationCountLabel) {
      annotationCountLabel.textContent = String(annotations.length);
    }
  }

  if (saveAnnotationBtn) {
    saveAnnotationBtn.addEventListener("click", () => {
      const noteText = modalTextarea ? modalTextarea.value.trim() : "";
      if (!noteText || !currentSelectionText) {
        closeAnnotationModal();
        return;
      }
      createAnnotation({
        snippet: currentSelectionText,
        note: noteText,
      });
      currentSelectionText = "";
      if (addAnnotationBtn) addAnnotationBtn.disabled = true;
      closeAnnotationModal();
    });
  }

  // Clicking a highlighted span: behave like Perusall (open drawer + jump to annotation)
  if (readingContent) {
    readingContent.addEventListener("click", (e) => {
      const target = e.target.closest(".highlight[data-annotation-id]");
      if (!target) return;
      const annotationId = target.getAttribute("data-annotation-id");
      if (!annotationId) return;

      openDrawer();

      // Switch drawer to "My annotations" for clarity
      const drawerNavBtn = document.querySelector(
        '.drawer-link[data-drawer="drawerMyAnnotations"]'
      );
      if (drawerNavBtn) drawerNavBtn.click();

      const cards = document.querySelectorAll(".annotation-card");
      cards.forEach((c) => c.classList.remove("is-selected"));
      const targetCard = document.querySelector(
        `.annotation-card[data-annotation-id="${annotationId}"]`
      );
      if (targetCard) {
        targetCard.classList.add("is-selected");
        targetCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  /* ===== DRAWER OPEN/CLOSE ===== */
  const readingShell = document.getElementById("readingShell");
  const toggleDrawerBtn = document.getElementById("toggleDrawerBtn");
  const closeDrawerBtn = document.getElementById("closeDrawerBtn");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const drawerLinks = document.querySelectorAll(".drawer-link");
  const drawerSections = document.querySelectorAll(".drawer-section");

  function openDrawer() {
    if (readingShell) {
      readingShell.classList.add("drawer-open");
    }
  }

  function closeDrawer() {
    if (readingShell) {
      readingShell.classList.remove("drawer-open");
    }
  }

  if (toggleDrawerBtn) toggleDrawerBtn.addEventListener("click", openDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  drawerLinks.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.drawer;
      drawerLinks.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      drawerSections.forEach((sec) => {
        sec.classList.toggle("active", sec.id === targetId);
      });
    });
  });

  /* ===== NOTIFICATIONS ===== */
  const notificationsBtn = document.getElementById("notificationsBtn");
  const notificationsPopover = document.getElementById("notificationsPopover");
  const notifCloseBtn = document.getElementById("notifCloseBtn");
  const notifList = document.getElementById("notifList");
  const notifBadge = document.getElementById("notifBadge");

  function renderNotifications() {
    const count = notifications.length;
    if (notifBadge) {
      notifBadge.textContent = String(count);
      notifBadge.classList.toggle("show", count > 0);
    }

    if (!notifList) return;
    notifList.innerHTML = "";
    if (!notifications.length) {
      const empty = document.createElement("div");
      empty.className = "notif-empty";
      empty.textContent = "No notifications yet.";
      notifList.appendChild(empty);
      return;
    }

    notifications.forEach((n) => {
      const item = document.createElement("div");
      item.className = "notif-item";

      const title = document.createElement("strong");
      title.textContent = n.title;

      const body = document.createElement("div");
      body.textContent = n.body;

      const time = document.createElement("div");
      time.style.fontSize = "0.78rem";
      time.style.color = "#6b7280";
      time.textContent = n.time;

      item.append(title, body, time);

      item.addEventListener("click", () => {
        openDrawer();
        const drawerNavBtn = document.querySelector(
          '.drawer-link[data-drawer="drawerMyAnnotations"]'
        );
        if (drawerNavBtn) drawerNavBtn.click();
      });

      notifList.appendChild(item);
    });
  }

  function addNotification({ title, body, time }) {
    notifications.unshift({
      id: `n_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      title,
      body,
      time,
    });
    renderNotifications();
  }

  if (notificationsBtn && notificationsPopover) {
    notificationsBtn.addEventListener("click", () => {
      const isOpen = notificationsPopover.classList.contains("open");
      notificationsPopover.classList.toggle("open", !isOpen);
      if (!isOpen) {
        renderNotifications();
      }
    });
  }

  if (notifCloseBtn && notificationsPopover) {
    notifCloseBtn.addEventListener("click", () => {
      notificationsPopover.classList.remove("open");
    });
  }

  document.addEventListener("click", (e) => {
    if (
      notificationsPopover &&
      notificationsPopover.classList.contains("open") &&
      e.target !== notificationsBtn &&
      !notificationsPopover.contains(e.target)
    ) {
      notificationsPopover.classList.remove("open");
    }
  });

  /* ===== SEED EXAMPLE DATA (Perusall-style) ===== */
  createAnnotation({
    snippet:
      "observing how children respond",
    note:
      "I’m wondering whether kids would feel nervous in a lab setting and if that would change how they interact with the interface.",
    author: "Tiffany Patrick",
    timeLabel: "Yesterday · 8:14 PM",
    replies: 2,
    highlightPhrase: "Usability testing",
  });

  createAnnotation({
    snippet:
      "natural settings such as homes, schools, and after-school programs.",
    note:
      "This seems more realistic for our hamster app idea, since we care about how kids actually use it with their families.",
    author: "Tiffany Patrick",
    timeLabel: "Today · 9:02 AM",
    replies: 1,
    highlightPhrase: "Field studies",
  });

  addNotification({
    title: "Cleophas replied to your note",
    body: "“Good point about kids feeling nervous in the lab – maybe we can frame it as a game.”",
    time: "1 hr ago",
  });

  addNotification({
    title: "Instructor highlighted your annotation",
    body: "Your field study comment was marked as a helpful example for the class.",
    time: "Earlier today",
  });

  renderAnnotations();
  renderNotifications();
});








