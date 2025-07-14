// src/app/services/google-slide.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare const window: any;

@Injectable({ providedIn: 'root' })
export class GoogleSlidesService {
  private API_KEY = 'AIzaSyDW6ahrkhwN4W89_w7KN2zmYaALeneUpTQ';
  private DISCOVERY_DOCS = ['https://slides.googleapis.com/$discovery/rest?version=v1'];
  private SCOPES = 'https://www.googleapis.com/auth/presentations.readonly';
  private tokenClient: any;
  private gapiInited = false;
  private gisInited = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadGapiAndGis();
    }
  }

  private async loadGapiAndGis(): Promise<void> {
    try {
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      document.body.appendChild(gapiScript);

      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      document.body.appendChild(gisScript);

      await new Promise<void>((resolve) => {
        gapiScript.onload = () => {
          window.gapi.load('client', async () => {
            await window.gapi.client.init({
              apiKey: this.API_KEY,
              discoveryDocs: this.DISCOVERY_DOCS,
            });
            this.gapiInited = true;
            if (this.gisInited) resolve();
          });
        };

        gisScript.onload = () => {
          this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: '240652730511-5fsefbo5fascaqiesf24fm5rcpqmuked.apps.googleusercontent.com',
            scope: this.SCOPES,
            callback: undefined as unknown as (response: any) => void
          });
          this.gisInited = true;
          if (this.gapiInited) resolve();
        };
      });
    } catch (error) {
      console.error('Error loading Google libraries:', error);
      throw error;
    }
  }

  async signIn(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Not in browser');
    }

    if (!this.gapiInited || !this.gisInited) {
      await this.loadGapiAndGis();
    }

    return new Promise<void>((resolve, reject) => {
      this.tokenClient.callback = (response: any) => {
        if (response.error) {
          reject(response.error);
        } else {
          if (response.access_token) {
            window.gapi.client.setToken({ access_token: response.access_token });
          }
          resolve();
        }
      };

      if (window.gapi.client.getToken() === null) {
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        this.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  }

  async listSlides(presentationId: string): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Not in browser');
    }

    if (!this.gapiInited || !this.gisInited) {
      await this.loadGapiAndGis();
    }

    try {
      const response = await window.gapi.client.slides.presentations.get({ presentationId });
      if (!response || !response.result) {
        throw new Error('Invalid response from Google Slides API');
      }
      return response.result;
    } catch (error: any) {
      console.error('Error fetching slides:', error);
      if (error.status === 403 || error.status === 'PERMISSION_DENIED') {
        throw new Error('Permission denied. Please ensure you have proper access and the Google Slides API is enabled.');
      }
      throw new Error(`Failed to fetch slides: ${error.message}`);
    }
  }

  async getSlideThumbnail(presentationId: string, pageId: string): Promise<string> {
    const token = window.gapi.client.getToken()?.access_token;
    const response = await fetch(
      `https://slides.googleapis.com/v1/presentations/${presentationId}/pages/${pageId}/thumbnail?thumbnailProperties.mimeType=PNG&thumbnailProperties.thumbnailSize=LARGE`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get slide thumbnail: ${response.status}`);
    }

    const data = await response.json();
    return data.contentUrl;
  }
}