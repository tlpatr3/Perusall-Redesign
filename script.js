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
});

// ================================
// ANNOTATIONS DRAWER (FOCUS MODE TOGGLE)
// ================================
const readingShell = document.getElementById("readingShell");
const annotationsDrawer = document.getElementById("annotationsDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const toggleDrawerBtn = document.getElementById("toggleDrawerBtn");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");

function openDrawer() {
  readingShell.classList.add("drawer-open");
}

function closeDrawer() {
  readingShell.classList.remove("drawer-open");
}

toggleDrawerBtn.addEventListener("click", () => {
  if (readingShell.classList.contains("drawer-open")) {
    closeDrawer();
  } else {
    openDrawer();
  }
});

closeDrawerBtn.addEventListener("click", closeDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);

// ================================
// ZOOM CONTROLS (FONT-BASED TO KEEP SELECTION WORKING)
// ================================
const readingPane = document.getElementById("readingPane");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomLevelLabel = document.getElementById("zoomLevelLabel");

let zoomLevel = 100;
const baseFontSize = 16; // implicit baseline for 100%

function applyZoom() {
  const scale = zoomLevel / 100;
  const newSize = baseFontSize * scale;
  readingPane.style.fontSize = newSize + "px";
  zoomLevelLabel.textContent = zoomLevel + "%";
  zoomOutBtn.disabled = zoomLevel <= 80;
  zoomInBtn.disabled = zoomLevel >= 140;
}

zoomOutBtn.addEventListener("click", () => {
  if (zoomLevel > 80) {
    zoomLevel -= 10;
    applyZoom();
  }
});

zoomInBtn.addEventListener("click", () => {
  if (zoomLevel < 140) {
    zoomLevel += 10;
    applyZoom();
  }
});

// ================================
// ANNOTATION SYSTEM
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

const readingProfile = document.getElementById("readingProfile");
const homeProfile = document.getElementById("homeProfile");

let currentRange = null;
let currentSelectionText = "";
const annotations = [];

function clearSelectionState() {
  currentRange = null;
  currentSelectionText = "";
  addAnnotationBtn.disabled = true;
}

// Selection tracking: only in reading view & inside readingContent
document.addEventListener("selectionchange", () => {
  if (!readingView.classList.contains("active")) return;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    clearSelectionState();
    return;
  }

  const range = sel.getRangeAt(0);
  let container = range.commonAncestorContainer;
  const selectedText = sel.toString().trim();

  if (container.nodeType === Node.TEXT_NODE) {
    container = container.parentNode;
  }

  const isInsideReading = readingContent.contains(container);

  if (!isInsideReading || selectedText.length === 0) {
    clearSelectionState();
    return;
  }

  currentRange = range;
  currentSelectionText = selectedText;
  addAnnotationBtn.disabled = false;
});

// Modal helpers
function openModal() {
  modalSnippet.textContent = currentSelectionText;
  modalTextarea.value = "";
  modal.classList.add("active");
  modalTextarea.focus();
}

function closeModal() {
  modal.classList.remove("active");
}

// ✎ button opens modal
addAnnotationBtn.addEventListener("click", () => {
  if (!currentRange || !currentSelectionText) return;
  openModal();
});

cancelAnnotationBtn.addEventListener("click", () => {
  closeModal();
});

// Save annotation → highlight + drawer list + notification dots
saveAnnotationBtn.addEventListener("click", () => {
  const note = modalTextarea.value.trim();
  if (!note) {
    alert("Please enter a note for your annotation.");
    return;
  }

  // Highlight selection
  const span = document.createElement("span");
  span.className = "highlight";
  span.setAttribute("data-annotation-id", String(annotations.length));

  try {
    currentRange.surroundContents(span);
  } catch (e) {
    console.warn("Could not highlight selection:", e);
  }

  const timestamp = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const annotation = {
    id: annotations.length,
    text: note,
    snippet: currentSelectionText,
    author: "You",
    time: timestamp,
    replies: [],
  };

  annotations.push(annotation);
  renderAnnotations();
  clearSelectionState();
  closeModal();

  // Show notification dots on both profiles
  readingProfile.classList.add("has-notifications");
  homeProfile.classList.add("has-notifications");
});

// Render annotations into drawer
function renderAnnotations() {
  annotationsList.innerHTML = "";
  annotationCount.textContent = annotations.length;

  if (annotations.length === 0) {
    annotationsList.innerHTML =
      '<div class="annotation-empty">No annotations yet. Use focus mode to read; open this panel when you’re ready to review notes.</div>';
    return;
  }

  annotations.forEach((ann) => {
    const card = document.createElement("div");
    card.className = "annotation-card";

    const meta = document.createElement("div");
    meta.className = "annotation-meta";
    meta.innerHTML =
      "<span>" + ann.author + "</span><span>" + ann.time + "</span>";

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

    replyActions.appendChild(replyCancel);
    replyActions.appendChild(replySave);

    const repliesList = document.createElement("div");
    repliesList.className = "reply-meta";
    if (ann.replies.length > 0) {
      repliesList.textContent = ann.replies
        .map((r) => r.author + " · " + r.text)
        .join("   ·   ");
    }

    replyBlock.appendChild(replyTextarea);
    replyBlock.appendChild(replyActions);

    // Reply button toggles reply box
    replyBtn.addEventListener("click", () => {
      replyBlock.style.display =
        replyBlock.style.display === "none" ? "flex" : "none";
      if (replyBlock.style.display === "flex") {
        replyTextarea.focus();
      }
    });

    replyCancel.addEventListener("click", () => {
      replyTextarea.value = "";
      replyBlock.style.display = "none";
    });

    replySave.addEventListener("click", () => {
      const replyText = replyTextarea.value.trim();
      if (!replyText) return;

      const reply = {
        author: "You",
        text: replyText,
      };
      ann.replies.push(reply);
      replyTextarea.value = "";
      replyBlock.style.display = "none";

      repliesList.textContent = ann.replies
        .map((r) => r.author + " · " + r.text)
        .join("   ·   ");

      readingProfile.classList.add("has-notifications");
      homeProfile.classList.add("has-notifications");
    });

    card.appendChild(meta);
    card.appendChild(body);
    card.appendChild(snippet);
    card.appendChild(actions);
    card.appendChild(replyBlock);
    if (ann.replies.length > 0) {
      card.appendChild(repliesList);
    }

    annotationsList.appendChild(card);
  });
}

