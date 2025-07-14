import { TestBed } from '@angular/core/testing';

import { DownloadPageService } from './download-page.service';

describe('DownloadPageService', () => {
  let service: DownloadPageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DownloadPageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
