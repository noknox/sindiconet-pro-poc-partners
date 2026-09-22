import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PartnerError } from '../../core/partners/partner.types';

@Component({
  selector: 'app-partner-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error && error.errors.length) {
      <ul class="partner-error">
        @for (e of error.errors; track e.code) {
          <li><strong>{{ e.code }}</strong>: {{ e.message }}</li>
        }
      </ul>
    }
  `,
  styles: [
    `
      .partner-error {
        list-style: none;
        padding: 12px 16px;
        margin: 0 0 16px;
        border-radius: 6px;
        background: #fdecea;
        color: #b3261e;
        border: 1px solid #f5c2c0;
        font-size: 13px;
      }
      .partner-error li {
        margin: 2px 0;
      }
      .partner-error li strong {
        margin-right: 4px;
      }
    `
  ]
})
export class PartnerErrorComponent {
  @Input() error: PartnerError | null = null;
}
