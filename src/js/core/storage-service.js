class StorageService {
  constructor(config) {
    this.ticketKey = config.ticketKey;
    this.notifKey = config.notifKey;
    this.notesKey = config.notesKey;
    this.agentsKey = config.agentsKey;
    this.clientsKey = config.clientsKey;
  }

  readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  loadTickets() {
    return this.readJSON(this.ticketKey, null);
  }

  saveTickets(tickets) {
    this.writeJSON(this.ticketKey, tickets);
  }

  loadNotifications() {
    return this.readJSON(this.notifKey, []);
  }

  saveNotifications(notifications) {
    this.writeJSON(this.notifKey, notifications);
  }

  loadNotes() {
    return this.readJSON(this.notesKey, {});
  }

  saveNotes(notes) {
    this.writeJSON(this.notesKey, notes);
  }

  loadAgents(defaultAgents) {
    return this.readJSON(this.agentsKey, defaultAgents);
  }

  saveAgents(agents) {
    this.writeJSON(this.agentsKey, agents);
  }

  loadClients() {
    return this.readJSON(this.clientsKey, []);
  }

  saveClients(clients) {
    this.writeJSON(this.clientsKey, clients);
  }
}

window.StorageService = StorageService;
