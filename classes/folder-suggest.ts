import { AbstractInputSuggest, App } from "obsidian";


class FolderSuggest extends AbstractInputSuggest<string> {
	content: Set<string>;

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.content = [''].concat(this.app.vault.getAllFolders().map(f => f.path));
	}

	getSuggestions(query: string): string[] {
		return this.folders.filter(p => p.contains(query));
	}

	renderSuggestion(path: string, el: HTMLElement) {
		el.textContent = path;
	}

	selectSuggestion(path: string) {
		this.inputEl.value = path;
		this.onChoose(path);
	}
}

