// ================================
// DASHBOARD TABS (menus link now)
// ================================
const navLinks = document.querySelectorAll(".nav-link");
const dashTabs = document.querySelectorAll(".dash-tab");

navLinks.forEach(btn => {
  btn.addEventListener("click", () => {
    navLinks.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tabId = btn.dataset.tab;
    dashTabs.forEach(t => t.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
  });
});

// ================================
// VIEW SWITCHING (Dashboard ↔ Reading)
// ================================
const dashboardView = document.getElementById("dashboardView");
const readingView = document.getElementById("readingView");
const globalNav = document.getElementById("globalNav");
const openReadingBtn = document.getElementById("openReadingBtn");
const backToDashboardBtn = document.getElementById("backToDashboardBtn");

openReadingBtn.addEventListener("click", () => {
  dashboardView.classList.remove("active");
  readingView.classList.add("active");
  globalNav.style.display = "none";
  window.getSelection().removeAllRanges();
});

backToDashboardBtn.addEventListener("click", () => {
  readingView.classList.remove("active");
  dashboardView.classList.add("active");
  globalNav.style.display = "flex";
  closeDrawer();
  closeNotifications();
});

// ================================
// DRAWER TOGGLE (focus mode)
// ================================
const readingShell = document.getElementById("readingShell");
const toggleDrawerBtn = document.getElementById("toggleDrawerBtn");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");
const drawerBackdrop = document.getElementById("drawerBackdrop");

function openDrawer() { readingShell.classList.add("drawer-open"); }
function closeDrawer() { readingShell.classList.remove("drawer-open"); }

toggleDrawerBtn.addEventListener("click", () => {
  readingShell.classList.contains("drawer-open") ? closeDrawer() : openDrawer();
});
closeDrawerBtn.addEventListener("click", closeDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);

// Drawer nav sections
const drawerLinks = document.querySelectorAll(".drawer-link");
const drawerSections = document.querySelectorAll(".drawer-section");

drawerLinks.forEach(btn => {
  btn.addEventListener("click", () => {
    drawerLinks.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const sectionId = btn.dataset.drawer;
    drawerSections.forEach(s => s.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");
  });
});

// ================================
// ZOOM CONTROLS (works now)
// ================================
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomLevelLabel = document.getElementById("zoomLevelLabel");

let zoomLevel = 100;

function applyZoom() {
  const scale = zoomLevel / 100;
  document.documentElement.style.setProperty("--reading-scale", scale);
  zoomLevelLabel.textContent = zoomLevel + "%";
  zoomOutBtn.disabled = zoomLevel <= 80;
  zoomInBtn.disabled = zoomLevel >= 140;
}

zoomOutBtn.addEventListener("click", () => {
  if (zoomLevel > 80) { zoomLevel -= 10; applyZoom(); }
});
zoomInBtn.addEventListener("click", () => {
  if (zoomLevel < 140) { zoomLevel += 10; applyZoom(); }
});

// ================================
// ANNOTATION SYSTEM (highlight + save works)
// ================================
const readingContent = document.getElementById("readingContent");
const addAnnotationBtn = document.getElementById("addAnnotationBtn");

const modal = document.getElementById("annotationModal");
const modalSnippet = document.getElementById("modalSnippet");
const modalTextarea = document.getElementById("modalTextarea");
const cancelAnnotationBtn = document.getElementById("cancelAnnotationBtn");
const saveAnnotationBtn = document.getElementById("saveAnnotationBtn");

const annotationsList = document.getElementById("annotationsList");
const annotationCount = document.getElementById("annotationCount");

const dashMyAnnotationsList = document.getElementById("dashMyAnnotationsList");
const drawerMyAnnotationsList = document.getElementById("drawerMyAnnotationsList");

let currentRange = null;
let currentSelectionText = "";
const annotations = [];
const notifications = [];

// Track selection more reliably
function updateSelectionState() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return clearSelectionState();

  const range = sel.getRangeAt(0);
  let container = range.commonAncestorContainer;
  const selectedText = sel.toString().trim();

  if (container.nodeType === Node.TEXT_NODE) container = container.parentNode;

  if (!readingContent.contains(container) || selectedText.length === 0) {
    return clearSelectionState();
  }

  currentRange = range;
  currentSelectionText = selectedText;
  addAnnotationBtn.disabled = false;
}

function clearSelectionState() {
  currentRange = null;
  currentSelectionText = "";
  addAnnotationBtn.disabled = true;
}

// Update on mouseup/keyup inside reading for best reliability
readingContent.addEventListener("mouseup", updateSelectionState);
readingContent.addEventListener("keyup", updateSelectionState);
document.addEventListener("selectionchange", () => {
  if (readingView.classList.contains("active")) updateSelectionState();
});

// Modal helpers
function openModal() {
  modalSnippet.textContent = currentSelectionText;
  modalTextarea.value = "";
  modal.classList.add("active");
  modalTextarea.focus();
}
function closeModal() { modal.classList.remove("active"); }

// Open modal with ✎
addAnnotationBtn.addEventListener("click", () => {
  if (!currentRange || !currentSelectionText) return;
  openModal();
});
cancelAnnotationBtn.addEventListener("click", closeModal);

// Save annotation
saveAnnotationBtn.addEventListener("click", () => {
  const note = modalTextarea.value.trim();
  if (!note) return alert("Please enter a note for your annotation.");

  // Wrap selection in highlight span
  const span = document.createElement("span");
  span.className = "highlight";
  span.dataset.annotationId = String(annotations.length);

  try {
    currentRange.surroundContents(span);
  } catch (e) {
    console.warn("Surround failed; selection crossed elements.", e);
    // Still saves annotation even if highlight fails
  }

  const timestamp = new Date().toLocaleString([], {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });

  const annotation = {
    id: annotations.length,
    text: note,
    snippet: currentSelectionText,
    author: "You",
    time: timestamp,
    replies: []
  };

  annotations.push(annotation);
  renderAnnotations();
  renderMyAnnotationsPanels();
  clearSelectionState();
  closeModal();

  // Demo: simulate a classmate reply notification on first annotation
  if (annotations.length === 1) {
    simulateReplyNotification(annotation.id);
  }
});

// Render annotations in drawer
function renderAnnotations() {
  annotationsList.innerHTML = "";
  annotationCount.textContent = annotations.length;

  if (annotations.length === 0) {
    annotationsList.innerHTML = `<div class="annotation-empty">No annotations yet.</div>`;
    return;
  }

  annotations.forEach((ann) => {
    const card = document.createElement("div");
    card.className = "annotation-card";
    card.id = `ann-card-${ann.id}`;

    const meta = document.createElement("div");
    meta.className = "annotation-meta";
    meta.innerHTML = `<span>${ann.author}</span><span>${ann.time}</span>`;

    const body = document.createElement("div");
    body.className = "annotation-body";
    body.textContent = ann.text;

    const snippet = document.createElement("div");
    snippet.className = "annotation-snippet";
    snippet.textContent = ann.snippet;

    const actions = document.createElement("div");
    actions.className = "annotation-actions";

    const replyBtn = document.createElement("button");
    replyBtn.className = "link-btn";
    replyBtn.textContent = "Reply";
    actions.appendChild(replyBtn);

    const replyBlock = document.createElement("div");
    replyBlock.className = "reply-block";
    replyBlock.style.display = "none";

    const replyTextarea = document.createElement("textarea");
    replyTextarea.className = "reply-textarea";
    replyTextarea.placeholder = "Write a reply…";

    const replyActions = document.createElement("div");
    replyActions.style.display = "flex";
    replyActions.style.justifyContent = "flex-end";
    replyActions.style.gap = "0.4rem";

    const replyCancel = document.createElement("button");
    replyCancel.className = "btn-ghost";
    replyCancel.style.fontSize = "0.78rem";
    replyCancel.textContent = "Cancel";

    const replySave = document.createElement("button");
    replySave.className = "btn-primary";
    replySave.style.fontSize = "0.78rem";
    replySave.textContent = "Post";

    replyActions.append(replyCancel, replySave);
    replyBlock.append(replyTextarea, replyActions);

    const repliesList = document.createElement("div");
    repliesList.className = "reply-meta";

    function refreshReplies() {
      repliesList.textContent = ann.replies
        .map((r) => `${r.author} · ${r.text}`)
        .join("   ·   ");
    }

    replyBtn.addEventListener("click", () => {
      replyBlock.style.display =
        replyBlock.style.display === "none" ? "flex" : "none";
      if (replyBlock.style.display === "flex") replyTextarea.focus();
    });

    replyCancel.addEventListener("click", () => {
      replyTextarea.value = "";
      replyBlock.style.display = "none";
    });

    replySave.addEventListener("click", () => {
      const replyText = replyTextarea.value.trim();
      if (!replyText) return;

      ann.replies.push({ author: "You", text: replyText });
      replyTextarea.value = "";
      replyBlock.style.display = "none";
      refreshReplies();
      renderMyAnnotationsPanels();
    });

    card.append(meta, body, snippet, actions, replyBlock);
    if (ann.replies.length > 0) {
      refreshReplies();
      card.appendChild(repliesList);
    }

    annotationsList.appendChild(card);
  });
}

// Render "My Annotations" panels
function renderMyAnnotationsPanels() {
  const items = annotations.map(a => `
    <div class="simple-item">
      <div class="simple-title">${a.snippet.slice(0, 60)}${a.snippet.length > 60 ? "…" : ""}</div>
      <div class="simple-meta">${a.time} · ${a.text.slice(0, 70)}${a.text.length > 70 ? "…" : ""}</div>
    </div>
  `).join("");

  dashMyAnnotationsList.innerHTML = items || `<div class="simple-empty">No saved annotations yet.</div>`;
  drawerMyAnnotationsList.innerHTML = items || `<div class="simple-empty">No saved annotations yet.</div>`;
}

// ================================
// NOTIFICATIONS DEMO
// ================================
const notificationsBtn = document.getElementById("notificationsBtn");
const notificationsPopover = document.getElementById("notificationsPopover");
const notifCloseBtn = document.getElementById("notifCloseBtn");
const notifList = document.getElementById("notifList");
const notifBadge = document.getElementById("notifBadge");

function openNotifications() {
  notificationsPopover.classList.add("open");
}
function closeNotifications() {
  notificationsPopover.classList.remove("open");
}

notificationsBtn.addEventListener("click", () => {
  notificationsPopover.classList.contains("open") ? closeNotifications() : openNotifications();
});
notifCloseBtn.addEventListener("click", closeNotifications);

// Create a fake reply notification so you can demo the visuals
function simulateReplyNotification(annotationId) {
  const notif = {
    id: notifications.length,
    type: "reply",
    annotationId,
    text: "A classmate replied to your annotation.",
    from: "Classmate",
    time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    read: false
  };
  notifications.push(notif);
  renderNotifications();
  updateNotifBadge();
}

function updateNotifBadge() {
  const unread = notifications.filter(n => !n.read).length;
  notifBadge.textContent = unread;
  unread > 0 ? notifBadge.classList.add("show") : notifBadge.classList.remove("show");
}

function renderNotifications() {
  notifList.innerHTML = "";

  if (notifications.length === 0) {
    notifList.innerHTML = `<div class="notif-empty">No notifications yet.</div>`;
    return;
  }

  notifications.forEach(n => {
    const item = document.createElement("div");
    item.className = "notif-item";

    item.innerHTML = `
      <strong>${n.from}</strong>
      <div>${n.text}</div>
      <div style="color: var(--text-muted); font-size: 0.75rem;">${n.time}</div>
    `;

    item.addEventListener("click", () => {
      n.read = true;
      updateNotifBadge();
      closeNotifications();

      // Jump to annotation
      openDrawer();
      document.getElementById("drawerCourses").classList.add("active");
      drawerSections.forEach(s => s.classList.toggle("active", s.id === "drawerCourses"));
      drawerLinks.forEach(b => b.classList.toggle("active", b.dataset.drawer === "drawerCourses"));

      const card = document.getElementById(`ann-card-${n.annotationId}`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("flash");
        setTimeout(() => card.classList.remove("flash"), 1200);
      }
    });

    notifList.appendChild(item);
  });
}




