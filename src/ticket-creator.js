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
  const priority = issue.priority.name;
  const project = issue.project.name;
  const created = issue.created_on.split("T")[0];
  const updated = issue.updated_on.split("T")[0];
  const url = `${REDMINE_URL}/issues/${issueId}`;
  const description = (issue.description || '').trim();

  return {
    issueId,
    title,
    status,
    priority,
    project,
    created,
    updated,
    url,
    description,
    ...issue.custom_fields.reduce((acc, field) => {
      acc[field.name.replace(' ', '_').toLowerCase()] = field.value;
      return acc;
    }, {}),
  }
}

function createPropTable(issueObj) {
  const headers = ['Property', 'Value'];

  const mdTable =
    `| ${headers.join(' | ')} |\n` +
    `| ${headers.map(() => '---').join(' | ')} |\n`// +
    + Object.keys(issueObj)
      .map(propName =>
        `| ${propName.charAt(0).toUpperCase() + propName.slice(1)} | ${issueObj[propName]} |\n`)
      .join("")

  return mdTable;
}

function addComments(issue) {
  if (!issue.journals) return null;

  return issue.journals.map(item => {
    if (!!item.notes) {
      return `
> [!${item.user.name} ]
> ==${item.created_on.replace('T', ' '.replace('Z', ''))}==
${item.notes.split('\r\n').join(`\n>`)}
`
    }
  }).join(``);
}

function createMarkdown(issue, showTable) {
  const {
    title,
    issueId,
    url,
    status,
    priority,
    project,
    created,
    updated,
    sprint_complexity,
    description,
  } = createIssueObject(issue)

  const comments = addComments(issue);

  return `---
title: "${title}"
ticket_id: ${issueId}
url: "${url}"
status: "${status}"
priority: ${priority}
project: "${project}"
created: ${created}
updated: ${updated}
sprint_conplexity: ${sprint_complexity}
---
#${status.replace(' ', '')}
# ${title}
${showTable ? createPropTable({
    url,
    status,
    priority,
    sprint_complexity
  }) : ''}
---
${description}

---

${comments ? '# Комментарии\n' + comments : '' }

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

export const sync = async (vaultPath, issuesGroups, showTable, ticketsDir) => {
  const pathToTickets = `${vaultPath}/${ticketsDir}`;

  Object.keys(issuesGroups).forEach((project) => {
    const pathToProject = `${pathToTickets}/${project}`;
    fs.mkdirSync(pathToProject, { recursive: true });
    clearDirectorySync(pathToProject);

    // Create ticket notes
    for (const issue of issuesGroups[project]) {
      const mdContent = createMarkdown(issue, showTable);

      const filename = path.join(pathToProject, `${issue.id}.md`);
      fs.writeFileSync(filename, mdContent, { flag: 'a' });
    }

    // Create Kanban
    const filenameKanban = path.join(vaultPath, `Kanban board [${project}].md`);
    try {
      fs.unlinkSync(filenameKanban);
    } catch (e) { }

    fs.writeFileSync(filenameKanban, createKanban(issuesGroups[project]), { flag: 'a' });
  })
};

