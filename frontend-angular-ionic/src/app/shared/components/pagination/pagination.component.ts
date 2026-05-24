import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  template: `
    <div class="news-pagination-container animate-fade-in my-base" *ngIf="totalPages > 1">
      <ion-button mode="ios" fill="clear" color="primary" (click)="onPrev()" [disabled]="currentPage === 1" class="nav-btn">
        <ion-icon name="chevron-back-outline" slot="start"></ion-icon>
        <span>Anterior</span>
      </ion-button>
      
      <div class="page-indicators">
        <ion-button mode="ios" *ngFor="let page of getPages()" 
          [fill]="currentPage === page ? 'solid' : 'clear'"
          [color]="currentPage === page ? 'primary' : 'dark'" 
          class="page-btn"
          [class.active]="currentPage === page" 
          (click)="onGoTo(page)">
          {{ page }}
        </ion-button>
      </div>
      
      <ion-button mode="ios" fill="clear" color="primary" (click)="onNext()" [disabled]="currentPage === totalPages" class="nav-btn">
        <span>Siguiente</span>
        <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
      </ion-button>
    </div>
  `,
  styles: [`
    .news-pagination-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }
    .page-indicators {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .page-btn {
      --padding-start: 12px;
      --padding-end: 12px;
      --border-radius: 8px;
      margin: 0;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .page-btn.active {
      transform: scale(1.05);
    }
    .nav-btn {
      font-weight: 600;
      --padding-start: 8px;
      --padding-end: 8px;
    }
    @media (max-width: 576px) {
      .nav-btn span { display: none; }
      .news-pagination-container { gap: 0.5rem; }
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });
  }

  getPages(): number[] {
    const total = this.totalPages;
    if (total <= 1) return [];
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, start + 4);

    if (end === total) start = Math.max(1, total - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  onPrev() {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  onNext() {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  onGoTo(page: number) {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }
}
