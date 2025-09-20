import fs from 'fs';
import path from 'path';
import os from 'os';

const homeDir = os.homedir();
const configDir = path.join(homeDir, '.config', 'emnavi_asset_manager');
fs.mkdirSync(configDir, { recursive: true });

const configFilePath = path.join(configDir, 'config.json');

type Config = {
    [key: string]: any;
};

class ConfigManager {
    private filePath: string;
    private config: Config;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.config = {};
        this.load();
    }

    private load() {
        if (fs.existsSync(this.filePath)) {
            const content = fs.readFileSync(this.filePath, 'utf-8');
            try {
                this.config = JSON.parse(content);
            } catch {
                this.config = {};
            }
        }
    }

    get(key: string, defaultValue?: any) {
        return this.config[key] !== undefined ? this.config[key] : defaultValue;
    }

    set(key: string, value: any) {
        this.config[key] = value;
        this.save();
    }

    save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.config, null, 2), 'utf-8');
    }

    getAll() {
        return { ...this.config };
    }
}

const configManager = new ConfigManager(configFilePath);

export default configManager;