import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-sindiconet-iframe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iframe
      [src]="safeUrl()"
      style="width:100%;height:100%;border:none;display:block"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
      allow="clipboard-write"
      referrerpolicy="strict-origin-when-cross-origin"
      title="SindicoNet IA"
    ></iframe>
  `,
  styles: `
    :host { display:block; width:100%; height:100%; }
  `
})
export class SindiconetIframeComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly src = input.required<string>();

  safeUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.src());
  }
}