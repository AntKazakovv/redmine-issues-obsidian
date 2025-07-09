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
import * as path from 'path';
import * as fs from 'fs';

import {sync} from 'modules/ticket-creator.js';

type ErrorHandlerCallback = (err: any, context: any, methodName: string, args: any[]) => void;
const defaultErrorHandler = (err: any, ctx: any, name: string, args: any[]) => {
        console.error(`Ошибка в ${name}:`, err);
    }

function catchErrors(
    handler: ErrorHandlerCallback = defaultErrorHandler): MethodDecorator {

    return function (target, propertyKey, descriptor: PropertyDescriptor) {
        const original = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            try {
                const result = original.apply(this, args);
                if (result instanceof Promise) {
                    return await result;
                }
                return result;
            } catch (err) {
                handler.call(this, err, this, propertyKey as string, args);
            }
        };
        return descriptor;
    };
}

interface RedmineIssuesSettings {
    apiKey: string | null;
    redmineUrl: string | null;
    showTableProps: boolean;
    ticketsDir: string;
}

const DEFAULT_SETTINGS: RedmineIssuesSettings = {
    apiKey: null,
    redmineUrl: null,
    showTableProps: false,
    ticketsDir: 'Tickets/',
};

export default class RedmineIssuePlugin extends Plugin {
    settings: RedmineIssuesSettings;

    @catchErrors()
    checkRequiredSettings(): boolean {
        if (!this.settings.apiKey) {
            new Notice(uiTexts.notifications.errors.settingsApiKey);
            return false;
        }
        if (!this.settings.redmineUrl) {
            new Notice(uiTexts.notifications.errors.settingsURL);
            return false;
        }

        const absolutePath = path.resolve(this.settings.ticketsDir);
        try {
            const stat = fs.statSync(absolutePath);
            if (!stat.isDirectory()) return false;
        } catch (err) {
            return false;
        }
        return true;
    }

    @catchErrors()
    async fetchIssues(): Promise<object[] | null> {
        if (!this.checkRequiredSettings()) return null;

        const headers = {
            'X-Redmine-API-Key': this.settings.apiKey ?? '',
            Accept: 'application/json',
            'User-Agent': 'Obsidian-Plugin',
        };

        let issues: object[] = [];
        let data = null;

        const params = new URLSearchParams({
            assigned_to_id: 'me',
            limit: '100',
            offset: '0',
        });

        const options = {
            url: `${this.settings.redmineUrl}/issues.json?${params}`,
            method: 'GET',
            headers,
        };

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

    @catchErrors()
    async createIssues(vaultPath: string): Promise<boolean> {
        const issues = await this.fetchIssues();

        if (!issues) return false;

        await sync(vaultPath, issues, this.settings.showTableProps, this.settings.ticketsDir);
        return true;
    }

    @catchErrors()
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

        new Setting(containerEl)
            .setName(uiTexts.settings.showTableProperties.name)
            .setDesc(uiTexts.settings.showTableProperties.desc)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.showTableProps).onChange(async (value) => {
                    this.plugin.settings.showTableProps = value;
                    await this.plugin.saveSettings();
                }),
            );

        new Setting(containerEl)
            .setName(uiTexts.settings.ticketsDir.name)
            .setDesc(uiTexts.settings.ticketsDir.desc)
            .addText((text) =>
                text
                    .setPlaceholder(uiTexts.settings.ticketsDir.placeholder)
                    .setValue(this.plugin.settings.ticketsDir ?? '')
                    .onChange(async (value) => {
                        this.plugin.settings.ticketsDir = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
