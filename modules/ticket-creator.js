import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Notice } from 'obsidian';
import * as fs_promises from 'fs/promises';

const REDMINE_URL = 'https://tracker.egamings.com/';

function createIssueObject(issue) {
  const issueId = issue.id;
  const title = issue.subject.replace(/"/g, '\\"');
  const status = issue.status.name;
  const project = issue.project.name;
  const created = issue.created_on.split("T")[0];
  const updated = issue.updated_on.split("T")[0];
  const url = `${REDMINE_URL}/issues/${issueId}`;
  const description = (issue.description || '').trim();

  return {
    issueId,
    title,
    status,
    project,
    created,
    updated,
    url,
    description
  }
}

function createMarkdown(issue) {
  const issueObj = createIssueObject(issue)

  return `---
title: "${issueObj.title}"
ticket_id: ${issueObj.issueId}
url: "${issueObj.url}"
status: "${issueObj.status}"
project: "${issueObj.project}"
created: ${issueObj.created}
updated: ${issueObj.updated}
---
#${issueObj.status}
# ${issueObj.title}
---
${issueObj.description}
`;
}

function createKanban(issues) {

  const groupByStatus = issues
    .map((issue) =>
      createIssueObject(issue))
    .reduce((acc, issue) => {
      const status = issue.status;
      (acc[status] ??= []).push(issue);
      return acc;
    }, {})

  return ``
    + `---

kanban-plugin: board

---\n`
    + Object.keys(groupByStatus)
      .map((status) => {
        return `## ${status}\n\n`
          + groupByStatus[status]
            .map((issue) =>
              `- [[${issue.issueId}]] : ${issue.title}`).join("\n") + "\n"
      }).join("\n")
    + "\n%% kanban:settings\n"
    + "```\n"
    + `{"kanban-plugin":"board","list-collapse":[false,false]}\n`
    + "```\n"
    + "%%\n"
}

async function clearDirectory(dir) {
  const files = await fs.readdir(dir);
  await Promise.all(
    files.map(async (file) => {
      const filePath = `${dir}/${file}`;
      const stat = await fs.lstat(filePath);
      if (stat.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
      } else {
        await fs.unlink(filePath);
      }
    })
  );
}

function clearDirectorySync(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  }
}

export const sync = async (vaultPath, issues) => {
  const pathToTickets = `${vaultPath}/Tickets`;
  fs.mkdirSync(pathToTickets, { recursive: true });
  clearDirectorySync(pathToTickets);

  // Create ticket notes
  for (const issue of issues) {
    const mdContent = createMarkdown(issue);

    const filename = path.join(pathToTickets, `${issue.id}.md`);
    fs.writeFileSync(filename, mdContent, { flag: 'a' });
  }

  // Create Kanban
  const filenameKanban = path.join(vaultPath, `Kanban board.md`);
  try {
    fs.unlinkSync(filenameKanban);
  } catch(e) {}
  fs.writeFileSync(filenameKanban, createKanban(issues), { flag: 'a' });
};

