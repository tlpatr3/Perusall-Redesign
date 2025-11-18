// Hamburger dropdown
(function () {
  const button = document.querySelector(".hamburger");
  const menu = document.querySelector(".hamburger-menu");

  if (!button || !menu) return;

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    menu.hidden = expanded;
  });

  document.addEventListener("click", () => {
    if (button.getAttribute("aria-expanded") === "true") {
      button.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    }
  });

  menu.addEventListener("click", (e) => {
    e.stopPropagation(); // keep menu open if user clicks inside
  });
})();

// Comment filter (All / Mine / New)
(function () {
  const filterButtons = document.querySelectorAll("[data-comment-filter]");
  const comments = document.querySelectorAll(".comment");

  if (!filterButtons.length || !comments.length) return;

  function applyFilter(filter) {
    comments.forEach((comment) => {
      comment.classList.remove("comment--hidden");
      const author = comment.dataset.author;
      const status = comment.dataset.status;

      if (filter === "mine" && author !== "me") {
        comment.classList.add("comment--hidden");
      } else if (filter === "new" && status !== "new") {
        comment.classList.add("comment--hidden");
      }
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.commentFilter;

      filterButtons.forEach((b) => b.classList.remove("chip--active"));
      btn.classList.add("chip--active");

      applyFilter(filter);
    });
  });
})();

// Highlight corresponding text when hovering comments
(function () {
  const comments = document.querySelectorAll(".comment");
  const highlights = document.querySelectorAll("[data-comment-ref]");

  if (!comments.length || !highlights.length) return;

  function clearHighlights() {
    highlights.forEach((h) => h.classList.remove("reading-highlight--active"));
  }

  comments.forEach((comment) => {
    const id = comment.dataset.commentId;
    if (!id) return;

    comment.addEventListener("mouseenter", () => {
      clearHighlights();
      document
        .querySelectorAll(`[data-comment-ref="${id}"]`)
        .forEach((el) => el.classList.add("reading-highlight--active"));
    });

    comment.addEventListener("mouseleave", () => {
      clearHighlights();
    });
  });
})();

// Conversation drawer toggle (for button in course strip)
(function () {
  const toggleButton = document.querySelector("[data-conversation-toggle]");
  const drawer = document.querySelector(".conversation");

  if (!toggleButton || !drawer) return;

  function toggleDrawer() {
    const collapsed = drawer.classList.toggle("conversation--collapsed");
    toggleButton.textContent = collapsed ? "Show conversation" : "Conversation";
  }

  toggleButton.addEventListener("click", toggleDrawer);
})();



