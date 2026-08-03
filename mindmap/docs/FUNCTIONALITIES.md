# Functional Specifications & Feature Manual (`FUNCTIONALITIES.md`)

This document defines the complete functional features, UI interaction patterns, rich markdown article engine, AI generation capabilities, and keyboard shortcut specifications for **Meta-Fikra Mind Map** (`pub/mindmap`).

---

## 🎨 1. Interactive Mind Map Canvas

### Organic Bacterial Node Morphing
- Nodes are rendered on an HTML5 canvas using smooth quadratic curve interpolation between 16 animated radial vertices.
- Vertices oscillate subtly using pre-calculated sine/cosine wave distortion lookup tables, giving the nodes an organic, dynamic appearance.

### Visual Node Badges
- **Subtree Children Counter (`+N`)**: Displayed at top-center of parent nodes (`y - r * 0.72`) in a soft dark slate pill container (`rgba(38, 42, 56, 0.94)`), indicating total descendant nodes in that branch.
- **Vector Eye Article Badge (`👁`)**: Displayed at bottom-center of nodes (`y + r * 0.72`).
  - **Gold Outline (`#e2b714`)**: Unread article attached to node.
  - **Emerald Green Outline (`#10b981`)**: Read article.

---

## 📖 2. Rich Markdown Article Reader & EasyMDE Editor

### Deep Node Knowledge Articles
Every node in the mind map can store a full-length Markdown article (`node.article.content`), containing headers, bullet lists, code snippets, data tables, and inline images.

### Article Reader Modal (`#articleModal`)
- Clicking the vector eye badge (`👁`) or pressing **`Space`** on a focused node opens the Rich Article Reader.
- Rendered using `marked.js` with RTL Arabic text alignment.

### Integrated Single-Box EasyMDE Editor
- Clicking **"تعديل المقال"** (Edit Article) transitions the modal into the single-box **EasyMDE Editor**.
- Features Markdown toolbar formatting (Bold, Italic, Code, Headings, Tables, Lists, Undo/Redo) and split preview pane.

### Per-Visitor Article Read Tracking
- Article read status is stored independently per visitor in `localStorage` under `mf_read_articles`.
- Preserves article content while allowing each individual reader to mark articles as read/unread without mutating shared maps.

---

## 🤖 3. AI Mind Map Generator (Groq Llama 3.3 70B)

### AI Generation Modal (`#aiModalOverlay`)
- Opened via the magic wand button in the top header bar or shortcut **`Alt + A`**.
- User inputs any concept, topic, or outline in natural Arabic or English.

### Suggested Topic Chips
- Typography-focused clean chips (*الذكاء الاصطناعي*, *العلوم والفيزياء*, *إطلاق مشروع*, *علم النفس والمنطق*, *التسويق والأعمال*) for instant 1-click prompt selection.

### Minimalist Loading Animation & Cycling Status
- While generating, a glowing gold magic pulse ring and progress bar display dynamically cycling Arabic status messages:
  1. *"جاري استدعاء المعرفة وتنظيم الأفكار..."*
  2. *"نسج الهيكل الشجري والمفاهيم..."*
  3. *"صياغة المقالات الشارحة والتوضيحات..."*
  4. *"تحضير الخريطة الذهنية التفاعلية..."*

---

## 🎹 4. Universal Keyboard Shortcuts Matrix

| Action | Primary Shortcut | Alternative | Description |
| :--- | :--- | :--- | :--- |
| **Add Child Node** | `Tab` | Toolbar `+` | Creates a new child node under the currently focused node. |
| **Add Sibling Node** | `Shift + Tab` | Toolbar `+ Sibling` | Creates a new sibling node at the same hierarchy level. |
| **Edit Node Text** | `Enter` | Double Click / Toolbar Pen | Opens inline text input to modify the node label. |
| **Open Article Reader** | `Space` | Click Eye Badge (`👁`) | Opens the Rich Markdown Article Reader for the focused node. |
| **Toggle Read Status** | `Enter` (inside Article Modal) | Status Pill Click | Toggles article read state between Unread (Gold) and Read (Green). |
| **Toggle Completion** | `Ctrl + Enter` | Toolbar Checkmark | Toggles completed checkmark status (`✓`) on node. |
| **Delete Node** | `Delete` / `Backspace` | Toolbar Trash | Deletes the currently focused node and its subtree. |
| **Undo Action** | `Ctrl + Z` / `Cmd + Z` | Toolbar Undo | Reverts the last mind map edit. |
| **Redo Action** | `Ctrl + Y` / `Cmd + Y` | Toolbar Redo | Re-applies the reverted mind map edit. |
| **Universal Close** | `Escape` | Modal Background Click | Closes any open modal, drawer, popup, search bar, or node input. |
| **Save Local `.mt`** | `Ctrl + S` / `Cmd + S` | File Menu -> Save | Exports the current mind map as a `.mt` text file. |
| **Open Local `.mt`** | `Ctrl + O` / `Cmd + O` | File Menu -> Open | Imports a `.mt` or JSON mind map file from disk. |
| **Export PNG Image** | `Ctrl + E` / `Cmd + E` | File Menu -> Export PNG | Renders high-resolution PNG image of the canvas. |
| **Search Mind Map** | `Ctrl + F` / `/` | Header Search Box | Focuses search input to filter titles & articles. |
| **Toggle Direction** | `G` | Header Direction Icon | Toggles layout branching direction (Right-to-Left / Left-to-Right). |
| **AI Generator** | `Alt + A` | Header Wand Icon | Opens the AI Mind Map Generator Modal. |
| **About Project** | `I` / `Alt + I` | Sublabel "خريطة الأفكار" | Opens the Glassmorphic About Project Modal with version info. |

---

## ☁️ 5. Cloud Storage & Shared Links

1. **Saved Cloud Maps Drawer**:
   - Registered/Logged-in users can save maps to Cloudflare D1 SQL database via `POST /api/maps`.
   - Access saved cloud maps anytime from the Cloud Drawer (`#cloudMapsDrawer`).

2. **Read-Only Shareable Links**:
   - Click **"مشاركة"** (Share) in the header to generate a public read-only link (`https://metafikra.com/?share=SHARE_ID`).
   - Visitors opening shared links can view, search, read attached articles, and click **"حفظ نسخة في حسابي"** (Fork to Account) to create a personal editable copy.
