package com.futbol.corba;

/**
 * Main server class for the CORBA News Service.
 */
public class NewsServer {

  /**
   * Main entry point for the CORBA News Service.
   *
   * @param args Command line arguments.
   */
  public static void main(String[] args) {
    System.out.println("--- Servidor de Noticias CORBA Iniciado ---");
    try {
      // Logic for ORB initialization will be added later.
      while (true) {
        Thread.sleep(10000);
        System.out.println("CORBA Service: Esperando noticias...");
      }
    } catch (InterruptedException e) {
      System.err.println("Servidor CORBA interrumpido");
      Thread.currentThread().interrupt();
    }
  }

}
