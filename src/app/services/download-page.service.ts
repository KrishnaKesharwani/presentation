// import { Injectable } from '@angular/core';
// import { saveAs } from 'file-saver';
// import JSZip from 'jszip';
// import { lastValueFrom } from 'rxjs';
// import { HttpClient } from '@angular/common/http';

// @Injectable({ providedIn: 'root' })
// export class DownloadPageService {
//   private imageCounter = 0;
//   constructor(private http: HttpClient) { }
//   async downloadCurrentPage() {
//     try {
//       this.imageCounter = 0; // Reset counter for each download
//       const zip = new JSZip();

//       // Process page content and get HTML with updated asset references
//       const { html, assets } = await this.processPageContent();

//       // Add all assets to zip with proper organization
//       await this.addAssetsToZip(zip, assets);
//       // const finalHtml = this.addInteractiveScripts(html);
//       // Add modified HTML
//       zip.file('index.html', html);

//       // Add supporting files
//       this.addSupportFiles(zip);

//       // Generate and download ZIP
//       const content = await zip.generateAsync({ type: 'blob' });
//       saveAs(content, 'google-slide.zip');
//     } catch (error) {
//       console.error('Error downloading page:', error);
//       alert('Error downloading page. Please check console for details.');
//     }
//   }
//   private async processPageContent(): Promise<{ html: string, assets: Map<string, { blob: Blob, filename: string }> }> {
//     const assets = new Map<string, { blob: Blob, filename: string }>();
//     let html = this.getPageHTML();

//     // Process assets
//     const assetUrls = this.extractAssetUrls(html);
//     for (const url of assetUrls) {
//       if (!url || assets.has(url)) continue;

//       try {
//         const result = await this.processAsset(url);
//         if (result) assets.set(url, result);
//       } catch (error) {
//         console.warn(`Asset failed: ${url}`, error);
//       }
//     }

//     // Update HTML paths
//     html = this.updateAssetPaths(html, assets);

//     return { html, assets };
//   }
//   private async processAsset(url: string): Promise<{ blob: Blob, filename: string } | null> {
//     // Generate custom filename for images
//     const isImage = this.isImageUrl(url);
//     const customFilename = isImage ? `img_${++this.imageCounter}${this.getFileExtension(url)}` : this.getFilenameFromUrl(url);

//     try {
//       let blob: Blob;

//       // Special handling for Google images
//       if (url.includes('googleusercontent.com')) {
//         // blob = await this.downloadGoogleImage(url);
//         blob = await lastValueFrom(this.http.get(url, { responseType: 'blob' }));
//         const fileExtension = this.getFileExtension(url) || 'png';
//       } else {
//         // Standard download for other assets
//         const response = await fetch(url, { mode: 'cors', credentials: 'include' });
//         if (!response.ok) throw new Error(`HTTP ${response.status}`);
//         blob = await response.blob();
//       }

//       return { blob, filename: customFilename };
//     } catch (error) {
//       console.warn(`Asset download failed: ${url}`, error);

//       // Return placeholder for failed images
//       if (isImage) {
//         return {
//           blob: await this.createPlaceholderImage(url),
//           filename: customFilename
//         };
//       }
//       return null;
//     }
//   }

//   private async createPlaceholderImage(originalUrl: string): Promise<Blob> {
//     return new Promise((resolve) => {
//       const canvas = document.createElement('canvas');
//       canvas.width = 200;
//       canvas.height = 150;
//       const ctx = canvas.getContext('2d');

//       if (ctx) {
//         ctx.fillStyle = '#f0f0f0';
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
//         ctx.fillStyle = '#999';
//         ctx.font = '14px Arial';
//         ctx.textAlign = 'center';
//         ctx.fillText('Image not available', canvas.width / 2, 70);
//         ctx.font = '10px Arial';

//         // Show shortened URL
//         const shortUrl = originalUrl.length > 50
//           ? originalUrl.substring(0, 50) + '...'
//           : originalUrl;
//         ctx.fillText(shortUrl, canvas.width / 2, 90);
//       }

//       // Create as JPG
//       canvas.toBlob(
//         (blob) => resolve(blob || new Blob()),
//         'image/jpeg',
//         0.8
//       );
//     });
//   }

//   private getFileExtension(url: string): string {
//     const match = url.match(/\.(jpe?g|png|gif|webp|bmp)/i);
//     return match ? match[0] : '.jpg';
//   }

//   private async addAssetsToZip(zip: JSZip, assets: Map<string, { blob: Blob, filename: string }>): Promise<void> {
//     const cssFolder = zip.folder('css');
//     const jsFolder = zip.folder('js');
//     const imgFolder = zip.folder('images');
//     const fontsFolder = zip.folder('fonts');

//     for (const [url, { blob, filename }] of assets.entries()) {
//       if (url.endsWith('.css')) {
//         cssFolder?.file(filename, blob);
//       } else if (url.endsWith('.js')) {
//         jsFolder?.file(filename, blob);
//       } else if (this.isImageUrl(url)) {
//         imgFolder?.file(filename, blob);
//       } else if (this.isFontUrl(url)) {
//         fontsFolder?.file(filename, blob);
//       } else {
//         zip.file(filename, blob);
//       }
//     }
//   }

//   private updateAssetPaths(html: string, assets: Map<string, { blob: Blob, filename: string }>): string {
//     let updatedHtml = html;

//     for (const [url, { filename }] of assets.entries()) {
//       const folder = this.getAssetFolder(url);
//       const newPath = folder ? `${folder}/${filename}` : filename;

//       updatedHtml = updatedHtml.replace(new RegExp(this.escapeRegExp(url), 'g'), newPath);
//     }

//     return updatedHtml;
//   }

//   private escapeRegExp(string: string): string {
//     return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//   }

//   private getAssetFolder(url: string): string | null {
//     if (url.endsWith('.css')) return 'css';
//     if (url.endsWith('.js')) return 'js';
//     if (this.isImageUrl(url)) return 'images';
//     if (this.isFontUrl(url)) return 'fonts';
//     return null;
//   }

//   private addSupportFiles(zip: JSZip): void {
//     // Add interactive scripts
//     const jsFolder = zip.folder('js') || zip;
//     jsFolder.file('interactive.js', this.getInteractiveScript());

//     // Add readme
//     zip.file('README.txt', `COMPLETE PAGE DOWNLOAD

// This package contains all page assets including:
// - HTML content
// - CSS styles
// - JavaScript
// - Images (saved as img_1.jpg, img_2.jpg, etc.)

// Simply extract and open index.html in your browser.`);
//   }

//   private getInteractiveScript(): string {
//     return `document.addEventListener('DOMContentLoaded', function() {
//       // Basic interactive functionality
//       console.log('Page loaded successfully');
      
//       // Add dark mode toggle if needed
//       document.querySelectorAll('[data-action="dark-mode"]').forEach(btn => {
//         btn.addEventListener('click', function() {
//           document.body.classList.toggle('dark-mode');
//         });
//       });
//     });`;
//   }

//   private getPageHTML(): string {
//     const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '';
//     const doc = document.cloneNode(true) as Document;

//     // Remove scripts that won't work offline
//     Array.from(doc.querySelectorAll('script')).forEach(script => {
//       if (script.src && !script.src.includes('interactive.js')) {
//         script.remove();
//       }
//     });

//     // Add base tag for relative paths
//     if (!doc.querySelector('base')) {
//       const base = doc.createElement('base');
//       base.href = './';
//       doc.head.insertBefore(base, doc.head.firstChild);
//     }

//     return doctype + doc.documentElement.outerHTML;
//   }

//   private extractAssetUrls(html: string): string[] {
//     const urls = new Set<string>();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');

//     const extract = (el: Element, attr: string) => {
//       const val = el.getAttribute(attr);
//       if (val && !val.startsWith('data:')) {
//         try { urls.add(this.makeAbsoluteUrl(val)); } catch { }
//       }
//     };

//     // Extract from various elements
//     doc.querySelectorAll(`
//       link[rel="stylesheet"],
//       script[src], 
//       img[src], 
//       source[src], 
//       source[srcset],
//       [style*="url("]
//     `).forEach(el => {
//       extract(el, 'href');
//       extract(el, 'src');

//       if (el.hasAttribute('srcset')) {
//         el.getAttribute('srcset')?.split(',').forEach(src => {
//           const url = src.trim().split(' ')[0];
//           if (url) try { urls.add(this.makeAbsoluteUrl(url)); } catch { }
//         });
//       }

//       if (el.hasAttribute('style')) {
//         const style = el.getAttribute('style') || '';
//         (style.match(/url\(['"]?(.*?)['"]?\)/gi) || []).forEach(match => {
//           const urlMatch = match.match(/url\(['"]?(.*?)['"]?\)/i);
//           if (urlMatch?.[1] && !urlMatch[1].startsWith('data:')) {
//             try { urls.add(this.makeAbsoluteUrl(urlMatch[1])); } catch { }
//           }
//         });
//       }
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
//     const cleanUrl = url.split('?')[0].split('#')[0];
//     return cleanUrl.split('/').pop() || 'file';
//   }

//   private isImageUrl(url: string): boolean {
//     return /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(url) ||
//       url.includes('googleusercontent.com');
//   }

//   private isFontUrl(url: string): boolean {
//     return /\.(woff|woff2|ttf|eot|otf)$/i.test(url);
//   }
// }



// import { Injectable } from '@angular/core';
// import { saveAs } from 'file-saver';
// import JSZip from 'jszip';
// import { lastValueFrom, timeout, catchError, of } from 'rxjs';
// import { HttpClient } from '@angular/common/http';

// @Injectable({ providedIn: 'root' })
// export class DownloadPageService {
//   private imageCounter = 0;
//   private readonly FETCH_TIMEOUT_MS = 15000;

//   constructor(private http: HttpClient) {}

//   /** Public entry */
//   async downloadCurrentPage(filename: string = 'google-slide.zip'): Promise<void> {
//     try {
//       this.imageCounter = 0;
//       const zip = new JSZip();

//       // Extract and sanitize page
//       const { html, assets } = await this.processPageContent();

//       // Add assets
//       await this.addAssetsToZip(zip, assets);

//       // Add main HTML & support files
//       zip.file('index.html', html);
//       this.addSupportFiles(zip);

//       const content = await zip.generateAsync({ type: 'blob' });
//       saveAs(content, filename);
//     } catch (error) {
//       console.error('Error downloading page:', error);
//       alert('Error downloading page. Please check console for details.');
//     }
//   }

//   /* ------------------------------------------------------------------ */
//   /*  High-level page processing                                        */
//   /* ------------------------------------------------------------------ */

//   private async processPageContent(): Promise<{
//     html: string;
//     assets: Map<string, { blob: Blob; filename: string; folder: string | null }>;
//   }> {
//     const assets = new Map<string, { blob: Blob; filename: string; folder: string | null }>();

//     // 1. Clone & sanitize DOM -> HTML string
//     let html = this.getSanitizedPageHTML();

//     // 2. Extract candidate asset URLs from sanitized HTML
//     const assetUrls = this.extractAssetUrls(html);

//     // 3. Fetch/process assets
//     for (const url of assetUrls) {
//       if (!url || assets.has(url)) continue;
//       try {
//         const result = await this.processAsset(url);
//         if (result) assets.set(url, result);
//       } catch (error) {
//         console.warn(`Asset failed: ${url}`, error);
//       }
//     }

//     // 4. Rewrite HTML asset paths to local packaged versions
//     html = this.updateAssetPaths(html, assets);

//     return { html, assets };
//   }

//   /* ------------------------------------------------------------------ */
//   /*  Asset processing                                                   */
//   /* ------------------------------------------------------------------ */

//   private async processAsset(url: string): Promise<{
//     blob: Blob;
//     filename: string;
//     folder: string | null;
//   } | null> {
//     // Skip non-packagable schemes completely
//     if (this.isBrowserExtensionUrl(url) || this.isForbiddenScheme(url)) {
//       return null;
//     }

//     const isImage = this.isImageUrl(url);
//     const isFont = this.isFontUrl(url);
//     const isCss = url.toLowerCase().endsWith('.css');
//     const isJs = url.toLowerCase().endsWith('.js');

//     const filename = this.buildFilename(url, { isImage, isFont, isCss, isJs });
//     const folder = this.getAssetFolderFromFlags({ isImage, isFont, isCss, isJs });

//     try {
//       let blob: Blob | null = null;

//       // If Googleusercontent (often uses auth / CORS) -> try Angular HttpClient to leverage cookies
//       if (url.includes('googleusercontent.com')) {
//         blob = await lastValueFrom(
//           this.http.get(url, { responseType: 'blob' }).pipe(
//             timeout(this.FETCH_TIMEOUT_MS),
//             catchError(() => of(null as unknown as Blob))
//           )
//         );
//       } else {
//         // Use fetch (CORS friendly fallback; credentials include for same-origin auth if any)
//         const response = await fetch(url, { mode: 'cors', credentials: 'include' });
//         if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
//         blob = await response.blob();
//       }

//       if (!blob) throw new Error('Empty blob');

//       return { blob, filename, folder };
//     } catch (error) {
//       console.warn(`Asset download failed: ${url}`, error);
//       if (isImage) {
//         const blob = await this.createPlaceholderImage(url);
//         return { blob, filename, folder };
//       }
//       return null; // Non-image failures are skipped
//     }
//   }

//   private buildFilename(
//     url: string,
//     flags: { isImage: boolean; isFont: boolean; isCss: boolean; isJs: boolean }
//   ): string {
//     if (flags.isImage) {
//       return `img_${++this.imageCounter}${this.getFileExtension(url, '.jpg')}`;
//     }
//     return this.getFilenameFromUrl(url) || this.uniqueFromUrl(url);
//   }

//   private getAssetFolderFromFlags(flags: {
//     isImage: boolean;
//     isFont: boolean;
//     isCss: boolean;
//     isJs: boolean;
//   }): string | null {
//     if (flags.isCss) return 'css';
//     if (flags.isJs) return 'js';
//     if (flags.isImage) return 'images';
//     if (flags.isFont) return 'fonts';
//     return null;
//   }

//   /* ------------------------------------------------------------------ */
//   /*  Sanitizing DOM before packaging                                   */
//   /* ------------------------------------------------------------------ */

//   private getSanitizedPageHTML(): string {
//     const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '';

//     // Deep clone
//     const doc = document.cloneNode(true) as Document;

//     // Remove scripts/styles injected by browser extensions or with forbidden schemes
//     const allScripts = Array.from(doc.querySelectorAll('script'));
//     for (const script of allScripts) {
//       const src = script.getAttribute('src') || '';
//       if (src && (this.isBrowserExtensionUrl(src) || this.isForbiddenScheme(src))) {
//         script.remove();
//         continue;
//       }

//       // Remove *all* external scripts except those we know we want to keep? Safer offline.
//       if (src && !src.includes('interactive.js')) {
//         script.remove();
//         continue;
//       }

//       // Inline script: keep, but you may want to redact analytics/tracking. Example: remove if it references chrome.*
//       if (!src && /chrome\./i.test(script.textContent || '')) {
//         script.remove();
//       }
//     }

//     // Remove link[rel="preload"|rel="modulepreload"] etc referencing forbidden schemes
//     Array.from(doc.querySelectorAll('link')).forEach((lnk) => {
//       const href = lnk.getAttribute('href') || '';
//       if (href && (this.isBrowserExtensionUrl(href) || this.isForbiddenScheme(href))) {
//         lnk.remove();
//       }
//     });

//     // Remove extension data attributes & inline styles referencing extension URLs
//     Array.from(doc.querySelectorAll('*')).forEach((el) => {
//       // scrub style url(...) patterns
//       const style = el.getAttribute('style');
//       if (style && this.styleHasForbiddenUrl(style)) {
//         const cleaned = this.cleanStyleForbiddenUrls(style);
//         if (cleaned.trim()) {
//           el.setAttribute('style', cleaned);
//         } else {
//           el.removeAttribute('style');
//         }
//       }

//       // Remove data- attributes from known extensions
//       Array.from(el.attributes).forEach((attr) => {
//         if (/^data-[a-z0-9_-]*extension/i.test(attr.name)) {
//           el.removeAttribute(attr.name);
//         }
//         if (this.isBrowserExtensionUrl(attr.value)) {
//           el.removeAttribute(attr.name);
//         }
//       });
//     });

//     // Insert <base> if missing so relative paths resolve from the package root
//     if (!doc.querySelector('base')) {
//       const base = doc.createElement('base');
//       base.href = './';
//       doc.head.insertBefore(base, doc.head.firstChild);
//     } else {
//       // Force packaged relative
//       const base = doc.querySelector('base');
//       if (base) base.setAttribute('href', './');
//     }

//     // Replace Google Slides embeds (optional but recommended for offline)
//     this.sanitizeGoogleSlidesEmbeds(doc);

//     return doctype + doc.documentElement.outerHTML;
//   }

//   private sanitizeGoogleSlidesEmbeds(doc: Document): void {
//     const iframes = Array.from(doc.querySelectorAll('iframe'));
//     for (const frame of iframes) {
//       const src = frame.getAttribute('src') || '';
//       if (/slides\.google\.com\/presentation\//i.test(src)) {
//         // Offline fallback: show thumbnail + link
//         const fallback = doc.createElement('div');
//         fallback.innerHTML = `\n<div class="offline-slides-fallback">\n  <p>This embedded Google Slides deck cannot run fully offline.</p>\n  <p><a href="${src}" target="_blank" rel="noopener">Open the live deck</a></p>\n</div>\n`;
//         frame.replaceWith(fallback);
//       }
//     }
//   }

//   /* ------------------------------------------------------------------ */
//   /*  Asset discovery                                                    */
//   /* ------------------------------------------------------------------ */

//   private extractAssetUrls(html: string): string[] {
//     const urls = new Set<string>();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');

//     const addUrl = (raw: string | null) => {
//       if (!raw) return;
//       if (raw.startsWith('data:')) return; // inline already
//       try {
//         const abs = this.makeAbsoluteUrl(raw);
//         if (!abs) return;
//         if (this.isBrowserExtensionUrl(abs) || this.isForbiddenScheme(abs)) return;
//         urls.add(abs);
//       } catch {
//         /* ignore bad URLs */
//       }
//     };

//     // link[rel="stylesheet"] & regular link assets
//     doc.querySelectorAll('link[href]').forEach((el) => addUrl(el.getAttribute('href')));

//     // scripts
//     doc.querySelectorAll('script[src]').forEach((el) => addUrl(el.getAttribute('src')));

//     // images
//     doc.querySelectorAll('img[src]').forEach((el) => addUrl(el.getAttribute('src')));

//     // source (video/audio/picture)
//     doc.querySelectorAll('source[src]').forEach((el) => addUrl(el.getAttribute('src')));

//     // srcset
//     doc.querySelectorAll('[srcset]').forEach((el) => {
//       (el.getAttribute('srcset') || '')
//         .split(',')
//         .map((s) => s.trim().split(' ')[0])
//         .forEach((u) => addUrl(u));
//     });

//     // styles inline: url(...)
//     doc.querySelectorAll('[style]').forEach((el) => {
//       const style = el.getAttribute('style') || '';
//       const matches = style.match(/url\((['"]?)(.*?)\1\)/gi) || [];
//       for (const m of matches) {
//         const inner = /url\((['"]?)(.*?)\1\)/i.exec(m)?.[2];
//         if (inner) addUrl(inner);
//       }
//     });

//     return Array.from(urls);
//   }

//   /* ------------------------------------------------------------------ */
//   /*  Asset path rewriting                                               */
//   /* ------------------------------------------------------------------ */

//   private updateAssetPaths(
//     html: string,
//     assets: Map<string, { blob: Blob; filename: string; folder: string | null }>
//   ): string {
//     let updatedHtml = html;
//     for (const [url, meta] of assets.entries()) {
//       const { filename, folder } = meta;
//       const newPath = folder ? `${folder}/${filename}` : filename;
//       updatedHtml = updatedHtml.replace(new RegExp(this.escapeRegExp(url), 'g'), newPath);
//     }
//     return updatedHtml;
//   }

//   /* ------------------------------------------------------------------ */
//   /*  ZIP population                                                     */
//   /* ------------------------------------------------------------------ */

//   private async addAssetsToZip(
//     zip: JSZip,
//     assets: Map<string, { blob: Blob; filename: string; folder: string | null }>
//   ): Promise<void> {
//     const cssFolder = zip.folder('css');
//     const jsFolder = zip.folder('js');
//     const imgFolder = zip.folder('images');
//     const fontsFolder = zip.folder('fonts');

//     for (const [_url, { blob, filename, folder }] of assets.entries()) {
//       switch (folder) {
//         case 'css':
//           cssFolder?.file(filename, blob);
//           break;
//         case 'js':
//           jsFolder?.file(filename, blob);
//           break;
//         case 'images':
//           imgFolder?.file(filename, blob);
//           break;
//         case 'fonts':
//           fontsFolder?.file(filename, blob);
//           break;
//         default:
//           zip.file(filename, blob);
//           break;
//       }
//     }
//   }

//   private addSupportFiles(zip: JSZip): void {
//     const jsFolder = zip.folder('js') || zip;
//     jsFolder.file('interactive.js', this.getInteractiveScript());
//     zip.file(
//       'README.txt',
//       `COMPLETE PAGE DOWNLOAD\n\nThis package contains all page assets including:\n- HTML content\n- CSS styles\n- JavaScript (all 3rd-party removed)\n- Images (saved as img_1.jpg, img_2.jpg, etc.)\n\nOpen index.html in a browser. Some live services (e.g., Google Slides) require internet connectivity and may have been replaced with an offline fallback.\n`
//     );
//   }

//   private getInteractiveScript(): string {
//     return `document.addEventListener('DOMContentLoaded',function(){console.log('Offline page loaded');document.querySelectorAll('[data-action="dark-mode"]').forEach(btn=>{btn.addEventListener('click',()=>{document.body.classList.toggle('dark-mode');});});});`;
//   }

//   /* ------------------------------------------------------------------ */
//   /*  Helpers                                                            */
//   /* ------------------------------------------------------------------ */

//   private createPlaceholderImage(originalUrl: string): Promise<Blob> {
//     return new Promise((resolve) => {
//       const canvas = document.createElement('canvas');
//       canvas.width = 200;
//       canvas.height = 150;
//       const ctx = canvas.getContext('2d');
//       if (ctx) {
//         ctx.fillStyle = '#f0f0f0';
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
//         ctx.fillStyle = '#999';
//         ctx.font = '14px Arial';
//         ctx.textAlign = 'center';
//         ctx.fillText('Image not available', canvas.width / 2, 70);
//         ctx.font = '10px Arial';
//         const shortUrl = originalUrl.length > 50 ? originalUrl.substring(0, 50) + '...' : originalUrl;
//         ctx.fillText(shortUrl, canvas.width / 2, 90);
//       }
//       canvas.toBlob((blob) => resolve(blob || new Blob()), 'image/jpeg', 0.8);
//     });
//   }

//   private getFileExtension(url: string, fallback = '.jpg'): string {
//     const clean = url.split('?')[0].split('#')[0];
//     const match = clean.match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i);
//     return match ? match[0] : fallback;
//   }

//   private uniqueFromUrl(url: string): string {
//     // derive safe slug from hash of URL
//     const hash = this.simpleHash(url).toString(36);
//     const ext = this.guessExt(url);
//     return `${hash}${ext}`;
//   }

//   private guessExt(url: string): string {
//     const lower = url.toLowerCase();
//     if (lower.includes('.css')) return '.css';
//     if (lower.includes('.js')) return '.js';
//     if (this.isImageUrl(url)) return this.getFileExtension(url, '.jpg');
//     if (this.isFontUrl(url)) return '.woff2';
//     return '';
//   }

//   private simpleHash(str: string): number {
//     let h = 0,
//       i = 0,
//       len = str.length;
//     while (i < len) h = (h << 5) - h + str.charCodeAt(i++) | 0; // eslint-disable-line no-bitwise
//     return Math.abs(h);
//   }

//   private getFilenameFromUrl(url: string): string {
//     const cleanUrl = url.split('?')[0].split('#')[0];
//     const last = cleanUrl.split('/').pop();
//     if (!last || !/\.[A-Za-z0-9]+$/.test(last)) return '';
//     return last;
//   }

//   private makeAbsoluteUrl(url: string): string | null {
//     if (!url) return null;
//     // Already absolute
//     if (/^https?:\/\//i.test(url)) return url;
//     if (/^\/\//.test(url)) return window.location.protocol + url; // protocol-relative
//     if (this.isBrowserExtensionUrl(url) || this.isForbiddenScheme(url)) return null;
//     try {
//       return new URL(url, window.location.href).href;
//     } catch {
//       return null;
//     }
//   }

//   private isImageUrl(url: string): boolean {
//     return /(\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)(\?|#|$))/i.test(url) || url.includes('googleusercontent.com');
//   }

//   private isFontUrl(url: string): boolean {
//     return /(\.(woff2?|ttf|eot|otf)(\?|#|$))/i.test(url);
//   }

//   private isBrowserExtensionUrl(url: string): boolean {
//     return /^(chrome|moz|safari)-extension:/i.test(url) || url.startsWith('chrome-extension://') || url.startsWith('moz-extension://');
//   }

//   private isForbiddenScheme(url: string): boolean {
//     return /^(about:|javascript:|data:|blob:|mailto:)/i.test(url);
//   }

//   private styleHasForbiddenUrl(style: string): boolean {
//     return /(chrome|moz|safari)-extension:/i.test(style) || /chrome-extension:\/\//i.test(style);
//   }

//   private cleanStyleForbiddenUrls(style: string): string {
//     // Remove any url(...) blocks referencing extension schemes
//     return style.replace(/url\([^)]*(chrome|moz|safari)-extension:[^)]*\)/gi, '').replace(/url\([^)]*chrome-extension:[^)]*\)/gi, '');
//   }

//   private escapeRegExp(str: string): string {
//     return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//   }
// }




import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { lastValueFrom, timeout, catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface DownloadOptions {
  /** Replace Google Slides iframes with offline fallback text+link. Default true. */
  stripGoogleSlides?: boolean;
  /** Remove ALL remote <script> tags (safer offline). Default true. */
  stripExternalScripts?: boolean;
  /** Remove inline scripts that look like extension injections. Default true. */
  stripExtensionInlineScripts?: boolean;
  /** Filename for the generated zip. */
  zipName?: string;
}

@Injectable({ providedIn: 'root' })
export class DownloadPageService {
  private imageCounter = 0;
  private readonly FETCH_TIMEOUT_MS = 15000;

  constructor(private http: HttpClient) {}

  /** Public entry */
  async downloadCurrentPage(opts: DownloadOptions = {}): Promise<void> {
    const {
      stripGoogleSlides = true,
      stripExternalScripts = true,
      stripExtensionInlineScripts = true,
      zipName = 'google-slide.zip',
    } = opts;

    try {
      this.imageCounter = 0;
      const zip = new JSZip();

      // Extract + sanitize
      const { html, assets } = await this.processPageContent({
        stripGoogleSlides,
        stripExternalScripts,
        stripExtensionInlineScripts,
      });

      // Assets
      await this.addAssetsToZip(zip, assets);

      // Main HTML & helpers
      zip.file('index.html', html);
      this.addSupportFiles(zip);

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, zipName);
    } catch (err) {
      console.error('Error downloading page:', err);
      alert('Error downloading page. See console.');
    }
  }

  /* ------------------------------------------------------------------ */
  /*  High-level page processing                                        */
  /* ------------------------------------------------------------------ */
  private async processPageContent(opts: {
    stripGoogleSlides: boolean;
    stripExternalScripts: boolean;
    stripExtensionInlineScripts: boolean;
  }): Promise<{
    html: string;
    assets: Map<string, { blob: Blob; filename: string; folder: string | null }>;
  }> {
    const assets = new Map<string, { blob: Blob; filename: string; folder: string | null }>();

    // 1. Clone & sanitize DOM
    let html = this.getSanitizedPageHTML(opts);

    // 2. Extract asset URLs
    const assetUrls = this.extractAssetUrls(html);

    // 3. Fetch/process
    for (const url of assetUrls) {
      if (!url || assets.has(url)) continue;
      try {
        const meta = await this.processAsset(url);
        if (meta) assets.set(url, meta);
      } catch (err) {
        console.warn('Asset failed:', url, err);
      }
    }

    // 4. Rewrite paths to packaged
    html = this.updateAssetPaths(html, assets);

    return { html, assets };
  }

  /* ------------------------------------------------------------------ */
  /*  DOM Sanitization                                                   */
  /* ------------------------------------------------------------------ */
  private getSanitizedPageHTML(opts: {
    stripGoogleSlides: boolean;
    stripExternalScripts: boolean;
    stripExtensionInlineScripts: boolean;
  }): string {
    const { stripGoogleSlides, stripExternalScripts, stripExtensionInlineScripts } = opts;
    const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '';
    const doc = document.cloneNode(true) as Document;

    /* Remove extension & unwanted scripts */
    Array.from(doc.querySelectorAll('script')).forEach((script) => {
      const src = script.getAttribute('src') || '';
      const txt = script.textContent || '';

      // Drop any browser-extension URL
      if (this.isBrowserExtensionUrl(src)) {
        script.remove();
        return;
      }

      // Drop file:// external scripts when packaging (not needed offline)
      if (/^file:/i.test(src)) {
        script.remove();
        return;
      }

      // Optionally drop *all* external scripts except our interactive placeholder
      if (stripExternalScripts && src && !src.includes('interactive.js')) {
        script.remove();
        return;
      }

      // Remove inline scripts that reference window.chrome.*, browser.*, or extension tokens
      if (stripExtensionInlineScripts && !src) {
        if (/chrome\.|mozExtension|browser\./i.test(txt) || /anepejceblmonolgjdjdkecbgjhapeme/i.test(txt)) {
          script.remove();
          return;
        }
      }
    });

    /* Remove extension-related <link> tags */
    Array.from(doc.querySelectorAll('link[href]')).forEach((lnk) => {
      const href = lnk.getAttribute('href') || '';
      if (this.isBrowserExtensionUrl(href) || /^file:/i.test(href)) {
        lnk.remove();
      }
    });

    /* Scrub ALL element attributes that point to extension/file schemes */
    Array.from(doc.querySelectorAll('*')).forEach((el: Element) => {
      // style cleanup
      const style = el.getAttribute('style');
      if (style && this.styleHasForbiddenUrl(style)) {
        const cleaned = this.cleanStyleForbiddenUrls(style);
        cleaned.trim() ? el.setAttribute('style', cleaned) : el.removeAttribute('style');
      }

      // generic attribute cleanup
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const v = attr.value;
        if (this.isBrowserExtensionUrl(v) || /^file:/i.test(v)) {
          el.removeAttribute(attr.name);
        }
        // remove obvious extension data attrs (heuristic)
        if (/^data-.*(ext|extension|chrome|moz)/i.test(attr.name)) {
          el.removeAttribute(attr.name);
        }
      }
    });

    /* Replace/remove Google Slides embeds if requested */
    if (stripGoogleSlides) {
      this.replaceGoogleSlidesEmbeds(doc);
    }

    /* Force relative base */
    const head = doc.head || doc.getElementsByTagName('head')[0];
    let base = doc.querySelector('base');
    if (!base) {
      base = doc.createElement('base');
      base.href = './';
      head?.insertBefore(base, head.firstChild || null);
    } else {
      base.setAttribute('href', './');
    }

    return doctype + doc.documentElement.outerHTML;
  }

  private replaceGoogleSlidesEmbeds(doc: Document): void {
    const iframes = Array.from(doc.querySelectorAll('iframe'));
    for (const fr of iframes) {
      const src = fr.getAttribute('src') || '';
      if (/slides\.google\.com\/presentation\//i.test(src) || /content-slides\.googleapis\.com/i.test(src)) {
        const repl = doc.createElement('div');
        repl.className = 'offline-slides-fallback';
        repl.innerHTML = `
  <p>This Google Slides embed was removed for offline packaging.</p>
  <p><a href="${src}" target="_blank" rel="noopener">Open live deck</a></p>
`;
        fr.replaceWith(repl);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Asset discovery                                                    */
  /* ------------------------------------------------------------------ */
  private extractAssetUrls(html: string): string[] {
    const urls = new Set<string>();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const addUrl = (raw: string | null) => {
      if (!raw) return;
      if (raw.startsWith('data:')) return; // inline
      const abs = this.makeAbsoluteUrl(raw);
      if (!abs) return;
      if (this.isBrowserExtensionUrl(abs)) return;
      if (/^file:/i.test(abs)) return; // ignore captured file:// paths
      if (this.isForbiddenScheme(abs)) return;
      urls.add(abs);
    };

    doc.querySelectorAll('link[href]').forEach((el) => addUrl(el.getAttribute('href')));
    doc.querySelectorAll('script[src]').forEach((el) => addUrl(el.getAttribute('src')));
    doc.querySelectorAll('img[src]').forEach((el) => addUrl(el.getAttribute('src')));
    doc.querySelectorAll('source[src]').forEach((el) => addUrl(el.getAttribute('src')));
    doc.querySelectorAll('[srcset]').forEach((el) => {
      (el.getAttribute('srcset') || '')
        .split(',')
        .map((s) => s.trim().split(' ')[0])
        .forEach((u) => addUrl(u));
    });
    doc.querySelectorAll('[style]').forEach((el) => {
      const style = el.getAttribute('style') || '';
      const matches = style.match(/url\((['\"]?)(.*?)\1\)/gi) || [];
      for (const m of matches) {
        const inner = /url\((['\"]?)(.*?)\1\)/i.exec(m)?.[2];
        addUrl(inner || null);
      }
    });

    return Array.from(urls);
  }

  /* ------------------------------------------------------------------ */
  /*  Asset fetching                                                     */
  /* ------------------------------------------------------------------ */
  private async processAsset(url: string): Promise<{
    blob: Blob;
    filename: string;
    folder: string | null;
  } | null> {
    if (this.isBrowserExtensionUrl(url) || this.isForbiddenScheme(url) || /^file:/i.test(url)) {
      return null;
    }

    const isImage = this.isImageUrl(url);
    const isFont = this.isFontUrl(url);
    const isCss = url.toLowerCase().endsWith('.css');
    const isJs = url.toLowerCase().endsWith('.js');

    const filename = this.buildFilename(url, { isImage, isFont, isCss, isJs });
    const folder = this.getAssetFolderFromFlags({ isImage, isFont, isCss, isJs });

    try {
      let blob: Blob | null = null;
      if (url.includes('googleusercontent.com')) {
        blob = await lastValueFrom(
          this.http.get(url, { responseType: 'blob' }).pipe(
            timeout(this.FETCH_TIMEOUT_MS),
            catchError(() => of(null as unknown as Blob))
          )
        );
      } else {
        const resp = await fetch(url, { mode: 'cors', credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
        blob = await resp.blob();
      }
      if (!blob) throw new Error('Empty blob');
      return { blob, filename, folder };
    } catch (err) {
      console.warn('Asset download failed:', url, err);
      if (isImage) {
        const blob = await this.createPlaceholderImage(url);
        return { blob, filename, folder };
      }
      return null; // skip non-images if failed
    }
  }

  private buildFilename(
    url: string,
    flags: { isImage: boolean; isFont: boolean; isCss: boolean; isJs: boolean }
  ): string {
    if (flags.isImage) {
      return `img_${++this.imageCounter}${this.getFileExtension(url, '.jpg')}`;
    }
    return this.getFilenameFromUrl(url) || this.uniqueFromUrl(url);
  }

  private getAssetFolderFromFlags(flags: {
    isImage: boolean;
    isFont: boolean;
    isCss: boolean;
    isJs: boolean;
  }): string | null {
    if (flags.isCss) return 'css';
    if (flags.isJs) return 'js';
    if (flags.isImage) return 'images';
    if (flags.isFont) return 'fonts';
    return null;
  }

  /* ------------------------------------------------------------------ */
  /*  Path rewriting                                                     */
  /* ------------------------------------------------------------------ */
  private updateAssetPaths(
    html: string,
    assets: Map<string, { blob: Blob; filename: string; folder: string | null }>
  ): string {
    let updated = html;
    for (const [url, meta] of assets.entries()) {
      const { filename, folder } = meta;
      const rel = folder ? `${folder}/${filename}` : filename;
      updated = updated.replace(new RegExp(this.escapeRegExp(url), 'g'), rel);
    }
    return updated;
  }

  /* ------------------------------------------------------------------ */
  /*  ZIP population                                                     */
  /* ------------------------------------------------------------------ */
  private async addAssetsToZip(
    zip: JSZip,
    assets: Map<string, { blob: Blob; filename: string; folder: string | null }>
  ): Promise<void> {
    const cssFolder = zip.folder('css');
    const jsFolder = zip.folder('js');
    const imgFolder = zip.folder('images');
    const fontsFolder = zip.folder('fonts');

    for (const [_url, { blob, filename, folder }] of assets.entries()) {
      switch (folder) {
        case 'css':
          cssFolder?.file(filename, blob);
          break;
        case 'js':
          jsFolder?.file(filename, blob);
          break;
        case 'images':
          imgFolder?.file(filename, blob);
          break;
        case 'fonts':
          fontsFolder?.file(filename, blob);
          break;
        default:
          zip.file(filename, blob);
      }
    }
  }

  private addSupportFiles(zip: JSZip): void {
    const jsFolder = zip.folder('js') || zip;
    jsFolder.file('interactive.js', this.getInteractiveScript());
    zip.file(
      'README.txt',
      `COMPLETE PAGE DOWNLOAD\n\nOpen index.html from a local web server (NOT by double-click).\n\nThis package strips browser-extension code and (optionally) Google Slides embeds to avoid console noise offline.\nIf you need the live embeds, re-run with stripGoogleSlides:false.\n`
    );
  }

  private getInteractiveScript(): string {
    return `document.addEventListener('DOMContentLoaded',function(){console.log('Offline page loaded');document.querySelectorAll('[data-action="dark-mode"]').forEach(btn=>{btn.addEventListener('click',()=>{document.body.classList.toggle('dark-mode');});});});`;
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */
  private createPlaceholderImage(originalUrl: string): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Image not available', canvas.width / 2, 70);
        ctx.font = '10px Arial';
        const shortUrl = originalUrl.length > 50 ? originalUrl.substring(0, 50) + '...' : originalUrl;
        ctx.fillText(shortUrl, canvas.width / 2, 90);
      }
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.8);
    });
  }

  private getFileExtension(url: string, fallback = '.jpg'): string {
    const clean = url.split('?')[0].split('#')[0];
    const match = clean.match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i);
    return match ? match[0] : fallback;
  }

  private uniqueFromUrl(url: string): string {
    const hash = this.simpleHash(url).toString(36);
    const ext = this.guessExt(url);
    return `${hash}${ext}`;
  }

  private guessExt(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes('.css')) return '.css';
    if (lower.includes('.js')) return '.js';
    if (this.isImageUrl(url)) return this.getFileExtension(url, '.jpg');
    if (this.isFontUrl(url)) return '.woff2';
    return '';
  }

  private simpleHash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0; // eslint-disable-line no-bitwise
    }
    return Math.abs(h);
  }

  private getFilenameFromUrl(url: string): string {
    const clean = url.split('?')[0].split('#')[0];
    const last = clean.split('/').pop();
    if (!last || !/\.[A-Za-z0-9]+$/.test(last)) return '';
    return last;
  }

  private makeAbsoluteUrl(url: string): string | null {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/\//.test(url)) return window.location.protocol + url;
    if (this.isBrowserExtensionUrl(url)) return null;
    if (this.isForbiddenScheme(url)) return null;
    try {
      return new URL(url, window.location.href).href;
    } catch {
      return null;
    }
  }

  private isImageUrl(url: string): boolean {
    return /(\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)(\?|#|$))/i.test(url) || url.includes('googleusercontent.com');
  }

  private isFontUrl(url: string): boolean {
    return /(\.(woff2?|ttf|eot|otf)(\?|#|$))/i.test(url);
  }

  private isBrowserExtensionUrl(url: string): boolean {
    return /^(chrome|moz|safari)-extension:/i.test(url) || url.startsWith('chrome-extension://') || url.startsWith('moz-extension://');
  }

  private isForbiddenScheme(url: string): boolean {
    return /^(about:|javascript:|data:|blob:|mailto:)/i.test(url);
  }

  private styleHasForbiddenUrl(style: string): boolean {
    return /(chrome|moz|safari)-extension:/i.test(style) || /chrome-extension:\/\//i.test(style) || /file:\/\//i.test(style);
  }

  private cleanStyleForbiddenUrls(style: string): string {
    return style
      .replace(/url\([^)]*(chrome|moz|safari)-extension:[^)]*\)/gi, '')
      .replace(/url\([^)]*chrome-extension:[^)]*\)/gi, '')
      .replace(/url\([^)]*file:[^)]*\)/gi, '');
  }

  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}




// import { Injectable } from '@angular/core';
// import { saveAs } from 'file-saver';
// import JSZip from 'jszip';
// import { lastValueFrom } from 'rxjs';
// import { HttpClient } from '@angular/common/http';

// @Injectable({ providedIn: 'root' })
// export class DownloadPageService {
//   private imageCounter = 0;
//   constructor(private http: HttpClient) { }
//   async downloadCurrentPage() {
//     try {
//       this.imageCounter = 0; 
//       const zip = new JSZip();
//       const { html, assets } = await this.processPageContent();
//       await this.addAssetsToZip(zip, assets);
//       zip.file('index.html', html);
//       this.addSupportFiles(zip);
//       const content = await zip.generateAsync({ type: 'blob' });
//       saveAs(content, 'google-slide.zip');
//     } catch (error) {
//       console.error('Error downloading page:', error);
//       alert('Error downloading page. Please check console for details.');
//     }
//   }
//   private async processPageContent(): Promise<{ html: string, assets: Map<string, { blob: Blob, filename: string }> }> {
//     const assets = new Map<string, { blob: Blob, filename: string }>();
//     let html = this.getPageHTML();
//     const assetUrls = this.extractAssetUrls(html);
//     for (const url of assetUrls) {
//       if (!url || assets.has(url)) continue;

//       try {
//         const result = await this.processAsset(url);
//         if (result) assets.set(url, result);
//       } catch (error) {
//         console.warn(`Asset failed: ${url}`, error);
//       }
//     }
//     html = this.updateAssetPaths(html, assets);

//     return { html, assets };
//   }
//   private async processAsset(url: string): Promise<{ blob: Blob, filename: string } | null> {
//     const isImage = this.isImageUrl(url);
//     const customFilename = isImage ? `img_${++this.imageCounter}${this.getFileExtension(url)}` : this.getFilenameFromUrl(url);

//     try {
//       let blob: Blob;
//       if (url.includes('googleusercontent.com')) {
//         blob = await lastValueFrom(this.http.get(url, { responseType: 'blob' }));
//         const fileExtension = this.getFileExtension(url) || 'png';
//       } else {
//         const response = await fetch(url, { mode: 'cors', credentials: 'include' });
//         if (!response.ok) throw new Error(`HTTP ${response.status}`);
//         blob = await response.blob();
//       }

//       return { blob, filename: customFilename };
//     } catch (error) {
//       console.warn(`Asset download failed: ${url}`, error);

//       if (isImage) {
//         return {
//           blob: await this.createPlaceholderImage(url),
//           filename: customFilename
//         };
//       }
//       return null;
//     }
//   }

//   private async createPlaceholderImage(originalUrl: string): Promise<Blob> {
//     return new Promise((resolve) => {
//       const canvas = document.createElement('canvas');
//       canvas.width = 200;
//       canvas.height = 150;
//       const ctx = canvas.getContext('2d');

//       if (ctx) {
//         ctx.fillStyle = '#f0f0f0';
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
//         ctx.fillStyle = '#999';
//         ctx.font = '14px Arial';
//         ctx.textAlign = 'center';
//         ctx.fillText('Image not available', canvas.width / 2, 70);
//         ctx.font = '10px Arial';
//         const shortUrl = originalUrl.length > 50
//           ? originalUrl.substring(0, 50) + '...'
//           : originalUrl;
//         ctx.fillText(shortUrl, canvas.width / 2, 90);
//       }
//       canvas.toBlob(
//         (blob) => resolve(blob || new Blob()),
//         'image/jpeg',
//         0.8
//       );
//     });
//   }

//   private getFileExtension(url: string): string {
//     const match = url.match(/\.(jpe?g|png|gif|webp|bmp)/i);
//     return match ? match[0] : '.jpg';
//   }

//   private async addAssetsToZip(zip: JSZip, assets: Map<string, { blob: Blob, filename: string }>): Promise<void> {
//     const cssFolder = zip.folder('css');
//     const jsFolder = zip.folder('js');
//     const imgFolder = zip.folder('images');
//     const fontsFolder = zip.folder('fonts');

//     for (const [url, { blob, filename }] of assets.entries()) {
//       if (url.endsWith('.css')) {
//         cssFolder?.file(filename, blob);
//       } else if (url.endsWith('.js')) {
//         jsFolder?.file(filename, blob);
//       } else if (this.isImageUrl(url)) {
//         imgFolder?.file(filename, blob);
//       } else if (this.isFontUrl(url)) {
//         fontsFolder?.file(filename, blob);
//       } else {
//         zip.file(filename, blob);
//       }
//     }
//   }

//   private updateAssetPaths(html: string, assets: Map<string, { blob: Blob, filename: string }>): string {
//     let updatedHtml = html;

//     for (const [url, { filename }] of assets.entries()) {
//       const folder = this.getAssetFolder(url);
//       const newPath = folder ? `${folder}/${filename}` : filename;

//       updatedHtml = updatedHtml.replace(new RegExp(this.escapeRegExp(url), 'g'), newPath);
//     }

//     return updatedHtml;
//   }

//   private escapeRegExp(string: string): string {
//     return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//   }

//   private getAssetFolder(url: string): string | null {
//     if (url.endsWith('.css')) return 'css';
//     if (url.endsWith('.js')) return 'js';
//     if (this.isImageUrl(url)) return 'images';
//     if (this.isFontUrl(url)) return 'fonts';
//     return null;
//   }

//   private addSupportFiles(zip: JSZip): void {
//     const jsFolder = zip.folder('js') || zip;
//     jsFolder.file('interactive.js', this.getInteractiveScript());
//     zip.file('README.txt', `COMPLETE PAGE DOWNLOAD

// This package contains all page assets including:
// - HTML content
// - CSS styles
// - JavaScript
// - Images (saved as img_1.jpg, img_2.jpg, etc.)

// Simply extract and open index.html in your browser.`);
//   }

//   private getInteractiveScript(): string {
//     return `document.addEventListener('DOMContentLoaded', function() {
//       // Basic interactive functionality
//       console.log('Page loaded successfully');
      
//       // Add dark mode toggle if needed
//       document.querySelectorAll('[data-action="dark-mode"]').forEach(btn => {
//         btn.addEventListener('click', function() {
//           document.body.classList.toggle('dark-mode');
//         });
//       });
//     });`;
//   }

//   private getPageHTML(): string {
//     const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '';
//     const doc = document.cloneNode(true) as Document;
//     Array.from(doc.querySelectorAll('script')).forEach(script => {
//       if (script.src && !script.src.includes('interactive.js')) {
//         script.remove();
//       }
//     });
//     if (!doc.querySelector('base')) {
//       const base = doc.createElement('base');
//       base.href = './';
//       doc.head.insertBefore(base, doc.head.firstChild);
//     }

//     return doctype + doc.documentElement.outerHTML;
//   }

//   private extractAssetUrls(html: string): string[] {
//     const urls = new Set<string>();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');

//     const extract = (el: Element, attr: string) => {
//       const val = el.getAttribute(attr);
//       if (val && !val.startsWith('data:')) {
//         try { urls.add(this.makeAbsoluteUrl(val)); } catch { }
//       }
//     };

//     doc.querySelectorAll(`
//       link[rel="stylesheet"],
//       script[src], 
//       img[src], 
//       source[src], 
//       source[srcset],
//       [style*="url("]
//     `).forEach(el => {
//       extract(el, 'href');
//       extract(el, 'src');

//       if (el.hasAttribute('srcset')) {
//         el.getAttribute('srcset')?.split(',').forEach(src => {
//           const url = src.trim().split(' ')[0];
//           if (url) try { urls.add(this.makeAbsoluteUrl(url)); } catch { }
//         });
//       }

//       if (el.hasAttribute('style')) {
//         const style = el.getAttribute('style') || '';
//         (style.match(/url\(['"]?(.*?)['"]?\)/gi) || []).forEach(match => {
//           const urlMatch = match.match(/url\(['"]?(.*?)['"]?\)/i);
//           if (urlMatch?.[1] && !urlMatch[1].startsWith('data:')) {
//             try { urls.add(this.makeAbsoluteUrl(urlMatch[1])); } catch { }
//           }
//         });
//       }
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
//     const cleanUrl = url.split('?')[0].split('#')[0];
//     return cleanUrl.split('/').pop() || 'file';
//   }

//   private isImageUrl(url: string): boolean {
//     return /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(url) ||
//       url.includes('googleusercontent.com');
//   }

//   private isFontUrl(url: string): boolean {
//     return /\.(woff|woff2|ttf|eot|otf)$/i.test(url);
//   }
// }