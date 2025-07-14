import { TestBed } from '@angular/core/testing';

import { GoogleSlideService } from './google-slide.service';

describe('GoogleSlideService', () => {
  let service: GoogleSlideService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleSlideService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
