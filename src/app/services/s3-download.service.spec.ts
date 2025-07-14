import { TestBed } from '@angular/core/testing';

import { S3DownloadService } from './s3-download.service';

describe('S3DownloadService', () => {
  let service: S3DownloadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(S3DownloadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
