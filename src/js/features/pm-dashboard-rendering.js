// PM: dashboard rendering (overview, workload, analytics) extracted from main.js

let charts = {};

function destroyChart(id) {
  if (charts[id]) {
    try {
      charts[id].destroy();
    } catch (e) {}
    delete charts[id];
  }
}

function renderOverview() {
  renderStats();
  const sidebarEl = document.getElementById("sidebarOpenCount");
  if (sidebarEl) sidebarEl.textContent = TICKETS.length;
  renderUrgentList();
  const feedEl = document.getElementById("activityFeed");
  if (feedEl) {
    const acts = [
      {
        icon: "bi-plus-lg",
        bg: "#e0f2fe",
        fg: "#0284c7",
        text: `<b>${CURRENT_USER}</b> opened PM Dashboard`,
        time: "Just now",
      },
      ...NOTIFS.slice(0, 7).map((n) => ({
        icon: n.icon,
        bg: n.bg,
        fg: n.fg,
        text: n.body,
        time: n.time,
      })),
    ];
    feedEl.innerHTML = acts
      .map(
        (a) =>
          `<div class="d-flex align-items-start gap-3 px-4 py-3 border-bottom"><div style="width:30px;height:30px;border-radius:8px;background:${a.bg};color:${a.fg};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px"><i class="bi ${a.icon}"></i></div><div><div style="font-size:12.5px;color:#1a2235">${a.text}</div><div class="text-muted" style="font-size:11px">${a.time}</div></div></div>`,
      )
      .join("");
  }
  const open = TICKETS.filter((t) => t.status === "Open").length,
    inprog = TICKETS.filter((t) => t.status === "In Progress").length;
  const resolved = TICKETS.filter((t) => t.status === "Resolved").length,
    closed = TICKETS.filter((t) => t.status === "Closed").length;
  setTimeout(() => {
    destroyChart("chartStatus");
    destroyChart("chartPriority");
    destroyChart("chartCategory");
    charts.chartStatus = new Chart(document.getElementById("chartStatus"), {
      type: "doughnut",
      data: {
        labels: ["Open", "In Progress", "Resolved", "Closed"],
        datasets: [
          {
            data: [open, inprog, resolved, closed],
            backgroundColor: ["#3b7cf4", "#eab308", "#22c55e", "#94a3b8"],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: { family: "Plus Jakarta Sans", size: 12 },
              padding: 12,
            },
          },
        },
      },
    });
    charts.chartPriority = new Chart(document.getElementById("chartPriority"), {
      type: "bar",
      data: {
        labels: ["Critical", "High", "Medium", "Low"],
        datasets: [
          {
            data: ["Critical", "High", "Medium", "Low"].map(
              (p) => TICKETS.filter((t) => t.priority === p).length,
            ),
            backgroundColor: ["#ffe4e6", "#ffedd5", "#fef9c3", "#f0fdf4"],
            borderColor: ["#be123c", "#9a3412", "#78350f", "#14532d"],
            borderWidth: 1.5,
            borderRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
      },
    });
    const cats = [
      "Bug",
      "Task",
      "Feature Request",
      "Performance Issue",
      "Account Issue",
      "Other",
    ];
    charts.chartCategory = new Chart(document.getElementById("chartCategory"), {
      type: "bar",
      data: {
        labels: cats.map((c) => (c.length > 10 ? c.substring(0, 10) + "…" : c)),
        datasets: [
          {
            data: cats.map(
              (c) => TICKETS.filter((t) => t.category === c).length,
            ),
            backgroundColor: "rgba(59,124,244,0.75)",
            borderRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
      },
    });
  }, 60);
}

function renderUrgentList() {
  const el = document.getElementById("urgentList");
  if (!el) return;
  const urgent = TICKETS.filter(
    (t) =>
      (t.priority === "Critical" || t.priority === "High") &&
      t.status === "Open",
  );
  if (!urgent.length) {
    el.innerHTML =
      '<div class="text-muted px-4 py-3" style="font-size:13px">No open Critical or High priority tickets.</div>';
    return;
  }
  el.innerHTML = urgent
    .map(
      (t) =>
        `<div class="d-flex align-items-center gap-3 px-4 py-3 border-bottom" style="cursor:pointer" onclick="openDetail('${t.id}')"><div class="avatar-sm" style="background:${t.priority === "Critical" ? "#ffe4e6" : "#ffedd5"};color:${t.priority === "Critical" ? "#be123c" : "#9a3412"};width:28px;height:28px;font-size:11px;border-radius:8px;font-weight:700">${t.priority[0]}</div><div class="flex-grow-1"><div class="fw-semibold" style="font-size:13.5px;color:#1a2235">${t.title}</div><div class="d-flex gap-2 align-items-center" style="font-size:12px">${prioBadgeHTML(t.priority)}<span class="badge rounded-pill" style="background:#141d22">#${t.id}</span><span class="badge rounded-pill" style="background:#7c8f99">${t.reporter || "—"}</span></div></div><div class="text-muted" style="font-size:12px">${t.created || ""}</div></div>`,
    )
    .join("");
}

window.saveAgentName = function (oldName, newName) {
  const idx = AGENTS.indexOf(oldName);
  if (idx !== -1) {
    AGENTS[idx] = newName;
    TICKETS.forEach((t) => {
      if (t.manager === oldName) t.manager = newName;
    });
    saveTickets();
    saveAgents();
    pmRender();
    renderWorkload();
    showToast({
      type: "success",
      title: "Updated",
      message: `${oldName} → ${newName}`,
    });
  }
};

window.addAgent = function (name) {
  if (!AGENTS.includes(name)) {
    AGENTS.push(name);
    saveAgents();
    renderWorkload();
    showToast({ type: "success", title: "Added", message: `${name} added` });
  } else {
    showToast({
      type: "warning",
      title: "Exists",
      message: `${name} already exists`,
    });
  }
};

window.removeAgent = function (name) {
  const idx = AGENTS.indexOf(name);
  if (idx !== -1) {
    AGENTS.splice(idx, 1);
    saveAgents();
    TICKETS.forEach((t) => {
      if (t.manager === name) t.manager = "";
    });
    saveTickets();
    pmRender();
    renderWorkload();
    showToast({ type: "info", title: "Removed", message: `${name} removed` });
  }
};

function renderWorkload() {
  const acEl = document.getElementById("agentCards"),
    wlEl = document.getElementById("workloadTableBody");
  const agentStats = (agent) => {
    const my = TICKETS.filter((t) => t.developer === agent),
      op = my.filter((t) => t.status === "Open").length,
      ip = my.filter((t) => t.status === "In Progress").length,
      rs = my.filter((t) => t.status === "Resolved").length,
      cl = my.filter((t) => t.status === "Closed").length;
    const util = Math.min(100, Math.round(((op + ip) / 6) * 100)),
      uc = util < 40 ? "#16a34a" : util < 75 ? "#d97706" : "#dc2626";
    return { my, op, ip, rs, cl, util, uc };
  };
  acEl.innerHTML = AGENTS.map((agent) => {
    const { op, ip, rs, cl, util, uc } = agentStats(agent);
    return `<div class="col-4"><div class="agent-card agent-card-clickable" onclick="openAgentModal('${agent}')"><div class="d-flex align-items-center gap-3 mb-3"><div class="agent-avatar" style="background:${paletteColor(agent)}">${initials(agent)}</div><div><div class="fw-bold" style="font-size:14px;color:#1a2235">${agent}</div><div class="text-muted" style="font-size:11.5px">Developer</div></div></div><div class="row g-2 mb-3 text-center"><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#3b7cf4;font-family:'JetBrains Mono',monospace">${op}</div><div class="text-muted" style="font-size:10.5px">Open</div></div><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#d97706;font-family:'JetBrains Mono',monospace">${ip}</div><div class="text-muted" style="font-size:10.5px">In Prog.</div></div><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#16a34a;font-family:'JetBrains Mono',monospace">${rs}</div><div class="text-muted" style="font-size:10.5px">Resolved</div></div><div class="col-3"><div class="fw-bold" style="font-size:20px;color:#64748b;font-family:'JetBrains Mono',monospace">${cl}</div><div class="text-muted" style="font-size:10.5px">Closed</div></div></div><div class="d-flex justify-content-between mb-1"><span style="font-size:11.5px;color:#7a8599">Utilization</span><span style="font-size:11.5px;font-weight:700;color:${uc}">${util}%</span></div><div class="util-bar-wrap"><div class="util-bar" style="width:${util}%;background:${uc}"></div></div></div></div>`;
  }).join("");
  wlEl.innerHTML = AGENTS.map((agent) => {
    const { my, op, ip, rs, cl, util } = agentStats(agent);
    return `<tr><td><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:${paletteColor(agent)};width:28px;height:28px;font-size:10px">${initials(agent)}</div><span class="fw-semibold" style="font-size:13px">${agent}</span></div></td><td><span class="wl-stat">${my.length}</span></td><td><span class="wl-stat" style="color:#3b7cf4">${op}</span></td><td><span class="wl-stat" style="color:#d97706">${ip}</span></td><td><span class="wl-stat" style="color:#16a34a">${rs}</span></td><td><span class="wl-stat" style="color:#64748b">${cl}</span></td><td><div class="d-flex align-items-center gap-2"><div class="progress flex-grow-1" style="height:6px"><div class="progress-bar" style="width:${util}%;background:${paletteColor(agent)}"></div></div><span style="font-size:12px;font-weight:700;min-width:36px">${util}%</span></div></td></tr>`;
  }).join("");
}

function renderAnalytics() {
  const total = TICKETS.length,
    done = TICKETS.filter((t) =>
      ["Resolved", "Closed"].includes(t.status),
    ).length,
    critOp = TICKETS.filter(
      (t) => t.priority === "Critical" && t.status === "Open",
    ).length;
  document.getElementById("anTotal").textContent = total;
  document.getElementById("anRate").textContent = total
    ? Math.round((done / total) * 100) + "%"
    : "0%";
  document.getElementById("anCritOpen").textContent = critOp;
  setTimeout(() => {
    ["chartClient", "chartAgent", "chartTrend"].forEach((id) =>
      destroyChart(id),
    );
    const clients = Array.from(new Set(TICKETS.map((t) => t.reporter))).filter(
      Boolean,
    );
    charts.chartClient = new Chart(document.getElementById("chartClient"), {
      type: "bar",
      data: {
        labels: clients.map((c) => c.split(" ")[0]),
        datasets: [
          {
            label: "Tickets",
            data: clients.map(
              (c) => TICKETS.filter((t) => t.reporter === c).length,
            ),
            backgroundColor: clients.map((c) => paletteColor(c)),
            borderRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
      },
    });
    charts.chartAgent = new Chart(document.getElementById("chartAgent"), {
      type: "bar",
      data: {
        labels: AGENTS.map((a) => a.split(" ")[0]),
        datasets: [
          {
            label: "Resolved/Closed",
            data: AGENTS.map(
              (a) =>
                TICKETS.filter(
                  (t) =>
                    t.manager === a &&
                    ["Resolved", "Closed"].includes(t.status),
                ).length,
            ),
            backgroundColor: AGENTS.map((a) => paletteColor(a)),
            borderRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
      },
    });
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      );
    }
    charts.chartTrend = new Chart(document.getElementById("chartTrend"), {
      type: "line",
      data: {
        labels: days,
        datasets: [
          {
            label: "Opened",
            data: [2, 1, 3, 2, 1, 4, 2, 3, 1, 2, 2, 3, 1, 2],
            borderColor: "#dc2626",
            backgroundColor: "rgba(220,38,38,0.07)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          },
          {
            label: "Resolved",
            data: [0, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1],
            borderColor: "#16a34a",
            backgroundColor: "rgba(22,163,74,0.07)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: { grid: { display: false } },
        },
      },
    });
  }, 60);
}
