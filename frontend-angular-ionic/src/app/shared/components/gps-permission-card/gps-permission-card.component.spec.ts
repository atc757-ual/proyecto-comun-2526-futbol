import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';
import { GpsPermissionCardComponent } from './gps-permission-card.component';

describe('GpsPermissionCardComponent', () => {
  let component: GpsPermissionCardComponent;
  let fixture: ComponentFixture<GpsPermissionCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), GpsPermissionCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GpsPermissionCardComponent);
    component = fixture.componentInstance;
  }));

  // =========================================================================
  // VISIBILIDAD
  // =========================================================================
  describe('Visibilidad', () => {
    it('no debería renderizar la tarjeta mientras isChecking es true', () => {
      component.isChecking = true;
      fixture.detectChanges();
      const card = fixture.debugElement.query(By.css('.permission-item-row'));
      expect(card).toBeNull();
    });

    it('debería renderizar la tarjeta cuando isChecking es false', () => {
      component.isChecking = false;
      component.hasPermission = true;
      fixture.detectChanges();
      const card = fixture.debugElement.query(By.css('.permission-item-row'));
      expect(card).not.toBeNull();
    });
  });

  // =========================================================================
  // ESTADO CON PERMISO
  // =========================================================================
  describe('Con permiso concedido (hasPermission = true)', () => {
    beforeEach(() => {
      component.isChecking = false;
      component.hasPermission = true;
      fixture.detectChanges();
    });

    it('debería aplicar la clase bg-permission-active', () => {
      const card = fixture.debugElement.query(By.css('.permission-item-row'));
      expect(card.nativeElement.classList).toContain('bg-permission-active');
    });

    it('no debería aplicar la clase bg-permission-denied', () => {
      const card = fixture.debugElement.query(By.css('.permission-item-row'));
      expect(card.nativeElement.classList).not.toContain('bg-permission-denied');
    });

    it('debería mostrar el texto "Ubicación compartida"', () => {
      const h3 = fixture.debugElement.query(By.css('h3'));
      expect(h3.nativeElement.textContent).toContain('Ubicación compartida');
    });

    it('debería mostrar el ícono de confirmación (checkmark)', () => {
      const checkIcon = fixture.debugElement.query(By.css('ion-icon[name="checkmark-circle-outline"]'));
      expect(checkIcon).not.toBeNull();
    });

    it('no debería mostrar el botón "Permitir"', () => {
      const button = fixture.debugElement.query(By.css('ion-button'));
      expect(button).toBeNull();
    });
  });

  // =========================================================================
  // ESTADO SIN PERMISO
  // =========================================================================
  describe('Sin permiso (hasPermission = false)', () => {
    beforeEach(() => {
      component.isChecking = false;
      component.hasPermission = false;
      component.isCapturing = false;
      fixture.detectChanges();
    });

    it('debería aplicar la clase bg-permission-denied', () => {
      const card = fixture.debugElement.query(By.css('.permission-item-row'));
      expect(card.nativeElement.classList).toContain('bg-permission-denied');
    });

    it('debería mostrar el texto "Ubicación no compartida"', () => {
      const h3 = fixture.debugElement.query(By.css('h3'));
      expect(h3.nativeElement.textContent).toContain('Ubicación no compartida');
    });

    it('debería mostrar el botón "Permitir"', () => {
      const button = fixture.debugElement.query(By.css('ion-button'));
      expect(button).not.toBeNull();
    });

    it('debería emitir requestPermission al hacer click en "Permitir"', () => {
      spyOn(component.requestPermission, 'emit');
      const button = fixture.debugElement.query(By.css('ion-button'));
      button.nativeElement.click();
      expect(component.requestPermission.emit).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // ESTADO CAPTURANDO UBICACIÓN
  // =========================================================================
  describe('Capturando ubicación (isCapturing = true)', () => {
    beforeEach(() => {
      component.isChecking = false;
      component.hasPermission = false;
      component.isCapturing = true;
      fixture.detectChanges();
    });

    it('debería mostrar el spinner en el botón', () => {
      const spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).not.toBeNull();
    });

    it('debería deshabilitar el botón mientras captura', () => {
      const button = fixture.debugElement.query(By.css('ion-button'));
      expect(button.nativeElement.disabled).toBeTrue();
    });
  });

  // =========================================================================
  // INPUTS DE ESTILOS
  // =========================================================================
  describe('Inputs de configuración', () => {
    it('debería aplicar titleClass al elemento h3', () => {
      component.isChecking = false;
      component.hasPermission = true;
      component.titleClass = 'fs-20';
      fixture.detectChanges();
      const h3 = fixture.debugElement.query(By.css('h3'));
      expect(h3.nativeElement.classList).toContain('fs-20');
    });
  });
});
