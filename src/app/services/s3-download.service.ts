// // src/app/services/s3-download.service.ts
// src/app/services/s3-download.service.ts
import { Injectable } from '@angular/core';
import { S3Client, GetObjectCommand, HeadObjectCommand, NoSuchKey, S3ServiceException } from '@aws-sdk/client-s3';

@Injectable({
  providedIn: 'root'
})
export class S3DownloadService {
  private s3: S3Client;
  private readonly bucketName = 'snwz-google-slides-app';
  private readonly defaultFileName = 'presentation.json';

  constructor() {
    this.s3 = new S3Client({
      region: 'us-west-1',
      credentials: {
        accessKeyId: 'AKIA4M7GLEXAOVL22X7G',
        secretAccessKey: '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',
      }
    });
  }

  /**
   * Fetches JSON data from S3 bucket
   * @param presentationId The folder name in S3
   * @param fileName The JSON file name (defaults to 'presentation.json')
   * @returns Parsed JSON data
   * @throws Error with descriptive message if download fails
   */
  async getJsonFromS3(presentationId: string, fileName: string = this.defaultFileName): Promise<any> {
    const key = this.normalizeKeyPath(presentationId, fileName);
    
    try {
      console.debug(`Fetching JSON from S3: ${this.bucketName}/${key}`);
      
      const response = await this.s3.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      }));

      if (!response.Body) {
        throw new Error('Empty response body from S3');
      }

      const jsonString = await this.processResponseBody(response.Body);
      return this.parseJson(jsonString);

    } catch (error: unknown) {
      throw this.handleS3Error(error, key);
    }
  }

  private normalizeKeyPath(presentationId: string, fileName: string): string {
    return `${presentationId}/${fileName}`.replace(/\/+/g, '/');
  }

  private async processResponseBody(body: any): Promise<string> {
    if (typeof body === 'string') return body;
    if (typeof body.transformToString === 'function') return await body.transformToString();
    if (body instanceof Uint8Array) return new TextDecoder('utf-8').decode(body);
    if (body instanceof ReadableStream) return await this.streamToText(body);
    
    throw new Error('Unsupported response body type');
  }

  private parseJson(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown JSON parsing error';
      throw new Error(`Failed to parse JSON: ${message}`);
    }
  }

  private handleS3Error(error: unknown, key: string): Error {
    // Handle AWS SDK specific errors
    if (error instanceof NoSuchKey) {
      return new Error(`File not found at s3://${this.bucketName}/${key}`);
    }

    if (error instanceof S3ServiceException) {
      console.error('S3 Service Exception:', {
        code: error.$metadata.httpStatusCode,
        requestId: error.$metadata.requestId,
        key
      });
      return new Error(`S3 service error: ${error.message}`);
    }

    // Handle generic errors
    if (error instanceof Error) {
      console.error('S3 Download Error:', {
        message: error.message,
        stack: error.stack,
        key
      });
      return new Error(`Failed to download from S3: ${error.message}`);
    }

    // Handle completely unknown errors
    console.error('Unknown S3 Download Error:', error);
    return new Error('Unknown error occurred while downloading from S3');
  }

  private async streamToText(stream: ReadableStream): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
      return result + decoder.decode(); // Flush remaining bytes
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Checks if a file exists in S3
   * @param presentationId Folder name
   * @param fileName File to check
   * @returns boolean indicating existence
   * @throws Error if the check fails (other than Not Found)
   */
  async fileExists(presentationId: string, fileName: string = this.defaultFileName): Promise<boolean> {
    const key = this.normalizeKeyPath(presentationId, fileName);
    
    try {
      await this.s3.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      }));
      return true;
    } catch (error: unknown) {
      if (error instanceof S3ServiceException && error.name === 'NotFound') {
        return false;
      }
      throw this.handleS3Error(error, key);
    }
  }
}


// import { Injectable } from '@angular/core';
// import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// @Injectable({
//   providedIn: 'root'
// })
// export class S3DownloadService {
//   private s3: S3Client;

//   constructor() {
//     this.s3 = new S3Client({
//       region: 'us-west-1',
//       credentials: {
//         accessKeyId: 'AKIA4M7GLEXAOVL22X7G',
//         secretAccessKey: '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',
//       }
//     });
//   }

//   async getJsonFromS3(presentationId: string, fileName: string = 'presentation.json'): Promise<any> {
//     const key = `${presentationId}/${fileName}`;
//     const command = new GetObjectCommand({
//       Bucket: 'snwz-google-slides-app',
//       Key: key
//     });

//     try {
//       const response = await this.s3.send(command);
//       const stream = response.Body as ReadableStream;

//       const text = await this.streamToText(stream);
//       return JSON.parse(text);
//     } catch (error) {
//       console.error('Error downloading JSON from S3:', error);
//       throw error;
//     }
//   }

//   private async streamToText(stream: ReadableStream): Promise<string> {
//     const reader = stream.getReader();
//     const decoder = new TextDecoder('utf-8');
//     let result = '';
//     let done = false;

//     while (!done) {
//       const { value, done: streamDone } = await reader.read();
//       done = streamDone;
//       if (value) {
//         result += decoder.decode(value, { stream: true });
//       }
//     }

//     return result;
//   }
// }
