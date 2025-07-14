// import { Injectable } from '@angular/core';
// import { saveAs } from 'file-saver';
// import JSZip from 'jszip';

// @Injectable({
//   providedIn: 'root'
// })
// export class DownloadPageService {
//   async downloadCurrentPage() {
//     try {
//       const zip = new JSZip();

//       // 1. Get current page HTML
//       let html = this.getPageHTML();

//       // 2. Add custom files
//       this.addReadmeFile(zip);
//       html = this.addActionsFile(zip, html);

//       // 3. Add external libraries
//       await this.addExternalLibraries(zip);

//       // 4. Save modified HTML
//       zip.file('page.html', html);

//       // 5. Extract and download assets
//       await this.processAssets(html, zip);

//       // 6. Generate and download ZIP
//       const content = await zip.generateAsync({ type: 'blob' });
//       saveAs(content, 'page-with-assets-and-actions.zip');
//     } catch (error) {
//       console.error('Error downloading page:', error);
//     }
//   }
//   private addReadmeFile(zip: JSZip): void {
//     const readmeContent = `This ZIP contains a snapshot of the webpage with all assets.
    
// HOW TO USE:
// 1. Extract all files
// 2. Open 'page.html' in your browser
// 3. Custom functions are available in the 'actions.js' file

// CUSTOM ACTIONS:
// - refreshContent(): Reloads dynamic content
// - analyzePage(): Provides page analytics
// - exportAsPDF(): Converts page to PDF (requires jsPDF)`;

//     zip.file('README.txt', readmeContent);
//   }

//   private addActionsFile(zip: JSZip, html: string): string {
//     const actionsJs = `...`; // The full JS content from earlier

//     const jsFolder = zip.folder('js');
//     if (jsFolder) {
//       jsFolder.file('actions.js', actionsJs);
//     }

//     // Modify HTML to include the actions.js file
//     return html.replace(
//       '</head>',
//       `<script src="js/actions.js"></script>\n</head>`
//     );
//   }

//   private async addExternalLibraries(zip: JSZip): Promise<void> {
//     const jsFolder = zip.folder('js');

//     // Add jsPDF library
//     try {
//       const jsPDFResponse = await fetch('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
//       if (jsPDFResponse.ok) {
//         const jsPDFBlob = await jsPDFResponse.blob();
//         if (jsFolder) {
//           jsFolder.file('jspdf.umd.min.js', jsPDFBlob);

//           // Also add the initialization script
//           jsFolder.file('init-pdf.js', `
//             window.jsPDF = window.jspdf.jsPDF;
//             console.log('jsPDF initialized');
//           `);
//         }
//       }
//     } catch (error) {
//       console.warn('Could not download jsPDF library:', error);
//     }
//   }

//   private getPageHTML(): string {
//     // Get the doctype
//     const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '';

//     // Get the HTML
//     const html = document.documentElement.outerHTML;

//     return doctype + html;
//   }

// private async processAssets(html: string, zip: JSZip): Promise<void> {
//   const cssFolder = zip.folder('css');
//   const jsFolder = zip.folder('js');
//   const imgFolder = zip.folder('images');
  
//   const assetUrls = this.extractAssetUrls(html);
  
//   // Create a map to track downloaded assets and avoid duplicates
//   const downloadedAssets = new Map<string, string>();
  
//   for (const url of assetUrls) {
//     try {
//       // Skip if already downloaded
//       if (downloadedAssets.has(url)) continue;
      
//       // Skip invalid URLs
//       if (!url || url.trim() === '') continue;
      
//       const response = await fetch(url, { 
//         mode: 'cors',
//         credentials: 'same-origin'
//       });
      
//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status} ${response.statusText}`);
//       }
      
//       const blob = await response.blob();
//       const filename = this.getFilenameFromUrl(url);
      
//       // Store in appropriate folder
//       if (url.endsWith('.css') && cssFolder) {
//         cssFolder.file(filename, blob);
//       } else if (url.endsWith('.js') && jsFolder) {
//         jsFolder.file(filename, blob);
//       } else if (this.isImageUrl(url) && imgFolder) {
//         imgFolder.file(filename, blob);
//       } else {
//         zip.file(filename, blob);
//       }
      
//       // Mark as downloaded
//       downloadedAssets.set(url, filename);
      
//     } catch (error) {
//       console.warn(`Could not download asset ${url}:`, error);
//       // Optionally: Add placeholder file to indicate missing asset
//       if (cssFolder && url.endsWith('.css')) {
//         cssFolder.file(this.getFilenameFromUrl(url), `/* Missing: ${url} */`);
//       }
//     }
//   }
// }

//   private extractAssetUrls(html: string): string[] {
//     const urls = new Set<string>();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');

//     const extractAndAdd = (element: Element, attribute: string) => {
//       const value = element.getAttribute(attribute);
//       if (value && !value.startsWith('data:')) {
//         try {
//           const absoluteUrl = this.makeAbsoluteUrl(value);
//           urls.add(absoluteUrl);
//         } catch (error) {
//           console.warn(`Could not resolve URL: ${value}`, error);
//         }
//       }
//     };

//     // Extract CSS links
//     doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
//       extractAndAdd(link, 'href');
//     });

//     // Extract script sources
//     doc.querySelectorAll('script[src]').forEach(script => {
//       extractAndAdd(script, 'src');
//     });

//     // Extract image sources
//     doc.querySelectorAll('img[src]').forEach(img => {
//       extractAndAdd(img, 'src');
//     });

//     // Extract background images from inline styles
//     doc.querySelectorAll('*[style]').forEach(el => {
//       const style = el.getAttribute('style') || '';
//       const bgImageMatches = style.match(/url\(['"]?(.*?)['"]?\)/gi) || [];
//       bgImageMatches.forEach(match => {
//         const urlMatch = match.match(/url\(['"]?(.*?)['"]?\)/i);
//         if (urlMatch && urlMatch[1] && !urlMatch[1].startsWith('data:')) {
//           try {
//             const absoluteUrl = this.makeAbsoluteUrl(urlMatch[1]);
//             urls.add(absoluteUrl);
//           } catch (error) {
//             console.warn(`Could not resolve background URL: ${urlMatch[1]}`, error);
//           }
//         }
//       });
//     });

//     return Array.from(urls);
//   }


//   private makeAbsoluteUrl(url: string): string {
//     // Skip if already absolute URL or data URI
//     if (url.startsWith('http') || url.startsWith('data:')) return url;
//     if (url.startsWith('//')) return window.location.protocol + url;

//     // Get base href from document
//     const baseElement = document.querySelector('base');
//     const baseHref = baseElement ? baseElement.getAttribute('href') || '/' : '/';

//     // Handle root-relative paths
//     if (url.startsWith('/')) {
//       return window.location.origin + baseHref + url.substring(1);
//     }

//     // Handle relative paths (including ../)
//     const baseUrl = window.location.origin + window.location.pathname;
//     const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);

//     // Combine with base href
//     const fullBase = window.location.origin + baseHref;

//     // Resolve relative paths
//     try {
//       const resolvedUrl = new URL(url, fullBase).href;
//       return resolvedUrl;
//     } catch (error) {
//       console.warn(`Failed to resolve URL: ${url}`, error);
//       // Fallback to simple concatenation
//       return fullBase + url;
//     }
//   }

//   private getFilenameFromUrl(url: string): string {
//     return url.split('/').pop() || 'file';
//   }

//   private isImageUrl(url: string): boolean {
//     return /\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i.test(url);
//   }
// }

// import { Injectable } from '@angular/core';
// import { saveAs } from 'file-saver';
// import JSZip from 'jszip';

// @Injectable({
//   providedIn: 'root'
// })
// export class DownloadPageService {
//   async downloadCurrentPage() {
//     try {
//       const zip = new JSZip();

//       // 1. Get current page HTML
//       let html = this.getPageHTML();

//       // 2. Add interactive functionality
//       html = this.addInteractiveScripts(zip, html);

//       // 3. Add content manager for state persistence
//       this.addContentManager(zip);
//       html = html.replace(
//         '</head>',
//         `<script src="js/content-manager.js"></script>\n</head>`
//       );

//       // 4. Add supporting files
//       this.addReadmeFile(zip);
//       await this.addExternalLibraries(zip);

//       // 5. Save modified HTML
//       zip.file('index.html', html);

//       // 6. Extract and download assets
//       await this.processAssets(html, zip);

//       // 7. Generate and download ZIP
//       const content = await zip.generateAsync({ type: 'blob' });
//       saveAs(content, 'presentation.zip');
//     } catch (error) {
//       console.error('Error downloading page:', error);
//     }
//   }

//   private addReadmeFile(zip: JSZip): void {
//     const readmeContent = `INTERACTIVE PAGE DOWNLOAD

// Features Included:
// - Button click handlers
// - Form submission handling
// - Dark mode toggle
// - Content preservation (saves to localStorage)
// - Toast notifications
// - Right-click context menu control
// - Auto-save functionality

// How to Use:
// 1. Extract all files
// 2. Open index.html in a browser
// 3. Interact with the page using:
//    - [data-action] attributes on buttons
//    - Forms with custom submission handling
//    - Persistent content with [data-save] attributes`;
    
//     zip.file('README.txt', readmeContent);
//   }

//   private addInteractiveScripts(zip: JSZip, html: string): string {
//     const interactiveJs = `
// // Main application functionality
// document.addEventListener('DOMContentLoaded', function() {
//   // Initialize all interactive components
//   initButtons();
//   initForms();
//   addGlobalHandlers();
  
//   // Add action panel UI
//   addActionPanel();
// });

// // Initialize button behaviors
// function initButtons() {
//   // Add click handlers to all buttons with [data-action] attributes
//   document.querySelectorAll('[data-action]').forEach(button => {
//     button.addEventListener('click', function() {
//       const action = this.getAttribute('data-action');
//       handleAction(action, this);
//     });
//   });
// }

// // Handle custom actions
// function handleAction(action, element) {
//   switch(action) {
//     case 'refresh':
//       location.reload();
//       break;
//     case 'print':
//       window.print();
//       break;
//     case 'toggle-dark':
//       document.body.classList.toggle('dark-mode');
//       localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
//       break;
//     default:
//       console.log('Action not implemented:', action);
//   }
// }

// // Form handling
// function initForms() {
//   document.querySelectorAll('form').forEach(form => {
//     form.addEventListener('submit', function(e) {
//       e.preventDefault();
//       showToast('Form submitted! (Demo)');
      
//       // Collect form data
//       const formData = {};
//       this.querySelectorAll('[name]').forEach(input => {
//         formData[input.getAttribute('name')] = input.value;
//       });
      
//       console.log('Form data:', formData);
//     });
//   });
// }

// // Global event handlers
// function addGlobalHandlers() {
//   // Restore dark mode preference
//   if (localStorage.getItem('darkMode') === 'true') {
//     document.body.classList.add('dark-mode');
//   }

//   // Confirm before leaving page with unsaved changes
//   window.addEventListener('beforeunload', function(e) {
//     if (document.querySelector('form.dirty')) {
//       e.preventDefault();
//       e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
//     }
//   });
// }

// // Add action panel UI
// function addActionPanel() {
//   const style = document.createElement('style');
//   style.textContent = \`
//     .action-panel {
//       position: fixed;
//       bottom: 20px;
//       right: 20px;
//       z-index: 1000;
//       background: white;
//       padding: 10px;
//       border: 1px solid #ddd;
//       border-radius: 5px;
//       box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//     }
//     .action-btn {
//       display: block;
//       margin: 5px 0;
//       padding: 5px 10px;
//       background: #007bff;
//       color: white;
//       border: none;
//       border-radius: 3px;
//       cursor: pointer;
//     }
//     .dark-mode .action-panel {
//       background: #333;
//       color: white;
//     }
//     .toast-message {
//       position: fixed;
//       bottom: 60px;
//       right: 20px;
//       background: rgba(0,0,0,0.7);
//       color: white;
//       padding: 10px 20px;
//       border-radius: 4px;
//       z-index: 1000;
//     }
//     .dark-mode {
//       background-color: #222;
//       color: #eee;
//     }
//     [data-action] {
//       cursor: pointer;
//       transition: all 0.2s;
//     }
//     [data-action]:hover {
//       opacity: 0.8;
//     }
//   \`;
//   document.head.appendChild(style);

//   const panel = document.createElement('div');
//   panel.className = 'action-panel';
//   panel.innerHTML = \`
//     <h3>Page Actions</h3>
//     <button class="action-btn" data-action="refresh">Refresh Page</button>
//     <button class="action-btn" data-action="print">Print Page</button>
//     <button class="action-btn" data-action="toggle-dark">Toggle Dark Mode</button>
//   \`;
//   document.body.appendChild(panel);
// }

// // Show toast notification
// function showToast(message, duration = 3000) {
//   const toast = document.createElement('div');
//   toast.className = 'toast-message';
//   toast.textContent = message;
//   document.body.appendChild(toast);
//   setTimeout(() => toast.remove(), duration);
// }

// // Add utility functions to window object
// window.pageUtils = {
//   toggleMenu: function() {
//     const menu = document.querySelector('.main-menu');
//     if (menu) menu.classList.toggle('open');
//   },
//   copyToClipboard: function(text) {
//     navigator.clipboard.writeText(text);
//     showToast('Copied to clipboard!');
//   },
//   showToast: showToast
// };
// `;

//     const jsFolder = zip.folder('js') || zip;
//     jsFolder.file('interactive.js', interactiveJs);

//     return html.replace(
//       '</body>',
//       `<script src="js/interactive.js"></script>\n</body>`
//     );
//   }

//   private addContentManager(zip: JSZip) {
//     const contentManagerJs = `
// class ContentManager {
//   constructor() {
//     this.data = {};
//     this.init();
//   }
  
//   init() {
//     // Load saved data from localStorage
//     const savedData = localStorage.getItem('pageData');
//     if (savedData) {
//       this.data = JSON.parse(savedData);
//       this.restoreState();
//     }
//   }
  
//   saveState() {
//     // Save all data-attributes values
//     document.querySelectorAll('[data-save]').forEach(el => {
//       const key = el.getAttribute('data-save');
//       this.data[key] = el.value || el.textContent;
//     });
//     localStorage.setItem('pageData', JSON.stringify(this.data));
//   }
  
//   restoreState() {
//     // Restore saved values
//     document.querySelectorAll('[data-save]').forEach(el => {
//       const key = el.getAttribute('data-save');
//       if (this.data[key]) {
//         if (el.value !== undefined) {
//           el.value = this.data[key];
//         } else {
//           el.textContent = this.data[key];
//         }
//       }
//     });
//   }
// }

// // Initialize when DOM is loaded
// document.addEventListener('DOMContentLoaded', () => {
//   window.contentManager = new ContentManager();
  
//   // Auto-save every 5 seconds
//   setInterval(() => {
//     contentManager.saveState();
//   }, 5000);
  
//   // Mark forms as dirty when changed
//   document.querySelectorAll('form').forEach(form => {
//     form.addEventListener('input', () => {
//       form.classList.add('dirty');
//     });
//   });
// });
// `;

//     const jsFolder = zip.folder('js') || zip;
//     jsFolder.file('content-manager.js', contentManagerJs);
//   }

//   private async addExternalLibraries(zip: JSZip): Promise<void> {
//     const jsFolder = zip.folder('js');

//     // Add jsPDF library
//     try {
//       const jsPDFResponse = await fetch('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
//       if (jsPDFResponse.ok) {
//         const jsPDFBlob = await jsPDFResponse.blob();
//         if (jsFolder) {
//           jsFolder.file('jspdf.umd.min.js', jsPDFBlob);
          
//           // Add PDF export initialization
//           jsFolder.file('init-pdf.js', `
//             window.jsPDF = window.jspdf.jsPDF;
            
//             // Add PDF export button if jsPDF loaded successfully
//             document.addEventListener('DOMContentLoaded', () => {
//               const pdfBtn = document.createElement('button');
//               pdfBtn.className = 'action-btn';
//               pdfBtn.textContent = 'Export as PDF';
//               pdfBtn.onclick = function() {
//                 const doc = new jsPDF();
//                 doc.html(document.body, {
//                   callback: function(doc) {
//                     doc.save('page-export.pdf');
//                     window.pageUtils.showToast('PDF exported!');
//                   },
//                   margin: 10
//                 });
//               };
              
//               const panel = document.querySelector('.action-panel');
//               if (panel) {
//                 panel.appendChild(pdfBtn);
//               }
//             });
//           `);
//         }
//       }
//     } catch (error) {
//       console.warn('Could not download jsPDF library:', error);
//     }
//   }

//   private getPageHTML(): string {
//     // Get the doctype
//     const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '';

//     // Get the HTML
//     const html = document.documentElement.outerHTML;

//     return doctype + html;
//   }

//   private async processAssets(html: string, zip: JSZip): Promise<void> {
//     const cssFolder = zip.folder('css');
//     const jsFolder = zip.folder('js');
//     const imgFolder = zip.folder('images');
//     const fontsFolder = zip.folder('fonts');
    
//     const assetUrls = this.extractAssetUrls(html);
    
//     const downloadedAssets = new Map<string, string>();
    
//     for (const url of assetUrls) {
//       try {
//         if (downloadedAssets.has(url)) continue;
//         if (!url || url.trim() === '') continue;
        
//         const cleanUrl = this.cleanAssetUrl(url);
//         const response = await fetch(cleanUrl, { 
//           mode: 'cors',
//           credentials: 'same-origin'
//         });
        
//         if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        
//         const blob = await response.blob();
//         const filename = this.getFilenameFromUrl(cleanUrl);
        
//         // Organize files by type
//         if (cleanUrl.endsWith('.css') && cssFolder) {
//           cssFolder.file(filename, blob);
//         } else if (cleanUrl.endsWith('.js') && jsFolder) {
//           jsFolder.file(filename, blob);
//         } else if (this.isImageUrl(cleanUrl) && imgFolder) {
//           imgFolder.file(filename, blob);
//         } else if (this.isFontUrl(cleanUrl) && fontsFolder) {
//           fontsFolder.file(filename, blob);
//         } else {
//           zip.file(filename, blob);
//         }
        
//         downloadedAssets.set(url, filename);
//       } catch (error) {
//         console.warn(`Could not download asset ${url}:`, error);
//         if (cssFolder && url.endsWith('.css')) {
//           cssFolder.file(this.getFilenameFromUrl(url), `/* Missing: ${url} */`);
//         }
//       }
//     }
//   }

//   private cleanAssetUrl(url: string): string {
//     // Remove query parameters and hash
//     return url.split('?')[0].split('#')[0];
//   }

//   private extractAssetUrls(html: string): string[] {
//     const urls = new Set<string>();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');

//     const extractAndAdd = (element: Element, attribute: string) => {
//       const value = element.getAttribute(attribute);
//       if (value && !value.startsWith('data:')) {
//         try {
//           const absoluteUrl = this.makeAbsoluteUrl(value);
//           urls.add(absoluteUrl);
//         } catch (error) {
//           console.warn(`Could not resolve URL: ${value}`, error);
//         }
//       }
//     };

//     // Extract CSS links
//     doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
//       extractAndAdd(link, 'href');
//     });

//     // Extract script sources
//     doc.querySelectorAll('script[src]').forEach(script => {
//       extractAndAdd(script, 'src');
//     });

//     // Extract image sources
//     doc.querySelectorAll('img[src], source[src], source[srcset]').forEach(el => {
//       extractAndAdd(el, 'src');
//       if (el.hasAttribute('srcset')) {
//         el.getAttribute('srcset')?.split(',').forEach(src => {
//           const url = src.trim().split(' ')[0];
//           if (url) extractAndAdd(el, 'srcset');
//         });
//       }
//     });

//     // Extract background images
//     doc.querySelectorAll('*[style]').forEach(el => {
//       const style = el.getAttribute('style') || '';
//       const bgImageMatches = style.match(/url\(['"]?(.*?)['"]?\)/gi) || [];
//       bgImageMatches.forEach(match => {
//         const urlMatch = match.match(/url\(['"]?(.*?)['"]?\)/i);
//         if (urlMatch && urlMatch[1] && !urlMatch[1].startsWith('data:')) {
//           try {
//             const absoluteUrl = this.makeAbsoluteUrl(urlMatch[1]);
//             urls.add(absoluteUrl);
//           } catch (error) {
//             console.warn(`Could not resolve background URL: ${urlMatch[1]}`, error);
//           }
//         }
//       });
//     });

//     // Extract font faces
//     const styleSheets = Array.from(document.styleSheets);
//     styleSheets.forEach(sheet => {
//       try {
//         const rules = Array.from(sheet.cssRules || []);
//         rules.forEach(rule => {
//           if (rule instanceof CSSFontFaceRule) {
//             const src = rule.style.getPropertyValue('src');
//             const srcMatch = src?.match(/url\(['"]?(.*?)['"]?\)/i);
//             if (srcMatch && srcMatch[1]) {
//               try {
//                 const absoluteUrl = this.makeAbsoluteUrl(srcMatch[1]);
//                 urls.add(absoluteUrl);
//               } catch (error) {
//                 console.warn(`Could not resolve font URL: ${srcMatch[1]}`, error);
//               }
//             }
//           }
//         });
//       } catch (error) {
//         console.warn('Could not access stylesheet rules:', error);
//       }
//     });

//     return Array.from(urls);
//   }

//   private makeAbsoluteUrl(url: string): string {
//     if (url.startsWith('http') || url.startsWith('data:')) return url;
//     if (url.startsWith('//')) return window.location.protocol + url;

//     const baseElement = document.querySelector('base');
//     const baseHref = baseElement ? baseElement.getAttribute('href') || '/' : '/';

//     if (url.startsWith('/')) {
//       return new URL(url, window.location.origin).href;
//     }

//     // Handle relative paths with base href
//     try {
//       return new URL(url, window.location.origin + baseHref).href;
//     } catch (error) {
//       console.warn(`Failed to resolve URL: ${url}`, error);
//       return window.location.origin + baseHref + url;
//     }
//   }

//   private getFilenameFromUrl(url: string): string {
//     const cleanUrl = this.cleanAssetUrl(url);
//     return cleanUrl.split('/').pop() || 'file';
//   }

//   private isImageUrl(url: string): boolean {
//     return /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(url);
//   }

//   private isFontUrl(url: string): boolean {
//     return /\.(woff|woff2|ttf|eot|otf)$/i.test(url);
//   }
// }


// import { Injectable } from '@angular/core';
// import { saveAs } from 'file-saver';
// import JSZip from 'jszip';

// @Injectable({ providedIn: 'root' })
// export class DownloadPageService {
//   async downloadCurrentPage() {
//     try {
//       const zip = new JSZip();
//       let html = this.getPageHTML();

//       html = this.addInteractiveScripts(zip, html);
//       this.addContentManager(zip);
//       html = html.replace('</head>', `<script src="js/content-manager.js"></script>\n</head>`);

//       this.addReadmeFile(zip);
//       await this.addExternalLibraries(zip);

//       const downloadedAssets = await this.processAssets(html, zip);
//       html = this.updateAssetLinksInHTML(html, downloadedAssets);

//       zip.file('index.html', html);
//       const content = await zip.generateAsync({ type: 'blob' });
//       saveAs(content, 'presentation.zip');
//     } catch (error) {
//       console.error('Error downloading page:', error);
//     }
//   }

//   private addReadmeFile(zip: JSZip): void {
//     const readmeContent = `INTERACTIVE PAGE DOWNLOAD

// Features Included:
// - Button click handlers
// - Form submission handling
// - Dark mode toggle
// - Content preservation (saves to localStorage)
// - Toast notifications
// - Right-click context menu control
// - Auto-save functionality

// How to Use:
// 1. Extract all files
// 2. Open index.html in a browser
// 3. Interact with the page using:
//    - [data-action] attributes on buttons
//    - Forms with custom submission handling
//    - Persistent content with [data-save] attributes`;
//     zip.file('README.txt', readmeContent);
//   }

//   private addInteractiveScripts(zip: JSZip, html: string): string {
//     const interactiveJs = `...`; // truncated for brevity
//     const jsFolder = zip.folder('js') || zip;
//     jsFolder.file('interactive.js', interactiveJs);
//     return html.replace('</body>', `<script src="js/interactive.js"></script>\n</body>`);
//   }

//   private addContentManager(zip: JSZip) {
//     const contentManagerJs = `...`; // truncated for brevity
//     const jsFolder = zip.folder('js') || zip;
//     jsFolder.file('content-manager.js', contentManagerJs);
//   }

//   private async addExternalLibraries(zip: JSZip): Promise<void> {
//     const jsFolder = zip.folder('js');
//     try {
//       const res = await fetch('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
//       if (res.ok) {
//         const blob = await res.blob();
//         jsFolder?.file('jspdf.umd.min.js', blob);
//         jsFolder?.file('init-pdf.js', `...`); // PDF initialization script
//       }
//     } catch (err) {
//       console.warn('Failed to fetch jsPDF:', err);
//     }
//   }

//   private getPageHTML(): string {
//     const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '';
//     return doctype + document.documentElement.outerHTML;
//   }

//   private async processAssets(html: string, zip: JSZip): Promise<Map<string, string>> {
//     const cssFolder = zip.folder('css');
//     const jsFolder = zip.folder('js');
//     const imgFolder = zip.folder('images');
//     const fontsFolder = zip.folder('fonts');
//     const assetUrls = this.extractAssetUrls(html);
//     const downloadedAssets = new Map<string, string>();

//     for (const url of assetUrls) {
//       try {
//         if (!url || downloadedAssets.has(url)) continue;
//         const cleanUrl = this.cleanAssetUrl(url);
//         const res = await fetch(cleanUrl);
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);

//         const blob = await res.blob();
//         const filename = this.getFilenameFromUrl(cleanUrl);

//         if (cleanUrl.endsWith('.css')) cssFolder?.file(filename, blob);
//         else if (cleanUrl.endsWith('.js')) jsFolder?.file(filename, blob);
//         else if (this.isImageUrl(cleanUrl)) imgFolder?.file(filename, blob);
//         else if (this.isFontUrl(cleanUrl)) fontsFolder?.file(filename, blob);
//         else zip.file(filename, blob);

//         downloadedAssets.set(url, filename);
//       } catch (error) {
//         console.warn(`Failed to download asset: ${url}`, error);
//         if (url.endsWith('.css')) cssFolder?.file(this.getFilenameFromUrl(url), `/* Missing: ${url} */`);
//       }
//     }

//     return downloadedAssets;
//   }

//   private updateAssetLinksInHTML(html: string, urlMap: Map<string, string>): string {
//     for (const [originalUrl, filename] of urlMap.entries()) {
//       let folder = '';
//       if (filename.endsWith('.css')) folder = 'css/';
//       else if (filename.endsWith('.js')) folder = 'js/';
//       else if (this.isImageUrl(filename)) folder = 'images/';
//       else if (this.isFontUrl(filename)) folder = 'fonts/';
//       html = html.replaceAll(originalUrl, `${folder}${filename}`);
//     }
//     return html;
//   }

//   private cleanAssetUrl(url: string): string {
//     return url.split('?')[0].split('#')[0];
//   }

//   private extractAssetUrls(html: string): string[] {
//     const urls = new Set<string>();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');

//     const extract = (el: Element, attr: string) => {
//       const val = el.getAttribute(attr);
//       if (val && !val.startsWith('data:')) {
//         try { urls.add(this.makeAbsoluteUrl(val)); } catch {}
//       }
//     };

//     doc.querySelectorAll('link[rel="stylesheet"]').forEach(el => extract(el, 'href'));
//     doc.querySelectorAll('script[src]').forEach(el => extract(el, 'src'));
//     doc.querySelectorAll('img[src], source[src], source[srcset]').forEach(el => {
//       extract(el, 'src');
//       if (el.hasAttribute('srcset')) {
//         el.getAttribute('srcset')?.split(',').forEach(src => {
//           const url = src.trim().split(' ')[0];
//           try { urls.add(this.makeAbsoluteUrl(url)); } catch {}
//         });
//       }
//     });

//     doc.querySelectorAll('[style]').forEach(el => {
//       const style = el.getAttribute('style') || '';
//       (style.match(/url\(['"]?(.*?)['"]?\)/gi) || []).forEach(match => {
//         const urlMatch = match.match(/url\(['"]?(.*?)['"]?\)/i);
//         if (urlMatch?.[1]) urls.add(this.makeAbsoluteUrl(urlMatch[1]));
//       });
//     });

//     return Array.from(urls);
//   }

//   private makeAbsoluteUrl(url: string): string {
//     if (url.startsWith('http') || url.startsWith('data:')) return url;
//     if (url.startsWith('//')) return window.location.protocol + url;
//     const baseElement = document.querySelector('base');
//     const baseHref = baseElement?.getAttribute('href') || '/';
//     return new URL(url, window.location.origin + baseHref).href;
//   }

//   private getFilenameFromUrl(url: string): string {
//     return this.cleanAssetUrl(url).split('/').pop() || 'file';
//   }

//   private isImageUrl(url: string): boolean {
//     return /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(url);
//   }

//   private isFontUrl(url: string): boolean {
//     return /\.(woff|woff2|ttf|eot|otf)$/i.test(url);
//   }
// }



// import { Injectable } from '@angular/core';
// import { saveAs } from 'file-saver';
// import JSZip from 'jszip';

// @Injectable({ providedIn: 'root' })
// export class DownloadPageService {
//   async downloadCurrentPage() {
//     try {
//       const zip = new JSZip();
      
//       // 1. Get HTML with all styles extracted
//       // const { html, styles } = await this.getPageContentWithStyles();
//       let { html, styles } = await this.getPageContentWithStyles();
//       // 2. Add all CSS files
//       const cssFolder = zip.folder('css');
//       styles.forEach((content, index) => {
//         cssFolder?.file(`style-${index}.css`, content);
//       });
      
//       // 3. Add interactive scripts
//       html = this.addInteractiveScripts(zip, html);
      
//       // 4. Add content manager
//       this.addContentManager(zip);
//       html = html.replace('</head>', `<script src="js/content-manager.js"></script>\n</head>`);
      
//       // 5. Add external libraries
//       await this.addExternalLibraries(zip);
      
//       // 6. Process all assets and update links
//       const downloadedAssets = await this.processAssets(html, zip);
//       html = this.updateAssetLinksInHTML(html, downloadedAssets);
      
//       // 7. Add readme file
//       this.addReadmeFile(zip);
      
//       // 8. Save final HTML
//       zip.file('index.html', html);
      
//       // 9. Generate and download ZIP
//       const content = await zip.generateAsync({ type: 'blob' });
//       saveAs(content, 'presentation-with-styles.zip');
//     } catch (error) {
//       console.error('Error downloading page:', error);
//     }
//   }

//   private async getPageContentWithStyles(): Promise<{ html: string, styles: string[] }> {
//     const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '';
//     const doc = document.cloneNode(true) as Document;
//     const styles: string[] = [];
    
//     // 1. Extract all stylesheets
//     const styleSheets = Array.from(document.styleSheets);
//     for (const sheet of styleSheets) {
//       try {
//         if (sheet.href) {
//           // External stylesheet - fetch it
//           const response = await fetch(sheet.href);
//           if (response.ok) {
//             styles.push(await response.text());
//           }
//         } else if (sheet.cssRules) {
//           // Inline styles
//           let cssText = '';
//           for (let i = 0; i < sheet.cssRules.length; i++) {
//             cssText += sheet.cssRules[i].cssText + '\n';
//           }
//           styles.push(cssText);
//         }
//       } catch (error) {
//         console.warn('Could not process stylesheet:', error);
//       }
//     }
    
//     // 2. Extract Angular component styles
//     const componentStyles = this.extractComponentStyles();
//     styles.push(...componentStyles);
    
//     // 3. Create CSS references
//     const links = styles.map((_, i) => 
//       `<link rel="stylesheet" href="css/style-${i}.css">`
//     ).join('\n');
    
//     // Remove existing style/link elements
//     Array.from(doc.querySelectorAll('style, link[rel="stylesheet"]')).forEach(el => el.remove());
    
//     // Add our style references
//     doc.head.insertAdjacentHTML('beforeend', links);
    
//     return {
//       html: doctype + doc.documentElement.outerHTML,
//       styles
//     };
//   }

//   private extractComponentStyles(): string[] {
//     const styles: string[] = [];
    
//     // Get styles from style elements (including Angular component styles)
//     document.querySelectorAll('style').forEach(style => {
//       if (style.textContent) {
//         styles.push(style.textContent);
//       }
//     });
    
//     // Get styles from Angular's runtime styles
//     const runtimeStyles = this.getAngularRuntimeStyles();
//     if (runtimeStyles) {
//       styles.push(runtimeStyles);
//     }
    
//     return styles;
//   }

//   private getAngularRuntimeStyles(): string {
//     // Capture styles added by Angular at runtime
//     const runtimeStyleElements = Array.from(document.querySelectorAll('style'))
//       .filter(el => el.getAttribute('ng-style') || el.textContent?.includes('[_ngcontent'));
    
//     return runtimeStyleElements.map(el => el.textContent || '').join('\n');
//   }

//   private addInteractiveScripts(zip: JSZip, html: string): string {
//     const interactiveJs = `
// // Interactive functionality
// document.addEventListener('DOMContentLoaded', function() {
//   // Initialize buttons
//   document.querySelectorAll('[data-action]').forEach(btn => {
//     btn.addEventListener('click', function() {
//       const action = this.getAttribute('data-action');
//       handleAction(action);
//     });
//   });

//   // Initialize forms
//   document.querySelectorAll('form').forEach(form => {
//     form.addEventListener('submit', function(e) {
//       e.preventDefault();
//       alert('Form submitted (demo)');
//     });
//   });

//   // Add action panel
//   const panel = document.createElement('div');
//   panel.style.position = 'fixed';
//   panel.style.bottom = '20px';
//   panel.style.right = '20px';
//   panel.style.zIndex = '1000';
//   panel.style.background = 'white';
//   panel.style.padding = '10px';
//   panel.style.border = '1px solid #ddd';
//   panel.style.borderRadius = '5px';
//   panel.innerHTML = \`
//     <h3 style="margin:0 0 10px 0">Page Actions</h3>
//     <button data-action="print" style="display:block;width:100%;margin:5px 0;padding:5px;">
//       Print Page
//     </button>
//     <button data-action="dark-mode" style="display:block;width:100%;margin:5px 0;padding:5px;">
//       Toggle Dark Mode
//     </button>
//   \`;
//   document.body.appendChild(panel);
// });

// function handleAction(action) {
//   switch(action) {
//     case 'print':
//       window.print();
//       break;
//     case 'dark-mode':
//       document.body.classList.toggle('dark-mode');
//       break;
//     default:
//       console.log('Action:', action);
//   }
// }

// // Add dark mode styles
// const darkModeStyles = document.createElement('style');
// darkModeStyles.textContent = \`
//   .dark-mode {
//     background-color: #222;
//     color: #eee;
//   }
//   .dark-mode button {
//     background-color: #444;
//     color: white;
//   }
// \`;
// document.head.appendChild(darkModeStyles);
//     `;
    
//     const jsFolder = zip.folder('js') || zip;
//     jsFolder.file('interactive.js', interactiveJs);
//     return html.replace('</body>', `<script src="js/interactive.js"></script>\n</body>`);
//   }

//   private addContentManager(zip: JSZip) {
//     const contentManagerJs = `
// class ContentManager {
//   constructor() {
//     this.data = {};
//     this.init();
//   }
  
//   init() {
//     // Load saved data
//     const savedData = localStorage.getItem('pageData');
//     if (savedData) {
//       this.data = JSON.parse(savedData);
//       this.restoreState();
//     }
//   }
  
//   saveState() {
//     // Save elements with data-save attribute
//     document.querySelectorAll('[data-save]').forEach(el => {
//       const key = el.getAttribute('data-save');
//       this.data[key] = el.value || el.textContent;
//     });
//     localStorage.setItem('pageData', JSON.stringify(this.data));
//   }
  
//   restoreState() {
//     // Restore saved values
//     document.querySelectorAll('[data-save]').forEach(el => {
//       const key = el.getAttribute('data-save');
//       if (this.data[key]) {
//         if (el.value !== undefined) {
//           el.value = this.data[key];
//         } else {
//           el.textContent = this.data[key];
//         }
//       }
//     });
//   }
// }

// // Initialize content manager
// document.addEventListener('DOMContentLoaded', () => {
//   window.contentManager = new ContentManager();
  
//   // Auto-save every 5 seconds
//   setInterval(() => {
//     contentManager.saveState();
//   }, 5000);
// });
//     `;
    
//     const jsFolder = zip.folder('js') || zip;
//     jsFolder.file('content-manager.js', contentManagerJs);
//   }

//   private async addExternalLibraries(zip: JSZip): Promise<void> {
//     const jsFolder = zip.folder('js');
//     if (!jsFolder) return;

//     try {
//       // Add jsPDF
//       const jsPDFResponse = await fetch('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
//       if (jsPDFResponse.ok) {
//         const jsPDFBlob = await jsPDFResponse.blob();
//         jsFolder.file('jspdf.umd.min.js', jsPDFBlob);
        
//         // Add PDF initialization
//         jsFolder.file('init-pdf.js', `
//           window.jsPDF = window.jspdf.jsPDF;
          
//           // Add PDF export button
//           document.addEventListener('DOMContentLoaded', () => {
//             const pdfBtn = document.createElement('button');
//             pdfBtn.className = 'action-btn';
//             pdfBtn.textContent = 'Export as PDF';
//             pdfBtn.onclick = function() {
//               const doc = new jsPDF();
//               doc.html(document.body, {
//                 callback: function(doc) {
//                   doc.save('page-export.pdf');
//                 },
//                 margin: 10
//               });
//             };
            
//             const panel = document.querySelector('.action-panel');
//             if (panel) panel.appendChild(pdfBtn);
//           });
//         `);
//       }
//     } catch (error) {
//       console.warn('Could not load jsPDF:', error);
//     }
//   }

//   private addReadmeFile(zip: JSZip): void {
//     const readmeContent = `PRESENTATION DOWNLOAD

// This ZIP contains a complete snapshot of the page including:
// - All CSS styles (including component styles)
// - Interactive functionality
// - Content preservation
// - PDF export capability

// How to use:
// 1. Extract all files
// 2. Open index.html in a browser
// 3. Use the action panel for additional functions`;
    
//     zip.file('README.txt', readmeContent);
//   }

//   private async processAssets(html: string, zip: JSZip): Promise<Map<string, string>> {
//     const cssFolder = zip.folder('css');
//     const jsFolder = zip.folder('js');
//     const imgFolder = zip.folder('images');
//     const fontsFolder = zip.folder('fonts');
//     const assetUrls = this.extractAssetUrls(html);
//     const downloadedAssets = new Map<string, string>();

//     for (const url of assetUrls) {
//       try {
//         if (!url || downloadedAssets.has(url)) continue;
        
//         const cleanUrl = this.cleanAssetUrl(url);
//         const response = await fetch(cleanUrl, { mode: 'cors' });
//         if (!response.ok) continue;
        
//         const blob = await response.blob();
//         const filename = this.getFilenameFromUrl(cleanUrl);
//         const folder = this.getAssetFolder(cleanUrl);
        
//         if (folder === 'css') cssFolder?.file(filename, blob);
//         else if (folder === 'js') jsFolder?.file(filename, blob);
//         else if (folder === 'images') imgFolder?.file(filename, blob);
//         else if (folder === 'fonts') fontsFolder?.file(filename, blob);
//         else zip.file(filename, blob);
        
//         downloadedAssets.set(url, filename);
//       } catch (error) {
//         console.warn(`Could not download asset: ${url}`, error);
//       }
//     }

//     return downloadedAssets;
//   }

//   private updateAssetLinksInHTML(html: string, urlMap: Map<string, string>): string {
//     let updatedHtml = html;
    
//     for (const [originalUrl, filename] of urlMap.entries()) {
//       const folder = this.getAssetFolder(filename);
//       const newPath = folder ? `${folder}/${filename}` : filename;
//       updatedHtml = updatedHtml.replace(new RegExp(originalUrl, 'g'), newPath);
//     }
    
//     return updatedHtml;
//   }

//   private getAssetFolder(filename: string): string | null {
//     if (filename.endsWith('.css')) return 'css';
//     if (filename.endsWith('.js')) return 'js';
//     if (this.isImageUrl(filename)) return 'images';
//     if (this.isFontUrl(filename)) return 'fonts';
//     return null;
//   }

//   private cleanAssetUrl(url: string): string {
//     return url.split('?')[0].split('#')[0];
//   }

//   private extractAssetUrls(html: string): string[] {
//     const urls = new Set<string>();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');

//     const extract = (el: Element, attr: string) => {
//       const val = el.getAttribute(attr);
//       if (val && !val.startsWith('data:')) {
//         try { urls.add(this.makeAbsoluteUrl(val)); } catch {}
//       }
//     };

//     // Extract from various elements
//     doc.querySelectorAll('link[rel="stylesheet"], script[src], img[src], source[src], source[srcset]').forEach(el => {
//       extract(el, 'href');
//       extract(el, 'src');
//       if (el.hasAttribute('srcset')) {
//         el.getAttribute('srcset')?.split(',').forEach(src => {
//           const url = src.trim().split(' ')[0];
//           if (url) try { urls.add(this.makeAbsoluteUrl(url)); } catch {}
//         });
//       }
//     });

//     // Extract from inline styles
//     doc.querySelectorAll('[style]').forEach(el => {
//       const style = el.getAttribute('style') || '';
//       (style.match(/url\(['"]?(.*?)['"]?\)/gi) || []).forEach(match => {
//         const urlMatch = match.match(/url\(['"]?(.*?)['"]?\)/i);
//         if (urlMatch?.[1] && !urlMatch[1].startsWith('data:')) {
//           try { urls.add(this.makeAbsoluteUrl(urlMatch[1])); } catch {}
//         }
//       });
//     });

//     return Array.from(urls);
//   }

//   private makeAbsoluteUrl(url: string): string {
//     if (url.startsWith('http') || url.startsWith('data:')) return url;
//     if (url.startsWith('//')) return window.location.protocol + url;
    
//     const baseElement = document.querySelector('base');
//     const baseHref = baseElement?.getAttribute('href') || '/';
//     return new URL(url, window.location.origin + baseHref).href;
//   }

//   private getFilenameFromUrl(url: string): string {
//     return this.cleanAssetUrl(url).split('/').pop() || 'file';
//   }

//   private isImageUrl(url: string): boolean {
//     return /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(url);
//   }

//   private isFontUrl(url: string): boolean {
//     return /\.(woff|woff2|ttf|eot|otf)$/i.test(url);
//   }
// }






import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

@Injectable({ providedIn: 'root' })
export class DownloadPageService {
  async downloadCurrentPage() {
    try {
      const zip = new JSZip();
      let html = this.getPageHTML();

      html = this.addInteractiveScripts(zip, html);
      this.addContentManager(zip);
      html = html.replace('</head>', `<script src="js/content-manager.js"></script>\n</head>`);

      this.addReadmeFile(zip);
      await this.addExternalLibraries(zip);

      const downloadedAssets = await this.processAssets(html, zip);
      html = this.updateAssetLinksInHTML(html, downloadedAssets);

      zip.file('index.html', html);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'presentation.zip');
    } catch (error) {
      console.error('Error downloading page:', error);
    }
  }

  private addReadmeFile(zip: JSZip): void {
    const readmeContent = `INTERACTIVE PAGE DOWNLOAD

Features Included:
- Button click handlers
- Form submission handling
- Dark mode toggle
- Content preservation (saves to localStorage)
- Toast notifications
- Right-click context menu control
- Auto-save functionality

How to Use:
1. Extract all files
2. Open index.html in a browser
3. Interact with the page using:
   - [data-action] attributes on buttons
   - Forms with custom submission handling
   - Persistent content with [data-save] attributes`;
    zip.file('README.txt', readmeContent);
  }

  private addInteractiveScripts(zip: JSZip, html: string): string {
    const interactiveJs = `...`; // truncated for brevity
    const jsFolder = zip.folder('js') || zip;
    jsFolder.file('interactive.js', interactiveJs);
    return html.replace('</body>', `<script src="js/interactive.js"></script>\n</body>`);
  }

  private addContentManager(zip: JSZip) {
    const contentManagerJs = `...`; // truncated for brevity
    const jsFolder = zip.folder('js') || zip;
    jsFolder.file('content-manager.js', contentManagerJs);
  }

  private async addExternalLibraries(zip: JSZip): Promise<void> {
    const jsFolder = zip.folder('js');
    try {
      const res = await fetch('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      if (res.ok) {
        const blob = await res.blob();
        jsFolder?.file('jspdf.umd.min.js', blob);
        jsFolder?.file('init-pdf.js', `...`); // PDF initialization script
      }
    } catch (err) {
      console.warn('Failed to fetch jsPDF:', err);
    }
  }

  private getPageHTML(): string {
    const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '';
    return doctype + document.documentElement.outerHTML;
  }

  private async processAssets(html: string, zip: JSZip): Promise<Map<string, string>> {
    const cssFolder = zip.folder('css');
    const jsFolder = zip.folder('js');
    const imgFolder = zip.folder('images');
    const fontsFolder = zip.folder('fonts');
    const assetUrls = this.extractAssetUrls(html);
    const downloadedAssets = new Map<string, string>();

    for (const url of assetUrls) {
      try {
        if (!url || downloadedAssets.has(url)) continue;
        const cleanUrl = this.cleanAssetUrl(url);
        const res = await fetch(cleanUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const blob = await res.blob();
        const filename = this.getFilenameFromUrl(cleanUrl);

        if (cleanUrl.endsWith('.css')) cssFolder?.file(filename, blob);
        else if (cleanUrl.endsWith('.js')) jsFolder?.file(filename, blob);
        else if (this.isImageUrl(cleanUrl)) imgFolder?.file(filename, blob);
        else if (this.isFontUrl(cleanUrl)) fontsFolder?.file(filename, blob);
        else zip.file(filename, blob);

        downloadedAssets.set(url, filename);
      } catch (error) {
        console.warn(`Failed to download asset: ${url}`, error);
        if (url.endsWith('.css')) cssFolder?.file(this.getFilenameFromUrl(url), `/* Missing: ${url} */`);
      }
    }

    return downloadedAssets;
  }

  private updateAssetLinksInHTML(html: string, urlMap: Map<string, string>): string {
    for (const [originalUrl, filename] of urlMap.entries()) {
      let folder = '';
      if (filename.endsWith('.css')) folder = 'css/';
      else if (filename.endsWith('.js')) folder = 'js/';
      else if (this.isImageUrl(filename)) folder = 'images/';
      else if (this.isFontUrl(filename)) folder = 'fonts/';
      html = html.replaceAll(originalUrl, `${folder}${filename}`);
    }
    return html;
  }

  private cleanAssetUrl(url: string): string {
    return url.split('?')[0].split('#')[0];
  }

  private extractAssetUrls(html: string): string[] {
    const urls = new Set<string>();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const extract = (el: Element, attr: string) => {
      const val = el.getAttribute(attr);
      if (val && !val.startsWith('data:')) {
        try { urls.add(this.makeAbsoluteUrl(val)); } catch {}
      }
    };

    doc.querySelectorAll('link[rel="stylesheet"]').forEach(el => extract(el, 'href'));
    doc.querySelectorAll('script[src]').forEach(el => extract(el, 'src'));
    doc.querySelectorAll('img[src], source[src], source[srcset]').forEach(el => {
      extract(el, 'src');
      if (el.hasAttribute('srcset')) {
        el.getAttribute('srcset')?.split(',').forEach(src => {
          const url = src.trim().split(' ')[0];
          try { urls.add(this.makeAbsoluteUrl(url)); } catch {}
        });
      }
    });

    doc.querySelectorAll('[style]').forEach(el => {
      const style = el.getAttribute('style') || '';
      (style.match(/url\(['"]?(.*?)['"]?\)/gi) || []).forEach(match => {
        const urlMatch = match.match(/url\(['"]?(.*?)['"]?\)/i);
        if (urlMatch?.[1]) urls.add(this.makeAbsoluteUrl(urlMatch[1]));
      });
    });

    return Array.from(urls);
  }

  private makeAbsoluteUrl(url: string): string {
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('//')) return window.location.protocol + url;
    const baseElement = document.querySelector('base');
    const baseHref = baseElement?.getAttribute('href') || '/';
    return new URL(url, window.location.origin + baseHref).href;
  }

  private getFilenameFromUrl(url: string): string {
    return this.cleanAssetUrl(url).split('/').pop() || 'file';
  }

  private isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(url);
  }

  private isFontUrl(url: string): boolean {
    return /\.(woff|woff2|ttf|eot|otf)$/i.test(url);
  }
}
