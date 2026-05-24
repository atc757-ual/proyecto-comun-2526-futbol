package com.futbol.server;

import org.omg.CORBA.ORB;
import org.omg.CosNaming.NameComponent;
import org.omg.CosNaming.NamingContext;
import org.omg.CosNaming.NamingContextHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BufferServer {

    private static final Logger logger = LoggerFactory.getLogger(BufferServer.class);

    public static void main(String args[]) {
        try {
            ORB orb = ORB.init(args, null);

            BufferImpl newsImpl = new BufferImpl();
            orb.connect(newsImpl);

            org.omg.CORBA.Object objRef = orb.resolve_initial_references("NameService");
            NamingContext ncRef = NamingContextHelper.narrow(objRef);

            NameComponent nc = new NameComponent("NewsService", "");
            NameComponent path[] = {nc};
            ncRef.rebind(path, newsImpl);

            logger.info("NewsService listo y esperando peticiones...");
            orb.run();

        } catch (Exception e) {
            logger.error("ERROR FATAL EN EL SERVIDOR CORBA: {}", e.getMessage(), e);
        }
    }
}
