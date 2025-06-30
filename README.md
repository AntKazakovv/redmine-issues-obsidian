The plugin integrates with your Redmine tracker. It allows you to:

* 🔍 Load issues from Redmine
* 🗂 Automatically create a Kanban board reflecting the status of issues (such as “New”, “In Progress”, “Resolved”, etc.) — (For this, you need to have the **Kanban** plugin installed).

---

## 🛠 Main Features

* **Authentication** via `X‑Redmine‑API‑Key`
* **Filtering issues** assigned to the current user
* **Dynamic board creation** in Obsidian with columns for each issue status
* **Updating issues** on reload or on demand

---

## 🚀 Installation

The **Kanban** plugin is required for proper display of the ticket board.

---

## ⚙️ Setup

Go to the plugin settings and specify:

* **Your Redmine URL**
* **Redmine API Key** (find it in your Redmine profile)

---

## ▶️ Usage

1. Run the “Redmine Issues: Synchronize issues” command via the **Command Palette** (`Ctrl/Cmd + P`).
2. The same action can be performed by clicking the button in the left menu.
3. The plugin will automatically create or update ticket files in the `Tickets/` folder and create a `Kanban board.md` with the board:

> [!Warning]
> At the moment, the plugin does not update the issue status in Redmine — it only serves for visual representation in Obsidian.

---

## 🧩 Why This Is Convenient

This is a universal solution for **personal task tracking** directly from Obsidian. Your issues appear as an interactive Kanban board inside your notes, without the need to open a browser or mobile app.
