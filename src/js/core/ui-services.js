class UIHelpers {
  constructor(config = {}) {
    this.statusClass = config.statusClass || {};
    this.prioStyle = config.prioStyle || {};
    this.categoryStyles = config.categoryStyles || {};
  }

  initials(name) {
    return (name || "")
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  statusBadgeHTML(status, extra = "") {
    const statusClass = this.statusClass[status] || "secondary text-white";
    const [bg, text] = statusClass.split(" ");
    return `<span class="badge bg-${bg} ${text || ""} rounded-pill" style="font-size:11px" ${extra}>${status}</span>`;
  }

  prioBadgeHTML(priority, extra = "") {
    const style = this.prioStyle[priority] || this.prioStyle.Low;
    return `<span class="badge rounded-pill" style="${style};font-size:11px" ${extra}>${priority}</span>`;
  }

  categoryBadgeHTML(category) {
    const styles = this.categoryStyles;
    const bg = (styles.bg || {})[category] || "#eff4ff";
    const fg = (styles.fg || {})[category] || "#3b7cf4";
    const icon = (styles.icon || {})[category] || "bi-check2-square";
    return `<span class="badge rounded-pill" style="background:${bg};color:${fg};font-size:11px"><i class="bi ${icon} me-1"></i>${category || "-"}</span>`;
  }

  linkify(text) {
    const safeText = text || "";
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    return safeText.replace(urlRegex, (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#3b7cf4;word-break:break-all">${url}</a>`,
    );
  }
}

class SidebarController {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  init() {
    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("sidebarToggle");
    const brandIcon = document.querySelector(".brand-icon");
    if (!sidebar || !toggleButton) {
      return;
    }

    // Static mode: always start expanded
    sidebar.classList.remove("collapsed");

    toggleButton.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      // No-op for static mode
    });

    if (brandIcon) {
      brandIcon.addEventListener("click", () => {
        if (sidebar.classList.contains("collapsed")) {
          sidebar.classList.remove("collapsed");
          // No-op for static mode
        }
      });
    }
  }
}

class PaginationRenderer {
  constructor(pageSize) {
    this.pageSize = pageSize;
  }

  render(page, totalCount, goPageFnName) {
    const pages = Math.max(1, Math.ceil(totalCount / this.pageSize));
    let buttons = `<button class="page-btn" onclick="${goPageFnName}(${page - 1})" ${page === 1 ? "disabled" : ""}><i class="bi bi-chevron-left"></i></button>`;
    let start = Math.max(1, page - 2);
    let end = Math.min(pages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let p = start; p <= end; p += 1) {
      buttons += `<button class="page-btn ${p === page ? "active" : ""}" onclick="${goPageFnName}(${p})">${p}</button>`;
    }

    buttons += `<button class="page-btn" onclick="${goPageFnName}(${page + 1})" ${page === pages ? "disabled" : ""}><i class="bi bi-chevron-right"></i></button>`;
    return buttons;
  }
}

class ToastService {
  constructor() {
    this.types = {
      success: { bg: "#bbf7d0", fg: "#166534", icon: "bi-check-circle" },
      info: { bg: "#bae6fd", fg: "#075985", icon: "bi-info-circle" },
      warning: { bg: "#fef3c7", fg: "#92400e", icon: "bi-exclamation-circle" },
      error: { bg: "#fecaca", fg: "#b91c1c", icon: "bi-x-circle" },
    };
  }

  getContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container position-fixed bottom-0 start-0 p-3";
      container.style.zIndex = 9999;
      document.body.appendChild(container);
    }
    return container;
  }

  show({ type = "info", title = "", message = "" }) {
    const config = this.types[type] || this.types.info;
    const container = this.getContainer();
    const toast = document.createElement("div");

    toast.className = "toast show d-flex align-items-center mb-2";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");
    toast.style.cssText = `background:${config.bg};color:${config.fg};border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);min-width:320px;max-width:450px`;
    toast.innerHTML = `
      <div class="d-flex align-items-center px-3 py-2 flex-grow-1">
        <i class="bi ${config.icon} me-2" style="font-size:20px;color:${config.fg}"></i>
        <div>
          <div class="fw-semibold" style="font-size:15px;color:${config.fg}">${title}</div>
          <div style="font-size:13px;color:${config.fg}">${message}</div>
        </div>
      </div>
      <button type="button" class="btn-close ms-3 me-2" style="filter:invert(0.7)" aria-label="Close"></button>
    `;

    toast.querySelector(".btn-close").onclick = () => {
      toast.remove();
    };

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 4000);
  }
}

window.UIHelpers = UIHelpers;
window.SidebarController = SidebarController;
window.PaginationRenderer = PaginationRenderer;
window.ToastService = ToastService;
