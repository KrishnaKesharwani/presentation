import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class S3UploadService {
    private s3: S3Client;

    constructor(private http: HttpClient) {
        this.s3 = new S3Client({
            region: 'us-west-1',
            credentials: {
                accessKeyId: 'AKIA4M7GLEXAOVL22X7G',
                secretAccessKey: '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',
            }
        });
    }

    async uploadAndReplaceImageUrls(jsonData: any, presentationId: string): Promise<void> {
        if (!jsonData?.slides) return;

        for (const [slideIndex, slide] of jsonData.slides.entries()) {
            if (!slide.pageElements) continue;

            for (const element of slide.pageElements) {
                if (!element?.image?.contentUrl) continue;

                try {
                    const originalUrl = element.image.contentUrl;
                    const elementId = element.objectId || `element-${slideIndex}-${Math.random().toString(36).substring(2, 9)}`;
                    
                    // Upload to S3 and get new URL
                    const s3Url = await this.uploadImageToS3(originalUrl, presentationId, elementId);
                    
                    // Replace the URL in the JSON data
                    element.image.contentUrl = s3Url;
                    element.image.originalUrl = originalUrl; // Keep original for reference
                } catch (error) {
                    console.error(`Failed to upload image for slide ${slideIndex}:`, error);
                    element.image.uploadFailed = true;
                }
            }
        }
    }

    private async uploadImageToS3(imageUrl: string, presentationId: string, elementId: string): Promise<string> {
        const blob = await lastValueFrom(
            this.http.get(imageUrl, { responseType: 'blob' })
        );

        const fileExtension = this.getFileExtension(imageUrl) || 'png';
        const s3Key = `${presentationId}/${elementId}.${fileExtension}`;

        const arrayBuffer = await blob.arrayBuffer();
        const body = new Uint8Array(arrayBuffer);

        const params: PutObjectCommandInput = {
            Bucket: 'snwz-google-slides-app',
            Key: s3Key,
            Body: body,
            ContentType: blob.type || 'image/png',
        };

        await this.s3.send(new PutObjectCommand(params));
        
        return `https://${params.Bucket}.s3.us-west-1.amazonaws.com/${encodeURIComponent(s3Key)}`;
    }

    private getFileExtension(url: string): string | null {
        const match = url.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
        return match ? match[1] : null;
    }
}

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { from, lastValueFrom } from 'rxjs';
// import { switchMap } from 'rxjs/operators';

// @Injectable({ providedIn: 'root' })
// export class S3UploadService {
//   private s3: S3Client;

//   constructor(private http: HttpClient) {
//     this.s3 = new S3Client({
//       region: 'us-west-1',
//       credentials: {
//         accessKeyId: 'AKIA4M7GLEXAOVL22X7G',
//         secretAccessKey: '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',
//       }
//     });
//   }

//   async uploadSlidesFromJson(json: any, presentationId: string): Promise<string[]> {
//     console.log('Uploading slides from JSON');
//     const uploadedUrls: string[] = [];

//     for (const slide of json.slides || []) {
//       for (const element of slide.pageElements || []) {
//         if (!element?.image?.contentUrl || !element.objectId) continue;

//         const imageUrl = element.image.contentUrl;
//         const elementId = element.objectId;

//         try {
//           const blob = await lastValueFrom(
//             this.http.get(imageUrl, { responseType: 'blob' })
//           );
//           const s3Key = `${presentationId}/slide-${elementId}.png`;
//           const uploadedUrl = await this.uploadToS3(blob, s3Key);
//           uploadedUrls.push(uploadedUrl);
//         } catch (error) {
//           console.error(`Upload failed for element ${elementId}:`, error);
//         }
//       }
//     }

//     return uploadedUrls;
//   }

// private async uploadToS3(blob: Blob, key: string): Promise<string> {
//   // Convert Blob to Uint8Array which is the expected type in v3
//   const arrayBuffer = await blob.arrayBuffer();
//   const body = new Uint8Array(arrayBuffer);

//   const params = {
//     Bucket: 'snwz-google-slides-app',
//     Key: key,
//     Body: body,
//     ContentType: blob.type || 'application/octet-stream', // Fallback content type
//   };

//   try {
//     const command = new PutObjectCommand(params);
//     await this.s3.send(command);
    
//     // Construct the URL manually since v3 doesn't return Location in response
//     return `https://${params.Bucket}.s3.${this.s3.config.region}.amazonaws.com/${encodeURIComponent(key)}`;
//   } catch (error) {
//     console.error('S3 upload error:', error);
//     throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : String(error)}`);
//   }
// }
// }


// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as AWS from 'aws-sdk';

// // import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { firstValueFrom } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class S3UploadService {
//   private s3: AWS.S3;

//   constructor(private http: HttpClient) {
//     AWS.config.update({
//       accessKeyId: 'AKIA4M7GLEXAOVL22X7G',
//       secretAccessKey: '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',
//       region: 'us-west-1',
//     });
//     this.s3 = new AWS.S3({ params: { Bucket: 'snwz-google-slides-app' } });
//   }

//   async uploadSlidesFromJson(json: any, presentationId: string): Promise<string[]> {
//     alert('Calling uploadSlidesFromJson');
//     const uploadedUrls: string[] = [];

//     for (const slide of json.slides || []) {
//       for (const element of slide.pageElements || []) {
//         if (!element?.image?.contentUrl || !element.objectId) continue;

//         const imageUrl = element.image.contentUrl;
//         const elementId = element.objectId;

//         try {
//           const blob = await firstValueFrom(this.http.get(imageUrl, { responseType: 'blob' }));
//           const s3Key = `${presentationId}/slide-${elementId}.png`;
//           const uploadedUrl = await this.uploadToS3(blob, s3Key);
//           uploadedUrls.push(uploadedUrl);
//         } catch (error) {
//           console.error(`Upload failed for element ${elementId}:`, error);
//         }
//       }

//       // Free memory after each slide
//       global.gc?.(); // works only if run with `--expose-gc` flag
//     }

//     return uploadedUrls;
//   }

//   private uploadToS3(blob: Blob, key: string): Promise<string> {
//     alert('Calling uploadToS3');
//     const params: AWS.S3.PutObjectRequest = {
//       Bucket: 'snwz-google-slides-app',
//       Key: key,
//       Body: blob,
//       ContentType: blob.type,
//     };

//     return new Promise((resolve, reject) => {
//       this.s3.upload(params, (err, data) => {
//         if (err) reject(err);
//         else resolve(data.Location);
//       });
//     });
//   }
// }


// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as AWS from 'aws-sdk';

// @Injectable({ providedIn: 'root' })
// export class S3UploadService {
//   private s3: AWS.S3;

//   constructor(private http: HttpClient) {
//     AWS.config.update({
//       accessKeyId: 'AKIA4M7GLEXAOVL22X7G',
//       secretAccessKey: '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',
//       region: 'us-west-1',
//     });
//     this.s3 = new AWS.S3({ params: { Bucket: 'snwz-google-slides-app' } });
//   }

//   async uploadSlidesFromJson(json: any, presentationId: string): Promise<string[]> {
//     const uploadedUrls: string[] = [];

//     for (const slide of json.slides || []) {
//       for (const element of slide.pageElements || []) {
//         if (!element?.image?.contentUrl || !element.objectId) continue;

//         const imageUrl = element.image.contentUrl;
//         const elementId = element.objectId;

//         try {
//           const blob = await this.http.get(imageUrl, { responseType: 'blob' }).toPromise();
//           if (!blob) {
//             console.error(`Failed to fetch blob for element ${elementId}`);
//             continue;
//           }
//           const s3Key = `${presentationId}/slide-${elementId}.png`;
//           const uploadedUrl = await this.uploadToS3(blob, s3Key);
//           uploadedUrls.push(uploadedUrl);
//         } catch (error) {
//           console.error(`Failed to upload element ${elementId}:`, error);
//         }
//       }
//     }

//     return uploadedUrls;
//   }

//   private uploadToS3(blob: Blob, key: string): Promise<string> {
//     const params: AWS.S3.PutObjectRequest = {
//       Bucket: 'snwz-google-slides-app',
//       Key: key,
//       Body: blob,
//       ContentType: blob.type,
//       // ACL: 'public-read'
//     };

//     return new Promise((resolve, reject) => {
//       this.s3.upload(params, (err, data) => {
//         if (err) reject(err);
//         else resolve(data.Location);
//       });
//     });
//   }
// }



// import { Injectable } from '@angular/core';
// import { environment } from '../../environments/environment';
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

// @Injectable({
//   providedIn: 'root'
// })
// export class S3UploadService {
//   private s3: S3Client;
//   private readonly bucketName = environment.aws.bucketName;

//   constructor() {
//     this.s3 = new S3Client({
//       region: environment.aws.region,
//       credentials: fromCognitoIdentityPool({
//         clientConfig: { region: environment.aws.region },
//         identityPoolId: environment.aws.identityPoolId, // Add this to your environment
//       }),
//       requestChecksumCalculation: "WHEN_REQUIRED"
//     });
//   }
// async uploadImageToS3(imageUrl: string, fileName: string): Promise<string> {
//   const response = await fetch(imageUrl);
//   if (!response.ok) throw new Error('Failed to fetch image');
//   const blob = await response.blob(); // <-- Use blob, not response.body

//   const command = new PutObjectCommand({
//     Bucket: this.bucketName,
//     Key: `${fileName}`,
//     Body: blob, // <-- Pass blob here
//     ACL: 'public-read',
//     ContentType: blob.type || 'image/jpeg'
//   });

//   await this.s3.send(command);

//   // Construct the public URL
//   return `https://${this.bucketName}.s3.${environment.aws.region}.amazonaws.com/slides/${fileName}`;
// }
// //   async uploadImageToS3(imageUrl: string, fileName: string): Promise<string> {
// //     debugger;
// //     const response = await fetch(imageUrl);
// //     if (!response.ok) throw new Error('Failed to fetch image');
// //     const blob = await response.blob();

// //     const command = new PutObjectCommand({
// //       Bucket: this.bucketName,
// //       Key: `slides/${fileName}`,
// //       Body: blob,
// //       ACL: 'public-read',
// //       ContentType: blob.type || 'image/jpeg'
// //     });

// //     await this.s3.send(command);
// // debugger;
// // console.log(`Image uploaded successfully: ${fileName}`);
// //     // Construct the public URL
// //     return `https://${this.bucketName}.s3.${environment.aws.region}.amazonaws.com/slides/${fileName}`;
// //   }

//   // ...rest of your batching logic...
// }// // src/app/services/s3-upload.service.ts



// import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import { environment } from '../../environments/environment';
// import * as AWS from 'aws-sdk';

// @Injectable({
//   providedIn: 'root'
// })

// export class S3UploadService {
//   private s3: AWS.S3 | undefined;
//   private readonly bucketName = environment.aws.bucketName;
//   private readonly MAX_CONCURRENT_UPLOADS = 5; // Limit concurrent uploads
//   private readonly SLIDE_BATCH_SIZE = 5; // Process slides in batches

//   constructor(@Inject(PLATFORM_ID) private platformId: Object) {
//     if (isPlatformBrowser(this.platformId)) {
//       AWS.config.update({
//         region: environment.aws.region,
//         credentials: new AWS.Credentials({
//           accessKeyId: environment.aws.accessKeyId,
//           secretAccessKey: environment.aws.secretAccessKey
//         }),
//         httpOptions: { timeout: 30000 } // 30 second timeout
//       });
//       this.s3 = new AWS.S3({ maxRetries: 3 });
//     }
//   }

//   /**
//    * Uploads all images in a presentation to S3 and returns updated data
//    */
//   async uploadPresentationImages(presentationData: any): Promise<any> {
//     debugger;
//     if (!isPlatformBrowser(this.platformId)) {
//       throw new Error('This method can only run in the browser');
//     }

//     if (!presentationData?.slides) {
//       throw new Error('Invalid presentation data');
//     }

//     if (!this.s3) {
//       throw new Error('S3 client is not initialized');
//     }

//     // Process slides in batches to prevent memory overload
//     const updatedSlides = [];
//     const slides = presentationData.slides;
    
//     for (let i = 0; i < slides.length; i += this.SLIDE_BATCH_SIZE) {
//       const batch = slides.slice(i, i + this.SLIDE_BATCH_SIZE);
//       const processedBatch = await this.processSlideBatch(batch);
//       updatedSlides.push(...processedBatch);
//     }

//     return {
//       ...presentationData,
//       slides: updatedSlides
//     };
//   }

//   /**
//    * Processes a batch of slides
//    */
//   private async processSlideBatch(slides: any[]): Promise<any[]> {
//     const processedSlides = [];
    
//     for (const slide of slides) {
//       try {
//         processedSlides.push(await this.processSlide(slide));
//       } catch (error) {
//         console.error(`Error processing slide:`, error);
//         processedSlides.push(slide); // Return original slide if processing fails
//       }
//     }
    
//     return processedSlides;
//   }

//   /**
//    * Processes a single slide and its elements
//    */
//   private async processSlide(slide: any): Promise<any> {
//     const imageElements = slide.pageElements.filter((el: any) => el.image?.contentUrl);
    
//     // Process elements with concurrency control
//     const updatedElements = await this.processElementsWithConcurrency(
//       imageElements,
//       this.MAX_CONCURRENT_UPLOADS
//     );

//     // Merge with non-image elements
//     const nonImageElements = slide.pageElements.filter((el: any) => !el.image?.contentUrl);
//     return {
//       ...slide,
//       pageElements: [...nonImageElements, ...updatedElements]
//     };
//   }

//   /**
//    * Processes elements with controlled concurrency
//    */
//   private async processElementsWithConcurrency(elements: any[], concurrency: number): Promise<any[]> {
//     const results: any[] = [];
    
//     for (let i = 0; i < elements.length; i += concurrency) {
//       const batch = elements.slice(i, i + concurrency);
//       const batchResults = await Promise.all(
//         batch.map(element => this.processElement(element))
//       );
//       results.push(...batchResults);
//     }
    
//     return results;
//   }

//   /**
//    * Processes a single element
//    */
//   private async processElement(element: any): Promise<any> {
//     try {
//       const updatedElement = { ...element };
//       const fileName = `${element.objectId}-${Date.now()}.jpg`; // Add timestamp for uniqueness
//       const s3Url = await this.uploadImageToS3(element.image.contentUrl, fileName);
      
//       return {
//         ...updatedElement,
//         image: {
//           ...updatedElement.image,
//           contentUrl: s3Url
//         }
//       };
//     } catch (error) {
//       console.error(`Failed to upload image for element ${element.objectId}:`, error);
//       return element; // Return original if upload fails
//     }
//   }

//   /**
//    * Uploads a single image to S3 using streaming approach
//    */
//   private async uploadImageToS3(imageUrl: string, fileName: string): Promise<string> {
//     if (!this.s3) {
//       throw new Error('S3 client is not initialized');
//     }

//     const response = await fetch(imageUrl);
//     if (!response.ok || !response.body) {
//       throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
//     }

//     const contentType = response.headers.get('content-type') || 'image/jpeg';
//     const contentLength = response.headers.get('content-length');

//     const uploadParams = {
//       Bucket: this.bucketName,
//       Key: `slides/${fileName}`,
//       Body: response.body,
//       ACL: 'public-read',
//       ContentType: contentType,
//       ...(contentLength && { ContentLength: Number(contentLength) })
//     };

//     try {
//       const upload = this.s3.upload(uploadParams);
      
//       // Optional: Track upload progress
//       upload.on('httpUploadProgress', (progress) => {
//         console.log(`Uploading ${fileName}: ${Math.round((progress.loaded / progress.total) * 100)}%`);
//       });

//       const uploadResult = await upload.promise();
//       return uploadResult.Location;
//     } finally {
//       // Clean up the stream
//       if (response.body) {
//         response.body.cancel().catch(() => {});
//       }
//     }
//   }
// }