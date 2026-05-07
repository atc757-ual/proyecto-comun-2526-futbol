package com.futbol.utils;

import BufferApp.NewsItem;

/**
 * Clase XMLCoder completa: Incluye todos los campos para validación total.
 */
public class XMLCoder {

    public static String toXML(NewsItem noticia) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<noticia>\n");
        xml.append("    <id>").append(noticia.id).append("</id>\n");
        xml.append("    <date>").append(noticia.date).append("</date>\n");
        xml.append("    <title>").append(noticia.title).append("</title>\n");
        xml.append("    <author>").append(noticia.author).append("</author>\n");
        xml.append("    <summary>").append(noticia.summary).append("</summary>\n");
        xml.append("    <content>").append(noticia.content).append("</content>\n");
        xml.append("    <imageUrl>").append(noticia.imageUrl).append("</imageUrl>\n");
        xml.append("    <category>").append(noticia.category).append("</category>\n");
        xml.append("    <isActive>").append(noticia.isActive).append("</isActive>\n");
        
        xml.append("    <tags>\n");
        if (noticia.tags != null) {
            for (String t : noticia.tags) {
                xml.append("        <tag>").append(t).append("</tag>\n");
            }
        }
        xml.append("    </tags>\n");
        xml.append("</noticia>");
        
        return xml.toString();
    }
}
