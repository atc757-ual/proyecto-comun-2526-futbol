import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline, sendOutline, arrowBackOutline,
  homeOutline, newspaperOutline, listOutline, personOutline, pricetagsOutline,
  calendarOutline, eyeOutline, closeCircle, starOutline,
  saveOutline, checkmarkCircleOutline, alertCircleOutline, closeOutline, trashOutline, syncOutline,
  chevronDownOutline
} from 'ionicons/icons';
import { NewsItem } from '../../../core/models/news.model';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LayoutService } from 'src/app/core/services/ui/layout.service';
import { PlatformService } from 'src/app/core/services/system/platform.service';
import { NEWS_SERVICE_TOKEN } from '../../../core/services/news/news.service.token';
import { ToastService } from 'src/app/core/services/ui/toast.service';

@Component({
  selector: 'app-add-edit-news',
  templateUrl: './add-edit-news.page.html',
  styleUrls: ['./add-edit-news.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class AddEditNewsPage implements OnInit {
  private newsService = inject(NEWS_SERVICE_TOKEN);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private navCtrl = inject(NavController);
  private layoutService = inject(LayoutService);
  private route = inject(ActivatedRoute);
  public platformService = inject(PlatformService);

  // Iconos para lógica de intercambio
  public calendarOutline = calendarOutline;
  public checkmarkCircleOutline = checkmarkCircleOutline;
  public chevronDownOutline = chevronDownOutline;
  public pricetagsOutline = pricetagsOutline;

  isEditMode = false;
  newsId: string | null = null;
  isLoading = false;
  selectedFile: File | null = null;

  // Para detección de cambios reales
  private initialDataJson = '';
  private initialPreviewImage: string | null = null;

  newsData: NewsItem = {
    title: '',
    summary: '',
    category: '',
    author: '',
    content: '',
    imageUrl: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    isActive: false,
    isFeatured: false
  }

  tagInput: string = '';
  previewImage: string | null = null;
  isPublishing: boolean = false;
  minDate: string = new Date().toISOString().split('T')[0];
  categories = [
    { value: 'Fichajes', label: 'Fichajes' },
    { value: 'Resultados', label: 'Resultados' },
    { value: 'Crónica', label: 'Crónica' },
    { value: 'Opinión', label: 'Opinión' },
    { value: 'Internacional', label: 'Internacional' },
    { value: 'Mundial 2026', label: 'Mundial 2026' },
    { value: 'Táctica', label: 'Táctica' },
    { value: 'Actualidad', label: 'Actualidad' },
    { value: 'Salud', label: 'Salud' },
    { value: 'General', label: 'General' }
  ];

  categoryPopoverOptions = {
    subHeader: 'Selecciona el tema principal',
    cssClass: 'futbol-popover'
  };


  // Estados de foco para los iconos (Estilo Auth)
  focusedField: string | null = null;

  setFocus(field: string | null) {
    this.focusedField = field;
  }


  get hasChanges(): boolean {
    // Si no estamos en edición, cualquier dato válido es un "cambio" respecto a nada
    if (!this.isEditMode) return true;

    const currentDataJson = JSON.stringify(this.newsData);
    const imageChanged = this.previewImage !== this.initialPreviewImage;

    return currentDataJson !== this.initialDataJson || imageChanged;
  }

  getNonWhitespaceLength(value: string | undefined): number {
    if (!value) return 0;
    return value.replace(/\s/g, '').length;
  }

  // Métodos de validación para el feedback visual (Checkmarks)
  isTitleValid(): boolean {
    return (this.newsData.title?.trim().length || 0) >= 5;
  }

  isSummaryValid(): boolean {
    const len = this.getNonWhitespaceLength(this.newsData.summary);
    return len >= 10;
  }

  isAuthorValid(): boolean {
    return (this.newsData.author?.trim().length || 0) >= 3;
  }

  isContentValid(): boolean {
    const len = this.getNonWhitespaceLength(this.newsData.content);
    return len >= 20;
  }

  // Formateadores específicos para cada campo para asegurar el contexto
  // Formateador específico para el título que SÍ cuenta espacios
  titleCounterFormatter = (inputLength: number, maxLength: number) => {
    return `${inputLength} / ${maxLength}`;
  };

  summaryCounterFormatter = (inputLength: number, maxLength: number) => {
    const len = this.getNonWhitespaceLength(this.newsData.summary);
    return `${len} / ${maxLength}`;
  };

  contentCounterFormatter = (inputLength: number, maxLength: number) => {
    const len = this.getNonWhitespaceLength(this.newsData.content);
    return `${len} / ${maxLength}`;
  };

  tagCounterFormatter = (inputLength: number, maxLength: number) => {
    return `${inputLength} / ${maxLength} carac. | ${this.newsData.tags.length} / 6 tags`;
  };

  tagsTouched = false;

  get shouldShowTagBorderError(): boolean {
    // El borde solo se pone rojo si está vacío y el usuario ya salió del campo
    return this.tagsTouched && this.newsData.tags.length === 0 && this.focusedField !== 'tags';
  }

  get tagErrorText(): string {
    if (this.tagError) return this.tagError;
    if (this.shouldShowTagBorderError) return 'Se requiere al menos una etiqueta';
    return '';
  }

  constructor() {
    addIcons({
      cloudUploadOutline, sendOutline, arrowBackOutline,
      homeOutline, newspaperOutline, listOutline, personOutline, pricetagsOutline,
      calendarOutline, eyeOutline, closeCircle, starOutline,
      saveOutline, checkmarkCircleOutline, alertCircleOutline, closeOutline, trashOutline, syncOutline,
      chevronDownOutline
    });
  }

  ngOnInit() {
    this.newsId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.newsId;

    this.layoutService.setHeader({
      title: this.isEditMode ? 'Editar noticia' : 'Crear noticia',
      subtitle: this.isEditMode ? 'Actualiza la información de la noticia seleccionada' : '¡Carga Noticias desde aquí, para la comunidad futbolística!',
      showHero: true
    });

    this.layoutService.setBreadcrumbs([
      { label: '', url: '/home', icon: 'home-outline' },
      { label: 'Noticias', url: '/news' },
      { label: this.isEditMode ? 'Editar noticia' : 'Crear noticia' }
    ]);

    if (this.isEditMode && this.newsId) {
      this.loadNews();
    } else {
      // Establecer creador automáticamente, pero dejar Autor vacío para llenado manual
      const userData = this.authService.getUserData();
      if (userData) {
        this.newsData.createdBy = userData.name || userData.email || 'Admin';
      } else {
        this.newsData.createdBy = 'Admin';
      }

      // El autor/editorial se queda vacío para que el admin lo decida
      this.newsData.author = '';
    }
  }

  loadNews() {
    if (!this.newsId) return;
    this.isLoading = true;
    this.newsService.getNewsById(this.newsId).subscribe({
      next: (news) => {
        if (news) {
          // Asignación segura de campos obligatorios para evitar errores de tipado
          this.newsData = {
            ...this.newsData, // Mantenemos los valores por defecto
            ...news           // Sobreescribimos con lo que viene de la API
          };

          // Asegurar formato yyyy-MM-DD para el input nativo
          if (this.newsData.date && this.newsData.date.includes('T')) {
            this.newsData.date = this.newsData.date.split('T')[0];
          }
          
          this.previewImage = news.imageUrl || '';

          // Guardar estado inicial para detección de cambios reales
          this.initialDataJson = JSON.stringify(this.newsData);
          this.initialPreviewImage = news.imageUrl || '';

          // Ajustar minDate si la noticia es más antigua que hoy
          const newsDateOnly = news.date ? news.date.split('T')[0] : '';
          if (newsDateOnly && newsDateOnly < this.minDate) {
            this.minDate = newsDateOnly;
          }

          // Forzar actualización del contador de tags inicial
          setTimeout(() => this.forceTagCounterUpdate(), 100);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showToast('Error al cargar la noticia', 'danger');
        this.navCtrl.navigateBack('/manage-news');
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validación de tamaño (100KB = 100 * 1024 bytes)
      const maxSize = 100 * 1024;
      if (file.size > maxSize) {
        this.showToast('La imagen es demasiado pesada. Máximo 100KB', 'danger');
        event.target.value = ''; // Limpiar el input para permitir re-seleccionar
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.previewImage = null;
    this.selectedFile = null;
    this.newsData.imageUrl = '';
  }

  tagError: string = '';

  addTag() {
    this.tagError = ''; // Limpiar error previo
    let tag = this.tagInput.trim().replace(/,/g, '');
    if (!tag) return;

    // Quitar el # inicial si ya lo trae
    tag = tag.startsWith('#') ? tag.substring(1) : tag;

    // Ya no hace falta recortar ni avisar aquí, el HTML se encarga con maxlength="15"
    if (tag) {
      if (this.newsData.tags.includes(tag)) {
        this.tagError = 'Esta etiqueta ya ha sido añadida';
        this.tagInput = '';
        return;
      }

      if (this.newsData.tags.length < 6) {
        this.newsData.tags.push(tag);
        this.tagInput = ''; // Limpiar el input
        this.forceTagCounterUpdate();
      } else {
        this.tagError = 'Máximo 6 etiquetas permitidas';
      }
    } else {
      this.tagInput = ''; // Limpiar si está vacío
    }
  }

  removeTag(tag: string) {
    this.newsData.tags = this.newsData.tags.filter((t: string) => t !== tag);
    this.forceTagCounterUpdate();
  }

  dummyCounter = 0;

  forceTagCounterUpdate() {
    this.dummyCounter++;
    // Forzamos el refresco del formateador re-asignándolo
    this.tagCounterFormatter = (inputLength: number, maxLength: number) => {
      return `${inputLength} / ${maxLength} carac. | ${this.newsData.tags.length} / 6 tags`;
    };
  }

  updateTags() {
    if (this.tagInput.includes(',')) {
      this.addTag();
    }
  }


  async onPublish() {
    if (!this.newsData.title || !this.newsData.content) {
      this.showToast('Por favor, completa los campos obligatorios', 'warning');
      return;
    }

    if (this.isEditMode && !this.hasChanges) {
      this.showToast('No se han detectado cambios para actualizar', 'warning');
      return;
    }

    this.isPublishing = true;

    this.newsService.saveNews(this.newsData, this.selectedFile, this.initialPreviewImage).subscribe({
      next: (res) => {
        this.isPublishing = false;
        const msg = this.isEditMode ? '¡Noticia actualizada con éxito!' : '¡Noticia publicada con éxito en CORBA!';
        this.showToast(msg, 'success');
        this.navCtrl.navigateRoot('/manage-news');
      },
      error: (err) => {
        this.isPublishing = false;
        console.error('[PUBLISH] Error al procesar noticia:', err);
        this.showToast('Error al guardar la noticia (CORBA/Storage)', 'danger');
      }
    });
  }

  onCancel() {
    this.navCtrl.back();
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning' | 'danger') {
    if (type === 'success') {
      this.toastService.showSuccess(message);
    } else {
      this.toastService.showError(message);
    }
  }

}
