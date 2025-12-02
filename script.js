document.addEventListener("DOMContentLoaded", () => {
  /* === VIEW SWITCHING === */
  const dashboardView = document.getElementById("dashboardView");
  const readingView = document.getElementById("readingView");
  const openReadingBtn = document.getElementById("openReadingBtn");
  const backToDashboardBtn = document.getElementById("backToDashboardBtn");

  const navLinks = document.querySelectorAll(".nav-link");
  const dashTabs = document.querySelectorAll(".dash-tab");

  const homeProfile = document.getElementById("homeProfile");
  const readingProfile = document.getElementById("readingProfile");

  

  function showDashboardView() {
    readingView.classList.remove("active");
    dashboardView.classList.add("active");
  }

  function showReadingView() {
    dashboardView.classList.remove("active");
    readingView.classList.add("active");
  }

  if (openReadingBtn) {
    openReadingBtn.addEventListener("click", showReadingView);
  }
  if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener("click", showDashboardView);
  }

  // top-nav tabs on the dashboard
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

  /* === ZOOM CONTROLS === */
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomLevelLabel = document.getElementById("zoomLevelLabel");

  let zoomLevel = 100; // percent

  function applyZoom() {
    const scale = zoomLevel / 100;
    document.documentElement.style.setProperty("--reading-scale", scale);
    if (zoomLevelLabel) {
      zoomLevelLabel.textContent = `${zoomLevel}%`;
    }
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
      if (zoomLevel < 140) {
        zoomLevel += 10;
        applyZoom();
      }
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      if (zoomLevel > 80) {
        zoomLevel -= 10;
        applyZoom();
      }
    });
  }

  applyZoom(); // set initial

  /* === ANNOTATIONS: selection + modal === */
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

  // Detect text selection inside the reading content
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
    modalSnippet.textContent = currentSelectionText;
    modalTextarea.value = "";
    annotationModal.classList.add("active");
    modalTextarea.focus();
  }

  function closeAnnotationModal() {
    if (!annotationModal) return;
    annotationModal.classList.remove("active");
  }

  if (addAnnotationBtn) {
    addAnnotationBtn.addEventListener("click", openAnnotationModal);
  }
  if (cancelAnnotationBtn) {
    cancelAnnotationBtn.addEventListener("click", closeAnnotationModal);
  }

  if (annotationModal) {
    annotationModal.addEventListener("click", (e) => {
      if (e.target === annotationModal) {
        closeAnnotationModal();
      }
    });
  }

  function formatNowShort() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function createAnnotation({ snippet, note, author, timeLabel, replies }) {
    const id = `a_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    annotations.push({
      id,
      snippet,
      note,
      author: author || "You",
      timeLabel: timeLabel || "Just now",
      replies: replies || 0,
    });
    renderAnnotations();

    // if it's your new note, also add a gentle notification
    if (!timeLabel || timeLabel === "Just now") {
      addNotification({
        title: "Note saved",
        body: "Your annotation was added to this chapter.",
        time: formatNowShort(),
      });
    }
  }

  function renderAnnotations() {
    // Drawer "Courses" section list
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

    // Drawer "My Annotations" section
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

          const meta = document.createElement("div");
          meta.className = "annotation-meta";
          const left = document.createElement("span");
          left.textContent = a.timeLabel;
          const right = document.createElement("span");
          right.textContent = "Chapter 15.1";
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

    // Dashboard "My Annotations" tab list
    if (dashMyAnnotationsList) {
      dashMyAnnotationsList.innerHTML = "";
      if (!annotations.length) {
        const empty = document.createElement("div");
        empty.className = "simple-empty";
        empty.textContent = "No saved annotations yet.";
        dashMyAnnotationsList.appendChild(empty);
      } else {
        annotations.forEach((a) => {
          const item = document.createElement("div");
          item.className = "simple-item";

          const title = document.createElement("div");
          title.className = "simple-title";
          title.textContent = "15.1 Introduction";

          const meta = document.createElement("div");
          meta.className = "simple-meta";
          meta.textContent = `${a.note.slice(0, 60)}${a.note.length > 60 ? "…" : ""}`;

          item.append(title, meta);
          dashMyAnnotationsList.appendChild(item);
        });
      }
    }

    // Update count badge in drawer
    if (annotationCountLabel) {
      annotationCountLabel.textContent = annotations.length.toString();
    }

    // Update profile mini-summary in drawer
    const profileNotesLine = document.querySelector(
      "#drawerProfile .profile-block div:nth-child(2)"
    );
    if (profileNotesLine) {
      profileNotesLine.innerHTML = `<strong>Notes this week:</strong> ${annotations.length}`;
    }
  }

  if (saveAnnotationBtn) {
    saveAnnotationBtn.addEventListener("click", () => {
      const noteText = modalTextarea.value.trim();
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

  /* === ANNOTATION DRAWER OPEN/CLOSE === */
  const readingShell = document.getElementById("readingShell");
  const toggleDrawerBtn = document.getElementById("toggleDrawerBtn");
  const closeDrawerBtn = document.getElementById("closeDrawerBtn");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const drawerLinks = document.querySelectorAll(".drawer-link");
  const drawerSections = document.querySelectorAll(".drawer-section");

  function openDrawer() {
    if (!readingShell) return;
    readingShell.classList.add("drawer-open");
  }
  function closeDrawer() {
    if (!readingShell) return;
    readingShell.classList.remove("drawer-open");
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

  /* === NOTIFICATIONS === */
  const notificationsBtn = document.getElementById("notificationsBtn");
  const notificationsPopover = document.getElementById("notificationsPopover");
  const notifCloseBtn = document.getElementById("notifCloseBtn");
  const notifList = document.getElementById("notifList");
  const notifBadge = document.getElementById("notifBadge");

  function renderNotifications() {
    // badge + profile dots
    const count = notifications.length;
    if (notifBadge) {
      notifBadge.textContent = count.toString();
      notifBadge.classList.toggle("show", count > 0);
    }
    if (homeProfile) {
      homeProfile.classList.toggle("has-notifications", count > 0);
    }
    if (readingProfile) {
      readingProfile.classList.toggle("has-notifications", count > 0);
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
        // clicking a notification opens the drawer on "My Annotations"
        openDrawer();
        drawerLinks.forEach((b) => {
          if (b.dataset.drawer === "drawerMyAnnotations") {
            b.click();
          }
        });
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

  // Close notifications when clicking outside
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

  /* === SEED EXAMPLE DATA === */

  // Example annotations (comments)
  createAnnotation({
    snippet: "usability testing",
    note: "I wonder if the kids would actually enjoy being 'tested' like this or if it needs to be framed as a game.",
    author: "Tiffany Patrick",
    timeLabel: "Yesterday · 8:14 PM",
    replies: 2,
  });

  createAnnotation({
    snippet: "Field Studies, which take place in natural settings",
    note: "This sounds most realistic for the hamster app, since families would actually be at home with the pet.",
    author: "Tiffany Patrick",
    timeLabel: "Today · 9:02 AM",
    replies: 1,
  });

  // Example notifications
  addNotification({
    title: "Jay replied to your note",
    body: "“Good point about making the evaluation feel like a game for kids.”",
    time: "1 hr ago",
  });

  addNotification({
    title: "Instructor highlighted your annotation",
    body: "Your comment on field studies was marked as a helpful example.",
    time: "Earlier today",
  });

  renderAnnotations();
  renderNotifications();
});





