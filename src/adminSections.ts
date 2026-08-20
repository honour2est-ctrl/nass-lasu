// ============================================================================
// ADMIN SECTIONS CONFIG
// ----------------------------------------------------------------------------
// This file is the single source of truth for what shows up in the Admin
// Panel. Each entry in BUILT_IN_SECTIONS describes one manageable part of the
// website: which Firestore collection it reads/writes, what fields it has,
// and how those fields should be edited (plain text, long text, a single
// image, or a multi-photo gallery).
//
// TO ADD A NEW BUILT-IN SECTION TO THE SITE (requires a code change):
//   1. Add a new object to BUILT_IN_SECTIONS below.
//   2. That's it — the Admin Panel automatically gets a new tab, a form,
//      image/gallery upload, bulk actions, CSV export, etc. No other file
//      needs to change.
//
// TO ADD A NEW SECTION WITHOUT TOUCHING CODE:
//   Admins can also do this live from the Admin Panel itself via
//   "+ New Section" — those are stored in the `adminSectionConfigs`
//   Firestore collection and merged in at runtime (see AdminPanel.tsx).
// ============================================================================

export type AdminFieldType =
  | 'text'
  | 'textarea'
  | 'richtext'   // long textarea, used for bios/summaries
  | 'number'
  | 'url'
  | 'select'
  | 'image'      // single image, uploaded via FileUploadZone
  | 'gallery';   // multiple images, stored as a comma-separated string

export interface AdminField {
  key: string;
  label: string;
  type: AdminFieldType;
  options?: string[];      // required for 'select'
  placeholder?: string;
  required?: boolean;
}

export interface AdminSection {
  key: string;              // stable internal id, also used as the tab key
  label: string;             // shown on the tab button
  collection: string;        // Firestore collection name
  fields: AdminField[];
  titleField: string;        // which field is used as the card's heading
  subtitleField?: string;    // which field is used as the card's subheading
  isCustom?: boolean;        // true for sections created live from the UI
}

// ----------------------------------------------------------------------------
// Reusable option lists
// ----------------------------------------------------------------------------
const DEPARTMENT_OPTIONS = [
  'Department of Biochemistry',
  'Department of Botany',
  'Department of Chemistry',
  'Department of Fisheries and Aquatic Biology',
  'Department of Mathematics',
  'Department of Microbiology',
  'Department of Physics',
  'Department of Science Laboratory Technology',
  'Department of Zoology and Environment Biology',
];

const LEVEL_OPTIONS = ['100 Level', '200 Level', '300 Level', '400 Level'];
const SEMESTER_OPTIONS = ['First Semester', 'Second Semester'];

// ----------------------------------------------------------------------------
// Built-in sections — mirrors what the site currently reads from Firestore
// ----------------------------------------------------------------------------
export const BUILT_IN_SECTIONS: AdminSection[] = [
  {
    key: 'executives',
    label: 'Executives',
    collection: 'executives',
    titleField: 'name',
    subtitleField: 'office',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'nickname', label: 'Nickname', type: 'text' },
      { key: 'office', label: 'Office / Position', type: 'text', required: true },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'summary', label: 'Bio / Summary', type: 'richtext' },
      { key: 'imageUrl', label: 'Photo', type: 'image' },
    ],
  },
  {
    key: 'ssrc',
    label: 'SSRC Members',
    collection: 'ssrcMembers',
    titleField: 'name',
    subtitleField: 'duty',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'duty', label: 'Duty / Role', type: 'text', required: true },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'imageUrl', label: 'Photo', type: 'image' },
    ],
  },
  {
    key: 'brands',
    label: 'Student Brands',
    collection: 'studentBrands',
    titleField: 'name',
    subtitleField: 'category',
    fields: [
      { key: 'name', label: 'Brand Name', type: 'text', required: true },
      { key: 'owner', label: 'Owner', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'contact', label: 'Contact Number', type: 'text' },
      { key: 'whatsappNumber', label: 'WhatsApp Number', type: 'text', required: true },
      { key: 'price', label: 'Price', type: 'text' },
      { key: 'website', label: 'Website', type: 'url' },
      { key: 'imageUrl', label: 'Brand Image', type: 'image', required: true },
      { key: 'productImageUrl', label: 'Product Image', type: 'image' },
    ],
  },
  {
    key: 'announcements',
    label: 'Announcements',
    collection: 'announcements',
    titleField: 'title',
    subtitleField: 'description',
    fields: [
      { key: 'tag', label: 'Tag', type: 'text' },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'event1Date', label: 'Event 1 Date', type: 'text' },
      { key: 'event1Text', label: 'Event 1 Label', type: 'text' },
      { key: 'event2Date', label: 'Event 2 Date', type: 'text' },
      { key: 'event2Text', label: 'Event 2 Label', type: 'text' },
    ],
  },
  {
    key: 'events',
    label: 'Events & Galleries',
    collection: 'events',
    titleField: 'title',
    subtitleField: 'category',
    fields: [
      { key: 'title', label: 'Event Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'image', label: 'Cover Image', type: 'image', required: true },
      { key: 'images', label: 'Photo Gallery', type: 'gallery' },
    ],
  },
  {
    key: 'vaultItems',
    label: 'Academic Vault',
    collection: 'vaultItems',
    titleField: 'title',
    subtitleField: 'department',
    fields: [
      { key: 'title', label: 'Document Title', type: 'text', required: true },
      { key: 'department', label: 'Department', type: 'select', options: DEPARTMENT_OPTIONS },
      { key: 'level', label: 'Level', type: 'select', options: LEVEL_OPTIONS },
      { key: 'semester', label: 'Semester', type: 'select', options: SEMESTER_OPTIONS },
      { key: 'year', label: 'Year', type: 'text' },
      { key: 'link', label: 'Document Link (Google Drive, etc.)', type: 'url' },
    ],
  },
  {
    key: 'knowledgeBase',
    label: 'Knowledge Base',
    collection: 'knowledgeBase',
    titleField: 'title',
    subtitleField: 'content',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'content', label: 'Content', type: 'richtext', required: true },
    ],
  },
];

// ----------------------------------------------------------------------------
// Blank "new item" builder — every field gets a sensible empty default so the
// form always has a stable, predictable shape when creating a new document.
// ----------------------------------------------------------------------------
export const blankItemFor = (section: AdminSection): Record<string, any> => {
  const item: Record<string, any> = {};
  section.fields.forEach((f) => {
    if (f.type === 'number') item[f.key] = 0;
    else if (f.type === 'select') item[f.key] = f.options?.[0] || '';
    else item[f.key] = '';
  });
  return item;
};
