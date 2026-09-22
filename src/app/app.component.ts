import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './features/menu/menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <app-menu />
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell {
      display: flex;
      min-height: 100vh;
      background: #f4f5f7;
    }
    .content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
  `
})
export class AppComponent {}