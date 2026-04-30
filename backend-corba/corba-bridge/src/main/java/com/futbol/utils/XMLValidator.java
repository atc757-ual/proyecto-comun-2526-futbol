package com.futbol.utils;

import java.io.StringReader;
import java.io.File;
import javax.xml.XMLConstants;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;
import org.xml.sax.SAXException;
import java.io.IOException;

/**
 * Clase Validator solicitada para verificar el XML contra el XSD.
 */
public class XMLValidator {

    public static boolean validar(String xmlContent, String xsdPath) throws SAXException, IOException {
        try {
            SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
            Schema schema = factory.newSchema(new File(xsdPath));
            Validator validator = schema.newValidator();
            validator.validate(new StreamSource(new StringReader(xmlContent)));
            return true;
        } catch (SAXException e) {
            System.err.println("Error de validación XSD: " + e.getMessage());
            throw e;
        }
    }
}
