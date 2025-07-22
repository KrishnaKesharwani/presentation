import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DownloadPageService {
  private imageCounter = 0;
  constructor(private http: HttpClient) { }
  async downloadCurrentPage() {
    try {
      this.imageCounter = 0; // Reset counter for each download
      const zip = new JSZip();

      // Process page content and get HTML with updated asset references
      const { html, assets } = await this.processPageContent();

      // Add all assets to zip with proper organization
      await this.addAssetsToZip(zip, assets);
      // const finalHtml = this.addInteractiveScripts(html);
      // Add modified HTML
      zip.file('index.html', html);

      // Add supporting files
      this.addSupportFiles(zip);

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'google-slide.zip');
    } catch (error) {
      console.error('Error downloading page:', error);
      alert('Error downloading page. Please check console for details.');
    }
  }

  // private async processPageContent(): Promise<{ html: string, assets: Map<string, { blob: Blob, filename: string }> }> {
  //   const assets = new Map<string, { blob: Blob, filename: string }>();
  //   let html = this.getPageHTML();

  //   // Extract all asset URLs from HTML
  //   const assetUrls = this.extractAssetUrls(html);

  //   // Process each asset
  //   for (const url of assetUrls) {
  //     try {
  //       if (!url || assets.has(url)) continue;

  //       const result = await this.processAsset(url);
  //       if (result) {
  //         assets.set(url, result);
  //       }
  //     } catch (error) {
  //       console.warn(`Could not process asset: ${url}`, error);
  //     }
  //   }

  //   // Update HTML with new asset references
  //   html = this.updateAssetPaths(html, assets);

  //   return { html, assets };
  // }
  private async processPageContent(): Promise<{ html: string, assets: Map<string, { blob: Blob, filename: string }> }> {
    const assets = new Map<string, { blob: Blob, filename: string }>();
    let html = this.getPageHTML();

    // Process assets
    const assetUrls = this.extractAssetUrls(html);
    for (const url of assetUrls) {
      if (!url || assets.has(url)) continue;

      try {
        const result = await this.processAsset(url);
        if (result) assets.set(url, result);
      } catch (error) {
        console.warn(`Asset failed: ${url}`, error);
      }
    }

    // Update HTML paths
    html = this.updateAssetPaths(html, assets);

    return { html, assets };
  }

  // private addInteractiveScripts(html: string): string {
  //   // Add this script just before closing </body> tag
  //   const interactiveScript = `
  //   <script>
  //   document.addEventListener('DOMContentLoaded', function() {
  //     // Button click handlers
  //     document.querySelectorAll('[data-action]').forEach(button => {
  //       button.addEventListener('click', function() {
  //         const action = this.getAttribute('data-action');
  //         handleAction(action);
  //       });
  //     });

  //     // Form handlers
  //     document.querySelectorAll('form').forEach(form => {
  //       form.addEventListener('submit', function(e) {
  //         e.preventDefault();
  //         handleFormSubmit(this);
  //       });
  //     });

  //     function handleAction(action) {
  //       switch(action) {
  //         case 'print':
  //           window.print();
  //           break;
  //         case 'dark-mode':
  //           document.body.classList.toggle('dark-mode');
  //           break;
  //         // Add more actions as needed
  //         default:
  //           console.log('Action:', action);
  //       }
  //     }

  //     function handleFormSubmit(form) {
  //       const data = {};
  //       form.querySelectorAll('input, select, textarea').forEach(input => {
  //         data[input.name] = input.value;
  //       });
  //       console.log('Form data:', data);
  //       alert('Form submitted (demo)');
  //     }

  //     // Add action panel if needed
  //     const actionPanel = document.createElement('div');
  //     actionPanel.style.position = 'fixed';
  //     actionPanel.style.bottom = '20px';
  //     actionPanel.style.right = '20px';
  //     actionPanel.style.zIndex = '1000';
  //     actionPanel.innerHTML = \`
  //       <button data-action="print">Print</button>
  //       <button data-action="dark-mode">Dark Mode</button>
  //     \`;
  //     document.body.appendChild(actionPanel);
  //   });
  //   </script>
  //   `;

  //   return html.replace('</body>', interactiveScript + '\n</body>');
  // }

  private async processAsset(url: string): Promise<{ blob: Blob, filename: string } | null> {
    // Generate custom filename for images
    const isImage = this.isImageUrl(url);
    const customFilename = isImage ? `img_${++this.imageCounter}${this.getFileExtension(url)}` : this.getFilenameFromUrl(url);

    try {
      let blob: Blob;

      // Special handling for Google images
      if (url.includes('googleusercontent.com')) {
        // blob = await this.downloadGoogleImage(url);
        blob = await lastValueFrom(this.http.get(url, { responseType: 'blob' }));
        const fileExtension = this.getFileExtension(url) || 'png';
      } else {
        // Standard download for other assets
        const response = await fetch(url, { mode: 'cors', credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        blob = await response.blob();
      }

      return { blob, filename: customFilename };
    } catch (error) {
      console.warn(`Asset download failed: ${url}`, error);

      // Return placeholder for failed images
      if (isImage) {
        return {
          blob: await this.createPlaceholderImage(url),
          filename: customFilename
        };
      }
      return null;
    }
  }

  private async createPlaceholderImage(originalUrl: string): Promise<Blob> {
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

        // Show shortened URL
        const shortUrl = originalUrl.length > 50
          ? originalUrl.substring(0, 50) + '...'
          : originalUrl;
        ctx.fillText(shortUrl, canvas.width / 2, 90);
      }

      // Create as JPG
      canvas.toBlob(
        (blob) => resolve(blob || new Blob()),
        'image/jpeg',
        0.8
      );
    });
  }

  private getFileExtension(url: string): string {
    const match = url.match(/\.(jpe?g|png|gif|webp|bmp)/i);
    return match ? match[0] : '.jpg';
  }

  private async addAssetsToZip(zip: JSZip, assets: Map<string, { blob: Blob, filename: string }>): Promise<void> {
    const cssFolder = zip.folder('css');
    const jsFolder = zip.folder('js');
    const imgFolder = zip.folder('images');
    const fontsFolder = zip.folder('fonts');

    for (const [url, { blob, filename }] of assets.entries()) {
      if (url.endsWith('.css')) {
        cssFolder?.file(filename, blob);
      } else if (url.endsWith('.js')) {
        jsFolder?.file(filename, blob);
      } else if (this.isImageUrl(url)) {
        imgFolder?.file(filename, blob);
      } else if (this.isFontUrl(url)) {
        fontsFolder?.file(filename, blob);
      } else {
        zip.file(filename, blob);
      }
    }
  }

  private updateAssetPaths(html: string, assets: Map<string, { blob: Blob, filename: string }>): string {
    let updatedHtml = html;

    for (const [url, { filename }] of assets.entries()) {
      const folder = this.getAssetFolder(url);
      const newPath = folder ? `${folder}/${filename}` : filename;

      updatedHtml = updatedHtml.replace(new RegExp(this.escapeRegExp(url), 'g'), newPath);
    }

    return updatedHtml;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private getAssetFolder(url: string): string | null {
    if (url.endsWith('.css')) return 'css';
    if (url.endsWith('.js')) return 'js';
    if (this.isImageUrl(url)) return 'images';
    if (this.isFontUrl(url)) return 'fonts';
    return null;
  }

  private addSupportFiles(zip: JSZip): void {
    // Add interactive scripts
    const jsFolder = zip.folder('js') || zip;
    jsFolder.file('interactive.js', this.getInteractiveScript());

    // Add readme
    zip.file('README.txt', `COMPLETE PAGE DOWNLOAD

This package contains all page assets including:
- HTML content
- CSS styles
- JavaScript
- Images (saved as img_1.jpg, img_2.jpg, etc.)

Simply extract and open index.html in your browser.`);
  }

  private getInteractiveScript(): string {
    return `document.addEventListener('DOMContentLoaded', function() {
      // Basic interactive functionality
      console.log('Page loaded successfully');
      
      // Add dark mode toggle if needed
      document.querySelectorAll('[data-action="dark-mode"]').forEach(btn => {
        btn.addEventListener('click', function() {
          document.body.classList.toggle('dark-mode');
        });
      });
    });`;
  }

  private getPageHTML(): string {
    const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : '';
    const doc = document.cloneNode(true) as Document;

    // Remove scripts that won't work offline
    Array.from(doc.querySelectorAll('script')).forEach(script => {
      if (script.src && !script.src.includes('interactive.js')) {
        script.remove();
      }
    });

    // Add base tag for relative paths
    if (!doc.querySelector('base')) {
      const base = doc.createElement('base');
      base.href = './';
      doc.head.insertBefore(base, doc.head.firstChild);
    }

    return doctype + doc.documentElement.outerHTML;
  }

  private extractAssetUrls(html: string): string[] {
    const urls = new Set<string>();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const extract = (el: Element, attr: string) => {
      const val = el.getAttribute(attr);
      if (val && !val.startsWith('data:')) {
        try { urls.add(this.makeAbsoluteUrl(val)); } catch { }
      }
    };

    // Extract from various elements
    doc.querySelectorAll(`
      link[rel="stylesheet"],
      script[src], 
      img[src], 
      source[src], 
      source[srcset],
      [style*="url("]
    `).forEach(el => {
      extract(el, 'href');
      extract(el, 'src');

      if (el.hasAttribute('srcset')) {
        el.getAttribute('srcset')?.split(',').forEach(src => {
          const url = src.trim().split(' ')[0];
          if (url) try { urls.add(this.makeAbsoluteUrl(url)); } catch { }
        });
      }

      if (el.hasAttribute('style')) {
        const style = el.getAttribute('style') || '';
        (style.match(/url\(['"]?(.*?)['"]?\)/gi) || []).forEach(match => {
          const urlMatch = match.match(/url\(['"]?(.*?)['"]?\)/i);
          if (urlMatch?.[1] && !urlMatch[1].startsWith('data:')) {
            try { urls.add(this.makeAbsoluteUrl(urlMatch[1])); } catch { }
          }
        });
      }
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
    const cleanUrl = url.split('?')[0].split('#')[0];
    return cleanUrl.split('/').pop() || 'file';
  }

  private isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(url) ||
      url.includes('googleusercontent.com');
  }

  private isFontUrl(url: string): boolean {
    return /\.(woff|woff2|ttf|eot|otf)$/i.test(url);
  }
}