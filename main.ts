import {
    //
    App,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
} from 'obsidian';
import {FileSystemAdapter} from 'obsidian';
import {requestUrl} from 'obsidian';
import {uiTexts} from 'text';

import {sync} from 'modules/ticket-creator.js';

interface RedmineIssuesSettings {
    apiKey: string | null;
    redmineUrl: string | null;
}

const DEFAULT_SETTINGS: RedmineIssuesSettings = {
    apiKey: null,
    redmineUrl: null,
};

export default class RedmineIssuePlugin extends Plugin {
    settings: RedmineIssuesSettings;

    checkRequiredSettings(): boolean {
        if (!this.settings.apiKey) {
            new Notice(uiTexts.notifications.errors.settingsApiKey);
            return false;
        }
        if (!this.settings.redmineUrl) {
            new Notice(uiTexts.notifications.errors.settingsURL);
            return false;
        }
        return true;
    }

    async fetchIssues(): Promise<object[] | null> {
        if (!this.checkRequiredSettings()) return null;

        const headers = {
            'X-Redmine-API-Key': this.settings.apiKey ?? '',
            Accept: 'application/json',
            'User-Agent': 'Obsidian-Plugin',
        };

        let issues: object[] = [];

        let data = null;

        const params = new URLSearchParams(     {
            assigned_to_id: 'me',
            limit: '100',
            offset: '0',
        });

        const options = {
            url: `${this.settings.redmineUrl}/issues.json?${params}`,
            method: 'GET',
            headers,
        };

        console.log(options.url);

        try {
            const resp = await requestUrl({
                url: options.url,
                method: options.method,
                headers: options.headers,
            });

            if (resp.status !== 200) {
                console.error('Error API:', resp.status, resp.text);
                return null;
            }
            data = resp.json;
            issues = [...issues, ...data.issues];
        } catch (err) {
            console.error('Error in requestUrl:', err);
            new Notice(uiTexts.notifications.errors.settingsInvalidApiKey);
        }

        return issues;
    }

    async createIssues(vaultPath: string): Promise<boolean> {
        const issues = await this.fetchIssues();

        if (!issues) return false;

        await sync(vaultPath, issues);
        return true;
    }

    async onload() {
        await this.loadSettings();
        const adapter = this.app.vault.adapter;

        let vaultPath: string | null = null;
        if (adapter instanceof FileSystemAdapter) {
            vaultPath = adapter.getBasePath();
            console.log('Absolute vault path:', vaultPath);
        } else {
            console.warn('adapter is not FileSystemAdapter');
        }

        const status = await this.createIssues(vaultPath ?? '');
        if (status) new Notice(uiTexts.notifications.info.successfullySync);

        const ribbonIconEl = this.addRibbonIcon('dice', 'Redmine issues: Sync', async () => {
            const status = await this.createIssues(vaultPath ?? '');
            if (status) new Notice(uiTexts.notifications.info.successfullySync);
        });

        ribbonIconEl.addClass('my-plugin-ribbon-class');

        // const statusBarItemEl = this.addStatusBarItem();
        // statusBarItemEl.setText('Status Bar Text');

        this.addCommand({
            id: 'sync-issues',
            name: 'Syncthronize issues',
            callback: async () => {},
        });

        this.addSettingTab(new SampleSettingTab(this.app, this));
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SampleSettingTab extends PluginSettingTab {
    plugin: RedmineIssuePlugin;

    constructor(app: App, plugin: RedmineIssuePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName(uiTexts.settings.apiKey.name)
            .setDesc(uiTexts.settings.apiKey.desc)
            .addText((text) =>
                text
                    .setPlaceholder(uiTexts.settings.apiKey.placeholder)
                    .setValue(this.plugin.settings.apiKey ?? '')
                    .onChange(async (value) => {
                        this.plugin.settings.apiKey = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName(uiTexts.settings.url.name)
            .setDesc(uiTexts.settings.url.desc)
            .addText((text) =>
                text
                    .setPlaceholder(uiTexts.settings.url.placeholder)
                    .setValue(this.plugin.settings.redmineUrl ?? '')
                    .onChange(async (value) => {
                        this.plugin.settings.redmineUrl = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
