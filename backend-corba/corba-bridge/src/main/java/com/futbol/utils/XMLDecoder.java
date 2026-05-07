package com.futbol.utils;

import BufferApp.NewsItem;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import java.util.ArrayList;
import java.util.List;

/**
 * Clase XMLDecoder: Convierte un String XML en un objeto NewsItem.
 * Es la operación inversa de XMLCoder (deserialización).
 * Usa XMLParser para el trabajo de bajo nivel.
 */
public class XMLDecoder {

    /**
     * Decodifica un String XML y lo convierte en un objeto NewsItem.
     *
     * @param xmlContent El XML en texto plano (generado por XMLCoder o recibido externamente)
     * @return Un objeto NewsItem con los datos del XML
     * @throws Exception si el XML está mal formado o faltan campos requeridos
     */
    public static NewsItem decode(String xmlContent) throws Exception {
        // 1. Parsear el XML con XMLParser (bajo nivel -> DOM)
        Document doc = XMLParser.parse(xmlContent);

        // 2. Extraer los campos simples usando el parser
        NewsItem noticia = new NewsItem();
        noticia.id       = XMLParser.getText(doc, "id");
        noticia.date     = XMLParser.getText(doc, "date");
        noticia.title    = XMLParser.getText(doc, "title");
        noticia.author   = XMLParser.getText(doc, "author");
        noticia.summary  = XMLParser.getText(doc, "summary");
        noticia.content  = XMLParser.getText(doc, "content");
        noticia.imageUrl = XMLParser.getText(doc, "imageUrl");
        noticia.category = XMLParser.getText(doc, "category");
        String isActiveStr = XMLParser.getText(doc, "isActive");
        noticia.isActive = isActiveStr != null && isActiveStr.equalsIgnoreCase("true");

        // 3. Extraer los tags (lista de elementos <tag>)
        NodeList tagNodes = doc.getElementsByTagName("tag");
        List<String> tagList = new ArrayList<>();
        for (int i = 0; i < tagNodes.getLength(); i++) {
            String tag = tagNodes.item(i).getTextContent().trim();
            if (!tag.isEmpty()) {
                tagList.add(tag);
            }
        }
        noticia.tags = tagList.toArray(new String[0]);

        return noticia;
    }
}
