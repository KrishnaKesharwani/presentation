import { TestBed } from '@angular/core/testing';

import { GetServerdataService } from './get-serverdata.service';

describe('GetServerdataService', () => {
  let service: GetServerdataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetServerdataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
