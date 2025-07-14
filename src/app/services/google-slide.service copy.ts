
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Add type declarations for Google APIs
declare global {
  interface Window {
    gapi: {
      load: (module: string, callback: () => void) => void;
      client: {
        init: (config: {
          apiKey: string;
          discoveryDocs: string[];
        }) => Promise<void>;
        slides: {
          presentations: {
            get: (params: { presentationId: string }) => Promise<{ result: any }>;
          };
        };
        getToken: () => { access_token: string } | null;
        setToken: (token: { access_token: string }) => void;
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback?: (response: any) => void;
          }) => any;
        };
      };
    };
  }
}

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
      // Load the Google API client library
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      document.body.appendChild(gapiScript);

      // Load the Google Identity Services library
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
            callback: undefined as unknown as (response: any) => void // Type assertion
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
      const response = await window.gapi.client.slides.presentations.get({
        presentationId,
      });

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
  // async listSlides(presentationId: string): Promise<any> {
  //   if (!isPlatformBrowser(this.platformId)) {
  //     throw new Error('Not in browser');
  //   }

  //   if (!this.gapiInited || !this.gisInited) {
  //     await this.loadGapiAndGis();
  //   }

  //   try {
  //     const response = await window.gapi.client.slides.presentations.get({
  //       presentationId,
  //     });
  //     debugger;
  //     return response.result;
  //   } catch (error: any) {
  //     if (error.status === 'PERMISSION_DENIED') {
  //       // More specific error message
  //       throw new Error(
  //         'Google Slides API is not enabled. ' +
  //         'Please enable it in Google Cloud Console ' +
  //         'and wait a few minutes before retrying.'
  //       );
  //     }
  //     throw error;
  //   }
  // }
}

