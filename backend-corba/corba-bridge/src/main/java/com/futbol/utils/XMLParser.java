package com.futbol.utils;

import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Clase XMLParser: Parsea un String XML usando DOM y devuelve un Document.
 * Responsabilidad de bajo nivel: solo convierte texto a árbol DOM.
 */
public class XMLParser {

    private static final DocumentBuilderFactory factory;

    static {
        factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
    }

    /**
     * Parsea el XML recibido como String y devuelve el Document DOM.
     *
     * @param xmlContent El XML en texto plano
     * @return Document DOM listo para ser consultado
     * @throws ParserConfigurationException si el parser no puede configurarse
     * @throws SAXException si el XML está mal formado
     * @throws IOException si hay un error de lectura
     */
    public static Document parse(String xmlContent)
            throws ParserConfigurationException, SAXException, IOException {

        DocumentBuilder builder = factory.newDocumentBuilder();
        ByteArrayInputStream input = new ByteArrayInputStream(
                xmlContent.getBytes(StandardCharsets.UTF_8));
        Document document = builder.parse(input);
        document.getDocumentElement().normalize();
        return document;
    }

    /**
     * Extrae el valor de texto de un elemento por su nombre de tag.
     *
     * @param doc     El documento DOM
     * @param tagName El nombre del elemento a buscar
     * @return El valor de texto del elemento, o cadena vacía si no existe
     */
    public static String getText(Document doc, String tagName) {
        org.w3c.dom.NodeList nodes = doc.getElementsByTagName(tagName);
        if (nodes.getLength() > 0 && nodes.item(0).getTextContent() != null) {
            return nodes.item(0).getTextContent().trim();
        }
        return "";
    }
}
