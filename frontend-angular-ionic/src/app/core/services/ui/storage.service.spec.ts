import { TestBed } from '@angular/core/testing';
import { Storage } from '@angular/fire/storage';
import { StorageService } from '../system/storage.service';

describe('StorageService', () => {
  let service: StorageService;

  const storageMock = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: Storage, useValue: storageMock }
      ]
    });

    service = TestBed.inject(StorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('deleteImageByUrl', () => {
    it('should return early if URL is empty', async () => {
      // No error should be thrown
      await expectAsync(service.deleteImageByUrl('')).toBeResolved();
    });

    it('should return early if URL is not a Firebase Storage URL', async () => {
      await expectAsync(
        service.deleteImageByUrl('https://example.com/image.jpg')
      ).toBeResolved();
    });

    it('should return early when expectedFolder does not match file path', async () => {
      const url = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/players%2Fimage.jpg?alt=media';
      // expectedFolder 'news' should not match path starting with 'players/'
      await expectAsync(
        service.deleteImageByUrl(url, 'news')
      ).toBeResolved();
    });

    it('should return early for null/undefined URL', async () => {
      await expectAsync(service.deleteImageByUrl(null as any)).toBeResolved();
      await expectAsync(service.deleteImageByUrl(undefined as any)).toBeResolved();
    });

    it('should detect non-Firebase URL correctly', async () => {
      const consoleSpy = spyOn(console, 'warn');
      await service.deleteImageByUrl('https://cdn.example.com/img.png');
      expect(consoleSpy).toHaveBeenCalledWith(jasmine.stringContaining('no es de Firebase Storage'));
    });
  });
});
