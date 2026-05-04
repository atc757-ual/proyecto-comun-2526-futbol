import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonInput, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, atOutline, alertCircleOutline, checkmarkCircle, peopleOutline } from 'ionicons/icons';
import { AuthLayoutComponent } from '../../shared/components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AuthLayoutComponent,
    IonInput,
    IonButton,
    IonIcon
  ]
})
export class LoginPage implements OnInit {

  // Variables para controlar el formulario
  userEmail: string = '';
  userPass: string = '';
  emailTouched: boolean = false;
  passTouched: boolean = false;
  emailFocused: boolean = false;
  passFocused: boolean = false;

  constructor() {
    addIcons({ mailOutline, lockClosedOutline, atOutline, alertCircleOutline, checkmarkCircle, peopleOutline });
  }

  ngOnInit() { }

  // --- VALIDACIONES ---

  isEmailValid(): boolean {
    // Usamos un regex estándar que coincida con el patrón del HTML
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.userEmail);
  }

  isPasswordValid(): boolean {
    // Coincidimos con minlength="8" del HTML
    return this.userPass.length >= 8;
  }

  isFormValid(): boolean {
    return this.isEmailValid() && this.isPasswordValid();
  }

  // --- EVENTOS ---

  markEmailTouched() {
    this.emailTouched = true;
    this.emailFocused = false;
  }

  markPassTouched() {
    this.passTouched = true;
    this.passFocused = false;
  }

  // Detectar cuando el usuario entra en el campo
  onFocusEmail() {
    this.emailFocused = true;
    this.emailTouched = false;
  }

  onFocusPass() {
    this.passFocused = true;
    this.passTouched = false;
  }

  onLogin() {
    if (this.isFormValid()) {
      console.log('Iniciando sesión con:', this.userEmail);
    }
  }

}
