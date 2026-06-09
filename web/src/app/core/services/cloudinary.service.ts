import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface UploadSignature {
  signature: string;
  timestamp: number;
  cloud_name: string;
  api_key: string;
  folder: string;
}

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  subirImagen(file: File, folder: string = 'liga'): Observable<string> {
    return this.http
      .get<{ data: UploadSignature }>(`${this.base}/upload-signature?folder=${folder}`)
      .pipe(
        switchMap(({ data: sig }) => {
          const form = new FormData();
          form.append('file', file);
          form.append('api_key', sig.api_key);
          form.append('timestamp', String(sig.timestamp));
          form.append('signature', sig.signature);
          form.append('folder', sig.folder);
          return this.http.post<{ secure_url: string }>(
            `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
            form,
          );
        }),
        map(res => res.secure_url),
      );
  }
}
