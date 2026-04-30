package com.futbol.server;

import org.omg.CORBA.ORB;
import org.omg.CosNaming.NameComponent;
import org.omg.CosNaming.NamingContext;
import org.omg.CosNaming.NamingContextHelper;
import BufferApp.*;

public class BufferServer {

    public static void main(String args[]) {
        try {
            // 1. Inicializar el ORB
            ORB orb = ORB.init(args, null);

            // 2. Crear el objeto de implementación
            BufferImpl newsImpl = new BufferImpl();

            // 3. Conectar el objeto al ORB (Estilo Inheritance)
            orb.connect(newsImpl);

            // 4. Obtener referencia al servicio de nombres
            org.omg.CORBA.Object objRef = orb.resolve_initial_references("NameService");
            NamingContext ncRef = NamingContextHelper.narrow(objRef);

            // 5. Registrar el servicio con el nombre "NewsService"
            NameComponent nc = new NameComponent("NewsService", "");
            NameComponent path[] = {nc};
            ncRef.rebind(path, newsImpl);

            System.out.println(">>> NewsService (Legacy Style) listo y esperando...");
            
            // 6. Ejecutar el servidor
            orb.run();

        } catch (Exception e) {
            System.err.println("ERROR EN EL SERVIDOR: " + e);
            e.printStackTrace(System.out);
        }
    }
}