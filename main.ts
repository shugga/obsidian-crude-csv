import {
  App,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  TextFileView,
  Modal
} from "obsidian";

interface CrudeCSVSettings {
  templatePath: string; // Optional: explicit template file path
}

const DEFAULT_SETTINGS: CrudeCSVSettings = {
  templatePath: ""
};

const DEFAULT_CSV_CONTENT = "A,B\n0,0\n1,1";
const VIEW_TYPE_CSV = "crude-csv";

// Modal for getting filename from user
class FileNameModal extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Create New CSV File" });

    const inputContainer = contentEl.createEl("div", { cls: "modal-input-container" });
    inputContainer.createEl("label", { text: "File name:" });
    
    const input = inputContainer.createEl("input", { 
      type: "text", 
      placeholder: "Enter filename (without .csv extension)"
    }) as HTMLInputElement;
    
    input.focus();

    const buttonContainer = contentEl.createEl("div", { cls: "modal-button-container" });
    
    const submitBtn = buttonContainer.createEl("button", { 
      text: "Create", 
      cls: "mod-cta" 
    });
    
    const cancelBtn = buttonContainer.createEl("button", { 
      text: "Cancel" 
    });

    const submit = () => {
      const value = input.value.trim();
      if (value) {
        this.result = value;
        this.close();
        this.onSubmit(this.result);
      } else {
        new Notice("Please enter a filename");
      }
    };

    submitBtn.addEventListener("click", submit);
    cancelBtn.addEventListener("click", () => this.close());
    
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key === "Escape") {
        this.close();
      }
    });

    // Style the modal
    contentEl.style.minWidth = "300px";
    inputContainer.style.marginBottom = "20px";
    input.style.width = "100%";
    input.style.marginTop = "5px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.gap = "10px";
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export default class CrudeCSVPlugin extends Plugin {
  settings: CrudeCSVSettings;

  async onload() {
    await this.loadSettings();

    // Register the CSV view and map .csv files to it
    this.registerView(VIEW_TYPE_CSV, (leaf) => new CSVView(leaf));
    this.registerExtensions(["csv"], VIEW_TYPE_CSV);

    // Ribbon
    this.addRibbonIcon("table", "New CSV", () => {
      this.createNewCSV().catch(console.error);
    });

    // Command palette
    this.addCommand({
      id: "create-new-csv",
      name: "New CSV",
      callback: () => this.createNewCSV().catch(console.error)
    });

    // File explorer context menu (folder)
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle("New CSV")
              .setIcon("table")
              .onClick(async () => {
                await this.createNewCSV(file.path);
              });
          });
        }
      })
    );

    // Settings tab
    this.addSettingTab(new CrudeCSVSettingTab(this.app, this));
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CSV);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // Create a new CSV in the chosen folder (context menu) or vault root (ribbon/command)
  async createNewCSV(folderPath?: string) {
    try {
      const targetFolder = await this.resolveTargetFolder(folderPath);
      if (!targetFolder) {
        new Notice("Invalid folder. Could not create CSV.");
        return;
      }

      // Show modal to get filename from user
      new FileNameModal(this.app, async (fileName: string) => {
        await this.createCSVWithName(fileName, targetFolder);
      }).open();

    } catch (err) {
      console.error("Failed to create CSV:", err);
      new Notice("Failed to create CSV file.");
    }
  }

  private async createCSVWithName(fileName: string, targetFolder: TFolder) {
    try {
      const content = await this.getTemplateContent();
      
      // Ensure .csv extension
      const finalFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
      
      // Create temporary file first
      const tempFileName = `temp-csv-${Date.now()}.csv`;
      const tempFilePath = this.joinPath(targetFolder.path, tempFileName);
      
      // Check if target filename already exists
      const finalFilePath = this.joinPath(targetFolder.path, finalFileName);
      const existingFile = this.app.vault.getAbstractFileByPath(finalFilePath);
      
      if (existingFile) {
        new Notice(`File "${finalFileName}" already exists.`);
        return;
      }

      // Create temp file
      const tempFile = await this.app.vault.create(tempFilePath, content);

      // Rename to desired filename using vault API
      await this.app.vault.rename(tempFile, finalFilePath);

      // Get the renamed file reference
      const finalFile = this.app.vault.getAbstractFileByPath(finalFilePath) as TFile;

      // Open the created file
      await this.app.workspace.getLeaf(true).openFile(finalFile);
      new Notice(`Created ${finalFileName}`);
      
    } catch (err) {
      console.error("Failed to create CSV with custom name:", err);
      new Notice("Failed to create CSV file.");
    }
  }

  private async resolveTargetFolder(folderPath?: string): Promise<TFolder | null> {
    if (folderPath) {
      const af = this.app.vault.getAbstractFileByPath(folderPath);
      if (af instanceof TFolder) return af;
      return null;
    }

    // If there is an active file, default to its parent folder
    const active = this.app.workspace.getActiveFile();
    if (active?.parent instanceof TFolder) {
      return active.parent;
    }

    // Fallback to vault root
    return this.app.vault.getRoot();
  }

  // Determine template content:
  // 1) Explicit settings.templatePath (file)
  // 2) Templater community plugin templates folder -> template.csv
  // 3) Core Templates plugin folder -> template.csv
  // 4) Fallback DEFAULT_CSV_CONTENT
  async getTemplateContent(): Promise<string> {
    // 1) Explicit custom path
    if (this.settings.templatePath?.trim()) {
      const file = this.app.vault.getAbstractFileByPath(this.settings.templatePath.trim());
      if (file instanceof TFile) {
        try {
          return await this.app.vault.read(file);
        } catch (e) {
          console.log("Could not read custom templatePath file:", e);
        }
      } else {
        // If it's a folder path, try folder/template.csv
        const maybe = this.joinPath(this.settings.templatePath.trim(), "template.csv");
        const f2 = this.app.vault.getAbstractFileByPath(maybe);
        if (f2 instanceof TFile) {
          try {
            return await this.app.vault.read(f2);
          } catch (e) {
            console.log("Could not read custom template.csv (folder-based):", e);
          }
        }
      }
    }

    // 2) Templater community plugin
    try {
      const templater =
        (this.app as any).plugins?.getPlugin?.("templater-obsidian") ||
        (this.app as any).plugins?.plugins?.["templater-obsidian"];
      const tFolder: string | undefined = templater?.settings?.templates_folder;
      if (tFolder) {
        const tFile = this.app.vault.getAbstractFileByPath(this.joinPath(tFolder, "template.csv"));
        if (tFile instanceof TFile) {
          try {
            return await this.app.vault.read(tFile);
          } catch (e) {
            console.log("Could not read Templater template.csv:", e);
          }
        }
      }
    } catch (e) {
      console.log("Templater detection failed:", e);
    }

    // 3) Core Templates plugin
    try {
      const coreTemplates = (this.app as any).internalPlugins?.plugins?.templates;
      if (coreTemplates?.enabled) {
        const folder = coreTemplates.instance?.options?.folder as string | undefined;
        if (folder) {
          const cFile = this.app.vault.getAbstractFileByPath(this.joinPath(folder, "template.csv"));
          if (cFile instanceof TFile) {
            try {
              return await this.app.vault.read(cFile);
            } catch (e) {
              console.log("Could not read Core Templates template.csv:", e);
            }
          }
        }
      }
    } catch (e) {
      console.log("Core Templates detection failed:", e);
    }

    // 4) Fallback
    return DEFAULT_CSV_CONTENT;
  }

  private joinPath(folder: string, name: string): string {
    if (!folder || folder === "/") return name;
    return `${folder.replace(/\/+$/, "")}/${name.replace(/^\/+/, "")}`;
  }
}

class CSVView extends TextFileView {
  private tableData: string[][] = [];
  private tableEl: HTMLTableElement | null = null;

  getViewType(): string {
    return VIEW_TYPE_CSV;
  }

  getDisplayText(): string {
    return this.file?.name || "CSV";
  }

  getIcon(): string {
    return "table";
  }

  // Called when Obsidian wants to save the file
  getViewData(): string {
    return this.tableData.map((row) => row.join(",")).join("\n");
  }

  // Called when Obsidian provides file content
  setViewData(data: string, _clear: boolean): void {
    this.tableData = this.parseCSV(data);
    this.refresh();
  }

  clear(): void {
    this.tableData = [];
    if (this.tableEl) {
      this.tableEl.empty();
    }
  }

  async onOpen(): Promise<void> {
    // Toolbar
    const toolbar = this.contentEl.createEl("div", { cls: "csv-toolbar" });

    const addRowBtn = toolbar.createEl("button", { text: "+R", cls: "csv-btn" });
    addRowBtn.addEventListener("click", () => this.addRow());

    const removeRowBtn = toolbar.createEl("button", { text: "-R", cls: "csv-btn" });
    removeRowBtn.addEventListener("click", () => this.removeRow());

    const addColBtn = toolbar.createEl("button", { text: "+C", cls: "csv-btn" });
    addColBtn.addEventListener("click", () => this.addColumn());

    const removeColBtn = toolbar.createEl("button", { text: "-C", cls: "csv-btn" });
    removeColBtn.addEventListener("click", () => this.removeColumn());

    // Table container
    const tableContainer = this.contentEl.createEl("div", { cls: "csv-table-container" });
    this.tableEl = tableContainer.createEl("table", { cls: "csv-table" });
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
    this.tableEl = null;
  }

  private parseCSV(data: string): string[][] {
    const trimmed = data?.trim() ?? "";
    if (!trimmed) return [["A", "B", "C"], ["0", "0", "0"], ["1", "1", "1"], ["2", "2", "2"]];

    const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
    const result: string[][] = [];

    for (const line of lines) {
      const row = this.parseCSVLine(line);
      if (row.length > 0) result.push(row);
    }

    return result.length > 0 ? result : [["A", "B", "C"], ["0", "0", "0"], ["1", "1", "1"], ["2", "2", "2"]];
  }

  private parseCSVLine(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  }

private refresh(): void {
  if (!this.tableEl) return;

  this.tableEl.empty();

  this.tableData.forEach((row, r) => {
    const tr = this.tableEl!.createEl("tr");
    
    // Add row number cell first
    const rowNumTd = tr.createEl("td", { cls: "csv-row-number" });
    rowNumTd.textContent = (r + 1).toString();
    
    // Then add the data cells
    row.forEach((cell, c) => {
      const td = tr.createEl("td");
      const input = td.createEl("input", { type: "text", value: cell }) as HTMLInputElement;

      input.addEventListener("input", () => {
        this.tableData[r][c] = input.value;
        this.requestSave();
      });

      input.addEventListener("blur", () => {
        this.requestSave();
      });
    });
  });
}

  private addRow(): void {
    if (this.tableData.length === 0) {
      this.tableData = [["A", "B", "C"]];
    } else {
      const cols = this.tableData[0]?.length ?? 1;
      this.tableData.push(new Array(cols).fill(""));
    }
    this.refresh();
    this.requestSave();
  }

  private removeRow(): void {
    if (this.tableData.length > 1) {
      this.tableData.pop();
      this.refresh();
      this.requestSave();
    } else {
      new Notice("Cannot remove the last row");
    }
  }

  private addColumn(): void {
    if (this.tableData.length === 0) {
      this.tableData = [["A"]];
    } else {
      this.tableData.forEach((row) => row.push(""));
    }
    this.refresh();
    this.requestSave();
  }

  private removeColumn(): void {
    if (this.tableData.length === 0 || (this.tableData[0]?.length ?? 0) <= 1) {
      new Notice("Cannot remove the last column");
      return;
    }
    this.tableData.forEach((row) => row.pop());
    this.refresh();
    this.requestSave();
  }
}

class CrudeCSVSettingTab extends PluginSettingTab {
  plugin: CrudeCSVPlugin;

  constructor(app: App, plugin: CrudeCSVPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Crude CSV Settings" });

    new Setting(containerEl)
      .setName("Template path")
      .setDesc("Optional explicit path to a CSV template file, or a folder that contains template.csv")
      .addText((text) =>
        text
          .setPlaceholder("templates/template.csv or templates/")
          .setValue(this.plugin.settings.templatePath)
          .onChange(async (value) => {
            this.plugin.settings.templatePath = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
