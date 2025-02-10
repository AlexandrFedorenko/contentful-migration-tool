# Contentful Migration Tool

This project is a Contentful migration tool that allows you to back up, restore, and migrate content between different environments.

## 🚀 Installation & Setup

### 1. Clone the Repository
```sh
 git clone https://github.com/AlexandrFedorenko/contentful-migration-tool
 cd contentful-migration-tool
```

### 2. Install Dependencies
```sh
 npm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory and add the following Contentful API keys:

```ini
NEXT_PUBLIC_CONTENTFUL_MANAGEMENT_TOKEN=your_management_token
NEXT_PUBLIC_CONTENTFUL_CDA_TOKEN=your_cda_token
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Where to Get API Keys?
- **Management Token**: Get it from [Contentful API Keys](https://app.contentful.com/) → "Content Management API"
- **CDA Token**: Get it from "Content Delivery API" in Contentful settings

### 4. Start the Application
```sh
npm run dev
```
The application will be available at `http://localhost:3000`

---

## 📌 Features
### ✅ Full Content Backup
Backup all Contentful data including:
- Entries
- Content Types
- Assets
- Locales
- Webhooks

### ✅ Migration Between Environments
Migrate content from one environment (e.g., `master`) to another (e.g., `dev`).
- **Standard Migration**: Copies all content
- **Advanced Migration**: Creates a DIFF file to copy only new and modified entries

### ✅ Restore Content from Backup
Restore Contentful content from a previous backup.

### ✅ Delete Backups
Remove old backups directly from the UI.

---



## ⚠️ Important: Backup Before Production Migration
Before migrating content to production, always create a full backup using this guide:
[Contentful CLI Backup Guide](https://rohitgupta.netlify.app/import-and-export-data-with-contentful-cli)

---

## 🛠 Troubleshooting & Common Issues
| Error | Cause | Solution |
|----------------------|--------------------------------------------------|--------------------------------------------------|
| The content type could not be found | Content Type is missing in the target environment | Manually transfer Content Types first |
| Cannot delete locale | Locales cannot be removed via API | Manually disable or leave them |
| Asset already exists | Duplicate asset during import | Delete the existing asset and retry |
| Some entries failed to import | Content Type structure changed | Ensure the Content Type exists and is unchanged |

---

## 📜 License
This project is licensed under the MIT License.

## 📧 Contact
For issues or feature requests, open an issue in the repository or contact the maintainer.