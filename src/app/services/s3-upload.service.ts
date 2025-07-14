// src/app/services/s3-upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { lastValueFrom } from 'rxjs';
interface ImageElement {
  contentUrl: string;
  originalUrl?: string;
  uploadFailed?: boolean;
}

interface PageElement {
  image?: ImageElement;
  objectId?: string;
}

interface Slide {
  pageElements?: PageElement[];
}

interface PresentationData {
  slides?: Slide[];
}

@Injectable({ providedIn: 'root' })
export class S3UploadService {
  private s3: S3Client;

  constructor(private http: HttpClient) {
    this.s3 = new S3Client({
      region: 'us-west-1',
      credentials: {
        accessKeyId: 'AKIA4M7GLEXAOVL22X7G',
        secretAccessKey: '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',
      },
    });
  }

  // async uploadAndReplaceImageUrls(
  //   jsonData: any,
  //   presentationId: string,
  //   updateProgress?: (current: number, total: number) => void
  // ): Promise<void> {
  //   if (!jsonData?.slides) return;

  //   let total = 0;
  //   for (const slide of jsonData.slides) {
  //     if (slide.pageElements) {
  //       total += slide.pageElements.filter((el: any) => el?.image?.contentUrl).length;
  //     }
  //   }

  //   let count = 0;

  //   for (const slide of jsonData.slides) {
  //     if (!slide.pageElements) continue;

  //     for (const element of slide.pageElements) {
  //       if (!element?.image?.contentUrl || !element.objectId) continue;

  //       try {
  //         const originalUrl = element.image.contentUrl;
  //         const elementId = element.objectId;
  //         const s3Url = await this.uploadImageToS3WithRetry(originalUrl, presentationId, elementId);

  //         element.image.contentUrl = s3Url;
  //         element.image.originalUrl = originalUrl;
  //       } catch (error) {
  //         console.error(`Failed to upload image for element ${element.objectId}:`, error);
  //         element.image.uploadFailed = true;
  //       }

  //       count++;
  //       if (updateProgress) {
  //         updateProgress(count, total);
  //       }

  //       await this.sleep(200);
  //     }
  //   }
  // }
  async uploadAndReplaceImageUrls(
    jsonData: PresentationData,
    presentationId: string,
    updateProgress?: (current: number, total: number) => void
  ): Promise<void> {
    if (!jsonData?.slides) return;

    let total = 0;
    for (const slide of jsonData.slides) {
      if (slide.pageElements) {
        total += slide.pageElements.filter((el: PageElement) => el?.image?.contentUrl).length;
      }
    }

    let count = 0;

    for (const slide of jsonData.slides) {
      if (!slide.pageElements) continue;

      for (const element of slide.pageElements) {
        if (!element?.image?.contentUrl || !element.objectId) continue;

        try {
          const originalUrl = element.image.contentUrl;
          const elementId = element.objectId;
          const s3Url = await this.uploadImageToS3WithRetry(originalUrl, presentationId, elementId);

          element.image.contentUrl = s3Url;
          element.image.originalUrl = originalUrl;
        } catch (error) {
          console.error(`Failed to upload image for element ${element.objectId}:`, error);
          element.image.uploadFailed = true;
        }

        count++;
        if (updateProgress) {
          updateProgress(count, total);
        }

        await this.sleep(200);
      }
    }

    const uploadedCount = jsonData.slides
      .flatMap((slide: Slide) => slide.pageElements || [])
      .filter((el: PageElement) => el?.image?.contentUrl?.includes('amazonaws.com')).length;

    console.log(`Successfully uploaded ${uploadedCount}/${total} images`);
  }

  private async uploadImageToS3WithRetry(
    imageUrl: string,
    presentationId: string,
    objectId: string,
    maxRetries = 5
  ): Promise<string> {
    let attempt = 0;
    let delay = 1000;

    while (attempt < maxRetries) {
      try {
        const blob = await lastValueFrom(this.http.get(imageUrl, { responseType: 'blob' }));
        const fileExtension = this.getFileExtension(imageUrl) || 'png';
        const s3Key = `${presentationId}/${objectId}.${fileExtension}`;
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
      } catch (error: any) {
        const isRateLimit = error?.status === 429 || error?.statusCode === 429;

        if (isRateLimit) {
          const jitter = Math.floor(Math.random() * 300);
          console.warn(`429 Too Many Requests. Retrying in ${delay + jitter}ms...`);
          await this.sleep(delay + jitter);
          delay *= 2;
          attempt++;
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Max retry attempts exceeded for image: ${imageUrl}`);
  }

  private getFileExtension(url: string): string | null {
    const match = url.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    return match ? match[1] : null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // upload json in Aws Server
  // Add this method to your S3UploadService class
  async uploadJsonToS3(
    jsonData: any,
    presentationId: string,
    fileName: string = 'presentation.json'
  ): Promise<string> {
    try {
      const s3Key = `${presentationId}/${fileName}`;
      const jsonString = JSON.stringify(jsonData);
      const body = new TextEncoder().encode(jsonString);

      const params: PutObjectCommandInput = {
        Bucket: 'snwz-google-slides-app',
        Key: s3Key,
        Body: body,
        ContentType: 'application/json',
        // REMOVE THIS LINE: ACL: 'public-read',
      };

      await this.s3.send(new PutObjectCommand(params));
      return `https://${params.Bucket}.s3.us-west-1.amazonaws.com/${encodeURIComponent(s3Key)}`;
    } catch (error) {
      console.error('Failed to upload JSON to S3:', error);
      throw error;
    }
  }
}